import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaBuilding, FaMoneyBillWave, FaEnvelope, FaBars, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaEye, FaComments, FaSearch } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { ref, onValue, push, set, query, orderByChild } from 'firebase/database';
import { toast } from 'react-toastify';

export default function TenantProperties() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let off;
    let cancelled = false;
    let timeoutId;

    const loadProperties = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            setLoading(false);
            toast.error('Loading timeout. Please refresh the page.');
          }
        }, 2000);

        const user = await ensureAuthUser();
        if (cancelled) return;
        setCurrentUser(user);

        // Load only verified properties
        const propsRef = ref(db, 'properties');
        const verifiedPropsQuery = query(propsRef, orderByChild('isVerified'));
        
        off = onValue(verifiedPropsQuery, (snap) => {
          if (cancelled) return;
          
          const raw = snap.val() || {};
          const list = Object.entries(raw)
            .map(([id, p]) => ({ id, ...p }))
            .filter(p => p.isVerified === true) // Only show verified properties
            .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
          
          setProperties(list);
          setFilteredProperties(list);
          setLoading(false);
          clearTimeout(timeoutId);
        }, (err) => {
          if (cancelled) return;
          console.error('Failed to load properties:', err);
          toast.error('Failed to load properties');
          setLoading(false);
          clearTimeout(timeoutId);
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading properties:', error);
        toast.error('Error loading properties');
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    loadProperties();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (typeof off === 'function') off();
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = properties.filter(p => (
      p.name?.toLowerCase().includes(query) ||
      p.city?.toLowerCase().includes(query) ||
      p.location?.toLowerCase().includes(query) ||
      p.propertyType?.toLowerCase().includes(query) ||
      p.listingType?.toLowerCase().includes(query)
    ));
    setFilteredProperties(filtered);
  }, [searchQuery, properties]);

  const openDetailsModal = (property) => {
    setSelectedProperty(property);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProperty(null);
  };

  const handleContact = (property) => {
    // Navigate to chat with the landlord
    window.location.href = `/tenant/chats?landlord=${property.landlordId}&property=${property.id}`;
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `XAF ${Number(price).toLocaleString()}`;
  };

  const getListingTypeText = (type) => {
    switch (type) {
      case 'sale': return 'For Sale';
      case 'rent': return 'For Rent';
      case 'pledge': return 'For Pledge';
      case 'lease': return 'For Lease';
      default: return 'For Sale';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {mobileMenuOpen && <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="logo-section">
          <img src={logo} alt="ITT Real Estate Logo" />
          <span>ITT Real Estate</span>
        </div>
        <nav className="nav-menu">
          <div className="menu-items">
            <Link to="/tenant" className="nav-item">
              <FaHome /> Dashboard
            </Link>
            <Link to="/tenant/properties" className="nav-item active">
              <FaBuilding /> Properties
            </Link>
            <Link to="/tenant/transactions" className="nav-item">
              <FaMoneyBillWave /> Transactions
            </Link>
            <Link to="/tenant/chats" className="nav-item last-item">
              <FaEnvelope /> Chats
            </Link>
          </div>
          <div className="mobile-menu-footer">
            <ProfileCircle />
            <LogoutButton />
          </div>
        </nav>
      </aside>
      
      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Verified Properties</h1>
          <div className="header-actions">
            <button className="menu-toggle" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Toggle menu">
              <FaBars />
            </button>
            <div className="desktop-profile">
              <ProfileCircle />
            </div>
            <div className="desktop-logout">
              <LogoutButton />
            </div>
          </div>
        </div>

        <section className="content-section">
          <div className="search-section" style={{ marginBottom: '2rem' }}>
            <div className="search-box">
              <FaSearch style={{ color: '#64748b', marginRight: '0.5rem' }} />
              <input
                type="text"
                placeholder="Search properties by name, location, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: '1rem',
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          <div className="properties-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '1.5rem'
          }}>
            {filteredProperties.length === 0 ? (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '3rem', 
                color: '#666' 
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                  {searchQuery ? 'No properties match your search' : 'No verified properties available'}
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new listings'}
                </div>
              </div>
            ) : (
              filteredProperties.map(property => (
                <div key={property.id} className="property-card" style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  {property.mainImage && (
                    <div style={{ 
                      height: '200px', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      marginBottom: '1rem',
                      background: `url(${property.mainImage}) center/cover`
                    }} />
                  )}
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                      {property.name || 'Untitled Property'}
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      color: '#64748b',
                      marginBottom: '0.5rem'
                    }}>
                      <FaMapMarkerAlt />
                      <span>{property.city || property.location || 'Unknown Location'}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      color: '#3b82f6',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      <FaMoneyBillWave />
                      <span>{formatPrice(property.price)}</span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {property.bedrooms > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b' }}>
                        <FaBed />
                        <span>{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b' }}>
                        <FaBath />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                    {property.area > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b' }}>
                        <FaRulerCombined />
                        <span>{property.area} {property.sizeUnit || 'sqm'}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      background: property.listingType === 'sale' ? '#dbeafe' : '#fef3c7',
                      color: property.listingType === 'sale' ? '#1e40af' : '#d97706'
                    }}>
                      {getListingTypeText(property.listingType)}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      background: '#dcfce7',
                      color: '#059669'
                    }}>
                      Verified
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="action-button secondary-button"
                      onClick={() => openDetailsModal(property)}
                      style={{ flex: 1 }}
                    >
                      <FaEye style={{ marginRight: '0.5rem' }} />
                      View Details
                    </button>
                    <button
                      className="action-button primary-button"
                      onClick={() => handleContact(property)}
                      style={{ flex: 1 }}
                    >
                      <FaComments style={{ marginRight: '0.5rem' }} />
                      Contact
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Property Details Modal */}
      {showDetailsModal && selectedProperty && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Property Details</h2>
              <button className="modal-close" onClick={closeDetailsModal}>×</button>
            </div>
            
            <div className="modal-body">
              {selectedProperty.mainImage && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <img 
                    src={selectedProperty.mainImage} 
                    alt={selectedProperty.name}
                    style={{ 
                      width: '100%', 
                      height: '200px', 
                      objectFit: 'cover', 
                      borderRadius: '8px' 
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                  {selectedProperty.name || 'Untitled Property'}
                </h3>
                <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                  {selectedProperty.city || selectedProperty.location}
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: '#3b82f6',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  <FaMoneyBillWave />
                  <span>{formatPrice(selectedProperty.price)}</span>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {selectedProperty.bedrooms > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b' }}>
                    <FaBed />
                    <span>{selectedProperty.bedrooms} Bedrooms</span>
                  </div>
                )}
                {selectedProperty.bathrooms > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b' }}>
                    <FaBath />
                    <span>{selectedProperty.bathrooms} Bathrooms</span>
                  </div>
                )}
                {selectedProperty.area > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b' }}>
                    <FaRulerCombined />
                    <span>{selectedProperty.area} {selectedProperty.sizeUnit || 'sqm'}</span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Property Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <strong>Type:</strong> {selectedProperty.propertyType || 'N/A'}
                  </div>
                  <div>
                    <strong>Listing:</strong> {getListingTypeText(selectedProperty.listingType)}
                  </div>
                  <div>
                    <strong>Landlord:</strong> {selectedProperty.landlordName || 'N/A'}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: '#dcfce7',
                      color: '#059669',
                      marginLeft: '0.5rem'
                    }}>
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {selectedProperty.description && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Description</h4>
                  <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>
                    {selectedProperty.description}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="action-button secondary-button" 
                onClick={closeDetailsModal}
              >
                Close
              </button>
              <button 
                className="action-button primary-button" 
                onClick={() => {
                  closeDetailsModal();
                  handleContact(selectedProperty);
                }}
              >
                <FaComments style={{ marginRight: '0.5rem' }} />
                Contact Landlord
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
