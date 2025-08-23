import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaUsers, FaBuilding, FaMoneyBillWave, FaLandmark, FaBars, FaCheckCircle, FaTimesCircle, FaEye, FaCheck, FaBan } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { onValue, ref, update } from 'firebase/database';
import { toast } from 'react-toastify';

export default function AdminVerification() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let off;
    let cancelled = false;

    ensureAuthUser()
      .then(() => {
        if (cancelled) return;

        const propsRef = ref(db, 'properties');
        off = onValue(propsRef, (snap) => {
          const raw = snap.val() || {};
          const list = Object.entries(raw)
            .map(([id, p]) => ({ id, ...p }))
            .filter(p => (p.verificationRequested && !p.isVerified && !p.governmentRequested) || 
                        (p.verificationStatus === 'withdrawn_from_government' && p.verificationRequested)) // Show unverified requests and withdrawn requests
            .sort((a, b) => (b.verificationRequestedAt || 0) - (a.verificationRequestedAt || 0));
          setVerificationRequests(list);
        }, (err) => {
          toast.error(err?.message || 'Failed to load verification requests');
          setVerificationRequests([]);
        });
      })
      .catch((err) => {
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
          isVerified: false,
          verificationStatus: 'rejected',
          verifiedAt: timestamp,
          verifiedBy: 'admin',
          verificationRequested: false
        };
      } else if (action === 'forward') {
        updates = {
          verificationStatus: 'forwarded_to_government',
          forwardedAt: timestamp,
          forwardedBy: 'admin',
          governmentRequested: true,
          governmentRequestedAt: timestamp
        };
      }

      await update(ref(db, `properties/${selectedRequest.id}`), updates);
      
      const actionText = action === 'reject' ? 'rejected' : 'forwarded to government';
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
    return new Date(timestamp).toLocaleString();
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
            <Link to="/admin/verification" className="nav-item active">
              <FaCheckCircle /> Verification
            </Link>
            <Link to="/admin/transactions" className="nav-item">
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
          <h1 className="dashboard-title">Verification Requests</h1>
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
          <div className="table-wrapper" style={{ marginTop: '1rem', overflowX: 'auto' }}>
            {verificationRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No verification requests</div>
                <div style={{ fontSize: '0.9rem' }}>All properties are verified or no requests pending</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  Showing {verificationRequests.length} verification request{verificationRequests.length !== 1 ? 's' : ''}
                </div>
                <table className="properties-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th>Property</th>
                      <th>Landlord</th>
                      <th>Location</th>
                      <th>Price</th>
                      <th>Requested</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationRequests.map((request) => (
                      <tr key={request.id} style={{ borderTop: '1px solid #eee' }}>
                        <td data-label="Property">{request.name}</td>
                        <td data-label="Landlord">{request.landlordName || 'Unknown'}</td>
                        <td data-label="Location">{request.city || request.location}</td>
                        <td data-label="Price">{formatPrice(request.price)}</td>
                        <td data-label="Requested">{formatDate(request.verificationRequestedAt)}</td>
                        <td data-label="Actions">
                          <button 
                            className="table-action-btn edit-btn" 
                            title="View Details" 
                            onClick={() => openVerificationModal(request)}
                          >
                            <FaEye />
                          </button>
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
                <p><strong>Requested:</strong> {formatDate(selectedRequest.verificationRequestedAt)}</p>
                
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
                onClick={() => handleVerification('forward')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Forwarding...' : <><FaCheck /> Forward to Government</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 