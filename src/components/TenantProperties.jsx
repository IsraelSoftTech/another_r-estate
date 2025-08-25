import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaBuilding, FaMoneyBillWave, FaEnvelope, FaBars, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaEye, FaComments, FaSearch } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { ref, onValue, push, set, query, orderByChild, get } from 'firebase/database';
import { toast } from 'react-toastify';

export default function TenantProperties() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [landlordNames, setLandlordNames] = useState({});

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
          }
        }, 2000);

        const user = await ensureAuthUser();
        if (cancelled) return;
        setCurrentUser(user);

        // Load all properties and filter for verified ones
        const propsRef = ref(db, 'properties');
        
        off = onValue(propsRef, (snap) => {
          if (cancelled) return;
          
          const raw = snap.val() || {};
          console.log('Raw properties data:', raw);
          
          const list = Object.entries(raw)
            .map(([id, p]) => ({ id, ...p }))
            .filter(p => p.isVerified === true) // Only show verified properties
            .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
          
          console.log('Filtered verified properties:', list);
          setProperties(list);
          setFilteredProperties(list);
          setLoading(false);
          clearTimeout(timeoutId);
          
          // Load landlord names for the properties
          loadLandlordNames(list);
        }, (err) => {
          if (cancelled) return;
          console.error('Failed to load properties:', err);
          setLoading(false);
          clearTimeout(timeoutId);
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading properties:', error);
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
    console.log('Opening modal for property:', property);
    console.log('Landlord names available:', landlordNames);
    console.log('Property landlord ID:', property.landlordId);
    console.log('Landlord name for this property:', landlordNames[property.landlordId]);
    setSelectedProperty(property);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProperty(null);
  };

  const handleContact = (property) => {
    // Navigate to chat with the landlord
    console.log('Starting chat with:', { landlordId: property.landlordId, propertyId: property.id, propertyName: property.name });
    navigate(`/tenant/chats?landlord=${property.landlordId}&property=${property.id}`);
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

  const loadLandlordNames = async (propertiesList) => {
    try {
      // Get unique landlord IDs from properties
      const landlordIds = [...new Set(propertiesList.map(p => p.landlordId).filter(Boolean))];
      
      if (landlordIds.length === 0) return;
      
      // Try both 'users' and 'accounts' databases
      const usersRef = ref(db, 'users');
      const accountsRef = ref(db, 'accounts');
      
      const [usersSnap, accountsSnap] = await Promise.all([
        get(usersRef),
        get(accountsRef)
      ]);
      
      const users = usersSnap.val() || {};
      const accounts = accountsSnap.val() || {};
      
      // Combine both databases
      const allUsers = { ...users, ...accounts };
      
      // Create a mapping of landlord ID to name
      const namesMap = {};
      landlordIds.forEach(id => {
        if (allUsers[id]) {
          const landlord = allUsers[id];
          namesMap[id] = landlord.displayName || landlord.username || landlord.email || 'Landlord';
        } else {
          namesMap[id] = 'Landlord';
        }
      });
      
      setLandlordNames(namesMap);
      console.log('Landlord names loaded:', namesMap);
    } catch (error) {
      console.error('Error loading landlord names:', error);
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
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
                      Start Chat
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
        <div 
          className="modal-overlay" 
          onClick={closeDetailsModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '600px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'modalSlideIn 0.3s ease-out'
            }}
          >
            <div 
              className="modal-header"
              style={{
                padding: '1.5rem 2rem 1rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Property Details</h2>
              <button 
                className="modal-close" 
                onClick={closeDetailsModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                ×
              </button>
            </div>
            
            <div 
              className="modal-body"
              style={{
                padding: '2rem',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}
            >
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
                    <strong>Landlord:</strong> {landlordNames[selectedProperty.landlordId] || 'N/A'}
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

            <div 
              className="modal-footer"
              style={{
                padding: '1.5rem 2rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                background: '#f8fafc'
              }}
            >
              <button 
                className="action-button secondary-button" 
                onClick={closeDetailsModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#d1d5db';
                }}
              >
                Close
              </button>
              <button 
                className="action-button primary-button" 
                onClick={() => {
                  closeDetailsModal();
                  handleContact(selectedProperty);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <FaComments />
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
