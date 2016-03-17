/*
 * Copyright (c) 2016.
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * globals require, module
 */
/**
 * @module app/Kernel
 * @param {object} context
 * @property {string} context.functionName
 * @property {function} context.succeed
 * @property {function} context.fail
 * @param {object} event
 * @property {string} event.getdata
 * @property {string} event.postdata
 * @class
 */
function Kernel(context, event) {
    this.kernelInfo = {
        "name"   : "Mesa",
        "version": 1
    };

    this.context = context;
    this.event   = event;

    this.mapValues = {
        "kernel" : this,
        "context": context,
        "event"  : event
    };

    this.loadServices();
    this.addService("queryString", "qs");
    var queryString = this.getService("queryString");
    var winston = require('winston');

    var loggerArguments = [
        {
            transports: [
                new (winston.transports.Console)({
                    timestamp: function() {
                        return Date.now();
                    },
                    formatter: function(options) {
                        return '[' + options.level.toUpperCase() + '] ' + (undefined !== options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '' );
                    }
                })
            ]
        }
    ];

    var loggerCommands = [
        {
            "name"     : "setLevels",
            "arguments": [winston.config.syslog.levels]
        }
    ];

    this.addService("logger", "winston.Logger", loggerArguments, loggerCommands);
    this.logger = this.getService("logger");

    //Since the Kernel Masquerades as context, we need to copy just it's variables to it, functions have been mapped to the context object.
    for (var attr in JSON.parse(JSON.stringify(context))) {
        if (context.hasOwnProperty(attr)) {
            this[attr] = context[attr];
        }
    }

    this.request = {
        "get" : "",
        "post": "",

        "all" : function() {
            var data   = [(this.get) ? JSON.stringify(this.get).trim() : '', (this.post) ? JSON.stringify(this.post).trim() : ''];
            var result = data.filter(Boolean).join('|').replace("}|{", ",");
            return (result) ? JSON.parse(result) : false;
        }
    };

    this.request.get  = (typeof event.getdata !== 'undefined' && event.getdata.trim() !== '') ? queryString.parse(event.getdata) : false;
    this.request.post = (typeof event.postdata !== 'undefined' && event.postdata.trim() !== '') ? queryString.parse(event.postdata) : false;

    /*
     We try to grab the stage from event stage then from the function name, if those fail we set to DEFAULT.
     */
    var nameArray     = (0 <= context.functionName.indexOf('-')) ? context.functionName.split('-') : [
        context.functionName, 'DEFAULT'
    ];
    var stage         = (typeof event.stage !== 'undefined') ? event.stage.split('-')[0] : nameArray[1];
    this.functionName = nameArray[0];
    this.loadStage(stage);

}

Kernel.prototype.returnResult = 'SUCCESS';

/**
 * @function loadStage
 * Set the stage and load the config based on the stage
 * @param {string} stage
 */
Kernel.prototype.loadStage = function loadStage(stage) {
    this.stage = stage.toUpperCase();
    var path   = String('../etc/stages/' + this.stage)
        .replace('/DEFAULT', '');
    try {
        this.config = require(path);
    } catch (err) {
        this.config = {};
        this.log(String(err)
                     .replace('Error: ', '') + " Code: " + err.code, ('DEFAULT' == stage) ? 'warning' : 'error');
    }
    if ('DEFAULT' == stage && 'undefined' !== typeof this.config.stage && 'DEFAULT' !== this.config.stage) {
        this.loadStage(this.config.stage);
    } else {
        this.config.succeedFails = (typeof this.config.succeedFails !== 'undefined') ? this.config.succeedFails : false;
        var logLevel             = this.config.logLevel || 'error';
        this.setLogLevel(logLevel);
        this.log('Set stage to: ' + this.stage);
    }
};

Kernel.prototype.loadServices = function loadServices() {
    this.services = require('../etc/services');
};

Kernel.prototype.traverse = function traverse(object, key) {
    var keyArray = (Array.isArray(key)) ? key : key.split('.');
    return keyArray.reduce(function(object, key) {
        return object[key] || false;
    }, object)
};

Kernel.prototype.getVariable = function getVariable(value) {
    if("string" == typeof value) {
        var valArray = value.split('%');
        for (var i = 1; i <= Math.floor(valArray.length / 2) * 2; i += 2) {
            var returnValue = false;
            var key         = valArray[i];
            returnValue     = (this.traverse(this.config, key)) ? this.traverse(this.config, key) : returnValue;
            returnValue     = (this.traverse(this.mapValues, key)) ? this.traverse(this.mapValues, key) : returnValue;
            returnValue     = (this.services[key]) ? this.getService(key) : returnValue;
            value           = (returnValue) ? returnValue : value;
        }
    }

    return value;
};
/**
 *
 * @param {string} serviceName
 * @param {string} servicePath
 * @param {Array} [serviceArguments]
 * @param {Array} [serviceCommands]
 */
