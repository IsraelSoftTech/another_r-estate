import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Users.css';
import { FaHome, FaUsers, FaBuilding, FaMoneyBillWave, FaLandmark, FaSearch, FaEdit, FaTrash, FaBars, FaCheckCircle } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { onValue, ref, remove, update } from 'firebase/database';
import { toast } from 'react-toastify';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let off;
    let cancelled = false;
    ensureAuthUser()
      .then(() => {
        if (cancelled) return;
        const accountsRef = ref(db, 'accounts');
        off = onValue(accountsRef, (snap) => {
          const raw = snap.val() || {};
          const list = Object.entries(raw).map(([id, u]) => ({ id, ...u }));
          setUsers(list);
          setLoading(false);
        }, (err) => {
          setLoading(false);
          toast.error(err?.message || 'Failed to load users');
        });
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
      if (typeof off === 'function') off();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.username || u.id || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.accountType || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username || user.id}"?`)) return;
    try {
      await remove(ref(db, `accounts/${user.id}`));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete user');
    }
  };

  const handleEdit = async (user) => {
    const newEmail = window.prompt('Update email:', user.email || '');
    if (newEmail === null) return;
    const newRole = window.prompt('Update role (tenant | landlord | technician):', user.accountType || 'tenant');
    if (newRole === null) return;
    try {
      await update(ref(db, `accounts/${user.id}`), { email: newEmail, accountType: newRole });
      toast.success('User updated');
    } catch (err) {
      toast.error(err?.message || 'Failed to update user');
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
            <Link to="/admin/users" className="nav-item active">
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
          <h1 className="dashboard-title">Users Management</h1>
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
          <div className="users-toolbar">
            <div className="users-count">Total Users: {users.length}</div>
            <div className="users-search">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by username, email or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="empty-state">Loading users...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">No users found.</td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td data-label="Username">{u.username || u.id}</td>
                      <td data-label="Email">{u.email || '-'}</td>
                      <td data-label="Role">{u.accountType || '-'}</td>
                      <td data-label="Actions">
                        <button className="table-action-btn edit-btn" title="Edit" onClick={() => handleEdit(u)}><FaEdit /></button>
                        <button className="table-action-btn delete-btn" title="Delete" onClick={() => handleDelete(u)}><FaTrash /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Users; 