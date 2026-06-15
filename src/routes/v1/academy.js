const router   = require('express').Router();
const validate = require('../../middleware/validate');
const { strictLimiter } = require('../../middleware/rateLimiter');
const { uuidParam, paginationQuery, courseTitle, courseLevel } = require('../../validators/common');
const { success, created, paginated, notFound } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

/**
 * @swagger
 * tags:
 *   name: Academy
 *   description: Cybersecurity courses, labs, and certifications
 *
 * /academy/courses:
 *   get:
 *     summary: List all courses
 *     tags: [Academy]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: Paginated list of courses
 */
router.get('/courses', paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Courses fetched' });
});

/**
 * @swagger
 * /academy/courses/{id}:
 *   get:
 *     summary: Get course details
 *     tags: [Academy]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/courses/:id', uuidParam(), validate, (req, res) => {
  return notFound(res, 'Course');
});

/**
 * @swagger
 * /academy/courses:
 *   post:
 *     summary: Create a course
 *     tags: [Academy]
 *     responses:
 *       201:
 *         description: Course created
 */
router.post('/courses', strictLimiter, [courseTitle, courseLevel], validate, (req, res) => {
  return created(res, { data: { id: 'placeholder-uuid', ...req.body }, message: 'Course created (placeholder)' });
});

/**
 * @swagger
 * /academy/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Academy]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Course updated
 */
router.put('/courses/:id', uuidParam(), validate, (req, res) => {
  return success(res, { message: 'Course update (placeholder)', data: { id: req.params.id } });
});

/**
 * @swagger
 * /academy/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Academy]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Course deleted
 */
router.delete('/courses/:id', uuidParam(), validate, (req, res) => {
  return success(res, { message: 'Course deleted (placeholder)', data: { id: req.params.id } });
});

/**
 * @swagger
 * /academy/enrollments:
 *   get:
 *     summary: List enrollments
 *     tags: [Academy]
 *     responses:
 *       200:
 *         description: List of enrollments
 */
router.get('/enrollments', paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Enrollments fetched' });
});

/**
 * @swagger
 * /academy/certifications:
 *   get:
 *     summary: List certifications
 *     tags: [Academy]
 *     responses:
 *       200:
 *         description: List of certifications
 */
router.get('/certifications', paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Certifications fetched' });
});

module.exports = router;
