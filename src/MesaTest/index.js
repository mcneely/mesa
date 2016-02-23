/**
 * Sample for Demoing
 *
 * @param event
 * @param context
 */
exports.handler = function(event, context) {
    if(typeof context.kernelVersion !=="undefined") {
        context.setLogLevel('debug');
        var service = context.getService("sampleService");
        context.log(service.test("bar"));
        context.log(event);
        context.log(context.request.all());
        context.log(context.getRemainingTimeInMillis(), 'debug');
        context.log(context.getRemainingTimeInSecs(), 'info');
        context.log("test", 'crit');
        context.setSucceedFails(true);
    }
    context.fail("Done.");
};