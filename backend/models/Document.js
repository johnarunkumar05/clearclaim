const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    claim: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', required: true },
    docType: {
      type: String,
      enum: ['id_proof', 'policy_copy', 'incident_report', 'medical_bill', 'repair_estimate', 'photo', 'other'],
      default: 'other',
    },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verificationNote: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);
