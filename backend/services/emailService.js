// backend/services/emailService.js
// Handles all outbound transactional email for Recova via Gmail SMTP.
// Requires: GMAIL_USER, GMAIL_APP_PASSWORD in backend/.env
//
// Install: npm install nodemailer

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM_NAME = 'Recova';
const APP_URL = process.env.FRONTEND_URL || 'https://recova.vercel.app';

const BRAND = {
  navy: '#1a2a4a',
  bg: '#f5f7fb',
  white: '#ffffff',
};

function wrapTemplate(title, bodyHtml) {
  return `
  <div style="font-family: Inter, Arial, sans-serif; background: ${BRAND.bg}; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background: ${BRAND.white}; border-radius: 12px; overflow: hidden;">
      <div style="background: ${BRAND.navy}; padding: 20px 24px;">
        <span style="color: ${BRAND.white}; font-size: 20px; font-weight: 700;">Recova</span>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: ${BRAND.navy}; margin: 0 0 12px;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          Recova &mdash; AI-Powered Campus Property Identification and Recovery Platform, University of Calabar.
        </p>
      </div>
    </div>
  </div>`;
}

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Gmail SMTP send failed:', err.message);
    return { success: false };
  }
}

// ---------------------------------------------------------------------------
// VISITOR EMAILS
// ---------------------------------------------------------------------------

async function sendVisitorReportConfirmation({ to, name, itemType, itemName, token }) {
  const trackingLink = `${APP_URL}/visitor/track/${token}`;
  const html = wrapTemplate('Your report has been submitted', `
    <p>Hi ${name},</p>
    <p>Your ${itemType} item report for <strong>${itemName}</strong> has been received.</p>
    <p>Use the link below any time to check its status, view AI match results, or submit a claim on a found item:</p>
    <p style="margin: 20px 0;">
      <a href="${trackingLink}" style="background:${BRAND.navy}; color:${BRAND.white}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track My Report</a>
    </p>
    <p style="color:#777; font-size: 13px;">Keep this email &mdash; this link is the only way to access your report.</p>
  `);
  return sendEmail({ to, subject: 'Recova: Your report has been submitted', html });
}

async function sendVisitorMatchFound({ to, name, itemName, confidenceScore, token, autoApproved }) {
  const trackingLink = `${APP_URL}/visitor/track/${token}`;
  const statusLine = autoApproved
    ? `Great news &mdash; this was a strong enough match that it's been <strong>auto-approved</strong>. A chat has been opened with the finder.`
    : `This match is under admin review. We'll notify you once it's confirmed.`;
  const html = wrapTemplate('Possible match found', `
    <p>Hi ${name},</p>
    <p>We found a <strong>${confidenceScore}% match</strong> for your item <strong>${itemName}</strong>.</p>
    <p>${statusLine}</p>
    <p style="margin: 20px 0;">
      <a href="${trackingLink}" style="background:${BRAND.navy}; color:${BRAND.white}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Match</a>
    </p>
  `);
  return sendEmail({ to, subject: `Recova: ${confidenceScore}% match found for your item`, html });
}

async function sendVisitorClaimUpdate({ to, name, itemName, status, token }) {
  const trackingLink = `${APP_URL}/visitor/track/${token}`;
  const isVerified = status === 'verified';
  const title = isVerified ? 'Your claim has been verified' : 'Update on your claim';
  const message = isVerified
    ? `Your claim on <strong>${itemName}</strong> has been verified. A chat has been opened with the finder so you can arrange pickup.`
    : `Your claim on <strong>${itemName}</strong> was not verified this time. You can browse other found items and submit another claim if something matches.`;
  const html = wrapTemplate(title, `
    <p>Hi ${name},</p>
    <p>${message}</p>
    <p style="margin: 20px 0;">
      <a href="${trackingLink}" style="background:${BRAND.navy}; color:${BRAND.white}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Details</a>
    </p>
  `);
  return sendEmail({ to, subject: `Recova: ${title}`, html });
}

async function sendVisitorChatMessage({ to, name, itemName, token }) {
  const trackingLink = `${APP_URL}/visitor/track/${token}`;
  const html = wrapTemplate('New message about your item', `
    <p>Hi ${name},</p>
    <p>You have a new message regarding <strong>${itemName}</strong>.</p>
    <p style="margin: 20px 0;">
      <a href="${trackingLink}" style="background:${BRAND.navy}; color:${BRAND.white}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open Chat</a>
    </p>
  `);
  return sendEmail({ to, subject: 'Recova: New message about your item', html });
}

// ---------------------------------------------------------------------------
// BUSINESS OWNER EMAILS
// ---------------------------------------------------------------------------

async function sendBusinessOwnerApproved({ to, name, businessName, bizId }) {
  const html = wrapTemplate('Your business account is approved', `
    <p>Hi ${name},</p>
    <p>Your business account for <strong>${businessName}</strong> has been approved.</p>
    <p>Your Business ID: <strong>${bizId}</strong></p>
    <p>You can now log in and start reporting found items or managing your listings.</p>
    <p style="margin: 20px 0;">
      <a href="${APP_URL}/login" style="background:${BRAND.navy}; color:${BRAND.white}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Log In</a>
    </p>
  `);
  return sendEmail({ to, subject: 'Recova: Your business account is approved', html });
}

async function sendBusinessOwnerRejected({ to, name, businessName, reason }) {
  const html = wrapTemplate('Update on your business registration', `
    <p>Hi ${name},</p>
    <p>Your business account request for <strong>${businessName}</strong> was not approved.</p>
    ${reason ? `<p>Reason: ${reason}</p>` : ''}
    <p>If you believe this was a mistake, please contact campus administration.</p>
  `);
  return sendEmail({ to, subject: 'Recova: Update on your business registration', html });
}

async function sendLecturerVerificationEmail({ to, name, verificationLink }) {
  const html = wrapTemplate('Verify your email address', `
    <p>Hi ${name},</p>
    <p>Thanks for registering as a lecturer on Recova. Please verify your email to activate full access to your account.</p>
    <p style="margin: 20px 0;">
      <a href="${verificationLink}" style="background:${BRAND.navy}; color:${BRAND.white}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify Email Address</a>
    </p>
    <p style="color:#777; font-size: 13px;">If you didn't create this account, you can safely ignore this email.</p>
  `);
  return sendEmail({ to, subject: 'Recova: Verify your email address', html });
}

module.exports = {
  sendEmail,
  sendVisitorReportConfirmation,
  sendVisitorMatchFound,
  sendVisitorClaimUpdate,
  sendVisitorChatMessage,
  sendBusinessOwnerApproved,
  sendBusinessOwnerRejected,
  sendLecturerVerificationEmail
};