const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createSettlement,
  completeSettlement,
  getSettlements,
} = require('../controllers/settlementController');

router.use(protect);

router.post('/:claimId', authorize('finance', 'admin'), createSettlement);
router.patch('/:id/complete', authorize('finance', 'admin'), completeSettlement);
router.get('/', authorize('finance', 'admin', 'approver'), getSettlements);

module.exports = router;
