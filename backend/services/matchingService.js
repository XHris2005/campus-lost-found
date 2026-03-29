const { sendPushNotification } = require('./notificationService');
const { db } = require('../config/firebase');
const { generateItemEmbeddings } = require('./embeddingService');

// Compute cosine similarity between two vectors
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

// Compute the combined similarity score between two items
function computeCombinedScore(itemA, itemB) {
  const scores = [];
  const weights = [];

  // Image-to-image similarity (CLIP)
  if (itemA.imageEmbedding && itemB.imageEmbedding) {
    scores.push(cosineSimilarity(itemA.imageEmbedding, itemB.imageEmbedding));
    weights.push(0.4);
  }

  // Text-to-text similarity (CLIP text)
  if (itemA.clipTextEmbedding && itemB.clipTextEmbedding) {
    scores.push(cosineSimilarity(itemA.clipTextEmbedding, itemB.clipTextEmbedding));
    weights.push(0.3);
  }

  // Text-to-text similarity (SBERT)
  if (itemA.sbertEmbedding && itemB.sbertEmbedding) {
    scores.push(cosineSimilarity(itemA.sbertEmbedding, itemB.sbertEmbedding));
    weights.push(0.3);
  }

  if (scores.length === 0) return 0;

  // Weighted average
  let totalWeight = weights.reduce((a, b) => a + b, 0);
  let weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);

  return weightedSum / totalWeight;
}

// Run matching for a newly submitted item against all items of the opposite type
async function runMatching(newItemId, newItemType) {
  try {
    console.log(`Running matching for ${newItemType} item: ${newItemId}`);

    // Get the new item from Firestore
    const newItemCollection = newItemType === 'lost' ? 'lostItems' : 'foundItems';
    const oppositeCollection = newItemType === 'lost' ? 'foundItems' : 'lostItems';

    const newItemDoc = await db.collection(newItemCollection).doc(newItemId).get();
    if (!newItemDoc.exists) {
      console.error('New item not found in Firestore');
      return;
    }

    const newItem = { id: newItemDoc.id, ...newItemDoc.data() };

    // If the item doesn't have embeddings yet, generate them now
    if (!newItem.sbertEmbedding) {
      const text = `${newItem.name} ${newItem.description} ${newItem.category}`;
      const embeddings = await generateItemEmbeddings(newItem.imageURL, text);

      // Save embeddings to Firestore
      await db.collection(newItemCollection).doc(newItemId).update({
        imageEmbedding: embeddings.imageEmbedding,
        clipTextEmbedding: embeddings.clipTextEmbedding,
        sbertEmbedding: embeddings.sbertEmbedding,
      });

      newItem.imageEmbedding = embeddings.imageEmbedding;
      newItem.clipTextEmbedding = embeddings.clipTextEmbedding;
      newItem.sbertEmbedding = embeddings.sbertEmbedding;
    }

    // Get all active items from the opposite collection
    const oppositeSnapshot = await db
      .collection(oppositeCollection)
      .where('status', '==', 'active')
      .get();

    if (oppositeSnapshot.empty) {
      console.log('No opposite items to match against yet');
      return;
    }

    const SIMILARITY_THRESHOLD = 0.70;
    const matches = [];

    for (const doc of oppositeSnapshot.docs) {
      const oppositeItem = { id: doc.id, ...doc.data() };

      // Generate embeddings for opposite item if missing
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

    // Save matches to Firestore
    for (const match of matches) {
      const lostItemId = newItemType === 'lost' ? newItemId : match.item.id;
      const foundItemId = newItemType === 'found' ? newItemId : match.item.id;
      const lostUserId = newItemType === 'lost' ? newItem.userId : match.item.userId;

      // Check if this match already exists
      const existingMatch = await db
        .collection('matches')
        .where('lostItemId', '==', lostItemId)
        .where('foundItemId', '==', foundItemId)
        .get();

      if (existingMatch.empty) {
        await db.collection('matches').add({
          lostItemId,
          foundItemId,
          combinedScore: match.score,
          status: 'pending',
          notifiedUser: lostUserId,
          createdAt: new Date().toISOString(),
        });

        console.log(`Match saved! Score: ${match.score.toFixed(3)}`);

        // Save notification for the item owner
        await db.collection('notifications').add({
          userId: lostUserId,
          type: 'match_found',
          message: `A potential match was found for your lost item!`,
          lostItemId,
          foundItemId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        // Save notification
        await db.collection('notifications').add({
          userId: lostUserId,
          type: 'match_found',
          message: `A potential match was found for your lost item!`,
          lostItemId,
          foundItemId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        // Send push notification
        await sendPushNotification(lostUserId, {
          title: '🎯 Potential Match Found!',
          body: 'A potential match was found for your lost item. Tap to view.',
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

module.exports = { runMatching };