Kernel.prototype.addService = function addService(serviceName, servicePath, serviceArguments, serviceCommands) {
    serviceName      = serviceName || false;
    servicePath      = servicePath || false;
    serviceArguments = serviceArguments || [];
    serviceCommands  = serviceCommands || [];
    // && "undefined" == typeof this.services[serviceName]
    if (serviceName && servicePath) {
        this.services[serviceName] = {
            "path"     : servicePath,
            "arguments": serviceArguments,
            "commands" : serviceCommands
        };
    }
};

Kernel.prototype.getService = function getService(serviceName) {
    var path      = ('undefined' !== typeof this.services[serviceName]) ? (((0 == this.services[serviceName].path.indexOf("/")) ? '..' : '' ) + this.services[serviceName].path ): serviceName;
    var nested    = (path.indexOf(".") > 0) ? path.split(".") : [];
    var service   = (nested.length > 0) ? this.traverse(require(nested.shift()), nested) : require(path);
    var arguments = this.services[serviceName].arguments || [];
    var commands  = this.services[serviceName].commands || [];
    var instance  =  ('function' !== typeof service) ?  service : Object.create(service.prototype);

    var argumentFilter = function(array) {
        return array.map(function(value) {
            return this.getVariable(value);
        }, this);
    }.bind(this);

    if (arguments.length > 0) {
        service.apply(instance, argumentFilter(arguments))
    }

    if (commands.length > 0) {
        commands.map(function(value) {
            switch (typeof value) {
                case "object":
                    var func = instance[value["name"]];
                    if (value["arguments"].length > 0) {
                        func.apply(instance, argumentFilter(value["arguments"]));
                    } else {
                        instance[value["name"]]();
                    }
                    break;
                case "string":
                    instance[value]();
                    break;
                case "default":
                    this.log("Unknown Command Definition: Expecting String(\"Function Name\") or Object({\"name\":\"Function Name\", \"arguments\":[<<Function Arguments>>]}).", "alert");
            }
        }, this);
    }

    return instance;
};

/**
 * Set the log level
 * @param {string} level
 */
Kernel.prototype.setLogLevel = function setLogLevel(level) {
    level = level.toLowerCase();
    if (typeof this.logger.levels[level] == "undefined") {
        this.logger.error("No such Log Level: " + level);
    } else {
        this.config.logLevel = level;
        this.logger.level    = this.config.logLevel;
    }
};

/**
 * @param {string} message
 * @param {string} [level]
 */
Kernel.prototype.log = function log(message, level) {
    level = level || 'info';
    level = level.toLowerCase();
    if (typeof this.logger.levels[level] == "undefined") {
        message = "No such Log Level: " + level;
        level   = 'error';
    }

    if (typeof message === 'object') {
        message = JSON.stringify(message);
    }
    this.logger.log(level, message);
};

/**
 * Overrides existing setting. Tells error handler whether or not to context.succeed failures.
 * @param {boolean} succeedFails
 */
Kernel.prototype.setSucceedFails = function setSucceedFails(succeedFails) {
    this.config.succeedFails = succeedFails;
};

/**
 *
 * @param {(string|object)} [err]
 * @param {(string|object)} [result]
 */
Kernel.prototype.done = function done(err, result) {
    var isSuccess     = true;
    var logLevel      = 'debug';
    this.returnResult = result || this.returnResult;

    if (err) {
        if (typeof err === 'object') {
            err = err.stack + JSON.stringify(err);
        }
        this.returnResult = err;
        logLevel          = 'crit';
        isSuccess         = false;
    }

    this.log(this.returnResult, logLevel);
    //context.fail forces lambda to try 2 or 3 more times.
    //if succeedFails is true, we go ahead and succeed and handle the failure elsewhere.
    if (this.config.succeedFails || isSuccess) {
        this.context.succeed(this.returnResult);
    } else {
        this.context.fail(this.returnResult);
    }
};

/**
 *
 * @param {(string|object)} [result]
 */
Kernel.prototype.succeed = function succeed(result) {
    this.done(false, result);
};

/**
 *
 * @param {(string|object)} [err]
 */
Kernel.prototype.fail = function fail(err) {
    this.done(err);
};

Kernel.prototype.getRemainingTimeInMillis = function getRemainingTimeInMillis() {
    return this.context.getRemainingTimeInMillis();
};

Kernel.prototype.getRemainingTimeInSecs = function getRemainingTimeInSecs() {
    return Math.floor(this.context.getRemainingTimeInMillis() / 1000);
};

module.exports               = Kernel;