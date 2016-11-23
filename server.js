'use strict';
// code from http://www.clementinejs.com/tutorials/tutorial-beginner.html

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json();

var port = process.env.PORT || 8000;  // Set the default port number to 8000, or use Heroku's settings (process.env.PORT)

// Remember to run mongod.exe first!
var url = 'mongodb://localhost:27017/sessions';

MongoClient.connect(url, function(err, db) {

	assert.equal(null, err);
	console.log("Connected correctly to server.");


	app.listen(port, function () {
		console.log('Listening on port ' + port + '...');
	});

	app.use(express.static('public'));    // Tell Express to serve everything in the "public" folder as static files
	//app.use('/public', express.static(process.cwd() + '/public'));
	app.use('/controllers', express.static(process.cwd() + '/app/controllers'));

	var StatsHandler = require(process.cwd() + '/app/controllers/stats.server.js');
	var statsHandler = new StatsHandler(db);

	app.route('/')
	.get(function (req, res) {
		res.sendFile(process.cwd() + '/public/index.html');
	});

	app.route('/api/stats')
	.get(statsHandler.getStats)
	.post(jsonParser, statsHandler.addSessionStats)
	.delete(statsHandler.resetStats);

}); //end MongoClient.connect
