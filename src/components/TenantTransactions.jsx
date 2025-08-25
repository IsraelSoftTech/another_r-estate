import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaBuilding, FaMoneyBillWave, FaEnvelope, FaBars, FaEye, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { toast } from 'react-toastify';

export default function TenantTransactions() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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
          }
        }, 2000);

        const user = await ensureAuthUser();
        if (cancelled) return;
        setCurrentUser(user);

        // Load all transactions and filter for this tenant
        const transactionsRef = ref(db, 'transactions');
        
        off = onValue(transactionsRef, (snap) => {
          if (cancelled) return;
          
          const raw = snap.val() || {};
          const list = Object.entries(raw)
            .map(([id, t]) => ({ id, ...t }))
            .filter(t => t.tenantId === user?.uid || t.tenantEmail === user?.email)
            .sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
          
          setTransactions(list);
          setLoading(false);
          clearTimeout(timeoutId);
        }, (err) => {
          if (cancelled) return;
          console.error('Failed to load transactions:', err);
          setLoading(false);
          clearTimeout(timeoutId);
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading transactions:', error);
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

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free';
    return `XAF ${Number(price).toLocaleString()}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle style={{ color: '#059669' }} />;
      case 'pending':
        return <FaClock style={{ color: '#f59e0b' }} />;
      case 'cancelled':
        return <FaTimesCircle style={{ color: '#dc2626' }} />;
      default:
        return <FaClock style={{ color: '#64748b' }} />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-badge completed';
      case 'pending':
        return 'status-badge pending';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge pending';
    }
  };

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'Property Inquiry':
        return 'Property Inquiry';
      case 'rental':
        return 'Rental Payment';
      case 'purchase':
        return 'Property Purchase';
      case 'deposit':
        return 'Security Deposit';
      default:
        return type || 'Transaction';
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
            <Link to="/tenant/properties" className="nav-item">
              <FaBuilding /> Properties
            </Link>
            <Link to="/tenant/transactions" className="nav-item active">
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
              <h3>Total Transactions</h3>
              <p className="stat-number">{transactions.length}</p>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <p className="stat-number">{transactions.filter(t => t.status === 'completed').length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p className="stat-number">{transactions.filter(t => t.status === 'pending').length}</p>
            </div>
            <div className="stat-card">
              <h3>Inquiries</h3>
              <p className="stat-number">{transactions.filter(t => t.type === 'Property Inquiry').length}</p>
            </div>
          </div>

          <div className="table-wrapper" style={{ marginTop: '2rem', overflowX: 'auto' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No transactions found</div>
                <div style={{ fontSize: '0.9rem' }}>Your transaction history will appear here</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </div>
                <table className="properties-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th>Type</th>
                      <th>Property</th>
                      <th>Landlord</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} style={{ borderTop: '1px solid #eee' }}>
                        <td data-label="Type">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <strong>{getTransactionTypeText(transaction.type)}</strong>
                            {transaction.inquiryType && (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {transaction.inquiryType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td data-label="Property">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>{transaction.propertyName || 'N/A'}</span>
                            {transaction.description && (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {transaction.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td data-label="Landlord">
                          {transaction.landlordName || 'N/A'}
                        </td>
                        <td data-label="Amount">
                          <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                            {formatPrice(transaction.amount)}
                          </span>
                        </td>
                        <td data-label="Date">
                          {formatDate(transaction.timestamp || transaction.createdAt)}
                        </td>
                        <td data-label="Status">
                          <span className={getStatusBadgeClass(transaction.status)}>
                            {getStatusIcon(transaction.status)} {transaction.status}
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
}
