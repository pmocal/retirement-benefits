var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema(
	{
		username: { type: String, required: true },
		password: { type: String, required: true },
		fullname: { type: String, required: true },
		ssn: { type: String, required: true },
		isAdmin: false
	}
)

module.exports = mongoose.model('User', UserSchema);