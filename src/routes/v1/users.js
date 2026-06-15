const router  = require('express').Router();
const { body } = require('express-validator');
const UsersController = require('../../controllers/usersController');
const { authenticate } = require('../../middleware/auth/authenticate');
const { requireRole } = require('../../middleware/auth/authorize');
const validate = require('../../middleware/validate');
const { updateProfileValidator } = require('../../validators/auth');

router.get('/', authenticate, requireRole('admin'), UsersController.list);
router.get('/me/profile', authenticate, UsersController.getMyProfile);
router.put('/me/profile', authenticate, updateProfileValidator, validate, UsersController.updateMyProfile);
router.get('/:id', authenticate, UsersController.getById);
router.put('/:id/role', authenticate, requireRole('admin'), [
  body('role').isIn(['user','instructor','vendor','moderator','admin']).withMessage('Invalid role'),
], validate, UsersController.assignRole);
router.put('/:id/deactivate', authenticate, requireRole('admin'), UsersController.deactivate);

module.exports = router;
