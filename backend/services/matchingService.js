const { sendPushNotification } = require('./notificationService');
const { sendVisitorMatchFound } = require('./emailService');
const { db, admin } = require('../config/firebase');
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

// Looks up the visitorReports doc for a given item, if the item was
// reported by a visitor.
async function getVisitorReportForItem(itemId) {
  const snapshot = await db.collection('visitorReports')
    .where('itemId', '==', itemId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { token: doc.id, ...doc.data() };
}

// Ensures a lightweight users doc exists for a visitor's derived identity,
// so chatRoutes.js and Firestore rules treat them like any other account.
// Returns the derived UID.
async function ensureVisitorIdentity(visitorReport) {
  if (!visitorReport) return null;
  const uid = `visitor_${visitorReport.token}`;
  await db.collection('users').doc(uid).set({
    uid,
    displayName: visitorReport.visitorName,
    role: 'visitor',
    recoveredCount: 0,
    isVisitor: true,
    createdAt: new Date().toISOString(),
  }, { merge: true });
  return uid;
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
      const lostItem = newItemType === 'lost' ? newItem : match.item;
      const foundItem = newItemType === 'found' ? newItem : match.item;

      const lostIsVisitor = lostItem.reporterType === 'visitor';
      const foundIsVisitor = foundItem.reporterType === 'visitor';

      const lostVisitor = lostIsVisitor ? await getVisitorReportForItem(lostItemId) : null;
      const foundVisitor = foundIsVisitor ? await getVisitorReportForItem(foundItemId) : null;

      // Visitors now get a real (lightweight) identity instead of null,
      // so chat creation works the same way it does for registered users.
      const lostUserId = lostIsVisitor
        ? await ensureVisitorIdentity(lostVisitor)
        : (lostItem.userId || null);
      const foundUserId = foundIsVisitor
        ? await ensureVisitorIdentity(foundVisitor)
        : (foundItem.userId || null);

      const isAutoApproved = match.score >= AUTO_APPROVE_THRESHOLD;
      const matchStatus = isAutoApproved ? 'auto_approved' : 'pending';

      const existingMatch = await db
        .collection('matches')
        .where('lostItemId', '==', lostItemId)
        .where('foundItemId', '==', foundItemId)
        .get();

      if (!existingMatch.empty) continue;

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
        await db.collection('lostItems').doc(lostItemId).update({ status: 'matched' });
        await db.collection('foundItems').doc(foundItemId).update({ status: 'matched' });

        // Chat now creates successfully even when one or both sides are
        // visitors, since they have a real (derived) userId above.
        await createChatForMatch(matchRef.id, lostItemId, foundItemId, lostUserId, foundUserId);

        if (lostIsVisitor) {
          if (lostVisitor) {
            await sendVisitorMatchFound({
              to: lostVisitor.visitorEmail,
              name: lostVisitor.visitorName,
              itemName: lostItem.name,
              confidenceScore: Math.round(match.score * 100),
              token: lostVisitor.token,
              autoApproved: true,
            });
          }
        } else {
          await db.collection('notifications').add({
            userId: lostUserId,
            type: 'match_auto_approved',
            message: `Great news! We're confident your lost item has been found (${Math.round(match.score * 100)}% match). A chat room has been created — tap to connect with the finder.`,
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
        }

        if (foundIsVisitor) {
          if (foundVisitor) {
            await sendVisitorMatchFound({
              to: foundVisitor.visitorEmail,
              name: foundVisitor.visitorName,
              itemName: foundItem.name,
              confidenceScore: Math.round(match.score * 100),
              token: foundVisitor.token,
              autoApproved: true,
            });
          }
        } else {
          await db.collection('notifications').add({
            userId: foundUserId,
            type: 'match_auto_approved',
            message: `The item you found has been matched with its owner (${Math.round(match.score * 100)}% match). A chat room has been created — tap to connect.`,
            lostItemId,
            foundItemId,
            isRead: false,
            createdAt: new Date().toISOString(),
          });

          await sendPushNotification(foundUserId, {
            title: '✅ Item Matched With Owner!',
            body: 'The item you found has been matched with its owner. A chat room is ready.',
            type: 'match_auto_approved',
            url: '/my-chats',
          });
        }

      } else {
        if (lostIsVisitor) {
          if (lostVisitor) {
            await sendVisitorMatchFound({
              to: lostVisitor.visitorEmail,
              name: lostVisitor.visitorName,
              itemName: lostItem.name,
              confidenceScore: Math.round(match.score * 100),
              token: lostVisitor.token,
              autoApproved: false,
            });
          }
        } else {
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
    }

    console.log(`Matching complete. ${matches.length} match(es) found.`);
  } catch (err) {
    console.error('Matching error:', err);
  }
}

function computeScore(itemA, itemB) {
  return computeCombinedScore(itemA, itemB);
}

module.exports = { runMatching, createChatForMatch, computeScore };