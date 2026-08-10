import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { submitVisitorReport } from '../../api/visitorApi';
import Logo from '../../components/Logo/Logo';
import {
  FiSearch, FiPackage, FiMapPin, FiCalendar, FiTag,
  FiFileText, FiImage, FiX, FiArrowRight, FiUser, FiPhone, FiMail,
  FiSun, FiMoon,
} from 'react-icons/fi';
import '../ReportLostItem/ReportLostItem.css';
import './VisitorReport.css';

const CATEGORIES = [
  'Bag', 'Mobile Phone', 'Laptop', 'Books / Notes',
  'Charger / Accessories', 'Clothing', 'ID Card', 'Keys', 'Other',
];

export default function VisitorReport() {
  const [type, setType] = useState('lost'); // 'lost' | 'found'
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', location: '', date: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { token, itemId }
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleImage(e) {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  function removeImage() {
    setImage(null);
    setPreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!visitorName || !visitorPhone || !visitorEmail) {
      return setError('Please fill in your contact details.');
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('type', type);
      data.append('visitorName', visitorName);
      data.append('visitorPhone', visitorPhone);
      data.append('visitorEmail', visitorEmail);
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('location', formData.location);
      data.append('date', formData.date);
      if (image) data.append('image', image);

      const res = await submitVisitorReport(data);
      setResult(res);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  // Success screen
  if (result) {
    return (
      <div className="visitor-page-wrap">
        <div className="visitor-public-header">
          <div className="visitor-brand" onClick={() => navigate('/')}>
            <Logo size={28} />
            <span>Recova</span>
          </div>
          <button className="visitor-theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
        </div>
        <div className="report-success">
          <div className="success-card card">
            <div className={`success-icon ${type === 'found' ? 'found-success-icon' : ''}`}>
              {type === 'found' ? <FiPackage size={32} /> : <FiSearch size={32} />}
            </div>
            <h2>Report Submitted!</h2>
            <p>
              We've emailed a tracking link to <strong>{visitorEmail}</strong>.
              Use it to check your report's status, browse found items, or submit a claim
              — check your spam folder if it doesn't arrive shortly.
            </p>
            <div className="success-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/visitor/track/${result.token}`)}
              >
                Track My Report <FiArrowRight size={16} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="visitor-page-wrap">
      <div className="visitor-public-header">
        <div className="visitor-brand" onClick={() => navigate('/')}>
          <Logo size={28} />
          <span>Recova</span>
        </div>
        <div className="visitor-header-right">
          <button className="visitor-theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
          <p className="visitor-header-note">
            Have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="report-page">
        <div className="report-header">
          <div className={`report-header-icon ${type === 'found' ? 'found-icon' : 'lost-icon'}`}>
            {type === 'found' ? <FiPackage size={22} /> : <FiSearch size={22} />}
          </div>
          <div>
            <h1 className="report-title">Report an Item</h1>
            <p className="report-subtitle">
              Visiting campus? Report a lost or found item — no account needed
            </p>
          </div>
        </div>

        <div className="visitor-type-toggle">
          <button
            type="button"
            className={`visitor-type-btn ${type === 'lost' ? 'visitor-type-active' : ''}`}
            onClick={() => setType('lost')}
            disabled={loading}
          >
            I Lost Something
          </button>
          <button
            type="button"
            className={`visitor-type-btn ${type === 'found' ? 'visitor-type-active' : ''}`}
            onClick={() => setType('found')}
            disabled={loading}
          >
            I Found Something
          </button>
        </div>

        <div className="report-layout">
          <div className="report-form-card card">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-group">
                <label className="form-label">
                  <FiUser size={14} /> Your Full Name
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Chidi Okafor"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="report-row">
                <div className="form-group">
                  <label className="form-label">
                    <FiPhone size={14} /> Phone Number
                  </label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiMail size={14} /> Email Address
                  </label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="visitor-form-divider" />

              <div className="form-group">
                <label className="form-label">
                  <FiTag size={14} /> Item Name
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="name"
                  placeholder={type === 'lost' ? 'e.g. Black HP Laptop Bag' : 'e.g. Blue Water Bottle'}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiFileText size={14} /> Description
                </label>
                <textarea
                  className="form-textarea"
                  name="description"
                  placeholder="Describe the item in detail — colour, brand, size, unique markings, contents..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="report-row">
                <div className="form-group">
                  <label className="form-label">
                    <FiTag size={14} /> Category
                  </label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiCalendar size={14} /> {type === 'lost' ? 'Date Lost' : 'Date Found'}
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiMapPin size={14} /> {type === 'lost' ? 'Last Seen Location' : 'Where did you find it?'}
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="location"
                  placeholder="e.g. Faculty of Science, Library Block"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiImage size={14} /> Photo (Recommended)
                </label>
                {!preview ? (
                  <label className="image-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImage}
                      hidden
                    />
                    <FiImage size={28} className="upload-icon" />
                    <span className="upload-title">Take a photo or upload from gallery</span>
                    <span className="upload-hint">
                      PNG, JPG up to 5MB — better photos improve AI matching accuracy
                    </span>
                  </label>
                ) : (
                  <div className="image-preview-wrap">
                    <img src={preview} alt="Preview" className="image-preview" />
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={removeImage}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="report-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                  {!loading && <FiArrowRight size={16} />}
                </button>
              </div>
            </form>
          </div>

          <div className="report-tips">
            <div className="tips-card card">
              <h3 className="tips-title">How Visitor Reports Work</h3>
              <div className="tips-list">
                {[
                  { icon: '📧', tip: 'We\'ll email you a link to track this report' },
                  { icon: '🤖', tip: 'Our AI automatically scans for matches' },
                  { icon: '🔍', tip: 'Use your tracking link to browse found items' },
                  { icon: '✅', tip: 'Submit a claim without creating an account' },
                ].map((t) => (
                  <div key={t.tip} className="tip-item">
                    <span className="tip-emoji">{t.icon}</span>
                    <p>{t.tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-badge card">
              <div className="ai-badge-icon">🤖</div>
              <div>
                <p className="ai-badge-title">AI Matching Active</p>
                <p className="ai-badge-desc">
                  Jina CLIP v2 and SBERT will automatically scan for
                  visual and semantic matches on your report.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}