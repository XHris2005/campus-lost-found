import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportFoundItem } from '../../api/itemApi';
import {
  FiPackage, FiMapPin, FiCalendar, FiTag,
  FiFileText, FiImage, FiX, FiArrowRight,
} from 'react-icons/fi';
import './ReportFoundItem.css';

const CATEGORIES = [
  'Bag', 'Mobile Phone', 'Laptop', 'Books / Notes',
  'Charger / Accessories', 'Clothing', 'ID Card', 'Keys', 'Other',
];

export default function ReportFoundItem() {
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', location: '', dateFound: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('location', formData.location);
      data.append('dateFound', formData.dateFound);
      if (image) data.append('image', image);
      await reportFoundItem(data);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="report-success">
        <div className="success-card card">
          <div className="success-icon found-success-icon">
            <FiPackage size={32} />
          </div>
          <h2>Found Item Reported!</h2>
          <p>
            Thank you for helping reunite this item with its owner.
            Our AI will automatically search for the owner and notify them.
          </p>
          <div className="success-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/listings')}
            >
              Browse Listings
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSuccess(false);
                setFormData({ name: '', description: '', category: '', location: '', dateFound: '' });
                setImage(null);
                setPreview(null);
              }}
            >
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="report-header-icon found-icon">
          <FiPackage size={22} />
        </div>
        <div>
          <h1 className="report-title">Report Found Item</h1>
          <p className="report-subtitle">
            Help reunite someone with their lost belonging
          </p>
        </div>
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
                <FiTag size={14} /> Item Name
              </label>
              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="e.g. Blue Water Bottle"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FiFileText size={14} /> Description
              </label>
              <textarea
                className="form-textarea"
                name="description"
                placeholder="Describe the item — colour, brand, condition, any markings..."
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
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
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiCalendar size={14} /> Date Found
                </label>
                <input
                  className="form-input"
                  type="date"
                  name="dateFound"
                  value={formData.dateFound}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <FiMapPin size={14} /> Where did you find it?
              </label>
              <input
                className="form-input"
                type="text"
                name="location"
                placeholder="e.g. Library entrance, Faculty of Engineering"
                value={formData.location}
                onChange={handleChange}
                required
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
                  <span className="upload-title">Click to upload a photo</span>
                  <span className="upload-hint">
                    PNG, JPG up to 5MB — photos significantly improve matching
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
                onClick={() => navigate('/dashboard')}
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
            <h3 className="tips-title">What happens next?</h3>
            <div className="tips-list">
              {[
                { icon: '🤖', tip: 'Our AI scans all lost item reports for a match' },
                { icon: '📊', tip: 'Visual and semantic similarity is computed' },
                { icon: '🔔', tip: 'The owner is notified if a match is found' },
                { icon: '✅', tip: 'Admin verifies the match before connecting you' },
                { icon: '💬', tip: 'A chat is created for you to arrange the return' },
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
                Jina CLIP v2 and SBERT will automatically search for
                the owner of this item.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}