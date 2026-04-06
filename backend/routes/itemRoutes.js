const { sendPushNotification } = require('../services/notificationService');
const { runMatching } = require('../services/matchingService');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');
const sanitize = require('../utils/sanitize'); // add this import

// Store image in memory before uploading to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Helper — upload buffer to Cloudinary
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

// POST /api/items/lost — report a lost item
router.post('/lost', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const name = sanitize(req.body.name);
const description = sanitize(req.body.description);
const category = sanitize(req.body.category);
const location = sanitize(req.body.location);
const dateLost = sanitize(req.body.dateLost);

    if (!name || !description || !category || !location || !dateLost) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Upload image to Cloudinary
    let imageURL = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        'campus-lost-found/lost'
      );
      imageURL = result.secure_url;
    }

    // Save to Firestore
    const docRef = await db.collection('lostItems').add({
      userId: req.user.uid,
      userEmail: req.user.email,
      name,
      description,
      category,
      location,
      dateLost,
      imageURL,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    // Trigger AI matching in the background (don't await — let it run async)
    runMatching(docRef.id, 'lost').catch(console.error);

    res.status(201).json({
      message: 'Lost item reported successfully',
      itemId: docRef.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error — could not report item' });
  }
});

// POST /api/items/found — report a found item
router.post('/found', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const name = sanitize(req.body.name);
const description = sanitize(req.body.description);
const category = sanitize(req.body.category);
const location = sanitize(req.body.location);
const dateFound = sanitize(req.body.dateFound);

    if (!name || !description || !category || !location || !dateFound) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Upload image to Cloudinary
    let imageURL = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        'campus-lost-found/found'
      );
      imageURL = result.secure_url;
    }

    // Save to Firestore
    const docRef = await db.collection('foundItems').add({
      userId: req.user.uid,
      userEmail: req.user.email,
      name,
      description,
      category,
      location,
      dateFound,
      imageURL,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    // Trigger AI matching in the background (don't await — let it run async)
    runMatching(docRef.id, 'found').catch(console.error);

    res.status(201).json({
      message: 'Found item reported successfully',
      itemId: docRef.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error — could not report item' });
  }
});

// GET /api/items/lost — get all lost items
router.get('/lost', verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection('lostItems')
      .where('status', 'in', ['active', 'matched'])
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch lost items' });
  }
});

// GET /api/items/found — get all found items
router.get('/found', verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection('foundItems')
      .where('status', 'in', ['active', 'matched'])
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch found items' });
  }
});

module.exports = router;