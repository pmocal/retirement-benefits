const User = require('../models/user');
const { check,validationResult, sanitizeBody } = require('express-validator');
const bcrypt = require("bcryptjs");
const path = require('path');
const generatePdfBase64 = require('../util/generatePdfBase64');
const async = require('async');
var moment = require('moment');

exports.index_get = (req, res) => {
	if (req.user) {
		if (req.user.submission_status === "processed") {
			var additional = {
				date_when_62: moment(req.user.dob_formatted, "YYYYMMDD").add(62, "years").format("YYYYMMDD")
			}
		}
	}
	async.parallel({
		unprocessed: function(callback) {
			User.find({submission_status: "submitted"})
				.exec(callback)
		},
		processed: function(callback) {
			User.find({submission_status: "processed"})
			.exec(callback)
		},
	}, function(err, results) {
		if (err) { return next(err); } //error in API usage
		res.render("index", { user: req.user, title: "AFS Retirement Benefits",
			processed: results.processed, unprocessed: results.unprocessed , additional: additional});
	});
};

exports.index_post = [
	check('last_name', 'Last name must not be empty.').isLength({ min: 1 }).trim(),
	check('first_name', 'First name must not be empty.').isLength({ min: 1 }).trim(),
	check('address', 'Address must not be empty.').isLength({ min: 1 }).trim(),
	check('city', 'City must not be empty.').isLength({ min: 1 }).trim(),
	check('state', 'State must not be empty.').isLength({ min: 1 }).trim(),
	check('ssn', 'SSN must be at least 9 digits').isLength({ min: 9 }).trim(),
	check('dob', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
	check('phone_number', 'Phone number must be at least 9 digits').isLength({ min: 9 }).trim(),
	check('nafi', 'Employee NAFI must not be empty.').isLength({ min: 1 }).trim(),
	check('installation', 'Installation must not be empty.').isLength({ min: 1 }).trim(),
	check('retdate', 'Invalid Start Date').optional({ checkFalsy: true }).isISO8601(),
	sanitizeBody('dob').toDate(),
	sanitizeBody('retdate').toDate(),
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// There are errors. Render form again with values/error messages.
			res.render('index', { user: req.user, errors: errors.array() });
			// , { title: 'Create Item', item: item, errors: errors.array() });
		} else {
			User.findByIdAndUpdate(
				{
					_id: req.user.id
				},
				{
					installation: req.body.installation,
					nafi: req.body.nafi,
					retdate: req.body.retdate,
				},
				function(err) {
					if (err) {
						res.next(err);
					} 
				}
			)
			User.findById(req.user.id)
				.exec(function(err, theuser) {
					if (err) {
						return next(err);
					}
					const docDefinition = {
						pageSize: 'SRA2',
						content: [
							{
								text: "Last Name: " + req.user.last_name,
								absolutePosition: {x:86, y:410}
							},
							{
								text: "First Name: " + req.user.first_name,
								absolutePosition: {x:86, y:510}
							},
							{
								text: "Address: " + req.user.address,
								absolutePosition: {x:86, y:615}
							},
							{
								text: "City: " + req.user.city,
								absolutePosition: {x:86, y:715}
							},
							{
								text: "State: " + req.user.state,
								absolutePosition: {x:86, y:805}
							},
							{
								text: "SSN: " + req.user.ssn_formatted,
								absolutePosition: {x:86, y:910}
							},
							{
								text: "Sex: " + req.user.sex,
								absolutePosition: {x:86, y:1010}
							},
							{
								text: "Date of Birth: " + req.user.dob_formatted,
								absolutePosition: {x:86, y:1115}
							},
							{
								text: "Phone number: " + theuser.phone_number_formatted,
								absolutePosition: {x:86, y:1215}
							},
							{
								text: "Employee NAFI: " + theuser.nafi,
								absolutePosition: {x:86, y:1310}
							},
							{
								text: "Installation: " + theuser.installation,
								absolutePosition: {x:86, y:1410}
							},
							{
								text: "Date of Retirement: " + theuser.retdate_formatted,
								absolutePosition: {x:86, y:1510}
							},
						],
						defaultStyle: {
							font: 'Helvetica',
							fontSize: 40,
							alignment: 'justify'
						},
					};
					generatePdfBase64.generatePdf(docDefinition, (response) => {
						User.findByIdAndUpdate(
							{
								_id: req.user.id
							},
							{
								submission: response,
								submission_status: "submitted"
							},
							function(err) {
								if (err) {
									res.next(err);
								} else {
									res.redirect('/');
								}
							}
						)
					})
				})
		}
		
	}
]

exports.retirement_calculator_get = function(req, res, next) {
	User.findById(req.params.id)
		.exec(function(err, applicant) {
			if (err) {
				return next(err);
			}
			res.render("retirement_calculator_form", { title: 'Retirement Calculator', user: req.user, applicant: applicant });
		})
}

