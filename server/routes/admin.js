const express = require('express');
const router = express.Router();
const {
  getOverview,
  getUsers,
  createOrganizer,
  updateUserStatus,
  updateUserRole,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.post('/organizers', createOrganizer);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
