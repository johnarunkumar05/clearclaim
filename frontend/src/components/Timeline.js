import React from 'react';

const formatDate = (d) =>
  new Date(d).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const Timeline = ({ entries }) => {
  if (!entries || entries.length === 0) {
    return <p className="muted">No activity recorded yet.</p>;
  }

  const ordered = [...entries].reverse();

  return (
    <ol className="ledger">
      {ordered.map((entry, idx) => (
        <li className="ledger-entry" key={idx}>
          <span className="ledger-index">{String(ordered.length - idx).padStart(2, '0')}</span>
          <div className="ledger-line" aria-hidden="true" />
          <div className="ledger-body">
            <div className="ledger-heading">
              <span className={`ledger-status ledger-status-${entry.status}`}>
                {entry.status.replace('_', ' ')}
              </span>
              <span className="ledger-date">{formatDate(entry.date)}</span>
            </div>
            {entry.note && <p className="ledger-note">{entry.note}</p>}
            <p className="ledger-by">— {entry.updatedByName || 'System'}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default Timeline;
