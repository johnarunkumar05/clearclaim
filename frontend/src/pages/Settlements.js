import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const Settlements = () => {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [txnRef, setTxnRef] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/settlements');
      setSettlements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const complete = async (settlementId) => {
    setBusyId(settlementId);
    try {
      await api.patch(`/settlements/${settlementId}/complete`, {
        transactionRef: txnRef[settlementId] || '',
      });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1>Settlements</h1>
        </div>
      </header>

      <section className="panel">
        {loading ? (
          <p className="muted">Loading settlements…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Policyholder</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Reference</th>
                {user.role !== 'approver' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    No settlements yet.
                  </td>
                </tr>
              )}
              {settlements.map((s) => (
                <tr key={s._id}>
                  <td>
                    <Link to={`/claims/${s.claim?._id}`} className="mono link">
                      {s.claim?.claimNumber}
                    </Link>
                  </td>
                  <td>{s.claim?.policyholder?.name}</td>
                  <td>₹{Number(s.approvedAmount).toLocaleString('en-IN')}</td>
                  <td className="capitalize">{s.paymentMethod?.replace('_', ' ')}</td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="mono">{s.transactionRef || '—'}</td>
                  {user.role !== 'approver' && (
                    <td>
                      {s.status === 'processing' && (
                        <div className="settle-actions">
                          <input
                            placeholder="Txn ref"
                            className="txn-input"
                            value={txnRef[s._id] || ''}
                            onChange={(e) => setTxnRef({ ...txnRef, [s._id]: e.target.value })}
                          />
                          <button className="btn-tiny btn-tiny-success" disabled={busyId === s._id} onClick={() => complete(s._id)}>
                            Mark completed
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppShell>
  );
};

export default Settlements;
