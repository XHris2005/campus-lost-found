const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { db, admin } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');
const { sendBusinessOwnerApproved, sendBusinessOwnerRejected, sendLecturerVerificationEmail } = require('../services/emailService');

// DELETE /api/users/me — delete own account
router.delete('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    await db.collection('users').doc(uid).delete();
    await admin.auth().deleteUser(uid);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete account' });
  }
});

const verifyMatricLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many attempts. Please try again later.' },
});

// GET /api/users/verify-matric/:matricNo — used during REGISTRATION
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

// POST /api/users/claim-matric — lock matric number after registration
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

    await studentRef.update({ claimed: true, claimedBy: uid });
    res.json({ message: 'Matric number claimed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not claim matric number.' });
  }
});

// GET /api/users/lookup-matric/:matricNo — used during LOGIN and PASSWORD RESET
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

// ─── LECTURER ROUTES ────────────────────────────────────────────────────────

const lecturerRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

// Helper — generate next Lecturer ID (LEC-YYYY-XXXX)
async function generateLecturerId() {
  const year = new Date().getFullYear();
  const prefix = `LEC-${year}-`;

  const snapshot = await db
    .collection('users')
    .where('role', '==', 'lecturer')
    .get();

  // Find the highest sequence number used this year
  let maxSeq = 0;
  snapshot.docs.forEach((doc) => {
    const id = doc.data().lecturerId || '';
    if (id.startsWith(prefix)) {
      const seq = parseInt(id.replace(prefix, ''), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

// POST /api/users/register-lecturer
router.post('/register-lecturer', lecturerRegisterLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    // Validate UNICAL email domain
    if (!email.toLowerCase().endsWith('@unical.edu.ng')) {
      return res.status(400).json({
        error: 'Only UNICAL institutional emails (@unical.edu.ng) are allowed for lecturer registration.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email already registered
    try {
      await admin.auth().getUserByEmail(email);
      return res.status(409).json({ error: 'An account with this email already exists.' });
    } catch (err) {
      // getUserByEmail throws if not found — that's what we want
      if (err.code !== 'auth/user-not-found') throw err;
    }

    // Generate Lecturer ID
    const lecturerId = await generateLecturerId();

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Send email verification
    // Generate the link via Admin SDK (no quota, just returns a URL) and
    // send it ourselves via Gmail SMTP — bypasses Firebase's own email
    // delivery, which has a strict daily quota that testing alone can exhaust.
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    await sendLecturerVerificationEmail({ to: email, name, verificationLink });
    // Note: in production wire this through your email service (e.g. SendGrid, Nodemailer)
    // For now Firebase Auth's client SDK sendEmailVerification handles this on the frontend

    // Save to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      displayName: name,
      email,
      lecturerId,
      role: 'lecturer',
      recoveredCount: 0,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Lecturer account created successfully.',
      lecturerId,
      uid: userRecord.uid,
    });
  } catch (err) {
    console.error('Lecturer registration error:', err);
    res.status(500).json({ error: 'Could not create lecturer account.' });
  }
});

// POST /api/users/resend-verification — resend via own email service
router.post('/resend-verification', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) return res.status(400).json({ error: 'No email associated with this account.' });

    const userRecord = await admin.auth().getUser(req.user.uid);
    const name = userRecord.displayName || 'there';

    const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    await sendLecturerVerificationEmail({ to: email, name, verificationLink });

    res.json({ message: 'Verification email resent.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Could not resend verification email.' });
  }
});

// GET /api/users/lookup-lecturer/:idOrEmail — resolve Lecturer ID or email → email for login
router.get('/lookup-lecturer/:idOrEmail', async (req, res) => {
  try {
    const { idOrEmail } = req.params;
    const input = idOrEmail.trim();

    let email = null;

    if (input.toLowerCase().startsWith('lec-')) {
      // Lookup by Lecturer ID
      const snapshot = await db
        .collection('users')
        .where('lecturerId', '==', input.toUpperCase())
        .where('role', '==', 'lecturer')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Lecturer ID not found.' });
      }

      email = snapshot.docs[0].data().email;
    } else if (input.includes('@')) {
      // Lookup by email — verify it's a registered lecturer
      const snapshot = await db
        .collection('users')
        .where('email', '==', input.toLowerCase())
        .where('role', '==', 'lecturer')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'No lecturer account found for this email.' });
      }

      email = snapshot.docs[0].data().email;
    } else {
      return res.status(400).json({ error: 'Please enter a valid Lecturer ID (e.g. LEC-2024-0001) or email address.' });
    }

    res.json({ email });
  } catch (err) {
    console.error('Lecturer lookup error:', err);
    res.status(500).json({ error: 'Could not look up lecturer account.' });
  }
});

