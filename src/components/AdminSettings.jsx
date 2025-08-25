import React, { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './AdminDash.css';
import { FaCog, FaChevronDown, FaChevronUp, FaUsersCog, FaLock, FaMoneyBillWave, FaFileInvoice, FaPercentage, FaCubes, FaShieldAlt, FaHome, FaUsers, FaBuilding, FaMoneyBillWave as FaMoney, FaLandmark, FaBars, FaCheckCircle } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';

function SectionContainer({ title, children, icon }) {
  return (
    <div className="recent-activity" style={{ marginTop: 24 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const pathPart = location.pathname.split('/').pop();
  const [active, setActive] = useState(pathPart || 'general');

  const menuItems = useMemo(() => ([
    { id: 'packages', label: 'Subscription Packages', icon: <FaCubes /> },
    { id: 'commissions', label: 'Transaction Commissions', icon: <FaPercentage /> },
    { id: 'invoices', label: 'Invoices & Reports', icon: <FaFileInvoice /> },
    { id: 'roles', label: 'Roles & Permissions', icon: <FaUsersCog /> },
    { id: 'security', label: 'Security & KYC', icon: <FaLock /> },
    { id: 'trust', label: 'Trust & Fraud Rules', icon: <FaShieldAlt /> },
    { id: 'billing', label: 'Billing Providers', icon: <FaMoneyBillWave /> },
    { id: 'general', label: 'General Settings', icon: <FaCog /> },
  ]), []);

  const renderPanel = () => {
    switch (active) {
      case 'packages':
        return (
          <SectionContainer title="Subscription Packages" icon={<FaCubes />}>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-content">
                  <p><strong>Manage tiers</strong>: Basic, Premium, Agency, Enterprise.</p>
                  <p>Define features, price, billing cycle. (Mock UI)</p>
                </div>
              </div>
            </div>
          </SectionContainer>
        );
      case 'commissions':
        return (
          <SectionContainer title="Transaction Commissions" icon={<FaPercentage />}>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-content">
                  <p><strong>Set commission rates</strong> for sales, rentals, and services.</p>
                  <p>Differentiate by category and region. (Mock UI)</p>
                </div>
              </div>
            </div>
          </SectionContainer>
        );
      case 'invoices':
        return (
          <SectionContainer title="Invoices & Reports" icon={<FaFileInvoice />}>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-content">
                  <p>Generate invoices, export CSV/PDF, schedule monthly reports. (Mock UI)</p>
                </div>
              </div>
            </div>
          </SectionContainer>
        );
      case 'roles':
        return (
          <SectionContainer title="Roles & Permissions" icon={<FaUsersCog />}>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-content">
                  <p>Configure Admin, Moderator, Support, Auditor roles. (Mock UI)</p>
                </div>
              </div>
            </div>
          </SectionContainer>
        );
      case 'security':
        return (
          <SectionContainer title="Security & KYC" icon={<FaLock />}>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-content">
                  <p>2FA, password policy, identity checks, blockchain attestation. (Mock UI)</p>
                </div>
              </div>
            </div>
          </SectionContainer>
        );
      case 'trust':
        return (
          <SectionContainer title="Trust & Fraud Rules" icon={<FaShieldAlt />}>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-content">
                  <p>Flag patterns, anomaly thresholds, manual review queues. (Mock UI)</p>
                </div>
              </div>
            </div>
          </SectionContainer>
        );
      case 'billing':
        return (
          <SectionContainer title="Billing Providers" icon={<FaMoneyBillWave />}>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-content">
                  <p>Connect Stripe/M-Pesa/Paystack; webhooks and payout accounts. (Mock UI)</p>
                </div>
              </div>
            </div>
          </SectionContainer>
        );
      case 'general':
      default:
        return (
          <SectionContainer title="General Settings" icon={<FaCog />}>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-content">
                  <p>Branding, notifications, regional preferences, feature toggles. (Mock UI)</p>
                </div>
              </div>
            </div>
          </SectionContainer>
        );
    }
  };

  const isActive = (path) => location.pathname === path;
  const isSettingsRoute = location.pathname.startsWith('/admin/settings');

  return (
    <div className="admin-dashboard">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`sidebar`}>
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
              <FaMoney /> Transactions
            </Link>
            <Link to="/admin/government" className={`nav-item ${isActive('/admin/government') ? 'active' : ''}`}>
              <FaLandmark /> Government
            </Link>
            <div className={`nav-item ${isSettingsRoute ? 'active-parent' : ''}`} onClick={() => setOpen(v => !v)} style={{ cursor: 'pointer' }}>
              <FaCog /> Settings {open ? <FaChevronUp style={{ marginLeft: 'auto' }} /> : <FaChevronDown style={{ marginLeft: 'auto' }} />}
            </div>
            {open && (
              <div className="submenu" style={{ marginLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Link to="/admin/settings/general" className={`nav-item ${isActive('/admin/settings/general') ? 'active' : ''}`} onClick={() => setActive('general')}>General</Link>
                <Link to="/admin/settings/packages" className={`nav-item ${isActive('/admin/settings/packages') ? 'active' : ''}`} onClick={() => setActive('packages')}>Subscription Packages</Link>
                <Link to="/admin/settings/commissions" className={`nav-item ${isActive('/admin/settings/commissions') ? 'active' : ''}`} onClick={() => setActive('commissions')}>Transaction Commissions</Link>
                <Link to="/admin/settings/invoices" className={`nav-item ${isActive('/admin/settings/invoices') ? 'active' : ''}`} onClick={() => setActive('invoices')}>Invoices & Reports</Link>
                <Link to="/admin/settings/roles" className={`nav-item ${isActive('/admin/settings/roles') ? 'active' : ''}`} onClick={() => setActive('roles')}>Roles & Permissions</Link>
                <Link to="/admin/settings/security" className={`nav-item ${isActive('/admin/settings/security') ? 'active' : ''}`} onClick={() => setActive('security')}>Security & KYC</Link>
                <Link to="/admin/settings/trust" className={`nav-item ${isActive('/admin/settings/trust') ? 'active' : ''}`} onClick={() => setActive('trust')}>Trust & Fraud Rules</Link>
                <Link to="/admin/settings/billing" className={`nav-item ${isActive('/admin/settings/billing') ? 'active' : ''}`} onClick={() => setActive('billing')}>Billing Providers</Link>
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
          <h1 className="dashboard-title">Settings</h1>
          <div className="header-actions">
            <button className="menu-toggle" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
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
          {renderPanel()}
        </section>
      </main>
    </div>
  );
}


