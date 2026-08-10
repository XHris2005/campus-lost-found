import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ShieldBackground from '../../components/ShieldBackground/ShieldBackground';
import {
  FiSearch, FiPackage, FiCpu, FiBell, FiShield,
  FiMessageSquare, FiUsers, FiSmartphone, FiSun,
  FiMoon, FiArrowRight, FiCheckCircle, FiMapPin,
  FiClock, FiStar, FiUser,
} from 'react-icons/fi';
import Logo from '../../components/Logo/Logo';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: <FiCpu size={24} />,
      title: 'AI-Powered Matching',
      desc: 'Jina CLIP v2 and SBERT models generate semantic embeddings for accurate cross-modal matching.',
    },
    {
      icon: <FiBell size={24} />,
      title: 'Real-time Notifications',
      desc: 'Get instant push notifications the moment a potential match is found for your item.',
    },
    {
      icon: <FiShield size={24} />,
      title: 'Secure Verification',
      desc: 'Multi-step ownership verification prevents fraudulent claims and protects your belongings.',
    },
    {
      icon: <FiMessageSquare size={24} />,
      title: 'Built-in Chat',
      desc: 'Temporary encrypted chat rooms to arrange item collection securely between parties.',
    },
    {
      icon: <FiUsers size={24} />,
      title: 'Admin Oversight',
      desc: 'Dedicated dashboard to review matches, verify claims, and monitor all platform activity.',
    },
    {
      icon: <FiSmartphone size={24} />,
      title: 'Mobile Friendly',
      desc: 'Fully responsive design that works seamlessly on phones, tablets, and desktops.',
    },
  ];

  const steps = [
    {
      step: '01',
      icon: <FiSearch size={28} />,
      title: 'Report Your Item',
      desc: 'Submit a detailed report with photos and description of your lost or found item.',
    },
    {
      step: '02',
      icon: <FiCpu size={28} />,
      title: 'AI Matches Items',
      desc: 'Our AI uses CLIP and SBERT models to find visual and semantic matches automatically.',
    },
    {
      step: '03',
      icon: <FiCheckCircle size={28} />,
      title: 'Recover & Confirm',
      desc: 'Get notified, verify ownership, and arrange collection through our secure chat system.',
    },
  ];

  return (
    <div className="home">
      {/* Navbar */}
      <nav className="home-nav">
  <div className="home-nav-inner">
    <div className="home-nav-brand">
      <Logo size={26} />
      <span>Recova</span>
    </div>
    <div className="home-nav-actions">
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
      </button>
      <button className="btn btn-ghost home-nav-visitor" onClick={() => navigate('/visitor/report')}>
        Report as Visitor
      </button>
      <button className="btn btn-ghost home-nav-login" onClick={() => navigate('/login')}>
        Login
      </button>
      <button className="btn btn-primary" onClick={() => navigate('/register')}>
        Get Started
      </button>
    </div>
  </div>
</nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <FiCpu size={14} />
            AI-Powered Lost & Found Platform
          </div>
          <h1 className="hero-title">
            Lost Something on
            <span className="hero-highlight"> Campus?</span>
          </h1>
          <p className="hero-subtitle">
            Recova uses artificial intelligence to automatically match
            lost and found items at the University of Calabar — making
            recovery faster, smarter, and more reliable than ever before.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              <FiSearch size={18} />
              Report Lost Item
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/register')}
            >
              <FiPackage size={18} />
              Report Found Item
            </button>
          </div>
          <button
            className="btn btn-ghost btn-lg hero-visitor-btn"
            onClick={() => navigate('/visitor/report')}
          >
            <FiUser size={18} />
            Report as Visitor
          </button>
          <div className="hero-stats">
            <div className="hero-stat">
              <FiCpu className="stat-icon" />
              <div>
                <span className="hero-stat-number">AI</span>
                <span className="hero-stat-label">Powered Matching</span>
              </div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <FiBell className="stat-icon" />
              <div>
                <span className="hero-stat-number">Real-time</span>
                <span className="hero-stat-label">Notifications</span>
              </div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <FiShield className="stat-icon" />
              <div>
                <span className="hero-stat-number">Secure</span>
                <span className="hero-stat-label">Verification</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-blob" />
          <div className="hero-card hero-card-1 card">
            <div className="hero-card-icon-wrap match">
              <FiCheckCircle size={20} />
            </div>
            <div>
              <p className="hero-card-title">Match Found!</p>
              <p className="hero-card-desc">94% similarity score</p>
            </div>
          </div>
          <div className="hero-card hero-card-2 card">
            <div className="hero-card-icon-wrap lost">
              <FiSmartphone size={20} />
            </div>
            <div>
              <p className="hero-card-title">Black iPhone 13</p>
              <p className="hero-card-desc">
                <FiMapPin size={11} /> Library · 2h ago
              </p>
            </div>
          </div>
          <div className="hero-card hero-card-3 card">
            <div className="hero-card-icon-wrap recovered">
              <FiStar size={20} />
            </div>
            <div>
              <p className="hero-card-title">Item Recovered!</p>
              <p className="hero-card-desc">Owner verified & notified</p>
            </div>
          </div>
          <div className="hero-card hero-card-4 card">
            <div className="hero-card-icon-wrap chat">
              <FiMessageSquare size={20} />
            </div>
            <div>
              <p className="hero-card-title">Chat Active</p>
              <p className="hero-card-desc">
                <FiClock size={11} /> Arranging pickup...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <div className="section-badge">Simple Process</div>
            <h2>How It Works</h2>
            <p>Three simple steps to recover your lost item</p>
          </div>
          <div className="steps-grid">
            {steps.map((item, index) => (
              <div key={item.step} className="step-card card">
                <div className="step-number">{item.step}</div>
                <div className="step-icon-wrap">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                {index < steps.length - 1 && (
                  <div className="step-arrow">
                    <FiArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="section-container">
          <div className="section-header">
            <div className="section-badge">Features</div>
            <h2>Why Recova?</h2>
            <p>Built specifically for the University of Calabar community</p>
          </div>
          <div className="features-grid">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card card card-hover">
                <div className="feature-icon-wrap">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-content">
          <div className="cta-icon">
            <FiSearch size={32} />
          </div>
          <h2>Ready to Find Your Lost Item?</h2>
          <p>Join the University of Calabar community on Recova today.</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(currentUser ? '/dashboard' : '/register')}
          >
            {currentUser ? 'Go to Dashboard' : 'Create Free Account'}
            <FiArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
<footer className="home-footer">
  <div className="footer-content">
    <div className="footer-brand">
      <Logo size={18} />
      <span>Recova</span>
    </div>
    <p>© 2026 Recova · University of Calabar · AI-Powered Lost & Found</p>
    <div className="footer-links">
      <a href="/privacy" className="footer-link">
  Privacy Policy
</a>
    </div>
  </div>
</footer>
    </div>
  );
}