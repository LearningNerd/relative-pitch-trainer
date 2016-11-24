var testData = [{"sessionLength":10,"rangeStart":60,"rangeEnd":67,"sessionIntervals":[0,1,2,3,4,5,6,7,8,9,10,11,12],"refNote":64,"totalTime":40244,"questions":[{"answer":62,"totalTime":2539,"attempts":[{"note":63,"time":1732},{"note":62,"time":807}]},{"answer":65,"totalTime":2032,"attempts":[{"note":64,"time":1449},{"note":65,"time":583}]},{"answer":66,"totalTime":1268,"attempts":[{"note":66,"time":1268}]},{"answer":63,"totalTime":1831,"attempts":[{"note":62,"time":1248},{"note":63,"time":583}]},{"answer":67,"totalTime":1329,"attempts":[{"note":67,"time":1329}]},{"answer":65,"totalTime":1844,"attempts":[{"note":66,"time":1284},{"note":65,"time":560}]},{"answer":65,"totalTime":1263,"attempts":[{"note":65,"time":1263}]},{"answer":64,"totalTime":1254,"attempts":[{"note":64,"time":1254}]},{"answer":67,"totalTime":1259,"attempts":[{"note":67,"time":1259}]},{"answer":61,"totalTime":2296,"attempts":[{"note":60,"time":1830},{"note":61,"time":466}]}]},{"sessionLength":10,"rangeStart":60,"rangeEnd":67,"sessionIntervals":[0,1,2,3,4,5,6,7,8,9,10,11,12],"refNote":64,"totalTime":36960,"questions":[{"answer":60,"totalTime":1248,"attempts":[{"note":60,"time":1248}]},{"answer":62,"totalTime":1292,"attempts":[{"note":62,"time":1292}]},{"answer":61,"totalTime":1082,"attempts":[{"note":61,"time":1082}]},{"answer":65,"totalTime":1363,"attempts":[{"note":65,"time":1363}]},{"answer":60,"totalTime":2209,"attempts":[{"note":61,"time":1277},{"note":62,"time":482},{"note":60,"time":449}]},{"answer":63,"totalTime":1300,"attempts":[{"note":63,"time":1300}]},{"answer":60,"totalTime":1226,"attempts":[{"note":60,"time":1226}]},{"answer":65,"totalTime":1330,"attempts":[{"note":65,"time":1330}]},{"answer":62,"totalTime":2231,"attempts":[{"note":63,"time":1314},{"note":64,"time":506},{"note":62,"time":411}]},{"answer":67,"totalTime":1287,"attempts":[{"note":67,"time":1287}]}]},{"sessionLength":10,"rangeStart":60,"rangeEnd":67,"sessionIntervals":null,"refNote":64,"totalTime":39375,"questions":[{"answer":67,"totalTime":1493,"attempts":[{"note":67,"time":1493}]},{"answer":62,"totalTime":1811,"attempts":[{"note":60,"time":1283},{"note":62,"time":528}]},{"answer":66,"totalTime":1890,"attempts":[{"note":65,"time":1441},{"note":66,"time":449}]},{"answer":63,"totalTime":2109,"attempts":[{"note":64,"time":1262},{"note":63,"time":846}]},{"answer":60,"totalTime":1308,"attempts":[{"note":60,"time":1308}]},{"answer":61,"totalTime":1307,"attempts":[{"note":61,"time":1307}]},{"answer":65,"totalTime":1276,"attempts":[{"note":65,"time":1276}]},{"answer":67,"totalTime":1339,"attempts":[{"note":67,"time":1339}]},{"answer":67,"totalTime":1496,"attempts":[{"note":67,"time":1496}]},{"answer":61,"totalTime":2669,"attempts":[{"note":60,"time":1262},{"note":62,"time":606},{"note":61,"time":800}]}]}];

// Average time per question (including all attempts, until getting correct note):
var avgTimePerQuestion =
testData.reduce( function(a, b){
	return a.concat(b.questions);
}, []).reduce(function(prev, curr, i, arr){
	return prev + (curr.totalTime / arr.length);
},0);

// Average number of attempts per question:
var avgAttemptsPerQuestion =
testData.reduce( function(a, b){
	return a.concat(b.questions);
}, []).reduce(function(prev, curr, i, arr){
	return prev + (curr.attempts.length / arr.length);
},0);

// Average time per attempt:
var avgTimePerAttempt =
testData.reduce( function(a, b){
	return a.concat(
		b.questions.reduce( function(a, b){
			return a.concat(b.attempts);
		}, [])
	);
}, []).reduce(function(prev, curr, i, arr){
	return prev + (curr.time / arr.length);
},0);


// Average offset of each attempt from the correct note:
var avgAttemptOffset =
testData.reduce( function(a, b){
	return a.concat(
		b.questions.reduce( function(a, b){
			return a.concat(
				b.attempts.map(function(attempt){
					return {answer: b.answer, note: attempt.note };
				})
			);
		}, [])
	);
}, []).reduce(function(prev,curr,i,arr){
	var delta = curr.answer - curr.note;
	return prev + (delta / arr.length);
}, 0);
