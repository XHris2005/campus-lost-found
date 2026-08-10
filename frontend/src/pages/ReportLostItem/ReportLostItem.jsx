import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportLostItem } from '../../api/itemApi';
import {
  FiSearch, FiMapPin, FiCalendar, FiTag,
  FiFileText, FiImage, FiX, FiArrowRight,
} from 'react-icons/fi';
import './ReportLostItem.css';

const CATEGORIES = [
  'Bag', 'Mobile Phone', 'Laptop', 'Books / Notes',
  'Charger / Accessories', 'Clothing', 'ID Card', 'Keys', 'Other',
];

export default function ReportLostItem() {
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', location: '', dateLost: '',
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
      data.append('dateLost', formData.dateLost);
      if (image) data.append('image', image);
      await reportLostItem(data);
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
          <div className="success-icon">
            <FiSearch size={32} />
          </div>
          <h2>Report Submitted!</h2>
          <p>
            Your lost item has been reported. Our AI will automatically
            search for matches and notify you when one is found.
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
                setFormData({ name: '', description: '', category: '', location: '', dateLost: '' });
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
      {/* Page Header */}
      <div className="report-header">
        <div className="report-header-icon lost-icon">
          <FiSearch size={22} />
        </div>
        <div>
          <h1 className="report-title">Report Lost Item</h1>
          <p className="report-subtitle">
            Provide details about your lost item so our AI can find matches
          </p>
        </div>
      </div>

      <div className="report-layout">
        {/* Form */}
        <div className="report-form-card card">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="report-form">
            {/* Item Name */}
            <div className="form-group">
              <label className="form-label">
                <FiTag size={14} /> Item Name
              </label>
              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="e.g. Black HP Laptop Bag"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
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
              />
            </div>

            {/* Category + Date row */}
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
                  <FiCalendar size={14} /> Date Lost
                </label>
                <input
                  className="form-input"
                  type="date"
                  name="dateLost"
                  value={formData.dateLost}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">
                <FiMapPin size={14} /> Last Seen Location
              </label>
              <input
                className="form-input"
                type="text"
                name="location"
                placeholder="e.g. Faculty of Science, Library Block"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">
                <FiImage size={14} /> Photo (Recommended)
              </label>
              {!preview ? (
                <label className="image-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
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

            {/* Actions */}
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

        {/* Tips Panel */}
        <div className="report-tips">
          <div className="tips-card card">
            <h3 className="tips-title">Tips for Better Matching</h3>
            <div className="tips-list">
              {[
                { icon: '📸', tip: 'Upload a clear, well-lit photo of the item' },
                { icon: '🎨', tip: 'Mention the exact colour, brand, and model' },
                { icon: '✏️', tip: 'Describe unique marks, scratches, or stickers' },
                { icon: '📍', tip: 'Be specific about where you last saw it' },
                { icon: '🤖', tip: 'Our AI works best with detailed descriptions' },
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
                Jina CLIP v2 and SBERT will automatically scan all
                found items for visual and semantic matches.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}