// ─── BUSINESS OWNER ROUTES ──────────────────────────────────────────────────

const businessRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

// Helper — generate next Business ID (BIZ-YYYY-XXXX), same pattern as Lecturer IDs
async function generateBusinessId() {
  const year = new Date().getFullYear();
  const prefix = `BIZ-${year}-`;

  const snapshot = await db
    .collection('users')
    .where('role', '==', 'business_owner')
    .get();

  let maxSeq = 0;
  snapshot.docs.forEach((doc) => {
    const id = doc.data().bizId || '';
    if (id.startsWith(prefix)) {
      const seq = parseInt(id.replace(prefix, ''), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

// POST /api/users/register-business
router.post('/register-business', businessRegisterLimiter, async (req, res) => {
  try {
    const { name, businessName, location, phone, email, password } = req.body;

    if (!name || !businessName || !location || !phone || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email already registered
    try {
      await admin.auth().getUserByEmail(email);
      return res.status(409).json({ error: 'An account with this email already exists.' });
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }

    const bizId = await generateBusinessId();

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      displayName: name,
      businessName,
      location,
      phone,
      email,
      bizId,
      role: 'business_owner',
      status: 'pending', // pending | approved | rejected
      recoveredCount: 0,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Registration submitted. Your account is pending admin approval.',
      bizId,
      uid: userRecord.uid,
    });
  } catch (err) {
    console.error('Business registration error:', err);
    res.status(500).json({ error: 'Could not create business account.' });
  }
});

// GET /api/users/pending-business — admin only
router.get('/pending-business', verifyToken, async (req, res) => {
  try {
    const requester = await db.collection('users').doc(req.user.uid).get();
    if (requester.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const snapshot = await db
      .collection('users')
      .where('role', '==', 'business_owner')
      .where('status', '==', 'pending')
      .get();

    const pending = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(pending);
  } catch (err) {
    console.error('Fetching pending business owners error:', err);
    res.status(500).json({ error: 'Could not load pending accounts.' });
  }
});

// PATCH /api/users/approve-business/:uid — admin only
router.patch('/approve-business/:uid', verifyToken, async (req, res) => {
  try {
    const requester = await db.collection('users').doc(req.user.uid).get();
    if (requester.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const { action, reason } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action.' });
    }

    const targetRef = db.collection('users').doc(req.params.uid);
    const targetDoc = await targetRef.get();

    if (!targetDoc.exists || targetDoc.data().role !== 'business_owner') {
      return res.status(404).json({ error: 'Business owner not found.' });
    }

    const data = targetDoc.data();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await targetRef.update({ status: newStatus });

    if (action === 'approve') {
      await sendBusinessOwnerApproved({
        to: data.email,
        name: data.displayName,
        businessName: data.businessName,
        bizId: data.bizId,
      });
    } else {
      await sendBusinessOwnerRejected({
        to: data.email,
        name: data.displayName,
        businessName: data.businessName,
        reason,
      });
      await admin.auth().updateUser(req.params.uid, { disabled: true });
    }

    res.json({ message: `Business owner ${newStatus}.` });
  } catch (err) {
    console.error('Processing business approval error:', err);
    res.status(500).json({ error: 'Could not process request.' });
  }
});

module.exports = router;