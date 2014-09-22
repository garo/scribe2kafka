var thrift = require('thrift');
var scribe = require('./gen-nodejs/scribe');
var ttypes = require('./gen-nodejs/scribe_types');
var kafka = require('kafka-node');
var optimist = require('optimist')
  .usage('Start listening on scribed tcp feed and sends it to kafka found with --zookeepers argument')
  .demand(['zookeepers'])
  .default('port', 1463)
  .default('statsd-port', 8125)
  .default('statsd-prefix', "scribe2kafka")
  .default('retries', 10)
  .default('client-id', "scribe2kafka")
  .default('verbose', false)
  .describe('zookeepers', 'Zookeepers connection string')
  .describe('port', 'Port where to listen for incoming scribed tcp messages')
  .describe('retries', 'Kafka retry n times')
  .describe('client-id', 'Kafka client-id')  
  .describe('statsd-host', 'Optional statsd host where to send statsd statistics via udp')
  .describe('statsd-port', 'port of statsd server')
  .describe('statsd-prefix', 'statsd prefix')
  .describe('verbose', 'verbose output (only for debugging)')

var argv = optimist.argv;

var connectionString = argv.zookeepers;

var client = new kafka.Client(connectionString, argv["client-id"], { retries : argv.retries });
var producer = new kafka.HighLevelProducer(client);

var statsdClient = new require('statsd-client');
var statsd = null;
if (argv["statsd-host"]) {
  statsd = (new statsdClient({host: argv["statsd-host"], prefix: argv["statsd-prefix"], port:argv["statsd-port"]}));
}


var createServer = exports.createServer = function() {
var server = thrift.createServer(scribe, {
    Log: function(entry, callback) {
      if (argv.verbose) {
        console.log("Got scribed message:", entry);
      }
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
        if (statsd) {
          statsd.increment('scribe.' + t, topics[t].length);
        }
      }


      producer.send(payloads, function (err, data) {
        if (argv.verbose) {
          console.log("Kafka responded:", data, "err:", err);
        }

        if (err) {
          console.log("Kafka sent. err:", err, "data:", data);
          if (statsd) {
            statsd.increment('error-to.' + t);
          }
        }
      })

      server.emit('log', entry);
      callback(0);
    }
  });
  return server;
};

if (argv.verbose) {
  console.log("Trying to connect to kafka broker...");
}

producer.on('ready', function() {
  var server = createServer();
  server.listen(argv.port);
  console.log("Started in port", argv.port);

});

