var User = require('../models/user');
const { check,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const bcrypt = require("bcryptjs");
var ensureAuthentication = require('../util/ensureAuthentication');
var path = require('path');

exports.index = (req, res) => { 
	res.render("index", { user: req.user, title: "AFS Retirement Benefits" });
};

//display profile page for a specific user
exports.user_profile_get = [ensureAuthentication.ensureAuthenticated, function(req, res, next) {
	User.findById(req.params.id)
		.exec(function(err, user) {
			if (err) {
				return next(err);
			}
			res.render('user_profile', { title: 'User Profile', user: user });
		})
}];

exports.sign_up_get = (req, res) => res.render("sign_up_form", { title: "Sign up" });

exports.sign_up_post = [
	// Validate fields.
	check('fullname', 'Full name must not be empty.').isLength({ min: 1 }).trim(),
	check('ssn', 'SSN must be at least 9 digits').isLength({ min: 9 }).trim(),
	check('username', 'Username must not be empty.').isLength({ min: 1 }).trim(),
	check('password', 'Password must not be empty').isLength({ min: 1 }).trim(),
	check('passwordConfirmation').exists(),
	// Sanitize fields (using wildcard).
	sanitizeBody('fullname').escape(),
	sanitizeBody('SSN').escape(),
	sanitizeBody('username').escape(),
	sanitizeBody('password').escape(),
	sanitizeBody('passwordConfirmation').escape(),
	check('passwordConfirmation', 'passwordConfirmation field must have the same value as the password field')
	    .exists()
	    .custom((value, { req }) => value === req.body.password),
	(req, res, next) => {
		// Extract the validation errors from a request.
		var user = new User({
			username: req.body.username,
			fullname: req.body.fullname
		})
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/error messages.
			res.render('sign_up_form', { title: "Sign Up", user: user, errors: errors.array() });
			// , { title: 'Create Item', item: item, errors: errors.array() });
		}
		else {
			// Data from form is valid. Save book.
			bcrypt.genSalt(10, function(err, salt) {
				bcrypt.hash(req.body.password, salt, function(err, hash) {
					user = new User({
						username: req.body.username,
						fullname: req.body.fullname,
						ssn: req.body.ssn,
						password: hash,
					}).save(err => {
						if (err) { 
							return next(err);
						};
						res.redirect("/");
					});
				})		
			});
		}
	}
];

exports.log_out = (req, res) => {
	req.logout();
	res.redirect("/");
}