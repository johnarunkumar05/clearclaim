const Settlement = require('../models/Settlement');
const Claim = require('../models/Claim');

// @desc Create a settlement record for an approved claim
// @route POST /api/settlements/:claimId
// @access finance, admin
exports.createSettlement = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    if (claim.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved claims can be settled' });
    }

    const existing = await Settlement.findOne({ claim: claim._id });
    if (existing) {
      return res.status(400).json({ message: 'A settlement already exists for this claim' });
    }

    const { paymentMethod, transactionRef, notes } = req.body;

    const settlement = await Settlement.create({
      claim: claim._id,
      approvedAmount: claim.approvedAmount,
      paymentMethod: paymentMethod || 'bank_transfer',
      transactionRef: transactionRef || '',
      notes: notes || '',
      status: 'processing',
      processedBy: req.user._id,
    });

    res.status(201).json(settlement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Mark a settlement completed (funds disbursed) -> claim becomes 'settled'
// @route PATCH /api/settlements/:id/complete
// @access finance, admin
exports.completeSettlement = async (req, res) => {
  try {
    const { transactionRef } = req.body;
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) return res.status(404).json({ message: 'Settlement not found' });

    settlement.status = 'completed';
    settlement.settledAt = new Date();
    if (transactionRef) settlement.transactionRef = transactionRef;
    await settlement.save();

    const claim = await Claim.findById(settlement.claim);
    if (claim) {
      claim.status = 'settled';
      claim.timeline.push({
        status: 'settled',
        note: `Settlement completed. Amount disbursed: ${settlement.approvedAmount}`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        date: new Date(),
      });
      await claim.save();
    }

    res.json(settlement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc List settlements (role-aware)
// @route GET /api/settlements
exports.getSettlements = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    const settlements = await Settlement.find(filter)
      .populate({
        path: 'claim',
        select: 'claimNumber policyNumber claimType policyholder',
        populate: { path: 'policyholder', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
