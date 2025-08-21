import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaUsers, FaBuilding, FaMoneyBillWave, FaLandmark } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';

export default function AdminDash() {
  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
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
              <p className="stat-number">150</p>
              <p className="stat-change positive">+12% from last month</p>
            </div>
            <div className="stat-card">
              <h3>Active Users</h3>
              <p className="stat-number">2,847</p>
              <p className="stat-change positive">+8% from last month</p>
            </div>
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-number">$45,230</p>
              <p className="stat-change positive">+15% from last month</p>
            </div>
            <div className="stat-card">
              <h3>Pending Verifications</h3>
              <p className="stat-number">23</p>
              <p className="stat-change negative">+5 from yesterday</p>
            </div>
          </div>
          
          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">
                  <FaBuilding />
                </div>
                <div className="activity-content">
                  <p><strong>New Property Added</strong></p>
                  <p>Luxury Villa in Douala - XAF 25,000,000</p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <FaUsers />
                </div>
                <div className="activity-content">
                  <p><strong>New User Registration</strong></p>
                  <p>John Doe registered as a landlord</p>
                  <span className="activity-time">4 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <FaMoneyBillWave />
                </div>
                <div className="activity-content">
                  <p><strong>Transaction Completed</strong></p>
                  <p>Property sale: XAF 15,000,000</p>
                  <span className="activity-time">6 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 