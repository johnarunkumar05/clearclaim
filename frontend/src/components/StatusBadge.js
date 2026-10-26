import React from 'react';

const labels = {
  submitted: 'Submitted',
  documents_pending: 'Documents pending',
  under_review: 'Under review',
  verified: 'Verified',
  approved: 'Approved',
  rejected: 'Rejected',
  settled: 'Settled',
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

const StatusBadge = ({ status }) => {
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
};

export default StatusBadge;
