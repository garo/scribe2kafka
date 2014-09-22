var thrift = require('thrift');
var scribe = require('./gen-nodejs/scribe');
var scribe_types = require('./gen-nodejs/scribe_types');
var connection = thrift.createConnection("localhost", 1463);
var client = thrift.createClient(scribe, connection);

queue = [];
queue.push(new scribe_types.LogEntry({
	category : "test-queue2",
	message : "msg-a"
}));

queue.push(new scribe_types.LogEntry({
	category : "test-queue2",
	message : "msg-b"
}));

queue.push(new scribe_types.LogEntry({
	category : "test-queue",
	message : "msg-c"
}));


client.Log(queue, function (err, resultCode) {
	console.log("Flushed", queue.length, "messages. resultCode:", resultCode);
	connection.end();
	process.exit();
});

