const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createClaim,
  getClaims,
  getClaimById,
  startReview,
  verifyClaim,
  decideClaim,
  getSummary,
} = require('../controllers/claimController');

router.use(protect);

router.get('/stats/summary', getSummary);

router.post('/', authorize('policyholder'), createClaim);
router.get('/', getClaims);
router.get('/:id', getClaimById);

router.patch('/:id/start-review', authorize('verifier', 'admin'), startReview);
router.patch('/:id/verify', authorize('verifier', 'admin'), verifyClaim);
router.patch('/:id/approve', authorize('approver', 'admin'), decideClaim);

module.exports = router;
