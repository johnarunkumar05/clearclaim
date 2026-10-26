import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import { useAuth } from '../context/AuthContext';

const docTypeLabels = {
  id_proof: 'ID proof',
  policy_copy: 'Policy copy',
  incident_report: 'Incident report',
  medical_bill: 'Medical bill',
  repair_estimate: 'Repair estimate',
  photo: 'Photo',
  other: 'Other',
};

const ClaimDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [claim, setClaim] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('other');
  const [busy, setBusy] = useState(false);
  const [settlementForm, setSettlementForm] = useState({ paymentMethod: 'bank_transfer', transactionRef: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/claims/${id}`);
      setClaim(data.claim);
      setDocuments(data.documents);
      setApprovedAmount(data.claim.claimAmount);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not load claim');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      setActionNote('');
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setActionError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      await api.post(`/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const [previewDoc, setPreviewDoc] = useState(null); // { url, name, mimeType }

  const openDoc = async (doc) => {
    try {
      const response = await api.get(`/documents/file/${doc._id}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: doc.mimeType });
      const url = window.URL.createObjectURL(blob);

      if (doc.mimeType?.startsWith('image/')) {
        setPreviewDoc({ url, name: doc.originalName, mimeType: doc.mimeType });
      } else {
        // PDFs (and anything else the browser can render) open in a new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not open document');
    }
  };

  const downloadDoc = async (doc) => {
    try {
      const response = await api.get(`/documents/file/${doc._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not download document');
    }
  };

  const closePreview = () => {
    if (previewDoc?.url) window.URL.revokeObjectURL(previewDoc.url);
    setPreviewDoc(null);
  };

  const verifyDoc = (docId, verificationStatus) =>
    runAction(() => api.patch(`/documents/${docId}/verify`, { verificationStatus, note: actionNote }));

  const startReview = () => runAction(() => api.patch(`/claims/${id}/start-review`));
  const verifyClaim = (decision) =>
    runAction(() => api.patch(`/claims/${id}/verify`, { decision, note: actionNote }));
  const decideClaim = (decision) =>
    runAction(() =>
      api.patch(`/claims/${id}/approve`, {
        decision,
        note: actionNote,
        approvedAmount: decision === 'approved' ? Number(approvedAmount) : undefined,
      })
    );
  const createSettlement = () => runAction(() => api.post(`/settlements/${id}`, settlementForm));

  if (loading) {
    return (
      <AppShell>
        <p className="muted">Loading claim…</p>
      </AppShell>
    );
  }

  if (!claim) {
    return (
      <AppShell>
        <div className="alert alert-error">{actionError || 'Claim not found'}</div>
      </AppShell>
    );
  }

  const isVerifier = user.role === 'verifier' || user.role === 'admin';
  const isApprover = user.role === 'approver' || user.role === 'admin';
  const isFinance = user.role === 'finance' || user.role === 'admin';

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <p className="eyebrow mono">{claim.claimNumber}</p>
          <h1>
            {claim.claimType[0].toUpperCase() + claim.claimType.slice(1)} claim — ₹
            {Number(claim.claimAmount).toLocaleString('en-IN')}
          </h1>
        </div>
        <StatusBadge status={claim.status} />
      </header>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <h2>Claim details</h2>
            <dl className="detail-list">
              <div>
                <dt>Policyholder</dt>
                <dd>{claim.policyholder?.name} ({claim.policyholder?.email})</dd>
              </div>
              <div>
                <dt>Policy number</dt>
                <dd className="mono">{claim.policyNumber}</dd>
              </div>
              <div>
                <dt>Incident date</dt>
                <dd>{new Date(claim.incidentDate).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{claim.description}</dd>
              </div>
              {claim.approvedAmount != null && (
                <div>
                  <dt>Approved amount</dt>
                  <dd>₹{Number(claim.approvedAmount).toLocaleString('en-IN')}</dd>
                </div>
              )}
              {claim.rejectionReason && (
                <div>
                  <dt>Rejection reason</dt>
                  <dd>{claim.rejectionReason}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="panel">
            <h2>Supporting documents</h2>
            <ul className="doc-list">
              {documents.length === 0 && <li className="muted">No documents uploaded yet.</li>}
              {documents.map((doc) => (
                <li key={doc._id} className="doc-item">
                  <div>
                    <p className="doc-name">
                      <button type="button" className="link-button" onClick={() => openDoc(doc)}>
                        {doc.originalName}
                      </button>
                      <button
                        type="button"
                        className="download-icon-btn"
                        title="Download"
                        onClick={() => downloadDoc(doc)}
                      >
                        ⬇
                      </button>
                    </p>
                    <p className="muted small">
                      {docTypeLabels[doc.docType]} • uploaded by {doc.uploadedBy?.name}
                    </p>
                    {doc.verificationNote && <p className="muted small">Note: {doc.verificationNote}</p>}
                  </div>
                  <div className="doc-actions">
                    <StatusBadge status={doc.verificationStatus} />
                    {isVerifier && doc.verificationStatus === 'pending' && (
                      <>
                        <button className="btn-tiny btn-tiny-success" disabled={busy} onClick={() => verifyDoc(doc._id, 'verified')}>
                          Verify
                        </button>
                        <button className="btn-tiny btn-tiny-danger" disabled={busy} onClick={() => verifyDoc(doc._id, 'rejected')}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {(user.role === 'policyholder' || isVerifier) && claim.status !== 'settled' && claim.status !== 'rejected' && (
              <form className="upload-form" onSubmit={handleUpload}>
                <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {Object.entries(docTypeLabels).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                <button type="submit" className="btn-secondary" disabled={!file || busy}>
                  Upload
                </button>
              </form>
            )}
          </section>

          {isVerifier && ['submitted', 'documents_pending', 'under_review'].includes(claim.status) && (
            <section className="panel panel-action">
              <h2>Verification actions</h2>
              <textarea
                placeholder="Add a note (optional)"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={2}
              />
              <div className="action-row">
                {claim.status !== 'under_review' && (
                  <button className="btn-secondary" disabled={busy} onClick={startReview}>
                    Start review
                  </button>
                )}
                {claim.status === 'under_review' && (
                  <>
                    <button className="btn-primary" disabled={busy} onClick={() => verifyClaim('verified')}>
                      Mark verified → send to approver
                    </button>
                    <button className="btn-outline" disabled={busy} onClick={() => verifyClaim('documents_pending')}>
                      Request more documents
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {isApprover && claim.status === 'verified' && (
            <section className="panel panel-action">
              <h2>Approval decision</h2>
              <label>
                Approved amount (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                />
              </label>
              <textarea
                placeholder="Add a note or rejection reason"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={2}
              />
              <div className="action-row">
                <button className="btn-primary" disabled={busy} onClick={() => decideClaim('approved')}>
                  Approve claim
                </button>
                <button className="btn-outline btn-outline-danger" disabled={busy} onClick={() => decideClaim('rejected')}>
                  Reject claim
                </button>
              </div>
            </section>
          )}

          {isFinance && claim.status === 'approved' && (
            <section className="panel panel-action">
              <h2>Settlement</h2>
              <div className="form-row">
                <label>
                  Payment method
                  <select
                    value={settlementForm.paymentMethod}
                    onChange={(e) => setSettlementForm({ ...settlementForm, paymentMethod: e.target.value })}
                  >
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </label>
                <label>
                  Transaction reference
                  <input
                    value={settlementForm.transactionRef}
                    onChange={(e) => setSettlementForm({ ...settlementForm, transactionRef: e.target.value })}
                  />
                </label>
              </div>
              <button className="btn-primary" disabled={busy} onClick={createSettlement}>
                Initiate settlement
              </button>
              <p className="muted small">Complete the payout from the Settlements page once funds are disbursed.</p>
            </section>
          )}
        </div>

        <aside className="detail-side">
          <section className="panel">
            <h2>Audit trail</h2>
            <Timeline entries={claim.timeline} />
          </section>
        </aside>
      </div>

      {previewDoc && (
        <div className="modal-backdrop" onClick={closePreview}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{previewDoc.name}</span>
              <button type="button" className="modal-close" onClick={closePreview}>
                ✕
              </button>
            </div>
            <img src={previewDoc.url} alt={previewDoc.name} className="modal-image" />
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ClaimDetail;
