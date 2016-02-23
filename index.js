/* globals require, module */
var Kernel = require('app/Kernel.js');
/**
 *
 * @param event
 * @param context
 */
exports.handler = function(event, context)
{
    var kernel = new Kernel(context, event);
    var functionHandler = require('./src/' + kernel.functionName);
    functionHandler.handler(event, kernel);
};