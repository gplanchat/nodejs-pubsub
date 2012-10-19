/**
 *
 * @type {*}
 */
var events = require('events');
var util = require('util');
var redis = require('redis');

var EventEmitter = events.EventEmitter;

module.exports = PubSub;

/**
 * @param backend
 * @constructor
 */
function PubSub(backend) {
    EventEmitter.call(this);

    if (typeof backend === 'string' && typeof PubSub.backend[backend] === 'function') {
        console.log('Creating new instance of backend ' + backend);
        var backendType = PubSub.backend[backend];
        this.backend = new backendType();
    } else {
        console.log('Assinging instance of backend.');
        this.backend = backend || null;
    }

    backend.register(this);
}

util.inherits(PubSub, EventEmitter);

/**
 * @type {Object}
 */
PubSub.backend = {
    abstract: PubSubBackend,
    loop:     PubSubBackend_Looping,
    redis:    PubSubBackend_Redis
};

/**
 * @param channel
 * @return {*}
 */
PubSub.prototype.subscribe = function(channel) {
    this.backend.subscribe(channel);

    return this;
};

/**
 * @param channel
 * @param message
 */
PubSub.prototype.publish = function(channel, message) {
    this.backend.publish(channel, message);
};

/**
 * @constructor
 */
function PubSubBackend() {
    EventEmitter.call(this);
}

util.inherits(PubSubBackend, EventEmitter);

/**
 * @param options
 * @return {*}
 */
PubSubBackend.prototype.setPub = function(options) {
    return this;
};

/**
 * @param options
 * @return {*}
 */
PubSubBackend.prototype.setSub = function(options) {
    return this;
};

/**
 * @param channel
 * @return {*}
 */
PubSubBackend.prototype.subscribe = function(channel) {
    return this;
};

/**
 * @param channel
 * @param message
 * @return {*}
 */
PubSubBackend.prototype.publish = function(channel, message) {
    return this;
};

/**
 * @param frontend
 * @return {*}
 */
PubSubBackend.prototype.register = function(frontend) {
    this.frontend = frontend;

    return this;
};

/**
 * @constructor
 */
function PubSubBackend_Looping() {
    PubSubBackend.call(this);

    this._channels = [];
}

util.inherits(PubSubBackend_Looping, PubSubBackend);

/**
 * @param channel
 * @return {*}
 */
PubSubBackend_Looping.prototype.subscribe = function(channel) {
    PubSubBackend.prototype.subscribe.call(this, channel);

    this._channels.push(channel);

    return this;
};

/**
 * @param channel
 * @param message
 * @return {*}
 */
PubSubBackend_Looping.prototype.publish = function(channel, message) {
    PubSubBackend.prototype.publish.call(this, channel, message);

    var looping = this;
    this._channels.forEach(function(element){
        if (element == channel) {
            looping.frontend.emit('message', channel, message);
        }
    });

    return this;
};

/**
 * @constructor
 */
function PubSubBackend_Redis() {
    PubSubBackend.call(this);

    this._pub = null;
    this._sub = null;
}

util.inherits(PubSubBackend_Redis, PubSubBackend);

/**
 * @param server
 * @param port
 * @param options
 * @return {*}
 */
PubSubBackend_Redis.prototype.setPub = function(server, port, options) {
    PubSubBackend.prototype.setPub.call(this, options);

    if (arguments.length == 1 && typeof server != 'string') {
        this._pub = server;
    } else {
        this._pub = redis.createClient(port, server, options);
    }

    this._pub.backend = this;

    return this;
};

/**
 * @param server
 * @param port
 * @param options
 * @return {*}
 */
PubSubBackend_Redis.prototype.setSub = function(server, port, options) {
    PubSubBackend.prototype.setSub.call(this, options);

    if (arguments.length == 1 && typeof server != 'string') {
        this._sub = server;
    } else {
        this._sub = redis.createClient(port, server, options);
    }

    this._sub.backend = this;

    this._sub.on('message', function(channel, data) {
        this.backend.emit('message', channel, data);
    });

    return this;
};

/**
 * @param channel
 * @return {*}
 */
PubSubBackend_Redis.prototype.subscribe = function(channel) {
    PubSubBackend.prototype.subscribe.call(this, channel);

    this._sub.subscribe(channel);

    return this;
};

/**
 * @param channel
 * @param message
 * @return {*}
 */
PubSubBackend_Redis.prototype.publish = function(channel, message) {
    PubSubBackend.prototype.publish.call(this, channel, message);

    this._pub.publish(channel, message);

    return this;
};

/**
 * @param frontend
 * @return {*}
 */
PubSubBackend_Redis.prototype.register = function(frontend) {
    PubSubBackend.prototype.register.call(this, frontend);

    this._pub.frontend = frontend;
    this._sub.frontend = frontend;

    console.log('Registereing frontend...');

    this._sub.on('message', function(channel, data) {
        this.frontend.emit('message', channel, data);
    });

    return this;
};
