const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadDocument,
  getDocumentsForClaim,
  downloadDocument,
  verifyDocument,
} = require('../controllers/documentController');

router.use(protect);

router.post('/:claimId', upload.single('file'), uploadDocument);
router.get('/:claimId', getDocumentsForClaim);
router.get('/file/:id', downloadDocument);
router.patch('/:id/verify', authorize('verifier', 'admin'), verifyDocument);

module.exports = router;
