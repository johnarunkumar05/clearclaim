import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';

const NewClaim = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    policyNumber: '',
    claimType: 'health',
    incidentDate: '',
    description: '',
    claimAmount: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/claims', form);
      navigate(`/claims/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <p className="eyebrow">New submission</p>
          <h1>File a claim</h1>
        </div>
      </header>

      <section className="panel panel-narrow">
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="alert alert-error">{error}</div>}

          <label>
            Policy number
            <input name="policyNumber" value={form.policyNumber} onChange={handleChange} required />
          </label>

          <div className="form-row">
            <label>
              Claim type
              <select name="claimType" value={form.claimType} onChange={handleChange}>
                <option value="health">Health</option>
                <option value="auto">Auto</option>
                <option value="property">Property</option>
                <option value="life">Life</option>
                <option value="travel">Travel</option>
              </select>
            </label>
            <label>
              Date of incident
              <input type="date" name="incidentDate" value={form.incidentDate} onChange={handleChange} required />
            </label>
          </div>

          <label>
            Claim amount (₹)
            <input type="number" min="0" step="0.01" name="claimAmount" value={form.claimAmount} onChange={handleChange} required />
          </label>

          <label>
            Description of incident
            <textarea
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what happened, when, and any relevant details the reviewer should know."
              required
            />
          </label>

          <p className="muted">
            After submitting, you'll be able to upload supporting documents (ID proof, policy copy, bills, photos) from
            the claim detail page.
          </p>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit claim'}
          </button>
        </form>
      </section>
    </AppShell>
  );
};

export default NewClaim;
