const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');

// DELETE /api/users/me — delete own account
router.delete('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Delete Firestore user document
    await db.collection('users').doc(uid).delete();

    // Delete Firebase Auth account
    await admin.auth().deleteUser(uid);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete account' });
  }
});

module.exports = router;