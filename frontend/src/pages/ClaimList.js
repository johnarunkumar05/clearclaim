import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';

const statusOptions = [
  '',
  'submitted',
  'documents_pending',
  'under_review',
  'verified',
  'approved',
  'rejected',
  'settled',
];

const ClaimList = () => {
  const [claims, setClaims] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (search) params.search = search;
      const { data } = await api.get('/claims', { params });
      setClaims(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <p className="eyebrow">Register</p>
          <h1>Claims</h1>
        </div>
      </header>

      <section className="panel">
        <form className="filter-bar" onSubmit={handleSearch}>
          <input
            placeholder="Search by claim # or policy #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace('_', ' ') : 'All statuses'}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        {loading ? (
          <p className="muted">Loading claims…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Policyholder</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Filed</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No claims match this view.
                  </td>
                </tr>
              )}
              {claims.map((c) => (
                <tr key={c._id}>
                  <td>
                    <Link to={`/claims/${c._id}`} className="mono link">
                      {c.claimNumber}
                    </Link>
                  </td>
                  <td>{c.policyholder?.name}</td>
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
        )}
      </section>
    </AppShell>
  );
};

export default ClaimList;
