var testData = [{"sessionLength":10,"rangeStart":60,"rangeEnd":67,"sessionIntervals":[0,1,2,3,4,5,6,7,8,9,10,11,12],"refNote":64,"totalTime":40244,"questions":[{"answer":62,"totalTime":2539,"attempts":[{"notes":[63],"time":1732},{"notes":[62],"time":807}]},{"answer":65,"totalTime":2032,"attempts":[{"notes":[64],"time":1449},{"notes":[65],"time":583}]},{"answer":66,"totalTime":1268,"attempts":[{"notes":[66],"time":1268}]},{"answer":63,"totalTime":1831,"attempts":[{"notes":[62],"time":1248},{"notes":[63],"time":583}]},{"answer":67,"totalTime":1329,"attempts":[{"notes":[67],"time":1329}]},{"answer":65,"totalTime":1844,"attempts":[{"notes":[66],"time":1284},{"notes":[65],"time":560}]},{"answer":65,"totalTime":1263,"attempts":[{"notes":[65],"time":1263}]},{"answer":64,"totalTime":1254,"attempts":[{"notes":[64],"time":1254}]},{"answer":67,"totalTime":1259,"attempts":[{"notes":[67],"time":1259}]},{"answer":61,"totalTime":2296,"attempts":[{"notes":[60],"time":1830},{"notes":[61],"time":466}]}]},{"sessionLength":10,"rangeStart":60,"rangeEnd":67,"sessionIntervals":[0,1,2,3,4,5,6,7,8,9,10,11,12],"refNote":64,"totalTime":36960,"questions":[{"answer":60,"totalTime":1248,"attempts":[{"notes":[60],"time":1248}]},{"answer":62,"totalTime":1292,"attempts":[{"notes":[62],"time":1292}]},{"answer":61,"totalTime":1082,"attempts":[{"notes":[61],"time":1082}]},{"answer":65,"totalTime":1363,"attempts":[{"notes":[65],"time":1363}]},{"answer":60,"totalTime":2209,"attempts":[{"notes":[61],"time":1277},{"notes":[62],"time":482},{"notes":[60],"time":449}]},{"answer":63,"totalTime":1300,"attempts":[{"notes":[63],"time":1300}]},{"answer":60,"totalTime":1226,"attempts":[{"notes":[60],"time":1226}]},{"answer":65,"totalTime":1330,"attempts":[{"notes":[65],"time":1330}]},{"answer":62,"totalTime":2231,"attempts":[{"notes":[63],"time":1314},{"notes":[64],"time":506},{"notes":[62],"time":411}]},{"answer":67,"totalTime":1287,"attempts":[{"notes":[67],"time":1287}]}]},{"sessionLength":10,"rangeStart":60,"rangeEnd":67,"sessionIntervals":null,"refNote":64,"totalTime":39375,"questions":[{"answer":67,"totalTime":1493,"attempts":[{"notes":[67],"time":1493}]},{"answer":62,"totalTime":1811,"attempts":[{"notes":[60],"time":1283},{"notes":[62],"time":528}]},{"answer":66,"totalTime":1890,"attempts":[{"notes":[65],"time":1441},{"notes":[66],"time":449}]},{"answer":63,"totalTime":2109,"attempts":[{"notes":[64],"time":1262},{"notes":[63],"time":846}]},{"answer":60,"totalTime":1308,"attempts":[{"notes":[60],"time":1308}]},{"answer":61,"totalTime":1307,"attempts":[{"notes":[61],"time":1307}]},{"answer":65,"totalTime":1276,"attempts":[{"notes":[65],"time":1276}]},{"answer":67,"totalTime":1339,"attempts":[{"notes":[67],"time":1339}]},{"answer":67,"totalTime":1496,"attempts":[{"notes":[67],"time":1496}]},{"answer":61,"totalTime":2669,"attempts":[{"notes":[60],"time":1262},{"notes":[62],"time":606},{"notes":[61],"time":800}]}]}];

var flattenedQuestions = testData.reduce( function(a, b){
	// console.log('a: ');
	// console.log(a);
	// console.log('a.questions: ');
	// console.log(a.questions);
	// //return a.questions.concat(b.questions);
	// console.log('b: ');
	// console.log(b);
	// console.log('b.questions: ');
	// console.log(b.questions);

	return a.concat(b.questions);
}, []);

console.log('/n/n flattenedQuestions: /n');
console.log(flattenedQuestions);
console.log(JSON.stringify(flattenedQuestions));

// now to get the average of the totalTime for each question object in the array:

var avgTimePerQuestion = flattenedQuestions.reduce(function(prev, curr, i, arr){
	return prev + (curr.totalTime / arr.length);
},0);

console.log('/n/navgTimePerQuestion:');
console.log(avgTimePerQuestion);

var flattenedAttempts = flattenedQuestions.reduce(function(a, b){
	// console.log('a: ');
	// console.log(a);
	// //return a.questions.concat(b.questions);
	// console.log('b: ');
	// console.log(b);
	// console.log('b.attempts: ');
	// console.log(b.attempts);

	return a.concat(b.attempts);
}, []);

console.log('/n/n flattenedAttempts: /n');
console.log(flattenedAttempts);
console.log(JSON.stringify(flattenedAttempts));


var avgTimePerAttempt = flattenedAttempts.reduce(function(prev, curr, i, arr){
	return prev + (curr.time / arr.length);
},0);

console.log('/n/navgTimePerAttempt:');
console.log(avgTimePerAttempt);
