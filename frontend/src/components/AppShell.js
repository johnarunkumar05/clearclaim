import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  policyholder: 'Policyholder',
  verifier: 'Document Verifier',
  approver: 'Claims Approver',
  finance: 'Finance / Settlements',
  admin: 'Administrator',
};

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CC</span>
          <span className="brand-name">ClearClaim</span>
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className="nav-link">
            Overview
          </NavLink>
          {user?.role === 'policyholder' && (
            <NavLink to="/claims/new" className="nav-link">
              File a claim
            </NavLink>
          )}
          <NavLink to="/claims" className="nav-link">
            Claims register
          </NavLink>
          {(user?.role === 'finance' || user?.role === 'admin' || user?.role === 'approver') && (
            <NavLink to="/settlements" className="nav-link">
              Settlements
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{roleLabels[user?.role] || user?.role}</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
};

export default AppShell;
