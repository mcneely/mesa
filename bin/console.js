#!/usr/bin/env node
//var fs = require("fs");
var cmdArgs = process.argv,
    runner = cmdArgs.shift(),
    script = cmdArgs.shift(),
    command = cmdArgs.shift();

var commands = {
    package: {
        description: "Package Project Files",
        help: "package [stage]",
        command: function (arguments) {
            arguments = arguments || [false];
            var stage = arguments.shift(),
                fs  = require("fs"),
                path = require("path");
        }
    },
    help: {
        command: function(arguments){
            var key = "help";
            if (arguments.length > 0) {
                key = arguments[0];
            }
            console.log(commands[key].help)
        }
    }
};

var mainHelp = "";
Object.keys(commands).forEach(function(key){
    mainHelp += (typeof commands[key].description === "undefined") ? "" : "\r\n" + key + " : " + commands[key].description;
});
commands.help['help'] = mainHelp;

if (typeof commands[command] === "undefined") {
    command = "help";
}
commands[command].command(cmdArgs);

