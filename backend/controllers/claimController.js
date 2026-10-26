const Claim = require('../models/Claim');
const Document = require('../models/Document');

const generateClaimNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Claim.countDocuments();
  return `CLM-${year}-${String(count + 1).padStart(5, '0')}`;
};

const addTimelineEntry = (claim, status, note, user) => {
  claim.timeline.push({
    status,
    note: note || '',
    updatedBy: user?._id,
    updatedByName: user?.name || 'System',
    date: new Date(),
  });
};

// @desc Submit a new claim
// @route POST /api/claims
// @access policyholder
exports.createClaim = async (req, res) => {
  try {
    const { policyNumber, claimType, incidentDate, description, claimAmount } = req.body;

    if (!policyNumber || !claimType || !incidentDate || !description || !claimAmount) {
      return res.status(400).json({ message: 'All claim fields are required' });
    }

    const claimNumber = await generateClaimNumber();

    const claim = new Claim({
      claimNumber,
      policyholder: req.user._id,
      policyNumber,
      claimType,
      incidentDate,
      description,
      claimAmount,
      status: 'submitted',
    });

    addTimelineEntry(claim, 'submitted', 'Claim submitted by policyholder', req.user);
    await claim.save();

    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get claims (role-aware filtering)
// @route GET /api/claims
exports.getClaims = async (req, res) => {
  try {
    const { status, claimType, search } = req.query;
    let filter = {};

    if (req.user.role === 'policyholder') {
      filter.policyholder = req.user._id;
    } else if (req.user.role === 'verifier') {
      filter.status = status || { $in: ['submitted', 'documents_pending', 'under_review'] };
    } else if (req.user.role === 'approver') {
      filter.status = status || 'verified';
    } else if (req.user.role === 'finance') {
      filter.status = status || 'approved';
    }
    // admin sees everything unless a status filter is passed
    if (req.user.role === 'admin' && status) {
      filter.status = status;
    }

    if (claimType) filter.claimType = claimType;
    if (search) {
      filter.$or = [
        { claimNumber: { $regex: search, $options: 'i' } },
        { policyNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const claims = await Claim.find(filter)
      .populate('policyholder', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get single claim with documents
// @route GET /api/claims/:id
exports.getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('policyholder', 'name email phone');
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    // Policyholders can only view their own claims
    if (req.user.role === 'policyholder' && claim.policyholder._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this claim' });
    }

    const documents = await Document.find({ claim: claim._id }).populate('uploadedBy', 'name role');

    res.json({ claim, documents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Move claim into review (verifier picks it up)
// @route PATCH /api/claims/:id/start-review
// @access verifier
exports.startReview = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    claim.status = 'under_review';
    claim.assignedVerifier = req.user._id;
    addTimelineEntry(claim, 'under_review', 'Document verification started', req.user);
    await claim.save();

    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Verifier marks claim as verified or sends back for more documents
// @route PATCH /api/claims/:id/verify
// @access verifier
exports.verifyClaim = async (req, res) => {
  try {
    const { decision, note } = req.body; // decision: 'verified' | 'documents_pending'
    if (!['verified', 'documents_pending'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be verified or documents_pending' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    claim.status = decision;
    addTimelineEntry(
      claim,
      decision,
      note || (decision === 'verified' ? 'Documents verified, forwarded for approval' : 'Additional documents requested'),
      req.user
    );
    await claim.save();

    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Approver approves or rejects a verified claim
// @route PATCH /api/claims/:id/approve
// @access approver
exports.decideClaim = async (req, res) => {
  try {
    const { decision, approvedAmount, note } = req.body; // decision: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    if (claim.status !== 'verified') {
      return res.status(400).json({ message: 'Only verified claims can be approved or rejected' });
    }

    claim.status = decision;
    claim.assignedApprover = req.user._id;

    if (decision === 'approved') {
      if (!approvedAmount || approvedAmount <= 0) {
        return res.status(400).json({ message: 'A valid approved amount is required' });
      }
      claim.approvedAmount = approvedAmount;
      addTimelineEntry(claim, 'approved', note || `Claim approved for ${approvedAmount}`, req.user);
    } else {
      claim.rejectionReason = note || 'No reason provided';
      addTimelineEntry(claim, 'rejected', note || 'Claim rejected', req.user);
    }

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Dashboard summary counts
// @route GET /api/claims/stats/summary
exports.getSummary = async (req, res) => {
  try {
    let baseFilter = {};
    if (req.user.role === 'policyholder') baseFilter.policyholder = req.user._id;

    const statuses = ['submitted', 'documents_pending', 'under_review', 'verified', 'approved', 'rejected', 'settled'];
    const counts = {};
    for (const s of statuses) {
      counts[s] = await Claim.countDocuments({ ...baseFilter, status: s });
    }
    const totalClaims = await Claim.countDocuments(baseFilter);
    const totalApprovedAmountAgg = await Claim.aggregate([
      { $match: { ...baseFilter, approvedAmount: { $ne: null } } },
      { $group: { _id: null, total: { $sum: '$approvedAmount' } } },
    ]);

    res.json({
      counts,
      totalClaims,
      totalApprovedAmount: totalApprovedAmountAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
