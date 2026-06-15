const router = require('express').Router();

router.use('/health',      require('./health'));
router.use('/auth',        require('./auth'));
router.use('/users',       require('./users'));
router.use('/academy',     require('./academy'));
router.use('/marketplace', require('./marketplace'));
router.use('/community',   require('./community'));
router.use('/wallet',      require('./wallet'));
router.use('/analytics',   require('./analytics'));
router.use('/ai',          require('./ai'));

module.exports = router;