exports.retirement_calculator_post = [
	check('ssn', 'SSN must be at least 9 digits').isLength({ min: 9 }).trim(),
	check('first_name', 'First name must not be empty.').isLength({ min: 1 }).trim(),
	check('last_name', 'Last name must not be empty.').isLength({ min: 1 }).trim(),
	check('dob', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
	check('sex', 'Sex must not be empty.').isLength({ min: 1 }).trim(),
	check('base', 'Base must not be empty.').isLength({ min: 1 }).trim(),
	check('address', 'Address must not be empty.').isLength({ min: 1 }).trim(),
	check('city', 'City must not be empty.').isLength({ min: 1 }).trim(),
	check('state', 'State must not be empty.').isLength({ min: 1 }).trim(),
	check('zip', 'Zip must not be empty.').isLength({ min: 1 }).trim(),
	check('retdate', 'Invalid Retirement Date').optional({ checkFalsy: true }).isISO8601(),
	check('contrib', 'Contributions must not be empty.').notEmpty().trim(),
	check('interest', 'Interest must not be empty.').notEmpty().trim(),
	check('salary', 'Salary must not be empty.').notEmpty().trim(),
	check('rcs', 'Retirement Credited Service must not be empty.').notEmpty().trim(),
	check('sick', 'Sick leave must not be empty.').notEmpty().trim(),
	sanitizeBody('dob').toDate(),
	sanitizeBody('retdate').toDate(),
	sanitizeBody('termindate').toDate(),
	async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);
		User.findById(req.params.id)
			.exec(function(err, applicant) {
				if (err) {
					return next(err);
				}
				if (!errors.isEmpty()) {
					// There are errors. Render form again with values/error messages.
					res.render('retirement_calculator_form',
						{ title: 'Retirement Calculator', user: req.user, applicant: applicant, errors: errors.array() });
				} else {
					User.findByIdAndUpdate(
						{
							_id: req.params.id
						},
						{
							submission_status: "processed",
							zip: req.body.zip,
							base: req.body.base,
							salary: req.body.salary,
							sick: req.body.sick,
							rcs: req.body.rcs,
							interest: req.body.interest,
							middle_initial: req.body.middle_initial,
							contrib: req.body.contrib,
							retdate: req.body.retdate,
							termindate: req.body.termindate,
							years_til: moment().diff(moment(req.body.dob), 'years', true)
						},
						function(err) {
							if (err) {
								return next(err);
							} else {
								User.findById(req.params.id)
									.exec(function(err, updatedApplicant) {
										if (err) {
											return next(err);
										} else {
											const docDefinition = {
												pageSize: 'SRA2',
												content: [
													{
														text: "SSN " + updatedApplicant.ssn_formatted,
														absolutePosition: {x:86, y:410}
													},
													{
														text: "Date of Birth " + updatedApplicant.dob_formatted,
														absolutePosition: {x:86, y:510}
													},
													{
														text: "Full Name " + updatedApplicant.first_name
															+ " " + updatedApplicant.middle_initial
															+ " " + updatedApplicant.last_name,
														absolutePosition: {x:86, y:610}
													},
													{
														text: "Full Name " + updatedApplicant.nafi,
														absolutePosition: {x:86, y:710}
													},
													{
														text: "Full Name " + updatedApplicant.salary,
														absolutePosition: {x:86, y:810}
													},
													{
														text: "You have (years left to be 62 or older): " + updatedApplicant.years_til,
														absolutePosition: {x:86, y:910}
													},
													{
														text: "Your total contributions (last 5 years): " + updatedApplicant.contrib,
														absolutePosition: {x:86, y:1010}
													}
												],
												defaultStyle: {
													font: 'Helvetica',
													fontSize: 40,
													alignment: 'justify'
												},
											};

											generatePdfBase64.generatePdf(docDefinition, (response) => {
												User.findByIdAndUpdate(
													{
														_id: req.params.id
													},
													{
														calculation: response,
													},
													function(err) {
														if (err) {
															res.send(err);
														} else {
															res.render('retirement_calculator_form',
															{ title: 'Retirement Calculator', user: req.user, applicant: updatedApplicant });
														}
													}
												)
											})
										}
									})
							}
						}
					)
				}
			})
	}
]

//display profile page for a specific user
exports.user_profile_get = function(req, res, next) {
	User.findById(req.user.id)
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
	check('passwordConfirmation', 'passwordConfirmation field must have the same value as the password field')
	    .exists()
	    .custom((value, { req }) => value === req.body.password),
	sanitizeBody('dob').toDate(),
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
			// There are errors. Render form again with values/error messages.
			res.render('sign_up_form', { title: "Sign Up", user: user, errors: errors.array() });
			// , { title: 'Create Item', item: item, errors: errors.array() });
		}
		else if (await User.exists({ssn: req.body.ssn})) {
			res.render('sign_up_form', { title: "Sign Up", user: user, errors: [{'msg': 'SSN already exists among Users'}] });
		}
		else if (await User.exists({username: req.body.username})) {
			res.render('sign_up_form', { title: "Sign Up", user: req.user, errors: [{'msg': 'Username already exists among Users'}] });
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