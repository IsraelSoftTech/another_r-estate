import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaUsers, FaBuilding, FaMoneyBillWave, FaLandmark, FaBars, FaCheckCircle, FaClock, FaCheckCircle as FaApproved } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { onValue, ref } from 'firebase/database';
import { toast } from 'react-toastify';

const AdminGov = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [forwardedVerifications, setForwardedVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off;
    let cancelled = false;

    ensureAuthUser()
      .then(() => {
        if (cancelled) return;

        // Load properties that have been forwarded to government
        const propsRef = ref(db, 'properties');
        off = onValue(propsRef, (snap) => {
          if (cancelled) return;
          
          const raw = snap.val() || {};
          const list = Object.entries(raw)
            .filter(([id, item]) => 
              // Only get properties that have been forwarded to government
              item.governmentRequested && 
              item.verificationStatus === 'forwarded_to_government'
            )
            .map(([id, p]) => ({
              id,
              ...p,
              status: p.governmentApproved ? 'approved' : 'pending'
            }))
            .sort((a, b) => (b.governmentRequestedAt || 0) - (a.governmentRequestedAt || 0));
          
          setForwardedVerifications(list);
          setLoading(false);
        }, (err) => {
          if (cancelled) return;
          console.error('Failed to load forwarded verifications:', err);
          toast.error('Failed to load forwarded verifications');
          setLoading(false);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err?.message || 'Authentication required');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (typeof off === 'function') off();
    };
  }, []);

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '';
    try { return `XAF ${price.toLocaleString()}`; } catch (_) { return `XAF ${price}`; }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FaApproved style={{ color: '#059669' }} />;
      case 'pending':
        return <FaClock style={{ color: '#f59e0b' }} />;
      default:
        return <FaClock style={{ color: '#64748b' }} />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-badge completed';
      case 'pending':
        return 'status-badge pending';
      default:
        return 'status-badge pending';
    }
  };

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
            <Link to="/admin/transactions" className="nav-item">
              <FaMoneyBillWave /> Transactions
            </Link>
            <Link to="/admin/government" className="nav-item last-item active">
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
          <h1 className="dashboard-title">Government Verification Requests</h1>
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
              <h3>Total Forwarded</h3>
              <p className="stat-number">{forwardedVerifications.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p className="stat-number">{forwardedVerifications.filter(v => v.status === 'pending').length}</p>
            </div>
            <div className="stat-card">
              <h3>Approved</h3>
              <p className="stat-number">{forwardedVerifications.filter(v => v.status === 'approved').length}</p>
            </div>
          </div>

          <div className="table-wrapper" style={{ marginTop: '2rem', overflowX: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div className="loader">Loading forwarded verifications...</div>
              </div>
            ) : forwardedVerifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No forwarded verifications</div>
                <div style={{ fontSize: '0.9rem' }}>Verifications forwarded from admin will appear here</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  Showing {forwardedVerifications.length} forwarded verification{forwardedVerifications.length !== 1 ? 's' : ''}
                </div>
                <table className="properties-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th>Property</th>
                      <th>Landlord</th>
                      <th>Location</th>
                      <th>Price</th>
                      <th>Forwarded Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forwardedVerifications.map((verification) => (
                      <tr key={verification.id} style={{ borderTop: '1px solid #eee' }}>
                        <td data-label="Property">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <strong>{verification.name}</strong>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Type: {verification.propertyType || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td data-label="Landlord">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>{verification.landlordName || 'Unknown'}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {verification.landlordId || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td data-label="Location">
                          {verification.city || verification.location || 'N/A'}
                        </td>
                        <td data-label="Price">
                          {formatPrice(verification.price)}
                        </td>
                        <td data-label="Forwarded Date">
                          {formatDate(verification.governmentRequestedAt)}
                        </td>
                        <td data-label="Status">
                          <span className={getStatusBadgeClass(verification.status)}>
                            {getStatusIcon(verification.status)} {verification.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminGov; 