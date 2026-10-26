import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const statusOrder = ['submitted', 'documents_pending', 'under_review', 'verified', 'approved', 'rejected', 'settled'];

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: summaryData }, { data: claimsData }] = await Promise.all([
          api.get('/claims/stats/summary'),
          api.get('/claims'),
        ]);
        setSummary(summaryData);
        setRecentClaims(claimsData.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Good to see you, {user?.name?.split(' ')[0]}</h1>
        </div>
        {user?.role === 'policyholder' && (
          <Link to="/claims/new" className="btn-primary">
            File a new claim
          </Link>
        )}
      </header>

      {loading ? (
        <p className="muted">Loading dashboard…</p>
      ) : (
        <>
          <section className="stat-grid">
            <div className="stat-card stat-card-total">
              <span className="stat-label">Total claims</span>
              <span className="stat-value">{summary?.totalClaims ?? 0}</span>
            </div>
            {statusOrder.map((s) => (
              <div className="stat-card" key={s}>
                <span className="stat-label">
                  <StatusBadge status={s} />
                </span>
                <span className="stat-value">{summary?.counts?.[s] ?? 0}</span>
              </div>
            ))}
            <div className="stat-card stat-card-amount">
              <span className="stat-label">Total approved amount</span>
              <span className="stat-value">₹{Number(summary?.totalApprovedAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Recent claims</h2>
              <Link to="/claims" className="link">
                View the full register →
              </Link>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Filed</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">
                      No claims to show yet.
                    </td>
                  </tr>
                )}
                {recentClaims.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link to={`/claims/${c._id}`} className="mono link">
                        {c.claimNumber}
                      </Link>
                    </td>
                    <td className="capitalize">{c.claimType}</td>
                    <td>₹{Number(c.claimAmount).toLocaleString('en-IN')}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </AppShell>
  );
};

export default Dashboard;
