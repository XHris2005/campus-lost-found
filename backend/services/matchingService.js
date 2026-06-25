const { sendPushNotification } = require('./notificationService');
const { db } = require('../config/firebase');
const { generateItemEmbeddings } = require('./embeddingService');

const SIMILARITY_THRESHOLD = 0.70;
const AUTO_APPROVE_THRESHOLD = 0.90;

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

function computeCombinedScore(itemA, itemB) {
  const scores = [];
  const weights = [];

  if (itemA.imageEmbedding && itemB.imageEmbedding) {
    scores.push(cosineSimilarity(itemA.imageEmbedding, itemB.imageEmbedding));
    weights.push(0.4);
  }

  if (itemA.clipTextEmbedding && itemB.clipTextEmbedding) {
    scores.push(cosineSimilarity(itemA.clipTextEmbedding, itemB.clipTextEmbedding));
    weights.push(0.3);
  }

  if (itemA.sbertEmbedding && itemB.sbertEmbedding) {
    scores.push(cosineSimilarity(itemA.sbertEmbedding, itemB.sbertEmbedding));
    weights.push(0.3);
  }

  if (scores.length === 0) return 0;

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);

  return weightedSum / totalWeight;
}

// Shared function — used by both auto-approval here and admin approval in adminRoutes.js
async function createChatForMatch(matchId, lostItemId, foundItemId, ownerId, finderId) {
  if (!ownerId || !finderId || ownerId === finderId) return null;

  const chatRef = await db.collection('chats').add({
    matchId,
    lostItemId,
    foundItemId,
    ownerId,
    finderId,
    ownerConfirmed: false,
    finderConfirmed: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  await db.collection('chats').doc(chatRef.id).collection('messages').add({
    senderId: 'system',
    senderName: 'System',
    text: '👋 A match has been confirmed! Use this chat to arrange a meeting place to return the item. Once the item has been returned, both parties must confirm below.',
    createdAt: new Date().toISOString(),
  });

  // In-app notifications for both parties
  await db.collection('notifications').add({
    userId: ownerId,
    type: 'chat_created',
    message: 'A chat room has been created for you to arrange collection of your item!',
    chatId: chatRef.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  await db.collection('notifications').add({
    userId: finderId,
    type: 'chat_created',
    message: 'A chat room has been created to arrange return of the found item!',
    chatId: chatRef.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Push notifications for both parties
  await sendPushNotification(ownerId, {
    title: '💬 Chat Room Created!',
    body: 'A chat has been set up to arrange collection of your item.',
    type: 'chat_created',
    url: `/chat/${chatRef.id}`,
  });

  await sendPushNotification(finderId, {
    title: '💬 Chat Room Created!',
    body: 'A chat has been set up to arrange return of the found item.',
    type: 'chat_created',
    url: `/chat/${chatRef.id}`,
  });

  return chatRef.id;
}

async function runMatching(newItemId, newItemType) {
  try {
    console.log(`Running matching for ${newItemType} item: ${newItemId}`);

    const newItemCollection = newItemType === 'lost' ? 'lostItems' : 'foundItems';
    const oppositeCollection = newItemType === 'lost' ? 'foundItems' : 'lostItems';

    const newItemDoc = await db.collection(newItemCollection).doc(newItemId).get();
    if (!newItemDoc.exists) {
      console.error('New item not found in Firestore');
      return;
    }

    const newItem = { id: newItemDoc.id, ...newItemDoc.data() };

    if (!newItem.sbertEmbedding) {
      const text = `${newItem.name} ${newItem.description} ${newItem.category}`;
      const embeddings = await generateItemEmbeddings(newItem.imageURL, text);

      await db.collection(newItemCollection).doc(newItemId).update({
        imageEmbedding: embeddings.imageEmbedding,
        clipTextEmbedding: embeddings.clipTextEmbedding,
        sbertEmbedding: embeddings.sbertEmbedding,
      });

      newItem.imageEmbedding = embeddings.imageEmbedding;
      newItem.clipTextEmbedding = embeddings.clipTextEmbedding;
      newItem.sbertEmbedding = embeddings.sbertEmbedding;
    }

    const oppositeSnapshot = await db
      .collection(oppositeCollection)
      .where('status', '==', 'active')
      .get();

    if (oppositeSnapshot.empty) {
      console.log('No opposite items to match against yet');
      return;
    }

    const matches = [];

    for (const doc of oppositeSnapshot.docs) {
      const oppositeItem = { id: doc.id, ...doc.data() };

      if (!oppositeItem.sbertEmbedding) {
        const text = `${oppositeItem.name} ${oppositeItem.description} ${oppositeItem.category}`;
        const embeddings = await generateItemEmbeddings(oppositeItem.imageURL, text);

        await db.collection(oppositeCollection).doc(oppositeItem.id).update({
          imageEmbedding: embeddings.imageEmbedding,
          clipTextEmbedding: embeddings.clipTextEmbedding,
          sbertEmbedding: embeddings.sbertEmbedding,
        });

        oppositeItem.imageEmbedding = embeddings.imageEmbedding;
        oppositeItem.clipTextEmbedding = embeddings.clipTextEmbedding;
        oppositeItem.sbertEmbedding = embeddings.sbertEmbedding;
      }

      const score = computeCombinedScore(newItem, oppositeItem);
      console.log(`Similarity score with ${oppositeItem.id}: ${score.toFixed(3)}`);

      if (score >= SIMILARITY_THRESHOLD) {
        matches.push({ item: oppositeItem, score });
      }
    }

    for (const match of matches) {
      const lostItemId = newItemType === 'lost' ? newItemId : match.item.id;
      const foundItemId = newItemType === 'found' ? newItemId : match.item.id;
      const lostUserId = newItemType === 'lost' ? newItem.userId : match.item.userId;
      const foundUserId = newItemType === 'found' ? newItem.userId : match.item.userId;

      const isAutoApproved = match.score >= AUTO_APPROVE_THRESHOLD;
      const matchStatus = isAutoApproved ? 'auto_approved' : 'pending';

      const existingMatch = await db
        .collection('matches')
        .where('lostItemId', '==', lostItemId)
        .where('foundItemId', '==', foundItemId)
        .get();

      if (!existingMatch.empty) continue;

      // Save match doc
      const matchRef = await db.collection('matches').add({
        lostItemId,
        foundItemId,
        lostUserId,
        foundUserId,
        combinedScore: match.score,
        status: matchStatus,
        notifiedUser: lostUserId,
        createdAt: new Date().toISOString(),
        ...(isAutoApproved && { autoApprovedAt: new Date().toISOString() }),
      });

      console.log(`Match saved! Score: ${match.score.toFixed(3)}, Status: ${matchStatus}`);

      if (isAutoApproved) {
        // Update item statuses to matched immediately
        await db.collection('lostItems').doc(lostItemId).update({ status: 'matched' });
        await db.collection('foundItems').doc(foundItemId).update({ status: 'matched' });

        // Create chat room immediately
        await createChatForMatch(matchRef.id, lostItemId, foundItemId, lostUserId, foundUserId);

        // Notify lost item owner
        await db.collection('notifications').add({
          userId: lostUserId,
          type: 'match_auto_approved',
          message: `Great news! We're confident your lost item has been found (${Math.round(match.score * 100)}% match). A chat room has been created — tap to connect with the finder.`,
          lostItemId,
          foundItemId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        // Notify finder
        await db.collection('notifications').add({
          userId: foundUserId,
          type: 'match_auto_approved',
          message: `The item you found has been matched with its owner (${Math.round(match.score * 100)}% match). A chat room has been created — tap to connect.`,
          lostItemId,
          foundItemId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        await sendPushNotification(lostUserId, {
          title: '🎯 High Confidence Match Found!',
          body: 'We\'re confident your lost item has been found. A chat room is ready.',
          type: 'match_auto_approved',
          url: '/my-chats',
        });

        await sendPushNotification(foundUserId, {
          title: '✅ Item Matched With Owner!',
          body: 'The item you found has been matched with its owner. A chat room is ready.',
          type: 'match_auto_approved',
          url: '/my-chats',
        });

      } else {
        // Low confidence — notify lost owner only, pending admin review
        await db.collection('notifications').add({
          userId: lostUserId,
          type: 'match_found',
          message: `A potential match was found for your lost item (${Math.round(match.score * 100)}% match). Our team is reviewing it.`,
          lostItemId,
          foundItemId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        await sendPushNotification(lostUserId, {
          title: '🔍 Potential Match Found!',
          body: 'A potential match was found for your lost item. Our team is reviewing it.',
          type: 'match_found',
          url: '/listings',
        });
      }
    }

    console.log(`Matching complete. ${matches.length} match(es) found.`);
  } catch (err) {
    console.error('Matching error:', err);
  }
}

module.exports = { runMatching, createChatForMatch };