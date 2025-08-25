import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaCheckCircle, FaBars, FaCheckCircle as FaApproved, FaClock, FaEye, FaCheck, FaBan } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { onValue, ref, update } from 'firebase/database';
import { toast } from 'react-toastify';

export default function CouncilDash() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [forwardedVerifications, setForwardedVerifications] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        }, (err) => {
          if (cancelled) return;
          console.error('Failed to load forwarded verifications:', err);
          toast.error('Failed to load forwarded verifications');
        });
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err?.message || 'Authentication required');
      });

    return () => {
      cancelled = true;
      if (typeof off === 'function') off();
    };
  }, []);

  const openVerificationModal = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleVerification = async (action) => {
    if (!selectedRequest || isProcessing) return;

    setIsProcessing(true);
    try {
      const timestamp = Date.now();
      let updates = {};

      if (action === 'reject') {
        updates = {
          governmentApproved: false,
          governmentRejected: true,
          governmentRejectedAt: timestamp,
          verificationStatus: 'rejected_by_government'
        };
      } else if (action === 'approve') {
        updates = {
          governmentApproved: true,
          governmentApprovedAt: timestamp,
          verificationStatus: 'approved_by_government',
          isVerified: true,
          verifiedAt: timestamp,
          verifiedBy: 'government'
        };
      }

      await update(ref(db, `properties/${selectedRequest.id}`), updates);
      
      const actionText = action === 'reject' ? 'rejected' : 'approved';
      toast.success(`Property ${actionText} successfully`);
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Failed to update verification status');
    } finally {
      setIsProcessing(false);
    }
  };

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
            <Link to="/council" className="nav-item active">
              <FaHome /> Dashboard
            </Link>
            <Link to="/council/verifications" className="nav-item last-item">
              <FaCheckCircle /> Verifications
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
          <h1 className="dashboard-title">Council Dashboard</h1>
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
            {forwardedVerifications.length === 0 ? (
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
                      <th>Actions</th>
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
                        <td data-label="Actions">
                          {verification.status === 'pending' && (
                            <button 
                              className="table-action-btn edit-btn" 
                              title="View Details" 
                              onClick={() => openVerificationModal(verification)}
                            >
                              <FaEye />
                            </button>
                          )}
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

      {/* Verification Modal */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Property Verification Request</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="property-info">
                <h3>{selectedRequest.name}</h3>
                <p><strong>Location:</strong> {selectedRequest.city || selectedRequest.location}</p>
                <p><strong>Price:</strong> {formatPrice(selectedRequest.price)}</p>
                <p><strong>Type:</strong> {selectedRequest.propertyType}</p>
                <p><strong>Listing:</strong> {selectedRequest.listingType}</p>
                <p><strong>Landlord:</strong> {selectedRequest.landlordName}</p>
                <p><strong>Forwarded:</strong> {formatDate(selectedRequest.governmentRequestedAt)}</p>
                
                {selectedRequest.description && (
                  <div className="description-section">
                    <h4>Description:</h4>
                    <p>{selectedRequest.description}</p>
                  </div>
                )}
              </div>

              {selectedRequest.landTitle && (
                <div className="land-title-section">
                  <h4>Land Title Certificate:</h4>
                  <div className="land-title-image">
                    <img 
                      src={selectedRequest.landTitle} 
                      alt="Land Title Certificate"
                      style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                </div>
              )}

              {selectedRequest.mainImage && (
                <div className="main-image-section">
                  <h4>Property Image:</h4>
                  <div className="property-image">
                    <img 
                      src={selectedRequest.mainImage} 
                      alt="Property"
                      style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="action-button secondary-button" 
                onClick={closeModal}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className="action-button danger-button" 
                onClick={() => handleVerification('reject')}
                disabled={isProcessing}
                style={{ backgroundColor: '#dc2626', color: 'white' }}
              >
                {isProcessing ? 'Rejecting...' : <><FaBan /> Reject</>}
              </button>
              <button 
                className="action-button primary-button" 
                onClick={() => handleVerification('approve')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Approving...' : <><FaCheck /> Approve</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
