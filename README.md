scribe2kafka
============

Simple nodejs Scribe (the facebook legacy log collection system) to Kafka proxy.

Features:
 - Work as a Scribed server.
 - Forwards all messages to a Kafka cluster. The Kafka topic name is prefixed with "scribe." string.
 - Can optionally also send real time statistics via udp to a statsd server (github.com/etsy/statsd)

Usage
=====

Type "node index.js" to get list of configuration parameters:

```
Start listening on scribed tcp feed and sends it to kafka found with --zookeepers argument

Options:
  --zookeepers     Zookeepers connection string [required]
  --port           Port where to listen for incoming scribed tcp messages [default: 1463]
  --retries        Kafka retry n times [default: 10]
  --client-id      Kafka client-id [default: "scribe2kafka"]
  --statsd-host    Optional statsd host where to send statsd statistics via udp
  --statsd-port    port of statsd server [default: 8125]
  --statsd-prefix  statsd prefix [default: "scribe2kafka"]
  --verbose        verbose output (only for debugging) [default: false]
```

If you use scribed to store log files into filesystem via a centralized scribed instance you can use this kind of scribed.conf to gradually move scribe feeds to kafka:

```
<store>
  category=default
  type=multi

  # The old primary storage: Store everything in file
  <store0>
    base_filename=data
    fs_type=std
    max_size=2000000000
    rotate_period=hourly
    rotate_hour=0
    rotate_minute=10
    add_newlines=1
    type=file
    file_path=/mnt/scribe_storages
  </store0>

  # Also forward a copy of every message to the scribe2kafka proxy
  <store1>
    type=buffer
    replay_buffer=no
    
    # The primary proxy
    <primary>
      type=network
      remote_host=scribe2kafka-1.company.com
      remote_port=1463
    </primary>

    # Use secondary proxy if the primary fails.
    <secondary>
      type=network
      remote_host=scribe2kafka-2.company.com
      remote_port=1463
    </secondary>
  </store1>
</store>
```
