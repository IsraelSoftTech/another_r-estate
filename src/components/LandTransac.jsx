import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaBuilding, FaMoneyBillWave, FaBars, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { onValue, ref, query, orderByChild, equalTo } from 'firebase/database';
import { toast } from 'react-toastify';

export default function LandTransac() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    let off;
    let cancelled = false;
    ensureAuthUser()
      .then((user) => {
        if (cancelled) return;
        
        // Load platform fee transactions from properties node
        const propsRef = ref(db, 'properties');
        off = onValue(propsRef, (snap) => {
          if (cancelled) return;
          
          const raw = snap.val() || {};
          const list = Object.entries(raw)
            .filter(([id, item]) => 
              // Only get properties with platform fee info that belong to this landlord
              item.platformFee && 
              item.landlordId === user.uid && 
              !item.platformFee.isAdminCreated
            )
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
                landlordId: p.landlordId,
                landlordName: p.landlordName,
                amount: p.platformFee.amount,
                type: 'Platform Fee',
                status: p.platformFee.status,
                timestamp: p.platformFee.paidAt || p.createdAt,
                createdAt: p.platformFee.paidAt || p.createdAt,
                description: `Platform fee payment for property: ${p.name}`,
                paymentMethod: p.platformFee.paymentMethod,
                isAdminCreated: false
              };
              return transaction;
            })
            .sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
          
          setTransactions(list);
        }, (err) => {
          if (cancelled) return;
          console.error('Failed to load properties with platform fee info:', err);
          toast.error('Failed to load transactions');
          setTransactions([]);
        });
      })
      .catch((err) => toast.error(err?.message || 'Authentication required'));

    return () => { cancelled = true; if (typeof off === 'function') off(); };
  }, []);

  const totalAmount = useMemo(() => transactions.filter(t => t.status === 'completed').reduce((s, t) => s + (Number(t.amount) || 0), 0), [transactions]);

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
            <Link to="/landlord" className="nav-item">
              <FaHome /> Dashboard
            </Link>
            <Link to="/landlord/properties" className="nav-item">
              <FaBuilding /> Properties
            </Link>
            <Link to="/landlord/transactions" className="nav-item active">
              <FaMoneyBillWave /> Transactions
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
          <h1 className="dashboard-title">My Transactions</h1>
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
              <h3>Total Completed Amount</h3>
              <p className="stat-number">{formatPrice(totalAmount)}</p>
            </div>
            <div className="stat-card">
              <h3>Total Transactions</h3>
              <p className="stat-number">{transactions.length}</p>
            </div>
          </div>

          <div className="table-wrapper" style={{ marginTop: '1rem', overflowX: 'auto' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No transactions yet</div>
                <div style={{ fontSize: '0.9rem' }}>Any completed sales or rents will appear here</div>
              </div>
            ) : (
              <table className="properties-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderTop: '1px solid #eee' }}>
                      <td data-label="Property">{t.propertyName || t.propertyId}</td>
                      <td data-label="Type">{t.type || 'N/A'}</td>
                      <td data-label="Amount">{formatPrice(Number(t.amount) || 0)}</td>
                      <td data-label="Status"><StatusIcon status={t.status} /> {t.status}</td>
                      <td data-label="Date">{new Date(t.timestamp || t.createdAt || Date.now()).toLocaleString()}</td>
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
} 