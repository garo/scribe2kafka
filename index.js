var thrift = require('thrift');
var scribe = require('./gen-nodejs/scribe');
var ttypes = require('./gen-nodejs/scribe_types');
var kafka = require('kafka-node');

var connectionString = "zk-1:2181"

var client = new kafka.Client(connectionString, "scribe2kafka", { retries : 10 });
var producer = new kafka.HighLevelProducer(client);

var statsdClient = new require('statsd-client');
var statsd = (new statsdClient({host: "statsd.applifier.info", prefix: "scribe2kafka", port:8127}));


var createServer = exports.createServer = function() {
var server = thrift.createServer(scribe, {
    Log: function(entry, callback) {
      var topics = {};
      for (var i = 0; i < entry.length; i++) {
        if (topics[entry[i].category] == undefined) {
          topics[entry[i].category] = [];
        }

        topics[entry[i].category].push(entry[i].message);
      }

      var payloads = [];
      for (var t in topics) {
        payloads.push({
          topic : 'scribe.' + t,
          messages : topics[t]
        });
        statsd.increment('scribe.' + t, topics[t].length);
      }


      producer.send(payloads, function (err, data) {
        if (err) {
          console.log("Kafka sent. err:", err, "data:", data);
          statsd.increment('error-to.' + t);
        }
      })

      server.emit('log', entry);
      callback(0);
    }
  });
  return server;
};


producer.on('ready', function() {
  var server = createServer();
  server.listen(1463);
  console.log("Started in port 1463");

});

