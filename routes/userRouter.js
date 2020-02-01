var express = require('express');
var router = express.Router();
var ensureAuthentication = require('../util/ensureAuthentication');
var user_controller = require('../controllers/userController');

router.get('/myprofile', ensureAuthentication.noCache, ensureAuthentication.ensureAuthenticated, user_controller.user_profile_get);

module.exports = router;