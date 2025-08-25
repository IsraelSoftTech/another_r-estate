import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaBuilding, FaSearch, FaBars, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaEnvelope, FaPhone, FaMoneyBillWave } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { ref, onValue, push, set, query, orderByChild } from 'firebase/database';
import { toast } from 'react-toastify';

const TenantDash = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    inquiryType: 'general'
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
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

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProperty) {
      
      return;
    }

    if (!inquiryForm.name.trim() || !inquiryForm.email.trim() || !inquiryForm.phone.trim()) {
      
      return;
    }

    setSubmittingInquiry(true);

    try {
      // Create transaction record for the inquiry
      const transactionData = {
        propertyId: selectedProperty.id,
        propertyName: selectedProperty.name,
        landlordId: selectedProperty.landlordId,
        landlordName: selectedProperty.landlordName,
        tenantId: currentUser?.uid || 'anonymous',
        tenantName: inquiryForm.name,
        tenantEmail: inquiryForm.email,
        tenantPhone: inquiryForm.phone,
        amount: 0, // Inquiry has no cost
        type: 'Property Inquiry',
        inquiryType: inquiryForm.inquiryType,
        message: inquiryForm.message,
        status: 'pending', // Admin can review and respond
        timestamp: Date.now(),
        createdAt: Date.now(),
        description: `${inquiryForm.inquiryType} inquiry for ${selectedProperty.name}`,
        inquiryDetails: {
          name: inquiryForm.name,
          email: inquiryForm.email,
          phone: inquiryForm.phone,
          message: inquiryForm.message,
          type: inquiryForm.inquiryType
        }
      };

      // Save inquiry transaction to database
      const transactionsRef = ref(db, 'transactions');
      let newTransactionRef;
      
      try {
        // Try to save to transactions node first
        newTransactionRef = push(transactionsRef);
        await set(newTransactionRef, transactionData);
        console.log('Inquiry transaction created successfully in transactions node:', newTransactionRef.key);
      } catch (transactionError) {
        console.warn('Failed to create transaction in transactions node, using properties node as fallback:', transactionError);
        
        // Fallback: Store transaction in properties node with a special prefix
        const fallbackRef = ref(db, `properties/transaction_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
        await set(fallbackRef, transactionData);
        newTransactionRef = fallbackRef;
        console.log('Inquiry transaction created successfully in properties node (fallback):', fallbackRef.key);
      }

      toast.success('Inquiry submitted successfully! We will contact you soon.');
      
      // Reset form and close modal
      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        message: '',
        inquiryType: 'general'
      });
      setShowInquiryModal(false);
      setSelectedProperty(null);

    } catch (error) {
      console.error('Error submitting inquiry:', error);
      
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const openInquiryModal = (property) => {
    setSelectedProperty(property);
    setShowInquiryModal(true);
  };

  const closeInquiryModal = () => {
    setShowInquiryModal(false);
    setSelectedProperty(null);
    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      message: '',
      inquiryType: 'general'
    });
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
            <Link to="/tenant" className="nav-item active">
              <FaHome /> Dashboard
            </Link>
            <Link to="/tenant/properties" className="nav-item">
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
          <h1 className="dashboard-title">Available Properties</h1>
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

          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Properties</h3>
              <p className="stat-number">{properties.length}</p>
            </div>
            <div className="stat-card">
              <h3>For Sale</h3>
              <p className="stat-number">{properties.filter(p => p.listingType === 'sale').length}</p>
            </div>
            <div className="stat-card">
              <h3>For Rent</h3>
              <p className="stat-number">{properties.filter(p => p.listingType === 'rent').length}</p>
            </div>
            <div className="stat-card">
              <h3>Available Now</h3>
              <p className="stat-number">{filteredProperties.length}</p>
            </div>
          </div>

          <div className="properties-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {filteredProperties.length === 0 ? (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '3rem', 
                color: '#666' 
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                  {searchQuery ? 'No properties match your search' : 'No properties available'}
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

                  <button
                    className="action-button primary-button"
                    onClick={() => openInquiryModal(property)}
                    style={{ width: '100%' }}
                  >
                    <FaEnvelope style={{ marginRight: '0.5rem' }} />
                    Make Inquiry
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Inquiry Modal */}
      {showInquiryModal && selectedProperty && (
        <div className="modal-overlay" onClick={closeInquiryModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Property Inquiry</h2>
              <button className="modal-close" onClick={closeInquiryModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                  {selectedProperty.name || 'Untitled Property'}
                </h3>
                <p style={{ margin: '0', color: '#64748b' }}>
                  {selectedProperty.city || selectedProperty.location} - {formatPrice(selectedProperty.price)}
                </p>
              </div>

              <form onSubmit={handleInquirySubmit}>
                <div className="form-row">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Inquiry Type</label>
                  <select
                    value={inquiryForm.inquiryType}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, inquiryType: e.target.value }))}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="viewing">Schedule Viewing</option>
                    <option value="purchase">Purchase Interest</option>
                    <option value="rental">Rental Interest</option>
                    <option value="negotiation">Price Negotiation</option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Message</label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us more about your interest in this property..."
                    rows="4"
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button 
                className="action-button secondary-button" 
                onClick={closeInquiryModal}
                disabled={submittingInquiry}
              >
                Cancel
              </button>
              <button 
                className="action-button primary-button" 
                onClick={handleInquirySubmit}
                disabled={submittingInquiry}
              >
                {submittingInquiry ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDash; 