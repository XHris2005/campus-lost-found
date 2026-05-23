import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo';
import './Privacy.css';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <div className="privacy-brand" onClick={() => navigate('/')}>
        <Logo size={32} />
        <span>Recova</span>
      </div>

      <h1 className="privacy-title">Privacy Policy</h1>
      <p className="privacy-date">Last updated: May 2026</p>

      <div className="privacy-section">
        <h2>1. Introduction</h2>
        <p>Recova is an AI-powered lost and found platform for the University of Calabar community. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.</p>
      </div>

      <div className="privacy-section">
        <h2>2. Information We Collect</h2>
        <p>We collect the following information when you use Recova:</p>
        <ul>
          <li>Name and email address (via registration or Google Sign-In)</li>
          <li>Photos and descriptions of lost or found items you report</li>
          <li>Location information included in item reports</li>
          <li>Chat messages exchanged between users for item recovery</li>
          <li>Device token for push notifications</li>
        </ul>
      </div>

      <div className="privacy-section">
        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To match lost and found items using AI</li>
          <li>To notify you when a potential match is found</li>
          <li>To facilitate communication between item owners and finders</li>
          <li>To verify ownership claims</li>
          <li>To improve platform performance and user experience</li>
        </ul>
      </div>

      <div className="privacy-section">
        <h2>4. Google Sign-In</h2>
        <p>If you sign in using Google, we receive your name and email address from Google. We do not receive your Google password. Your Google account data is used only to create and manage your Recova account.</p>
      </div>

      <div className="privacy-section">
        <h2>5. Data Storage</h2>
        <p>Your data is stored securely using Firebase Firestore (Google Cloud, europe-west1 region). Images are stored on Cloudinary. We do not sell your personal data to third parties.</p>
      </div>

      <div className="privacy-section">
        <h2>6. Data Retention</h2>
        <p>Your account data is retained as long as your account is active. You may delete your account at any time from the Dashboard, which will permanently remove your profile and associated data.</p>
      </div>

      <div className="privacy-section">
        <h2>7. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data at any time. You can delete your account from the Dashboard or contact us directly.</p>
      </div>

      <div className="privacy-section">
        <h2>8. Contact</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:christoph3eze@gmail.com">christoph3eze@gmail.com</a></p>
      </div>

      <p className="privacy-footer">© 2026 Recova · University of Calabar</p>
    </div>
  );
}