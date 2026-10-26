const mongoose = require('mongoose');

const TimelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ClaimSchema = new mongoose.Schema(
  {
    claimNumber: { type: String, required: true, unique: true },
    policyholder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    policyNumber: { type: String, required: true, trim: true },
    claimType: {
      type: String,
      enum: ['health', 'auto', 'property', 'life', 'travel'],
      required: true,
    },
    incidentDate: { type: Date, required: true },
    description: { type: String, required: true },
    claimAmount: { type: Number, required: true, min: 0 },
    approvedAmount: { type: Number, default: null },
    status: {
      type: String,
      enum: [
        'submitted',
        'documents_pending',
        'under_review',
        'verified',
        'approved',
        'rejected',
        'settled',
      ],
      default: 'submitted',
    },
    rejectionReason: { type: String, default: '' },
    assignedVerifier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    timeline: [TimelineEntrySchema],
  },
  { timestamps: true }
);

ClaimSchema.index({ policyholder: 1 });
ClaimSchema.index({ status: 1 });

module.exports = mongoose.model('Claim', ClaimSchema);
