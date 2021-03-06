var express = require('express');
var router = express.Router();
var ensureAuthentication = require('../util/ensureAuthentication');
var user_controller = require('../controllers/userController');

router.get('/myprofile', ensureAuthentication.noCache, ensureAuthentication.ensureAuthenticated, user_controller.user_profile_get);

router.get('/:id', ensureAuthentication.noCache, ensureAuthentication.ensureAuthenticated, user_controller.retirement_calculator_get);

router.post('/:id', ensureAuthentication.noCache, ensureAuthentication.ensureAuthenticated, user_controller.retirement_calculator_post);

module.exports = router;