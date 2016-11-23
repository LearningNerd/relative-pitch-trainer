'use strict';
// with some code from http://www.clementinejs.com/tutorials/tutorial-beginner.html
// https://github.com/0xfe/vexflow/
// https://github.com/stuartmemo/qwerty-hancock

(function(){
	// ********************************* Settings! ********************************************
	var SESSION_LENGTH = 10, RANGE_START = 60, RANGE_END = 67;
	var SESSION_INTERVALS = [0,1,2,3,4,5,6,7,8,9,10,11,12];	// for now, allow all intervals; later, allow for limiting these!
	var apiUrl = 'http://localhost:8000/api/stats';

	// vars!
	var sessions = [], pressedMidiNotes = [], quizNotes = [], quizIndex = 0,
	 sessionTime = 0, questionTime = 0, attemptTime = 0, correctAnswer, listeningState = false;
	var sessionStats = {
		sessionLength: SESSION_LENGTH,
		rangeStart: RANGE_START,
		rangeEnd:RANGE_END,
		sessionIntervals: SESSION_INTERVALS,
		refNote: null,
		totalTime: 0,
		questions: []
	};

	/*	for each game session/round:
	var sessions = [
		{
			sessionLength: SESSION_LENGTH,
			rangeStart: RANGE_START,
			rangeEnd:RANGE_END,
			sessionIntervals: [0, 1,2,3,4,5,6,7,8,9,10,11,12],
			refNote: refNoteMidi,
			totalTime: #### milliseconds,
			questions: [
				{
					answer: 65,
					totalTime: 350,
					attempts: [
						{notes: [64], time: 200},
						{notes: [65], time: 135}
					]
				},
				{	answer: 67,
					totalTime: 500,
					attempts: [
						{notes: [67], time: 450}
					]
				}
			],
		},
		...{}, {}, {} ... << more sessions in this array
	];
	*/

	// DOM elements:
	var midiMessages = document.getElementById('midimessages');
	var messageBox = document.getElementById('intervalinfo');
	var statsBox = document.getElementById('stats');
	var mainButton = document.getElementById('play');
	mainButton.addEventListener('click', startSession);
	var resetButton = document.getElementById('reset');
	resetButton.addEventListener('click', resetData);
	var onScreenPiano = document.getElementById('piano');
	// Canvas:
	var myCanvas = document.getElementById("myCanvas");
	var ctx = myCanvas.getContext("2d");


	// ************************** ACCESS API, GET/SET FROM DB ***************************************

	function updateStatsView (data) {
		console.log('updateStatsView called.');
		console.log(data);
		if (data == null || data === 'null') {
			statsBox.innerHTML = 'No stats in the database.';
		} else {
			var statsObject = JSON.parse(data);
			statsBox.innerHTML = JSON.stringify(statsObject);
			console.log(JSON.stringify(statsObject));
		}
	}

	function resetData () {
		ajaxRequest('DELETE', apiUrl, function () {
	 		ajaxRequest('GET', apiUrl, updateStatsView);
		});
	}

	ready(ajaxRequest('GET', apiUrl, updateStatsView));


	// ****************   VexFlow setup  ********************
	var VF = Vex.Flow;
	var renderer = new Vex.Flow.Renderer(myCanvas, Vex.Flow.Renderer.Backends.CANVAS);
	var stave = new VF.Stave(0, 30, 498);
	var context = renderer.getContext();
	// VexFlow initialize staff:
	stave.addClef("treble").addTimeSignature("4/4");
	refreshVexFlowNotes([]);

	function refreshVexFlowNotes(vexNotesArray) {
		// Clear canvas
		ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

		console.log('Refreshing VexFlow with notes: ');
		console.log(vexNotesArray);

		// (Re)draw staff and notes:
		stave.setContext(context).draw();
		if (vexNotesArray != null && vexNotesArray.length > 0 && vexNotesArray[0] != null ) {
			VF.Formatter.FormatAndDraw(context, stave, vexNotesArray);
		} else {
			console.log('vexNotesArray argument either == null or is empty or first value == null');
		}
	}

	// ****************   Web audio API  ********************
	var audioCtx = new (window.AudioContext || window.webkitAudioContext);
	var masterGain = audioCtx.createGain();
	var nodes = [];
	masterGain.gain.value = 0.3;
	masterGain.connect(audioCtx.destination);

	function playFrequency (frequency, timeToStart) {
		if (timeToStart == null) timeToStart = 0;
		var oscillator = audioCtx.createOscillator();
		oscillator.type = 'square';
		oscillator.frequency.value = frequency;
		oscillator.connect(masterGain);
		oscillator.start(audioCtx.currentTime + timeToStart);
		nodes.push(oscillator);
		console.log('playFrequency: ' + frequency);
		console.log(nodes);
	}

	function stopFrequency (frequency, timeToStop) {
		if (timeToStop == null) timeToStop = 0;
		//var new_nodes = [];
		for (var i = 0; i < nodes.length; i++) {
			if (Math.round(nodes[i].frequency.value) === Math.round(frequency)) {
				nodes[i].stop(audioCtx.currentTime + timeToStop);
				//nodes[i].disconnect();
				// QUESTION: how to disconnect at a future point? do I need to?
				nodes.splice(i, 1);
			}
			// QUESTION: why was it implemented this way instead of using splice like I did above?
			//else {
				//new_nodes.push(nodes[i]);
			//}
		}
		//nodes = new_nodes;
		console.log('stopFrequency: ' + frequency + ', timeToStop: ' + timeToStop);
		console.log(nodes);
	}

	// **************************** MIDI INPUT *****************************
	var midi, data;
	// request MIDI access
	if (navigator.requestMIDIAccess) {
	    navigator.requestMIDIAccess({
	        sysex: false // this defaults to 'false' and we won't be covering sysex in this article.
	    }).then(onMIDISuccess, onMIDIFailure);
	} else {
	    midiMessages.textContent = "No MIDI support in your browser.";
	}

	// MIDI functions
	function onMIDISuccess(midiAccess) {
	    // when we get a succesful response, run this code
	   midiMessages.textContent = "Successfully connected to MIDI API!";
		console.log('MIDI Access Object', midiAccess);

		// when we get a succesful response, run this code
	    midi = midiAccess; // this is our raw MIDI data, inputs, outputs, and sysex status

	    var inputs = midi.inputs.values();
	    // loop over all available inputs and listen for any MIDI input
	    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
	        // each time there is a midi message call the onMIDIMessage function
	        input.value.onmidimessage = onMIDIMessage;
	    }

	}

	function onMIDIMessage(message) {
		data = message.data; // this gives us our [command/channel, note, velocity] data.
		console.log('MIDI data', data); // MIDI data [144, 63, 73]


		data = event.data,
	    cmd = data[0] >> 4,
	    channel = data[0] & 0xf,
	    type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
	    note = data[1],
	    velocity = data[2];
	    // with pressure and tilt off
	    // note off: 128, cmd: 8
	    // note on: 144, cmd: 9
	    // pressure / tilt on
	    // pressure: 176, cmd 11:
	    // bend: 224, cmd: 14

	    switch (type) {
	        case 144: // noteOn message
				 	midiMessages.textContent = convertMidiToVexFlow(data[1]) + "  |  MIDI: " + data[1];

				 if (!listeningState) {
						// save notes, identify interval and show it!
						//identifyInterval(data[1]);
						 pressedMidiNotes.push(data[1]);


					 	if (quizIndex > 0) {
					 			// make a COPY of the array so I don't modify the original:
								var pressedMidiNotesCopy = pressedMidiNotes.slice();

					 		correctAnswer = checkInput(pressedMidiNotesCopy);
							refreshViewWithInput(pressedMidiNotesCopy);
						} else {
							refreshVexFlowNotes( [ createVexChord(pressedMidiNotes) ] );
						}
				 }

				 	break;

			 case 128: // noteOff message
				if (!listeningState) {
					 var curNoteIndex = pressedMidiNotes.indexOf(data[1]);
					 if (curNoteIndex !== -1) {
						 pressedMidiNotes.splice(curNoteIndex,1);
					 }

					if (quizIndex > 0) {
						// Refresh VexFlow with current reference note (the previous quiz note) and currently pressed notes:
							// make a COPY of the array so I don't modify the original:
							var pressedMidiNotesCopy = pressedMidiNotes.slice();
						refreshViewWithInput(pressedMidiNotesCopy);

						if (correctAnswer) {
							// reset to prevent bugs, lolz:
							correctAnswer = false;
							// only on keyUP, if correct answer, advance to next question:
							runNextQuestion();
						}
					} else {
						refreshVexFlowNotes( [ createVexChord(pressedMidiNotes) ] );
					}

				}
	         break;
	    }
	}

	function onMIDIFailure(e) {
	    // when we get a failed response, run this code
		midiMessages.textContent = "No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e;
	    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
	}


	// *************************** QwertyHancock PIANO!! *******************************
	// qwerty hancock:
	var mykeyboard = new QwertyHancock({
		id: 'piano',
		width: 710,
		height: 80,
		octaves: 5,
		startNote: 'C2',
		whiteNotesColour: 'white',
		blackNotesColour: 'black',
		hoverColour: '#f3e939'
	});
	mykeyboard.keyDown = onScreenKeyboardDown;
	mykeyboard.keyUp = onScreenKeyboardUp;

	function onScreenKeyboardDown (note, frequency) {
		if (!listeningState) {
			var midiNum = convertNoteToMidi( note.slice(0,-1), note.slice(-1) );
			midiMessages.textContent = note.slice(0,-1) + '/' + note.slice(-1) + ' | MIDI: ' + midiNum;

			pressedMidiNotes.push(midiNum);

			console.log('KEY DOWN! midiNum: ' + midiNum);
			console.log(pressedMidiNotes);

			 if (quizIndex > 0) {
					// Refresh VexFlow with current reference note (the previous quiz note) and currently pressed notes:
					// make a COPY of the array so I don't modify the original:
					var pressedMidiNotesCopy = pressedMidiNotes.slice();
				correctAnswer = checkInput(pressedMidiNotesCopy);
				refreshViewWithInput(pressedMidiNotesCopy);
			 } else {
				 refreshVexFlowNotes( [ createVexChord(pressedMidiNotes) ] );
			 }

			// play sound
			playFrequency(frequency);
		}
	}

	function onScreenKeyboardUp (note, frequency) {
		if (!listeningState) {
			var midiNum = convertNoteToMidi( note.slice(0,-1), note.slice(-1) );
			var curNoteIndex = pressedMidiNotes.indexOf(midiNum);

			if (curNoteIndex !== -1) {
				pressedMidiNotes.splice(curNoteIndex,1);
			}

			console.log('KEY UP! midiNum: ' + midiNum);
			console.log(pressedMidiNotes);

			 if (quizIndex > 0) {
				 // Refresh VexFlow with current reference note (the previous quiz note) and currently pressed notes:
				// make a COPY of the array so I don't modify the original:
				var pressedMidiNotesCopy = pressedMidiNotes.slice();
				refreshViewWithInput(pressedMidiNotesCopy);

				if (correctAnswer) {
					// reset to prevent bugs, lolz:
					correctAnswer = false;
					// only on keyUP, if correct answer, advance to next question:
					runNextQuestion();
				}
			 } else {
				 refreshVexFlowNotes( [ createVexChord(pressedMidiNotes) ] );
			 }

			// stop playing sound:
			stopFrequency(frequency);
		}
	}


	// ******************* reusable stuff! *****************


	// ****** Reusable AJAX STUFF *********

	function ready (fn) {
	   if (typeof fn !== 'function') {
		  return;
	   }

	   if (document.readyState === 'complete') {
		  return fn();
	   }

	   document.addEventListener('DOMContentLoaded', fn, false);
	}

	function ajaxRequest (method, url, callback) {
	   var xmlhttp = new XMLHttpRequest();

	   xmlhttp.onreadystatechange = function () {
		  if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
			 callback(xmlhttp.response);
		  }
	   };

	   xmlhttp.open(method, url, true);
	   if (method === 'POST') {
		   xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		   xmlhttp.send( JSON.stringify(sessionStats) );
	   } else {
		   xmlhttp.send();
	   }


	}

	// ******** music stuff ********

	function randomNoteMidi(rangeStart, rangeEnd) {
		// Pick a random MIDI note given MIDI notes, within an inclusive range
		var min = Math.ceil(rangeStart);
		var max = Math.floor(rangeEnd);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}



	function createVexChord(midiNumArray) {
		if (midiNumArray.length === 0) {
			console.log('createVexChord argument array is empty.');
			//return;
		} else {
			var spnArray = [];
			midiNumArray.forEach( function (midiNum) {
				spnArray.push( convertMidiToVexFlow(midiNum) );
			});
			//var noteName = convertMidiToNoteName(midiNum);
			//var sciPitchNotation = convertMidiToVexFlow(midiNum);

			var vexFlowChord = new VF.StaveNote({ keys: spnArray, duration: "q" } );

			spnArray.forEach( function (spn, index) {
				if (spn.indexOf('#') !== -1) {
					vexFlowChord.addAccidental(index, new VF.Accidental('#'));
				}
			});

			console.log('new VF chord object: ');
			console.dir(vexFlowChord);

			return vexFlowChord;
		}

	}

	function styleVexFlowChord (vexFlowChord, styleObject) {
		if (vexFlowChord == null || styleObject == null || vexFlowChord.length === 0) {
			console.log('styleVexFlowChord: null or empty arguments');
			return vexFlowChord;
		}

		return vexFlowChord.setStyle(styleObject);
	}

	// VERSION TO SPECIFY INDIVIDUAL NOTES, NOT WHOLE CHORD:
	function styleVexFlowChordKeys (vexFlowChord, indeces, styleObject) {
		if (vexFlowChord == null || indeces == null || styleObject == null || vexFlowChord.length === 0 || indeces.length === 0) {
			console.log('styleVexFlowChordKeys: No styling happened; null or empty arguments');
			return vexFlowChord;
		}

		indeces.forEach( function (index) {
			// assuming vexFlowChord is always just one chord object:
			vexFlowChord.setKeyStyle(index, styleObject);
		});

		return vexFlowChord;
	}

	// via https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
	function storageAvailable(type) {
		try {
			var storage = window[type],
				x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		}
		catch(e) {
			return false;
		}
	}

	// **************************  QUIZ !  **************************
	function startSession () {
		// initialize game!
		if (quizIndex < 1) {
			toggleListeningState();	// set to true! will set to false when sound finishes playing
			// start the clock for session total time:
			sessionTime = Date.now();
			console.log('SESSION CLOCK STARTED. sessionTime stamp: ' + sessionTime);

			// set first reference note to be in the middle of the note range:
			var refNoteMidi = RANGE_START + Math.round( (RANGE_END - RANGE_START) / 2 );
			quizNotes.push(refNoteMidi);
			sessionStats.refNote = refNoteMidi;
			// generate random notes:
			for (var i = 0; i < SESSION_LENGTH; i++) {
				var randomMidi = randomNoteMidi(RANGE_START, RANGE_END);
				quizNotes.push(randomMidi);
				sessionStats.questions.push( {answer: randomMidi, totalTime: 0, attempts: [] } );
			}
			console.log('Generated random notes:');
			console.log(quizNotes);

			console.log("%c pushed questions to SessionStats: " + JSON.stringify( sessionStats), "color: blue;" );

			// hide start button
			mainButton.style.display = 'none';

			var firstRefNote = quizNotes[quizIndex];

			// update instructions
			messageBox.innerHTML = '<strong>Reference note:</strong> '  + convertMidiToVexFlow(firstRefNote) + '<br><br>   ';

			// update VexFlow
			refreshVexFlowNotes( [createVexChord([firstRefNote])] );

			// play the reference note
			var freq = convertMidiToFrequency(firstRefNote);
			playFrequency(freq, 0);
			stopFrequency(freq, 1);

			// NEXT note:
			quizIndex++;
			var midiNum = quizNotes[quizIndex];
			freq = convertMidiToFrequency(midiNum);
			var noteName = convertMidiToVexFlow(midiNum);

			// After delay, update UI and play next note:
			setTimeout(function() {

				// update instructions
				messageBox.innerHTML += '<span class="next">Next note: ???</span>';

				// start the clock for question and attempt time:
				questionTime = attemptTime = Date.now();
				console.log('QUESTION CLOCK STARTED. questionTime stamp: ' + questionTime + ", attemptTime stamp: " + attemptTime);

				// play the next note
				playFrequency(freq);
				stopFrequency(freq, 1);
				toggleListeningState(1000); // sets to false as sound finishes playing
			}, 2000);



		// CONSOLE LOG ALL THE THINGS!!!!!
		console.log('sessions: ' + JSON.stringify(sessions));
		console.log('pressedMidiNotes: ' + JSON.stringify(pressedMidiNotes));
		console.log('quizNotes: ' + JSON.stringify(quizNotes));
		console.log('quizIndex: ' + JSON.stringify(quizIndex));
		console.log('sessionTime: ' + JSON.stringify(sessionTime));
		console.log('questionTime: ' + JSON.stringify(questionTime));
		console.log('attemptTime: ' + JSON.stringify(attemptTime));
		console.log('correctAnswer: ' + JSON.stringify(correctAnswer));
		console.log('listeningState: ' + JSON.stringify(listeningState));
		console.log('sessionStats: ' + JSON.stringify(sessionStats));


		}
	}


	function runNextQuestion() {
		// next question index
		quizIndex++;
		console.log('runNextQuestion. - - - quizIndex: ' + quizIndex);
		console.log('- - - - - - quiznotes: ' + JSON.stringify(quizNotes));

		// if we already did the last question
		if (quizIndex >= quizNotes.length) {
			console.log('* * * * * * * * * Already did last question!');
			// end the game!
			//setTimeout(function() {
				finishSession();
			//}, 200);
			return;
		}
		console.log(' * * * * * THIS SHOULD NOT RUN AFTER GAME ENDS!!!! * * * * * *');

		toggleListeningState();	// should be TRUE at beginning of each question, then false when sound finishes playing

		var midiNum = quizNotes[quizIndex];
		var freq = convertMidiToFrequency(midiNum);
		var noteName = convertMidiToVexFlow(midiNum);

		// After delay short delay, play next note:
		setTimeout(function() {

			// update instructions
			messageBox.innerHTML = '<strong>Reference note:</strong> '  + convertMidiToVexFlow(quizNotes[quizIndex-1]) + '<br><br>   ' + '<span class="next">Next note: ???</span>';

			// restart the clock for question and attempt time:
			questionTime = attemptTime = Date.now();
			console.log('QUESTION CLOCK STARTED. questionTime stamp: ' + questionTime + ", attemptTime stamp: " + attemptTime);

			// play the next note
			playFrequency(freq);
			stopFrequency(freq, 1);
			toggleListeningState(1000); // should become false as sound finished playing
		}, 2000);

	}

	function finishSession() {
		console.log('finishSession()');
		sessionTime = Date.now() - sessionTime;
		// save sessiontime
		sessionStats.totalTime = sessionTime;

		// add to list of data for all sessions:
		sessions.push(sessionStats);

		console.log('%c Sessions: ' + JSON.stringify(sessions),'color:red');

		ajaxRequest('POST', apiUrl, function () {

			// TODO: send stats data to the server!

			// reset stuff!! (the rest happens in startSession)
			quizIndex = 0;
			quizNotes = [];
			sessionStats = {
				sessionLength: SESSION_LENGTH,
				rangeStart: RANGE_START,
				rangeEnd:RANGE_END,
				refNote: null,
				totalTime: 0,
				questions: []
			};

			// CONSOLE LOG ALL THE THINGS!!!!!
			console.log('sessions: ' + JSON.stringify(sessions));
			console.log('pressedMidiNotes: ' + JSON.stringify(pressedMidiNotes));
			console.log('quizNotes: ' + JSON.stringify(quizNotes));
			console.log('quizIndex: ' + JSON.stringify(quizIndex));
			console.log('sessionTime: ' + JSON.stringify(sessionTime));
			console.log('questionTime: ' + JSON.stringify(questionTime));
			console.log('attemptTime: ' + JSON.stringify(attemptTime));
			console.log('correctAnswer: ' + JSON.stringify(correctAnswer));
			console.log('listeningState: ' + JSON.stringify(listeningState));
			console.log('sessionStats: ' + JSON.stringify(sessionStats));

			// update UI
			messageBox.innerHTML = '<strong>Training session complete!</strong>';
			mainButton.style.display = 'inline-block';
			mainButton.textContent = 'Play Again!';

			// update stats once received from database:
			ajaxRequest('GET', apiUrl, updateStatsView);
		});


	}

	function updateUICorrectAnswer() {
			messageBox.innerHTML = '<strong>Reference note:</strong> '  + convertMidiToVexFlow(quizNotes[quizIndex-1]) + '<br><br>   ' + '<span class="correct">Correct! Listen for the next note... </span>';
	}

	function updateUIIncorrectAnswer() {
			messageBox.innerHTML = '<strong>Reference note:</strong> '  + convertMidiToVexFlow(quizNotes[quizIndex-1]) + '<br><br>   ' + '<span class="incorrect">Try again!</span>';
	}

	// check pressedMidiNotes (global array) for correct answer and refresh VexFlow accordingly
	function checkInput (pressedMidiNotesArray) {
		console.log('checkInput.');

		attemptTime = Date.now() - attemptTime;
		console.log('Saving stats. Attempt time: ' + attemptTime);


		// save to stats! (only if at least 1 note is being pressed)
		if (pressedMidiNotesArray.length > 0) {
			sessionStats.questions[quizIndex-1].attempts.push( {notes: pressedMidiNotesArray, time: attemptTime} );
			console.log("%c Attempt saved to sessionStats: " + JSON.stringify( sessionStats), "color: blue;" );
		}

		// Check if input is correct -- pressing ONE correct key!
		if (pressedMidiNotesArray.length === 1 && pressedMidiNotesArray[0] === quizNotes[quizIndex]) {
			// CORRECT!
			console.log('CORRECT answer!');

			// save total question time to stats
			questionTime = Date.now() - questionTime;
			sessionStats.questions[quizIndex-1].totalTime = questionTime;

			return true;
		} else {
			// WRONG!
				console.log('INCORRECT answer');
			// reset attemptTime to current timestamp, starting next attempt timer:
			attemptTime = Date.now();
			console.log('Restarting attempt timer, reset to: ' + attemptTime);
			return false;
		}
	}

	function refreshViewWithInput (pressedMidiNotesArray) {
		console.log('refreshViewWithInput.');

		// Combine pressed notes with last quiz note as the reference note to display:
		// Keep notes in order of pitch so I can style the right ones:
		var orderedMidiNotes = pressedMidiNotesArray.concat([quizNotes[quizIndex-1]]);
		orderedMidiNotes.sort(function(a, b) {
			return a - b;
		});

		// which notes to style (all except the reference note)
		var indeces = [];
		for (var i = 0; i < orderedMidiNotes.length; i++) {
			if ( i !== orderedMidiNotes.indexOf( quizNotes[quizIndex-1] ) ) {
				indeces.push(i);
			}
		}

		// Generate VexFlow chord object to display: pressed notes AND reference note
		var vexFlowChord = createVexChord(orderedMidiNotes);

		// Check if input is correct -- pressing ONE correct key!
		if (correctAnswer) {
			console.log('Styling for correct answer');
			vexFlowChord = styleVexFlowChordKeys(vexFlowChord, indeces, {fillStyle: 'green'});
			refreshVexFlowNotes([vexFlowChord]);

			// update UI!
			updateUICorrectAnswer();
		} else {
			// WRONG! Style and display!
				console.log('Styling for incorrect answer');
			vexFlowChord = styleVexFlowChordKeys(vexFlowChord, indeces, {fillStyle: 'red'});
			refreshVexFlowNotes([vexFlowChord]);

			// update UI!
			updateUIIncorrectAnswer();
		}
	}

	// helper function for changing game state with a delay (to match when sounds will be done playing):
	function toggleListeningState(milliseconds) {
		setTimeout(function() {
			listeningState = !listeningState;
		}, milliseconds);
	}

	// **************************  Musical interval thingy!!  **************************

	function identifyInterval (previousNote, currentNote) {
		var intervalMap = [
			'Perfect Unison',	// 0
			'Minor Second',		// 1
			'Major Second',		// 2
			'Minor Third',		// 3
			'Major Third',		// 4
			'Perfect Fourth',	// 5
			'Tritone',			// 6
			'Perfect Fifth',	// 7
			'Minor Sixth',		// 8
			'Major Sixth',		// 9
			'Minor Seventh',	// 10
			'Major Seventh',	// 11
			'Perfect Octave',	// 12
		];

			// Identify interval
			var intervalSemitones = Math.abs(currentNote - previousNote);
			var intervalIndex;

			// should be "octave" if no remainder, EXCEPT if interval is 0:
			if (intervalSemitones === 0) {
				intervalIndex = 0;
			} else if (intervalSemitones % 12 === 0) {
				intervalIndex = 12;
			} else {
				intervalIndex = intervalSemitones % 12;
			}

			var intervalName = intervalMap[intervalIndex];
			var intervalSemitonesString = '<strong>' + intervalSemitones + ':</strong> ';

			if (intervalSemitones > 12 && intervalSemitones % 12 !== 0) {
				intervalName = 'Compound ' + intervalName;
				intervalSemitonesString = '<strong>' + intervalSemitones + '</strong> (' + 12*Math.floor(intervalSemitones/12) + ' + <strong>' + (intervalSemitones % 12) + '</strong>):</strong> ';
			}

			return intervalSemitonesString + intervalName;
	}




	// ******************************  Manipulating notes  ************************
		// all based on MIDI input:
	function getInterval(midiNum, interval) {
		return midiNum + interval;
	}

	function getOctaveUp(midiNum) {
		return midiNum + 12;
	}

	function getOctaveDown(midiNum) {
		return midiNum - 12;
	}

	// ********** MIDI to note conversion *********

	function convertMidiToFrequency(midiNum) {
	  // midi # 69 = 440 Hz
		var HZBASE = 440;
		var MIDIBASE = midiNum - 69;

		return HZBASE * Math.pow(2, (MIDIBASE/12) );
	}

	function convertMidiToNoteName(midiNum) {
	  // 12 semitones, numbered 0 - 11, C=0
	  var noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
	  var index = Math.floor(midiNum % 12);
	  return noteNames[index];
	}

	function convertNoteToMidi(noteName, octave) {
		var octave = parseInt(octave, 10);

		// default to 4 if there's an error:
		if (isNaN(octave)) {
			octave = 4;
		}
		// 12 semitones, numbered 0 - 11, C=0
		var noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
		var noteIndex = noteNames.indexOf(noteName.toUpperCase());

		// default to C if there's an error:
		if (noteIndex === -1) {
			noteIndex = 0;
		}

		var octaveBase = octave + 1;
		return octaveBase * 12 + noteIndex;
		// example: A4 >>>  4 + 1 = 5.  5 * 12 = 60.  60 + noteIndex (which is 9) = 69 for A4
	}

	function convertMidiToOctave(midiNum) {
	    /* Octaves:
	    0 = C/-1
	    12 = C/0
	    24 = C/1
	    36 = C/2
	    48 = C/3
	    60 = C/4
	    72 = C/5
	    84 = C/6
	    ...
	    */

	  // if C/0 is MIDI #12, subtract 12:
	  var midiBase = midiNum - 12;
	  return Math.floor(midiBase / 12);
	}

	function convertMidiToVexFlow(midiNum) {
	  return convertMidiToNoteName(midiNum) + '/' + convertMidiToOctave(midiNum);
	}

})();
