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

export default function LordDash() {
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let offProps;
    let offTransactions;
    let cancelled = false;

    ensureAuthUser()
      .then((user) => {
        if (cancelled) return;
        

        // Get properties for this landlord
        const propsRef = ref(db, 'properties');
        const landlordPropsQuery = query(propsRef, orderByChild('landlordId'), equalTo(user.uid));
        offProps = onValue(landlordPropsQuery, (snap) => {
          const raw = snap.val() || {};
          const list = Object.entries(raw).map(([id, p]) => ({ id, ...p }));
          setProperties(list);
        }, (err) => {
          toast.error(err?.message || 'Failed to load properties');
          setProperties([]);
        });

        // Get transactions for this landlord
        const transRef = ref(db, 'transactions');
        offTransactions = onValue(transRef, (snap) => {
          const raw = snap.val() || {};
          const list = Object.entries(raw)
            .map(([id, t]) => ({ id, ...t }))
            .filter(t => t.landlordId === user.uid) // Filter for this landlord
            .sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
          setTransactions(list);
        }, (err) => {
          // If permission denied, just set empty array (transactions node doesn't exist yet)
          if (err.code === 'PERMISSION_DENIED') {
            console.log('Transactions node not accessible yet, setting empty array');
            setTransactions([]);
          } else {
            console.error('Failed to load transactions:', err);
            setTransactions([]);
          }
        });
      })
      .catch((err) => {
        toast.error(err?.message || 'Authentication required');
      });

    return () => {
      cancelled = true;
      if (typeof offProps === 'function') offProps();
      if (typeof offTransactions === 'function') offTransactions();
    };
  }, []);

  const totalProperties = properties.length;
  const verifiedProperties = useMemo(() => properties.filter(p => !!p.isVerified).length, [properties]);
  const pendingVerifications = useMemo(() => properties.filter(p => !p.isVerified).length, [properties]);
  const totalRevenue = useMemo(() => {
    return transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const recentProperties = useMemo(() => {
    return [...properties]
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .slice(0, 5);
  }, [properties]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0))
      .slice(0, 5);
  }, [transactions]);

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '';
    try { return `XAF ${price.toLocaleString()}`; } catch (_) { return `XAF ${price}`; }
  };

  const getPropertyStatusIcon = (isVerified) => {
    return isVerified ? <FaCheckCircle style={{ color: '#059669' }} /> : <FaClock style={{ color: '#f59e0b' }} />;
  };

  const getTransactionStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle style={{ color: '#059669' }} />;
      case 'pending':
        return <FaClock style={{ color: '#f59e0b' }} />;
      case 'failed':
        return <FaTimesCircle style={{ color: '#dc2626' }} />;
      default:
        return <FaClock style={{ color: '#64748b' }} />;
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
            <Link to="/landlord" className="nav-item active">
              <FaHome /> Dashboard
            </Link>
            <Link to="/landlord/properties" className="nav-item">
              <FaBuilding /> Properties
            </Link>
            <Link to="/landlord/transactions" className="nav-item">
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
          <h1 className="dashboard-title">Landlord Dashboard</h1>
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
              <h3>Total Properties</h3>
              <p className="stat-number">{totalProperties}</p>
              <p className="stat-change">Your listed properties</p>
            </div>
            <div className="stat-card">
              <h3>Verified Properties</h3>
              <p className="stat-number">{verifiedProperties}</p>
              <p className="stat-change positive">Approved by admin</p>
            </div>
            <div className="stat-card">
              <h3>Pending Verification</h3>
              <p className="stat-number">{pendingVerifications}</p>
              <p className="stat-change">Awaiting approval</p>
            </div>
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-number">{formatPrice(totalRevenue)}</p>
              <p className="stat-change positive">From completed transactions</p>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="recent-activity">
              <h2>Recent Properties</h2>
              <div className="activity-list">
                {recentProperties.length === 0 ? (
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaBuilding />
                    </div>
                    <div className="activity-content">
                      <p><strong>No properties yet</strong></p>
                      <p>Create your first property to get started.</p>
                    </div>
                  </div>
                ) : (
                  recentProperties.map((prop) => (
                    <div className="activity-item" key={prop.id}>
                      <div className="activity-icon">
                        {getPropertyStatusIcon(prop.isVerified)}
                      </div>
                      <div className="activity-content">
                        <p><strong>{prop.name || 'Untitled Property'}</strong></p>
                        <p>{prop.city || prop.location || 'Unknown'} - {formatPrice(prop.price)}</p>
                        <span className="activity-time">
                          {prop.isVerified ? 'Verified' : 'Pending Verification'} • {new Date(prop.updatedAt || prop.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Transactions</h2>
              <div className="activity-list">
                {recentTransactions.length === 0 ? (
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaMoneyBillWave />
                    </div>
                    <div className="activity-content">
                      <p><strong>No transactions yet</strong></p>
                      <p>Transactions will appear here when properties are sold or rented.</p>
                    </div>
                  </div>
                ) : (
                  recentTransactions.map((trans) => (
                    <div className="activity-item" key={trans.id}>
                      <div className="activity-icon">
                        {getTransactionStatusIcon(trans.status)}
                      </div>
                      <div className="activity-content">
                        <p><strong>{trans.propertyName || 'Property Transaction'}</strong></p>
                        <p>{formatPrice(trans.amount)} - {trans.type || 'transaction'}</p>
                        <span className="activity-time">
                          {trans.status} • {new Date(trans.timestamp || trans.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 