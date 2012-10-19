nodejs-pubsub
=============

A simple pub/sub handler

## Supported backends

Currently, this pub/sub module handles 2 types of backends:
 - `loop`: A programmatical loop backend, used for in-process messaging.
 - `redis`: This backend uses a redis server for transmitting messages, used for inter-process messaging and messaging through the network.

## Example

Below are examples for using the two backends.

### Using the loop backend

```javascript
var PubSub = require('gplanchat.pubsub');
var PubSubBackend_Looping = PubSub.backend.loop;

var backend = new PubSubBackend_Looping();
var pubsub = new PubSub(backend);

pubsub.on('message', function(channel, message){
    console.log('[' + channel + '] Message: ' + message);
});

pubsub.subscribe('test_channel');

setTimeout(function(){
    pubsub.publish('test_channel', (new Date()).toLocaleTimeString() + ' - This is a test message.');
}, 1500);
```

### Using the redis backend at `127.0.0.1:6379`

```javascript
var PubSub = require('gplanchat.pubsub');
var PubSubBackend_Redis = PubSub.backend.redis;

var backend = new PubSubBackend_Redis();

backend.setPub('127.0.0.1', 6379);
backend.setSub('127.0.0.1', 6379);

var pubsub = new PubSub(backend);

pubsub.on('message', function(channel, message){
    console.log('[' + channel + '] Message: ' + message);
});

pubsub.subscribe('test_channel');

setTimeout(function(){
    pubsub.publish('test_channel', (new Date()).toLocaleTimeString() + ' - This is a test message.');
}, 1500);
```
