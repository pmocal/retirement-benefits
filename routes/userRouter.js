var express = require('express');
var router = express.Router();

var user_controller = require('../controllers/userController');

router.get('/:id', user_controller.user_profile_get);

module.exports = router;