const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const cloudinary = require('../config/cloudinary');
const { db, admin } = require('../config/firebase');
const { runMatching, computeScore } = require('../services/matchingService');
const { sendVisitorReportConfirmation } = require('../services/emailService');
const sanitize = require('../utils/sanitize');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// Public route — no login. Rate limited since anyone can hit this.
const visitorReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many reports submitted. Please try again later.' },
});

// POST /api/visitor/report — visitor reports a lost OR found item
router.post('/report', visitorReportLimiter, upload.single('image'), async (req, res) => {
  try {
    const type = req.body.type; // 'lost' | 'found'
    const visitorName = sanitize(req.body.visitorName);
    const visitorPhone = sanitize(req.body.visitorPhone);
    const visitorEmail = sanitize(req.body.visitorEmail);
    const name = sanitize(req.body.name);
    const description = sanitize(req.body.description);
    const category = sanitize(req.body.category);
    const location = sanitize(req.body.location);
    const date = sanitize(req.body.date);

    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({ error: 'Invalid report type.' });
    }
    if (!visitorName || !visitorPhone || !visitorEmail || !name || !description || !category || !location || !date) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Upload image to Cloudinary
    let imageURL = null;
    if (req.file) {
      const folder = type === 'lost' ? 'campus-lost-found/lost' : 'campus-lost-found/found';
      const result = await uploadToCloudinary(req.file.buffer, folder);
      imageURL = result.secure_url;
    }

    const collectionName = type === 'lost' ? 'lostItems' : 'foundItems';
    const dateField = type === 'lost' ? 'dateLost' : 'dateFound';

    // Save the item doc — no visitor PII here, matches the shape your
    // authenticated routes already produce (no userId, since there's no account)
    const itemDoc = await db.collection(collectionName).add({
      reporterType: 'visitor',
      name,
      description,
      category,
      location,
      [dateField]: date,
      imageURL,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Generate a secure, unguessable access token and use it AS the doc ID —
    // lookups become a direct get(), and visitorReports is fully locked in rules.
    const token = crypto.randomBytes(32).toString('hex');

    await db.collection('visitorReports').doc(token).set({
      itemId: itemDoc.id,
      itemType: type,
      visitorName,
      visitorPhone,
      visitorEmail,
      createdAt: new Date().toISOString(),
    });

    // Trigger AI matching in the background — same as authenticated reports
    runMatching(itemDoc.id, type).catch(console.error);

    // Email the tracking link (their only way back into this report)
    await sendVisitorReportConfirmation({
      to: visitorEmail,
      name: visitorName,
      itemType: type,
      itemName: name,
      token,
    });

    res.status(201).json({
      message: 'Report submitted successfully. Check your email for a tracking link.',
      itemId: itemDoc.id,
      token,
    });
  } catch (err) {
    console.error('Visitor report submission error:', err);
    res.status(500).json({ error: 'Could not submit report. Please try again.' });
  }
});

// GET /api/visitor/report/:token — check status of a visitor's own report
router.get('/report/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const reportDoc = await db.collection('visitorReports').doc(token).get();

    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found. Check your tracking link.' });
    }

    const report = reportDoc.data();
    const collectionName = report.itemType === 'lost' ? 'lostItems' : 'foundItems';
    const itemDoc = await db.collection(collectionName).doc(report.itemId).get();

    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Associated item not found.' });
    }

    const item = { id: itemDoc.id, ...itemDoc.data() };

    // Check for any match involving this item
    const matchField = report.itemType === 'lost' ? 'lostItemId' : 'foundItemId';
    const matchSnapshot = await db.collection('matches')
      .where(matchField, '==', report.itemId)
      .get();

    const matches = matchSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // For any match that resulted in a chat, surface the chat ID so the
    // frontend can show a "Continue to Chat" button
    for (const match of matches) {
      const chatSnap = await db.collection('chats').where('matchId', '==', match.id).limit(1).get();
      match.chatId = chatSnap.empty ? null : chatSnap.docs[0].id;
    }

    res.json({
      visitorName: report.visitorName,
      itemType: report.itemType,
      item,
      matches,
    });
  } catch (err) {
    console.error('Visitor report lookup error:', err);
    res.status(500).json({ error: 'Could not load report.' });
  }
});

// GET /api/visitor/listings — public browsing, no login required
router.get('/listings', async (req, res) => {
  try {
    const type = req.query.type === 'lost' ? 'lost' : 'found';
    const collectionName = type === 'lost' ? 'lostItems' : 'foundItems';

    const snapshot = await db
      .collection(collectionName)
      .where('status', 'in', ['active', 'matched'])
      .orderBy('createdAt', 'desc')
      .get();

    // Strip to display-safe fields only — no embeddings, no internal metadata
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        category: data.category,
        location: data.location,
        dateLost: data.dateLost,
        dateFound: data.dateFound,
        imageURL: data.imageURL,
        status: data.status,
        createdAt: data.createdAt,
      };
    });

    res.json(items);
  } catch (err) {
    console.error('Visitor listings error:', err);
    res.status(500).json({ error: 'Could not load listings.' });
  }
});

