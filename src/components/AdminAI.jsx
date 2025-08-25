import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminDash.css';
import { FaRobot, FaBell, FaSearch, FaShieldAlt, FaChartLine, FaHome, FaUsers, FaBuilding, FaMoneyBillWave, FaLandmark, FaBars, FaCheckCircle, FaCog, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';

export default function AdminAI() {
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isSettingsRoute = location.pathname.startsWith('/admin/settings');

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
            <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
              <FaHome /> Dashboard
            </Link>
            <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
              <FaUsers /> Users
            </Link>
            <Link to="/admin/properties" className={`nav-item ${isActive('/admin/properties') ? 'active' : ''}`}>
              <FaBuilding /> Properties
            </Link>
            <Link to="/admin/verification" className={`nav-item ${isActive('/admin/verification') ? 'active' : ''}`}>
              <FaCheckCircle /> Verification
            </Link>
            <Link to="/admin/transactions" className={`nav-item ${isActive('/admin/transactions') ? 'active' : ''}`}>
              <FaMoneyBillWave /> Transactions
            </Link>
            <Link to="/admin/government" className={`nav-item ${isActive('/admin/government') ? 'active' : ''}`}>
              <FaLandmark /> Government
            </Link>
            <Link to="/admin/ai" className={`nav-item ${isActive('/admin/ai') ? 'active' : ''}`}>
              <FaRobot /> AI
            </Link>
            <div className={`nav-item ${isSettingsRoute ? 'active-parent' : ''}`} onClick={() => setSettingsOpen(v => !v)} style={{ cursor: 'pointer' }}>
              <FaCog /> Settings {settingsOpen ? <FaChevronUp style={{ marginLeft: 'auto' }} /> : <FaChevronDown style={{ marginLeft: 'auto' }} />}
            </div>
            {settingsOpen && (
              <div className="submenu" style={{ marginLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Link to="/admin/settings/general" className={`nav-item ${isActive('/admin/settings/general') ? 'active' : ''}`}>General</Link>
                <Link to="/admin/settings/packages" className={`nav-item ${isActive('/admin/settings/packages') ? 'active' : ''}`}>Subscription Packages</Link>
                <Link to="/admin/settings/commissions" className={`nav-item ${isActive('/admin/settings/commissions') ? 'active' : ''}`}>Transaction Commissions</Link>
                <Link to="/admin/settings/invoices" className={`nav-item ${isActive('/admin/settings/invoices') ? 'active' : ''}`}>Invoices & Reports</Link>
                <Link to="/admin/settings/roles" className={`nav-item ${isActive('/admin/settings/roles') ? 'active' : ''}`}>Roles & Permissions</Link>
                <Link to="/admin/settings/security" className={`nav-item ${isActive('/admin/settings/security') ? 'active' : ''}`}>Security & KYC</Link>
                <Link to="/admin/settings/trust" className={`nav-item ${isActive('/admin/settings/trust') ? 'active' : ''}`}>Trust & Fraud Rules</Link>
                <Link to="/admin/settings/billing" className={`nav-item ${isActive('/admin/settings/billing') ? 'active' : ''}`}>Billing Providers</Link>
              </div>
            )}
          </div>
          <div className="mobile-menu-footer">
            <ProfileCircle />
            <LogoutButton />
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">AI Operations</h1>
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
              <h3><FaChartLine /> Model Signals</h3>
              <p className="stat-number">Realtime risk scores</p>
            </div>
            <div className="stat-card">
              <h3><FaBell /> Fraud Alerts</h3>
              <p className="stat-number">Incoming alerts & triage</p>
            </div>
            <div className="stat-card">
              <h3><FaShieldAlt /> Trust & Safety</h3>
              <p className="stat-number">Verified identities, flagged items</p>
            </div>
          </div>

          <div className="recent-activity">
            <h2><FaRobot /> Assistant</h2>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask AI to analyze a user, property, or transaction..."
                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
              />
              <button className="menu-toggle" onClick={() => alert('AI processing mock...')}>
                <FaSearch /> Analyze
              </button>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon"><FaRobot /></div>
                <div className="activity-content">
                  <p><strong>Insights</strong></p>
                  <p>Enter a query to get risk, anomaly, and summary insights. (Mock UI)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


