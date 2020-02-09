var mongoose = require('mongoose');
const moment = require('moment-timezone');
var Schema = mongoose.Schema;

var UserSchema = new Schema(
	{
		last_name: { type: String, required: true },
		first_name: { type: String, required: true },
		address: { type: String, required: true },
		city: { type: String, required: true },
		state: { type: String, required: true },
		ssn: { type: String, required: true },
		sex: {type: String, required: true, enum: ['male', 'female', 'other']},
		dob: { type: Date, required: true },
		phone_number: { type: String, required: true },
		username: { type: String, required: true },
		password: { type: String, required: true },
		is_admin: false,
		submission_status: { type: String, default: "not submitted" },
		submission: { type: Buffer },
		nafi: {type: String},
		installation: {type: String},
		middle_initial: {type: String},
		base: {type: String},
		termindate: {type: Date},
		retdate: {type: Date},
		zip: {type: String},
		calculation: { type: Buffer },
		contrib: { type: Number },
		interest: { type: Number },
		salary: { type: Number },
		rcs: { type: Schema.Types.Decimal128 },
		sick: {type: Number},
		years_til: {type: Number},
		ss_award: {type: Number}
	}
)

UserSchema
.virtual('dob_formatted')
.get(function () {
	return moment(this.dob).format('YYYYMMDD');
});

UserSchema
.virtual('dob_form')
.get(function () {
	return moment(this.dob).format('YYYY-MM-DD');
});

UserSchema
.virtual('retdate_formatted')
.get(function () {
	return moment(this.retdate).format('YYYYMMDD');
});

UserSchema
.virtual('retdate_form')
.get(function () {
	if (this.retdate) {
		return moment(this.retdate).format('YYYY-MM-DD');
	} else {
		return;
	}
});

UserSchema
.virtual('termindate_formatted')
.get(function () {
	if (this.termindate) {
		return moment(this.termindate).format('YYYYMMDD');
	}
	return;
});

UserSchema
.virtual('phone_number_formatted')
.get(function () {
  return this.phone_number.slice(0,3) + '-' + this.phone_number.slice(3,6) + '-' + this.phone_number.slice(6,10);
});

UserSchema
.virtual('ssn_formatted')
.get(function () {
  return this.ssn.slice(0,3) + '-' + this.ssn.slice(3,5) + '-' + this.ssn.slice(5,9);
});

UserSchema
.virtual('submission_src')
.get(function() {
	return 'data:application/pdf;base64,' + this.submission.toString('base64');
})

UserSchema
.virtual('calculation_src')
.get(function() {
	return 'data:application/pdf;base64,' + this.calculation.toString('base64');
})

UserSchema
.virtual('years_til')
.get(function() {
	return (62-moment().diff(moment(req.body.dob), 'years', true));
})

module.exports = mongoose.model('User', UserSchema);