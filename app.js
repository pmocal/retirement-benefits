require('dotenv').config()

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
var logger = require('morgan');
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const mongoose = require("mongoose");
var hbs = require('hbs');
const Schema = mongoose.Schema;

const mongoDb = "mongodb+srv://" + process.env.DB_USER + ":" + 
	process.env.DB_PASS + "@" + process.env.DB_HOST + "/retirement-benefits-fake?retryWrites=true&w=majority";
mongoose.connect(mongoDb, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
	return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
hbs.registerHelper('ifNotEquals', function(arg1, arg2, options) {
	return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
});
hbs.registerHelper( 'toString', function returnToString( x ){
	return ( x === void 0 ) ? 'undefined' : x.toString();
} );
hbs.registerHelper( 'get_Id', function(x){
  return ( x === void 0 ) ? 'undefined' : x._id();
});
hbs.registerPartials(path.join(__dirname, 'views/partials'));

var User = require('./models/user');
var user_controller = require('./controllers/userController');
var userRouter = require('./routes/userRouter');

passport.use(
	new LocalStrategy((username, password, done) => {
		User.findOne({ username: username }, (err, user) => {
			if (err) { 
				return done(err);
			}
			if (!user) {
				return done(null, false, { msg: "Incorrect username" });
			}
			bcrypt.compare(password, user.password, (err, res) => {
				if (res) {
					return done(null, user);
				} else {
					return done(null, false, {msg: "Incorrect password"});
				}
			})
		});
	})
);

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

app.get("/", user_controller.index_get);

app.post("/", user_controller.index_post);

app.get("/sign-up", user_controller.sign_up_get);

app.post("/sign-up", user_controller.sign_up_post);

app.post(
	"/log-in",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/"
	})
);

app.get("/log-out", user_controller.log_out);

app.use('/user', userRouter);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
