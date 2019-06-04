

require("dotenv").config()

const express = require("express")
const exphbs = require("express-handlebars")
const session = require("cookie-session")
const passport = require("passport")
const RedditStrategy = require("passport-reddit").Strategy
const refresh = require("passport-oauth2-refresh")
const mysql = require("mysql2")
const Recaptcha = require("express-recaptcha").Recaptcha

const uuid = require("uuid/v4")
const bodyParser = require("body-parser")
const htmlesp = require("escape-html")
const morgan = require("morgan")
const sleep = require("system-sleep")
const recaptcha = new Recaptcha(process.env.GOOGLE_SITE, process.env.GOOGLE_SECRET)

//mysql login
var connection = mysql.createConnection({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
})


var app = express()

//error logging
//const Sentry = require('@sentry/node');

//Sentry.init({ dsn: 'https://559cb716d3324814bad62662be4eb96a@sentry.io/1390647' });

// The request handler must be the first middleware on the app
//app.use(Sentry.Handlers.requestHandler());

passport.serializeUser(function (user, done) {
	done(null, user)
})
passport.deserializeUser(function (obj, done) {
	done(null, obj)
})

const redditStrat = new RedditStrategy({
	clientID: process.env.DISCORD_ID,
	clientSecret: process.env.DISCORD_SECRET,
	callbackURL: "http://localhost:3000/callback"
}, function (_accessToken, refreshToken, profile, _done) {
	profile.refreshToken = refreshToken // store this for later refreshes
	process.nextTick(function () {
		// user db code placeholder
		/*connection.query("SELECT * FROM users WHERE user = ?", profile.id, function (error, results, fields) {
			if (error) throw error

			if (results.length) {
				return done(null, profile)
			} else {
				//if there's not then create a new user
				connection.query("INSERT INTO users SET user = ?", profile.id, function (error, results, fields) {
					if (error) throw error
					return done(null, profile)
				})
			}
		})*/
	})
})

app.use(express.static("static"))

//logging
app.use(morgan("dev"))

//auth
passport.use(redditStrat)
refresh.use(redditStrat)

//use res/req in handlebars
app.use(function (req, res, next) {
	res.locals.req = req
	// eslint-disable-next-line no-self-assign
	res = res
	next()
})

app.enable("trust proxy")
app.disable("x-powered-by")

//session
app.use(session({
	name: process.env.SESSION_NAME,
	secret: process.env.SESSION_SECRET,

	maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

//start passport
app.use(passport.initialize())
app.use(passport.session())

app.use(function (req, _res, next) {
	if (req.isAuthenticated()) {

		// set variables of user in req.user object placeholder code
		/*
		connection.query("SELECT * FROM users WHERE user = ?", req.user.id, function (error, results, fields) {
			if (error) throw error
			if (results.length && req.user !== null) {
				req.user.userid = results[0].id
				req.user.name = results[0].name
				req.user.robux = results[0].robux
				req.user.tix = results[0].tix
				req.user.admin = results[0].admin
				connection.query("SELECT COUNT(*) as count FROM messages WHERE reciever = ? AND viewed = 0", req.user.userid, function (error, results, fields) {
					if (error) throw error
					console.log("middleware hello")
					req.user.messages = results[0].count
					next()
				})
			}
		})

		connection.query("UPDATE users SET lastactive = ? WHERE id = ?", [Date.now(), req.user.userid], function (error, results, fields) {
			if (error) throw error
		})

	} else {*/
		next()
	}
})

app.engine("handlebars", exphbs({
	defaultLayout: "main",
	helpers: {
		eq: function (v1, v2) {
			return v1 === v2
		},
		ne: function (v1, v2) {
			return v1 !== v2
		},
		lt: function (v1, v2) {
			return v1 < v2
		},
		gt: function (v1, v2) {
			return v1 > v2
		},
		lte: function (v1, v2) {
			return v1 <= v2
		},
		gte: function (v1, v2) {
			return v1 >= v2
		},
		and: function () {
			return Array.prototype.slice.call(arguments).every(Boolean)
		},
		or: function () {
			return Array.prototype.slice.call(arguments, 0, -1).some(Boolean)
		},
		m: function (v1, v2) {
			return v1 + v2
		},
		repeat: function (n, block) {
			var accum = ""
			for (var i = 0; i < n; ++i)
				accum += block.fn(i)
			return accum
		}
	},
}))

app.set("view engine", "handlebars")
app.use(bodyParser.urlencoded({ extended: false }))

// example routes

app.get("/", function (_req, res) {
	res.render("home")
})