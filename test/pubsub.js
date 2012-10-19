
var PubSub = require('../src/pubsub');

var PubSubBackend_Looping = PubSub.backend.loop;
var PubSubBackend_Redis = PubSub.backend.redis;

var redisConfig = {
    port: 6379,
    host: 'localhost'
};

RunTests(InitFrontend, function(){
    return new PubSubBackend_Looping();
}, 0, "Running tests on loop backend.");

RunTests(InitFrontend, function(host, port){
    var backend = new PubSubBackend_Redis();

    backend.setPub(redisConfig.host, redisConfig.port);
    backend.setSub(redisConfig.host, redisConfig.port);

    return backend;
}, 15000, "Running tests on redis backend.");

function InitFrontend(backend){
    var pubsub = new PubSub(backend);

    pubsub.on('message', function(channel, message){
        console.log('[' + channel + '] Message: ' + message);
    });

    pubsub.subscribe('test1');
    pubsub.subscribe('test2');

    return pubsub;
}

function RunTests(pubsubFrontendCallback, pubsubBackendCallback, timeout, info) {

    var count = 0;

    var timers = {};
    var callback = function(){
        console.log('[START] ' + info);

        var pubsub = pubsubFrontendCallback(pubsubBackendCallback());

        timers.a = setInterval(function(){
            pubsub.publish('test1', (new Date()).toLocaleTimeString() + ' - My Test message n°' + (count++) + '!');
        }, 500);

        timers.b = setInterval(function(){
            pubsub.publish('test2', (new Date()).toLocaleTimeString() + ' - My Test message n°' + (count++) + '!');
        }, 1200);

        timers.c = setInterval(function(){
            pubsub.publish('test3', (new Date()).toLocaleTimeString() + ' - My Test message n°' + (count++) + '!');
        }, 0);

        setTimeout(function(){pubsub.subscribe('test3');}, 5000);

        setTimeout(function(){
            clearInterval(timers.a);
            clearInterval(timers.b);
            clearInterval(timers.c);

            console.log('[STOP] ' + info);
        }, 10000);
    };

    setTimeout(callback, timeout);
}
