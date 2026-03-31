import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-code">404</div>
        <h2>Page Not Found</h2>
        <p>
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="notfound-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft size={16} /> Go Back
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            <FiSearch size={16} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}