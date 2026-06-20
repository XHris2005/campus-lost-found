const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
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

// Tighter limit on this route specifically — without it, someone could
// hammer matric numbers to harvest names/emails for other students
const verifyMatricLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many attempts. Please try again later.' },
});

// GET /api/users/verify-matric/:matricNo — used during REGISTRATION.
// Blocks if already claimed, blocks if email is still a placeholder.
router.get('/verify-matric/:matricNo', verifyMatricLimiter, async (req, res) => {
  try {
    const { matricNo } = req.params;
    const docId = matricNo.replace(/\//g, '-');
    const studentDoc = await db.collection('students').doc(docId).get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Matric number not found' });
    }

    const student = studentDoc.data();

    if (student.claimed) {
      return res.status(409).json({
        error: 'This matric number has already been registered. If this is you, please log in instead.',
      });
    }

    if (student.email && student.email.endsWith('@recova.placeholder')) {
      return res.status(403).json({
        error: 'Your account is not yet activated for registration. Please contact admin.',
      });
    }

    // Mask email for display, e.g. christoph3eze@gmail.com -> ch*******e@gmail.com
    const [localPart, domain] = student.email.split('@');
    const maskedLocal =
      localPart.length <= 2
        ? localPart[0] + '*'
        : localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    const maskedEmail = `${maskedLocal}@${domain}`;

    res.json({
      student: {
        name: student.name,
        matricNo: student.matricNo,
        email: student.email,
        maskedEmail,
        department: student.department,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not verify matric number' });
  }
});

// POST /api/users/claim-matric — called after successful registration to
// lock the matric number so it can't be registered against again.
router.post('/claim-matric', async (req, res) => {
  try {
    const { matricNo, uid } = req.body;

    if (!matricNo || !uid) {
      return res.status(400).json({ error: 'Matric number and uid are required.' });
    }

    const docId = matricNo.replace(/\//g, '-');
    const studentRef = db.collection('students').doc(docId);
    const studentDoc = await studentRef.get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Matric number not found.' });
    }

    const student = studentDoc.data();

    if (student.claimed) {
      if (student.claimedBy !== uid) {
        return res.status(409).json({ error: 'This matric number has already been claimed.' });
      }
      return res.json({ message: 'Already claimed by this account.' });
    }

    await studentRef.update({
      claimed: true,
      claimedBy: uid,
    });

    res.json({ message: 'Matric number claimed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not claim matric number.' });
  }
});

// GET /api/users/lookup-matric/:matricNo — used during LOGIN and PASSWORD RESET.
// Only succeeds if the matric number IS claimed (i.e. has a real registered account).
router.get('/lookup-matric/:matricNo', async (req, res) => {
  try {
    const { matricNo } = req.params;
    const docId = matricNo.replace(/\//g, '-');
    const studentDoc = await db.collection('students').doc(docId).get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Matric number not found.' });
    }

    const student = studentDoc.data();

    if (!student.claimed) {
      return res.status(404).json({ error: 'No account is registered for this matric number yet.' });
    }

    res.json({ email: student.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not look up matric number.' });
  }
});

module.exports = router;