// POST /api/visitor/chat-token — mint a Firebase custom sign-in token tied
// to a stable derived identity, so a visitor can access a real-time chat
// the same way a registered user does.
router.post('/chat-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required.' });

    const reportDoc = await db.collection('visitorReports').doc(token).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const report = reportDoc.data();
    const uid = `visitor_${token}`;

    // Ensure a lightweight users doc exists — this is what makes the rest
    // of the app (chatRoutes.js, Firestore rules) treat this identity like
    // any other account with zero special-casing elsewhere.
    await db.collection('users').doc(uid).set({
      uid,
      displayName: report.visitorName,
      role: 'visitor',
      recoveredCount: 0,
      isVisitor: true,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    const customToken = await admin.auth().createCustomToken(uid);
    res.json({ customToken });
  } catch (err) {
    console.error('Visitor chat-token error:', err);
    res.status(500).json({ error: 'Could not generate chat access.' });
  }
});
// POST /api/visitor/claims/manual — visitor claims a found item using their
// own lost item report (identified by token — no lostItemId needed from
// the client, since a visitor only ever has one active report per token)
router.post('/claims/manual', async (req, res) => {
  try {
    const { token, foundItemId, verificationDetails } = req.body;

    if (!token || !foundItemId || !verificationDetails) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (verificationDetails.trim().length < 20) {
      return res.status(400).json({ error: 'Verification details must be at least 20 characters.' });
    }

    const reportDoc = await db.collection('visitorReports').doc(token).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found. Check your tracking link.' });
    }
    const report = reportDoc.data();

    if (report.itemType !== 'lost') {
      return res.status(400).json({ error: 'Only visitors with a lost item report can submit claims.' });
    }

    const lostItemId = report.itemId;

    const foundItemDoc = await db.collection('foundItems').doc(foundItemId).get();
    if (!foundItemDoc.exists) {
      return res.status(404).json({ error: 'Found item not found.' });
    }
    const foundItem = { id: foundItemDoc.id, ...foundItemDoc.data() };

    // Block claiming a found item reported by the same visitor — matched by
    // email, since each report has its own token and there's no account tying them together
    if (foundItem.reporterType === 'visitor') {
      const foundReportSnap = await db.collection('visitorReports')
        .where('itemId', '==', foundItemId)
        .limit(1)
        .get();
      if (!foundReportSnap.empty && foundReportSnap.docs[0].data().visitorEmail === report.visitorEmail) {
        return res.status(403).json({ error: 'You cannot claim an item you reported as found.' });
      }
    }

    const lostItemDoc = await db.collection('lostItems').doc(lostItemId).get();
    if (!lostItemDoc.exists) {
      return res.status(404).json({ error: 'Your lost item report could not be found.' });
    }
    const lostItem = { id: lostItemDoc.id, ...lostItemDoc.data() };

    const existingActiveMatch = await db
      .collection('matches')
      .where('foundItemId', '==', foundItemId)
      .where('status', 'in', ['approved', 'auto_approved', 'pending'])
      .get();

    if (!existingActiveMatch.empty) {
      return res.status(409).json({
        error: 'This item already has an active or approved match and cannot be claimed right now.',
      });
    }

    // Derived, stable identity for this report — same pattern as chat access,
    // so this claim shows up correctly wherever the admin dashboard looks up a claimant.
    const claimantUid = `visitor_${token}`;
    await db.collection('users').doc(claimantUid).set({
      uid: claimantUid,
      displayName: report.visitorName,
      role: 'visitor',
      recoveredCount: 0,
      isVisitor: true,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    const existingClaim = await db
      .collection('claims')
      .where('foundItemId', '==', foundItemId)
      .where('claimantId', '==', claimantUid)
      .where('status', '==', 'pending')
      .get();

    if (!existingClaim.empty) {
      return res.status(400).json({ error: 'You have already submitted a claim for this item.' });
    }

    let combinedScore = 0;
    if (lostItem.imageEmbedding && foundItem.imageEmbedding) {
      combinedScore = computeScore(lostItem, foundItem);
    }

    const matchRef = await db.collection('matches').add({
      lostItemId,
      foundItemId,
      lostUserId: claimantUid,
      foundUserId: foundItem.userId || null,
      combinedScore,
      status: 'pending',
      source: 'manual_claim',
      notifiedUser: claimantUid,
      createdAt: new Date().toISOString(),
    });

    const claimRef = await db.collection('claims').add({
      matchId: matchRef.id,
      lostItemId,
      foundItemId,
      claimantId: claimantUid,
      claimantEmail: report.visitorEmail,
      verificationDetails: verificationDetails.trim(),
      status: 'pending',
      source: 'manual_claim',
      createdAt: new Date().toISOString(),
    });

    const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    await Promise.all(
      adminsSnapshot.docs.map((adminDoc) =>
        db.collection('notifications').add({
          userId: adminDoc.id,
          type: 'manual_claim_submitted',
          message: `A visitor has manually claimed a found item. AI similarity score: ${Math.round(combinedScore * 100)}%. Review required.`,
          claimId: claimRef.id,
          matchId: matchRef.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      )
    );

    res.status(201).json({
      message: 'Claim submitted successfully. An admin will review it shortly.',
      claimId: claimRef.id,
      matchId: matchRef.id,
      aiScore: Math.round(combinedScore * 100),
    });
  } catch (err) {
    console.error('Visitor manual claim error:', err);
    res.status(500).json({ error: 'Could not submit claim.' });
  }
});
// POST /api/visitor/claims/manual — visitor claims a found item using their
// own lost item report (identified by token — no lostItemId needed from
// the client, since a visitor only ever has one active report per token)
router.post('/claims/manual', async (req, res) => {
  try {
    const { token, foundItemId, verificationDetails } = req.body;

    if (!token || !foundItemId || !verificationDetails) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (verificationDetails.trim().length < 20) {
      return res.status(400).json({ error: 'Verification details must be at least 20 characters.' });
    }

    const reportDoc = await db.collection('visitorReports').doc(token).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found. Check your tracking link.' });
    }
    const report = reportDoc.data();

    if (report.itemType !== 'lost') {
      return res.status(400).json({ error: 'Only visitors with a lost item report can submit claims.' });
    }

    const lostItemId = report.itemId;

    const foundItemDoc = await db.collection('foundItems').doc(foundItemId).get();
    if (!foundItemDoc.exists) {
      return res.status(404).json({ error: 'Found item not found.' });
    }
    const foundItem = { id: foundItemDoc.id, ...foundItemDoc.data() };

    // Block claiming a found item reported by the same visitor — matched by
    // email, since each report has its own token and there's no account tying them together
    if (foundItem.reporterType === 'visitor') {
      const foundReportSnap = await db.collection('visitorReports')
        .where('itemId', '==', foundItemId)
        .limit(1)
        .get();
      if (!foundReportSnap.empty && foundReportSnap.docs[0].data().visitorEmail === report.visitorEmail) {
        return res.status(403).json({ error: 'You cannot claim an item you reported as found.' });
      }
    }

    const lostItemDoc = await db.collection('lostItems').doc(lostItemId).get();
    if (!lostItemDoc.exists) {
      return res.status(404).json({ error: 'Your lost item report could not be found.' });
    }
    const lostItem = { id: lostItemDoc.id, ...lostItemDoc.data() };

    const existingActiveMatch = await db
      .collection('matches')
      .where('foundItemId', '==', foundItemId)
      .where('status', 'in', ['approved', 'auto_approved', 'pending'])
      .get();

    if (!existingActiveMatch.empty) {
      return res.status(409).json({
        error: 'This item already has an active or approved match and cannot be claimed right now.',
      });
    }

    // Derived, stable identity for this report — same pattern as chat access,
    // so this claim shows up correctly wherever the admin dashboard looks up a claimant.
    const claimantUid = `visitor_${token}`;
    await db.collection('users').doc(claimantUid).set({
      uid: claimantUid,
      displayName: report.visitorName,
      role: 'visitor',
      recoveredCount: 0,
      isVisitor: true,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    const existingClaim = await db
      .collection('claims')
      .where('foundItemId', '==', foundItemId)
      .where('claimantId', '==', claimantUid)
      .where('status', '==', 'pending')
      .get();

    if (!existingClaim.empty) {
      return res.status(400).json({ error: 'You have already submitted a claim for this item.' });
    }

    let combinedScore = 0;
    if (lostItem.imageEmbedding && foundItem.imageEmbedding) {
      combinedScore = computeScore(lostItem, foundItem);
    }

    const matchRef = await db.collection('matches').add({
      lostItemId,
      foundItemId,
      lostUserId: claimantUid,
      foundUserId: foundItem.userId || null,
      combinedScore,
      status: 'pending',
      source: 'manual_claim',
      notifiedUser: claimantUid,
      createdAt: new Date().toISOString(),
    });

    const claimRef = await db.collection('claims').add({
      matchId: matchRef.id,
      lostItemId,
      foundItemId,
      claimantId: claimantUid,
      claimantEmail: report.visitorEmail,
      verificationDetails: verificationDetails.trim(),
      status: 'pending',
      source: 'manual_claim',
      createdAt: new Date().toISOString(),
    });

    const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    await Promise.all(
      adminsSnapshot.docs.map((adminDoc) =>
        db.collection('notifications').add({
          userId: adminDoc.id,
          type: 'manual_claim_submitted',
          message: `A visitor has manually claimed a found item. AI similarity score: ${Math.round(combinedScore * 100)}%. Review required.`,
          claimId: claimRef.id,
          matchId: matchRef.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      )
    );

    res.status(201).json({
      message: 'Claim submitted successfully. An admin will review it shortly.',
      claimId: claimRef.id,
      matchId: matchRef.id,
      aiScore: Math.round(combinedScore * 100),
    });
  } catch (err) {
    console.error('Visitor manual claim error:', err);
    res.status(500).json({ error: 'Could not submit claim.' });
  }
});

module.exports = router;