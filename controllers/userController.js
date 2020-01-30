var User = require('../models/user');
const { check,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const bcrypt = require("bcryptjs");
var path = require('path');

exports.index = (req, res) => { 
	res.render("index", { user: req.user, title: "AFS Retirement Benefits" });
};

//display profile page for a specific user
exports.user_profile_get = function(req, res, next) {
	User.findById(req.params.id)
		.exec(function(err, user) {
			if (err) {
				return next(err);
			}
			res.render('user_profile', { title: 'User Profile', user: user });
		})
};

exports.sign_up_get = (req, res) => res.render("sign_up_form", { title: "Sign up" });

exports.sign_up_post = [
	// Validate fields.
	check('last_name', 'Last name must not be empty.').isLength({ min: 1 }).trim(),
	check('first_name', 'First name must not be empty.').isLength({ min: 1 }).trim(),
	check('address', 'Address must not be empty.').isLength({ min: 1 }).trim(),
	check('city', 'City must not be empty.').isLength({ min: 1 }).trim(),
	check('state', 'State must not be empty.').isLength({ min: 1 }).trim(),
	check('ssn', 'SSN must be at least 9 digits').isLength({ min: 9 }).trim(),
	check('dob', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
	check('phone_number', 'Phone number must be at least 9 digits').isLength({ min: 9 }).trim(),
	check('username', 'Username must not be empty.').isLength({ min: 1 }).trim(),
	check('password', 'Password must not be empty').isLength({ min: 1 }).trim(),
	check('passwordConfirmation').exists(),
	// Sanitize fields (using wildcard).
	sanitizeBody('last_name').escape(),
	sanitizeBody('first_name').escape(),
	sanitizeBody('address').escape(),
	sanitizeBody('city').escape(),
	sanitizeBody('state').escape(),
	sanitizeBody('ssn').escape(),
	sanitizeBody('sex').escape(),
	sanitizeBody('dob').toDate(),
	sanitizeBody('phone_number').escape(),
	sanitizeBody('username').escape(),
	sanitizeBody('password').escape(),
	sanitizeBody('passwordConfirmation').escape(),
	check('passwordConfirmation', 'passwordConfirmation field must have the same value as the password field')
	    .exists()
	    .custom((value, { req }) => value === req.body.password),
	async (req, res, next) => {
		// Extract the validation errors from a request.
		var user = new User({
			last_name: req.body.last_name,
			first_name: req.body.first_name,
			address: req.body.address,
			city: req.body.city,
			state: req.body.state,
			phone_number: req.body.phone_number,
			username: req.body.username
		})
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/error messages.
			res.render('sign_up_form', { title: "Sign Up", user: user, errors: errors.array() });
			// , { title: 'Create Item', item: item, errors: errors.array() });
		}
		else if (await User.exists({ssn: req.body.ssn})) {
			res.render('sign_up_form', { title: "Sign Up", user: user, errors: [{'msg': 'SSN already exists among Users'}] });
		}
		else {
			// Data from form is valid. Save book.
			bcrypt.genSalt(10, function(err, salt) {
				bcrypt.hash(req.body.password, salt, function(err, hash) {
					user = new User({
						last_name: req.body.last_name,
						first_name: req.body.first_name,
						address: req.body.address,
						city: req.body.city,
						state: req.body.state,
						ssn: req.body.ssn,
						sex: req.body.sex,
						dob: (req.body.dob == null) ? req.body.dob :
							new Date(req.body.dob.toISOString().replace(/-/g, '\/').replace(/T.+/, '')),
						phone_number: req.body.phone_number,
						username: req.body.username,
						password: hash,
						is_admin: false
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