import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLostItems, getFoundItems } from '../../api/itemApi';
import { getMyMatches } from '../../api/claimApi';
import ItemCard from '../../components/ItemCard/ItemCard';
import ClaimModal from '../../components/ClaimModal/ClaimModal';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiPackage, FiX } from 'react-icons/fi';
import './Listings.css';

const CATEGORIES = [
  'All', 'Bag', 'Mobile Phone', 'Laptop', 'Books / Notes',
  'Charger / Accessories', 'Clothing', 'ID Card', 'Keys', 'Other',
];

export default function Listings() {
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myMatches, setMyMatches] = useState([]);
  const [claimingItem, setClaimingItem] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
    fetchMyMatches();
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [search, category, items]);

  async function fetchItems() {
    setLoading(true);
    setError('');
    setSearch('');
    setCategory('All');
    try {
      const data = activeTab === 'lost'
        ? await getLostItems()
        : await getFoundItems();
      setItems(data);
      setFiltered(data);
    } catch (err) {
      setError('Could not load items. Please try again.');
    }
    setLoading(false);
  }

  async function fetchMyMatches() {
    try {
      const matches = await getMyMatches();
      setMyMatches(matches);
    } catch (err) {
      console.error('Could not fetch matches:', err);
    }
  }

  function applyFilters() {
    let results = [...items];
    if (category !== 'All') {
      results = results.filter(i => i.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q)
      );
    }
    setFiltered(results);
  }

  function clearFilters() {
    setSearch('');
    setCategory('All');
  }

  // Returns match info for a found item if it matches one of the user's lost items
  function getMatchForFoundItem(foundItemId) {
    return myMatches.find(m => m.foundItemId === foundItemId) || null;
  }

  // A found item is manually claimable when:
  // - It belongs to someone else
  // - It has no active/approved/pending match, OR all existing matches are rejected
  function isClaimable(item) {
    if (item.userId === currentUser?.uid) return false;
    const match = getMatchForFoundItem(item.id);
    if (!match) return true;
    return match.status === 'rejected';
  }

  const hasFilters = search || category !== 'All';

  return (
    <div className="listings-page">
      <div className="listings-header">
        <div>
          <h1 className="page-title">Browse Listings</h1>
          <p className="listings-subtitle">
            Search all reported lost and found items on campus
          </p>
        </div>
      </div>

      <div className="listings-tabs">
        <button
          className={`listings-tab ${activeTab === 'lost' ? 'listings-tab-active' : ''}`}
          onClick={() => setActiveTab('lost')}
        >
          <FiSearch size={16} /> Lost Items
        </button>
        <button
          className={`listings-tab ${activeTab === 'found' ? 'listings-tab-active listings-tab-found' : ''}`}
          onClick={() => setActiveTab('found')}
        >
          <FiPackage size={16} /> Found Items
        </button>
      </div>

      <div className="listings-controls">
        <div className="search-wrap">
          <FiSearch className="search-icon" size={16} />
          <input
            className="search-input"
            type="text"
            placeholder="Search by name, description or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="filter-row">
          <div className="category-filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${category === cat ? 'category-btn-active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm clear-btn" onClick={clearFilters}>
              <FiX size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {!loading && (
        <div className="listings-meta">
          <span className="listings-count">
            {filtered.length} {activeTab} item{filtered.length !== 1 ? 's' : ''}
            {hasFilters ? ' matching your filters' : ' found'}
          </span>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading items...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Could not load items</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchItems}>Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{activeTab === 'lost' ? '🔍' : '📦'}</div>
          <h3>{hasFilters ? 'No items match your search' : `No ${activeTab} items yet`}</h3>
          <p>{hasFilters ? 'Try adjusting your search or filters' : `Be the first to report a ${activeTab} item`}</p>
          {hasFilters && (
            <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
          )}
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map((item) => {
            const match = activeTab === 'found' ? getMatchForFoundItem(item.id) : null;
            const claimable = activeTab === 'found' && isClaimable(item);

            return (
              <ItemCard
                key={item.id}
                item={item}
                type={activeTab}
                matchStatus={match?.status || null}
                onClaim={claimable ? () => setClaimingItem(item) : null}
              />
            );
          })}
        </div>
      )}

      {claimingItem && (
        <ClaimModal
          foundItem={claimingItem}
          onClose={() => {
            setClaimingItem(null);
            fetchItems();
            fetchMyMatches();
          }}
        />
      )}
    </div>
  );
}