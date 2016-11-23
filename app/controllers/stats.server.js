'use strict';
// code from http://www.clementinejs.com/tutorials/tutorial-beginner.html

function statsHandler (db) {

	var sessions = db.collection('sessions');

	this.getStats = function (req, res) {

		var projection = { '_id': false };
		sessions.find({}, projection).toArray(function(err, docs){
			if (err) {
				throw err;
			}
			if (docs && docs.length === 0) {
				console.log('statsHandler.getStats. docs.length === 0');
				console.log(docs);
				res.json(null);
			} else if (docs) {
				console.log('Called statsHandler.getStats. Found result.');
				console.log(docs);
				res.json(docs);
			} else {
				console.log('Called statsHandler.getStats. NO RESULTS.');
				res.json(null);
			}

		});
	}

	this.addSessionStats = function (req, res) {
		if (!req.body) {
			console.log('!req.body, sending status 400');
			return res.sendStatus(400);
		}
		console.log('req.body:');
		console.log(req.body);

		sessions.insertOne(
			{
				'sessionLength': req.body.sessionLength,
				'rangeStart': req.body.rangeStart,
				'rangeEnd': req.body.rangeEnd,
				'sessionIntervals': req.body.sessionIntervals,
				'refNote': req.body.refNote,
				'totalTime': req.body.totalTime,
				'questions': req.body.questions
			},
			function (err, result) {
				if (err) { throw err; }
				console.log('Called statsHandler.addSessionStats. Inserted document into db.');
				res.json(result);
			}
		);
	};

	this.resetStats = function (req, res) {
		sessions.deleteMany( {}, function(err, result) {
			console.log('resetStats called.');
			//console.log(result);
			res.json(result);
		});
	};
}
module.exports = statsHandler;
