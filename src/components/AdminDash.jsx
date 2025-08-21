import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaUsers, FaBuilding, FaMoneyBillWave, FaLandmark, FaBars } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { onValue, ref } from 'firebase/database';
import { toast } from 'react-toastify';

export default function AdminDash() {
  const [properties, setProperties] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let offProps;
    let offAccounts;
    let cancelled = false;

    ensureAuthUser()
      .then(() => {
        if (cancelled) return;

        const propsRef = ref(db, 'properties');
        offProps = onValue(propsRef, (snap) => {
          const raw = snap.val() || {};
          const list = Object.entries(raw).map(([id, p]) => ({ id, ...p }));
          setProperties(list);
        }, (err) => {
          toast.error(err?.message || 'Failed to load properties');
          setProperties([]);
        });

        const accountsRef = ref(db, 'accounts');
        offAccounts = onValue(accountsRef, (snap) => {
          const raw = snap.val() || {};
          setUsersCount(Object.keys(raw).length);
        }, (err) => {
          toast.error(err?.message || 'Failed to load users');
          setUsersCount(0);
        });
      })
      .catch((err) => {
        toast.error(err?.message || 'Authentication required');
      });

    return () => {
      cancelled = true;
      if (typeof offProps === 'function') offProps();
      if (typeof offAccounts === 'function') offAccounts();
    };
  }, []);

  const totalProperties = properties.length;
  const verifiedProperties = useMemo(() => properties.filter(p => !!p.isVerified).length, [properties]);
  const pendingVerifications = useMemo(() => properties.filter(p => !p.isVerified).length, [properties]);

  const recentProperties = useMemo(() => {
    return [...properties]
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .slice(0, 5);
  }, [properties]);

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '';
    try { return `XAF ${price.toLocaleString()}`; } catch (_) { return `XAF ${price}`; }
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
            <Link to="/admin" className="nav-item active">
              <FaHome /> Dashboard
            </Link>
            <Link to="/admin/users" className="nav-item">
              <FaUsers /> Users
            </Link>
            <Link to="/admin/properties" className="nav-item">
              <FaBuilding /> Properties
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
          <h1 className="dashboard-title">Admin Dashboard</h1>
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
            </div>
            <div className="stat-card">
              <h3>Registered Users</h3>
              <p className="stat-number">{usersCount}</p>
            </div>
            <div className="stat-card">
              <h3>Verified Properties</h3>
              <p className="stat-number">{verifiedProperties}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Verifications</h3>
              <p className="stat-number">{pendingVerifications}</p>
            </div>
          </div>
          
          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {recentProperties.length === 0 ? (
                <div className="activity-item">
                  <div className="activity-icon">
                    <FaBuilding />
                  </div>
                  <div className="activity-content">
                    <p><strong>No recent properties</strong></p>
                    <p>Add a property to see activity here.</p>
                  </div>
                </div>
              ) : (
                recentProperties.map((prop) => (
                  <div className="activity-item" key={prop.id}>
                    <div className="activity-icon">
                      <FaBuilding />
                    </div>
                    <div className="activity-content">
                      <p><strong>New/Updated Property</strong></p>
                      <p>{prop.name || 'Untitled'} in {prop.city || prop.location || 'Unknown'} - {formatPrice(prop.price)}</p>
                      <span className="activity-time">{new Date(prop.updatedAt || prop.createdAt || Date.now()).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 