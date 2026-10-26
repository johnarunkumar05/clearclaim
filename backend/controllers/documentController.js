const Document = require('../models/Document');
const Claim = require('../models/Claim');
const fs = require('fs');
const path = require('path');

// @desc Upload a document for a claim
// @route POST /api/documents/:claimId
// @access policyholder (owner) or staff
exports.uploadDocument = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    if (req.user.role === 'policyholder' && claim.policyholder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this claim' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const doc = await Document.create({
      claim: claim._id,
      docType: req.body.docType || 'other',
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    });

    // If claim was waiting on more documents, move it back into review automatically
    if (claim.status === 'documents_pending') {
      claim.status = 'under_review';
      claim.timeline.push({
        status: 'under_review',
        note: `New document uploaded: ${req.file.originalname}`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        date: new Date(),
      });
      await claim.save();
    }

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc List documents for a claim
// @route GET /api/documents/:claimId
exports.getDocumentsForClaim = async (req, res) => {
  try {
    const documents = await Document.find({ claim: req.params.claimId }).populate('uploadedBy', 'name role');
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Download / view a document file
// @route GET /api/documents/file/:id
exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ message: 'File missing on server' });
    }
    res.download(doc.filePath, doc.originalName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Verifier marks a document as verified/rejected
// @route PATCH /api/documents/:id/verify
// @access verifier
exports.verifyDocument = async (req, res) => {
  try {
    const { verificationStatus, note } = req.body;
    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ message: 'verificationStatus must be verified or rejected' });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.verificationStatus = verificationStatus;
    doc.verifiedBy = req.user._id;
    doc.verificationNote = note || '';
    doc.verifiedAt = new Date();
    await doc.save();

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
