/*
 * Copyright (c) 2016.
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * globals require, module
 */
var Kernel = require('app/Kernel.js');
/**
 *
 * @param event
 * @param context
 */
exports.handler = function(event, context)
{
    var kernel = new Kernel(context, event);
    var functionHandler = require('./lib/' + kernel.functionName);
    functionHandler.handler(event, kernel);
};