import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaUsers, FaBuilding, FaMoneyBillWave, FaLandmark, FaBars, FaCheckCircle, FaClock, FaTimesCircle, FaEye, FaEnvelope } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import { toast } from 'react-toastify';

const AdminTransac = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off;
    let cancelled = false;
    let timeoutId;

    const loadTransactions = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            setLoading(false);
            toast.error('Loading timeout. Please refresh the page.');
          }
        }, 2000);

        // Load platform fee information from properties node
        const propsRef = ref(db, 'properties');
        off = onValue(propsRef, (snap) => {
          if (cancelled) return;
          
          const raw = snap.val() || {};
          const list = Object.entries(raw)
            .filter(([id, item]) => item.platformFee) // Only get properties with platform fee info
            .map(([id, p]) => {
              // Convert property with platform fee to transaction format
              const transaction = {
                id: p.platformFee.transactionId || id,
                propertyId: id,
                propertyName: p.name,
                propertyDetails: {
                  type: p.propertyType,
                  location: p.city || p.location,
                  price: p.price,
                  listingType: p.listingType,
                  bedrooms: p.bedrooms,
                  bathrooms: p.bathrooms,
                  area: p.area,
                  sizeUnit: p.sizeUnit
                },
                landlordId: p.landlordId || 'admin',
                landlordName: p.landlordName || 'Admin',
                adminId: p.platformFee.isAdminCreated ? 'admin' : null,
                adminName: p.platformFee.isAdminCreated ? 'Admin' : null,
                amount: p.platformFee.amount,
                type: p.platformFee.isAdminCreated ? 'Admin Property Creation' : 'Platform Fee',
                status: p.platformFee.status,
                timestamp: p.platformFee.paidAt || p.createdAt,
                createdAt: p.platformFee.paidAt || p.createdAt,
                description: p.platformFee.isAdminCreated ? 
                  `Property created by admin: ${p.name}` : 
                  `Platform fee payment for property: ${p.name}`,
                paymentMethod: p.platformFee.paymentMethod,
                isAdminCreated: p.platformFee.isAdminCreated || false
              };
              return transaction;
            })
            .sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
          
          setTransactions(list);
          setLoading(false);
          clearTimeout(timeoutId);
        }, (err) => {
          if (cancelled) return;
          console.error('Failed to load properties with platform fee info:', err);
          toast.error('Failed to load transactions');
          setLoading(false);
          clearTimeout(timeoutId);
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading transactions:', error);
        toast.error('Error loading transactions');
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    loadTransactions();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (typeof off === 'function') off();
    };
  }, []);

  const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
      // Find the property that contains this transaction
      const propertyRef = ref(db, 'properties');
      const snapshot = await get(propertyRef);
      const properties = snapshot.val() || {};
      
      let propertyId = null;
      for (const [id, prop] of Object.entries(properties)) {
        if (prop.platformFee && prop.platformFee.transactionId === transactionId) {
          propertyId = id;
          break;
        }
      }
      
      if (!propertyId) {
        toast.error('Property not found for this transaction');
        return;
      }
      
      // Update the platform fee status in the property record
      const updateData = {
        'platformFee.status': newStatus,
        updatedAt: Date.now(),
        adminUpdated: true
      };
      
      await update(ref(db, `properties/${propertyId}`), updateData);
      toast.success(`Transaction status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      toast.error('Failed to update transaction status');
    }
  };

  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const failedTransactions = transactions.filter(t => t.status === 'failed').length;
  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Group transactions by type
  const platformFees = transactions.filter(t => t.type === 'Platform Fee').length;
  const propertyInquiries = transactions.filter(t => t.type === 'Property Inquiry').length;
  const propertySales = transactions.filter(t => t.type === 'Property Sale').length;
  const propertyRentals = transactions.filter(t => t.type === 'Property Rental').length;
  const adminPropertyCreations = transactions.filter(t => t.type === 'Admin Property Creation').length;

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '';
    try { return `XAF ${price.toLocaleString()}`; } catch (_) { return `XAF ${price}`; }
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'completed': return <FaCheckCircle style={{ color: '#059669' }} />;
      case 'pending': return <FaClock style={{ color: '#f59e0b' }} />;
      case 'failed': return <FaTimesCircle style={{ color: '#dc2626' }} />;
      default: return <FaClock style={{ color: '#64748b' }} />;
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'Platform Fee': return <FaMoneyBillWave style={{ color: '#3b82f6' }} />;
      case 'Property Inquiry': return <FaEnvelope style={{ color: '#8b5cf6' }} />;
      case 'Property Sale': return <FaBuilding style={{ color: '#059669' }} />;
      case 'Property Rental': return <FaHome style={{ color: '#f59e0b' }} />;
      case 'Admin Property Creation': return <FaBuilding style={{ color: '#dc2626' }} />;
      default: return <FaMoneyBillWave style={{ color: '#64748b' }} />;
    }
  };

  const getTransactionTypeBadgeClass = (type) => {
    switch (type) {
      case 'Platform Fee': return 'type-badge platform-fee';
      case 'Property Inquiry': return 'type-badge inquiry';
      case 'Property Sale': return 'type-badge sale';
      case 'Property Rental': return 'type-badge rental';
      case 'Admin Property Creation': return 'type-badge admin-creation';
      default: return 'type-badge default';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'status-badge completed';
      case 'pending': return 'status-badge pending';
      case 'failed': return 'status-badge failed';
      default: return 'status-badge pending';
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
            <Link to="/admin" className="nav-item">
              <FaHome /> Dashboard
            </Link>
            <Link to="/admin/users" className="nav-item">
              <FaUsers /> Users
            </Link>
            <Link to="/admin/properties" className="nav-item">
              <FaBuilding /> Properties
            </Link>
            <Link to="/admin/verification" className="nav-item">
              <FaCheckCircle /> Verification
            </Link>
            <Link to="/admin/transactions" className="nav-item active">
              <FaMoneyBillWave /> Transactions
            </Link>
            <Link to="/admin/government" className="nav-item last-item">
              <FaLandmark /> Government
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
          <h1 className="dashboard-title">All Transactions</h1>
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
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Transactions</h3>
              <p className="stat-number">{totalTransactions}</p>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <p className="stat-number">{completedTransactions}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p className="stat-number">{pendingTransactions}</p>
            </div>
            <div className="stat-card">
              <h3>Failed</h3>
              <p className="stat-number">{failedTransactions}</p>
            </div>
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-number">{formatPrice(totalRevenue)}</p>
            </div>
          </div>

          <div className="table-wrapper" style={{ marginTop: '2rem', overflowX: 'auto' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No transactions found</div>
                <div style={{ fontSize: '0.9rem' }}>Transactions will appear here when users make payments or complete property transactions</div>
              </div>
            ) : (
              <table className="properties-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th>Transaction ID</th>
                    <th>Type</th>
                    <th>Property Details</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Landlord</th>
                    <th>Buyer/Tenant</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderTop: '1px solid #eee' }}>
                      <td data-label="ID">{t.id.substring(0, 8)}...</td>
                      <td data-label="Type">
                        <span className={getTransactionTypeBadgeClass(t.type)}>
                          {getTransactionTypeIcon(t.type)} {t.type}
                        </span>
                      </td>
                      <td data-label="Property Details">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <strong>{t.propertyName || t.propertyId || 'N/A'}</strong>
                          {t.propertyDetails && (
                            <>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                Type: {t.propertyDetails.type || 'N/A'}
                              </span>
                              {t.propertyDetails.bedrooms && (
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  {t.propertyDetails.bedrooms} Beds, {t.propertyDetails.bathrooms || 0} Baths
                                </span>
                              )}
                              {t.propertyDetails.area && (
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  {t.propertyDetails.area} {t.propertyDetails.sizeUnit || 'sqm'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td data-label="Location">
                        {t.propertyDetails?.location || t.city || t.location || 'N/A'}
                      </td>
                      <td data-label="Price">
                        {t.propertyDetails?.price ? formatPrice(t.propertyDetails.price) : 'N/A'}
                      </td>
                      <td data-label="Landlord">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span>{t.landlordName || t.landlordId || 'N/A'}</span>
                          {t.adminId && (
                            <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>
                              Admin Created
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Buyer/Tenant">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span>{t.buyerName || t.tenantName || t.tenantId || 'N/A'}</span>
                          {t.tenantEmail && (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {t.tenantEmail}
                            </span>
                          )}
                          {t.tenantPhone && (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {t.tenantPhone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Amount">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span>{t.amount > 0 ? formatPrice(Number(t.amount)) : 'Free'}</span>
                          {t.paymentMethod && t.paymentMethod !== 'N/A' && (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {t.paymentMethod}
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={getStatusBadgeClass(t.status)}>
                          <StatusIcon status={t.status} /> {t.status}
                        </span>
                      </td>
                      <td data-label="Date">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span>{new Date(t.timestamp || t.createdAt || Date.now()).toLocaleDateString()}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(t.timestamp || t.createdAt || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td data-label="Actions">
                        {t.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="action-button small-button success"
                              onClick={() => updateTransactionStatus(t.id, 'completed')}
                              title="Mark as completed"
                            >
                              <FaCheckCircle />
                            </button>
                            <button
                              className="action-button small-button danger"
                              onClick={() => updateTransactionStatus(t.id, 'failed')}
                              title="Mark as failed"
                            >
                              <FaTimesCircle />
                            </button>
                          </div>
                        )}
                        {t.status === 'completed' && (
                          <span style={{ color: '#059669', fontSize: '0.9rem' }}>
                            <FaCheckCircle /> Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminTransac; 