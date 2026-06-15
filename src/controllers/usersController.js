const UserModel  = require('../models/User');
const AuthService = require('../services/authService');
const { success, paginated, notFound } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

class UsersController {

  /** GET /users — list all users (admin only) */
  static async list(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search } = req.query;
      const [users, total] = await Promise.all([
        UserModel.findAll({ limit, offset, search }),
        UserModel.count(search),
      ]);
      return paginated(res, {
        data:    users.map(UserModel.sanitize),
        total, page, limit,
        message: 'Users fetched successfully',
      });
    } catch (err) { next(err); }
  }

  /** GET /users/:id — get user by ID */
  static async getById(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return notFound(res, 'User');
      return success(res, { message: 'User fetched', data: { user: UserModel.sanitize(user) } });
    } catch (err) { next(err); }
  }

  /** GET /users/me/profile — get own profile */
  static async getMyProfile(req, res) {
    return success(res, { message: 'Profile fetched', data: { user: req.user } });
  }

  /** PUT /users/me/profile — update own profile */
  static async updateMyProfile(req, res, next) {
    try {
      const { firstName, lastName, bio, phone, country } = req.body;
      const updated = await UserModel.update(req.user.id, {
        first_name: firstName,
        last_name:  lastName,
        bio, phone, country,
      });
      return success(res, { message: 'Profile updated', data: { user: UserModel.sanitize(updated) } });
    } catch (err) { next(err); }
  }

  /** PUT /users/:id/role — assign role (admin only) */
  static async assignRole(req, res, next) {
    try {
      const { role } = req.body;
      const validRoles = ['user', 'instructor', 'vendor', 'moderator', 'admin'];
      if (!validRoles.includes(role)) {
        return notFound(res, `Role '${role}'`);
      }
      const user = await UserModel.findById(req.params.id);
      if (!user) return notFound(res, 'User');
      await UserModel.assignRole(req.params.id, role, req.user.id);
      return success(res, { message: `Role '${role}' assigned successfully`, data: null });
    } catch (err) { next(err); }
  }

  /** PUT /users/:id/deactivate — deactivate user (admin only) */
  static async deactivate(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return notFound(res, 'User');
      await UserModel.deactivate(req.params.id);
      return success(res, { message: 'User deactivated', data: null });
    } catch (err) { next(err); }
  }
}

module.exports = UsersController;
