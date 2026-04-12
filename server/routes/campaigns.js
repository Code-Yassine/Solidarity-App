const express = require('express');
const router = express.Router();
const {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  getManageableCampaigns,
  updateCampaignStatus,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadCampaignImage } = require('../middleware/upload');

router.get('/', getAllCampaigns);
router.get('/manage', authenticate, authorize('admin', 'organizer'), getManageableCampaigns);
router.get('/:id', getCampaignById);
router.post('/', authenticate, authorize('admin', 'organizer'), uploadCampaignImage.single('image'), createCampaign);
router.put('/:id', authenticate, authorize('admin', 'organizer'), uploadCampaignImage.single('image'), updateCampaign);
router.patch('/:id/status', authenticate, authorize('admin', 'organizer'), updateCampaignStatus);
router.delete('/:id', authenticate, authorize('admin', 'organizer'), deleteCampaign);

module.exports = router;
