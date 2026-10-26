const mongoose = require('mongoose');

const SettlementSchema = new mongoose.Schema(
  {
    claim: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', required: true, unique: true },
    approvedAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'upi'],
      default: 'bank_transfer',
    },
    transactionRef: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    settledAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settlement', SettlementSchema);
