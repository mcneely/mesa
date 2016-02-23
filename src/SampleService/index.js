function SampleService(Kernel) {
    this.kernel = Kernel;
    Kernel.log("Hello from Sample Service!", "debug");
    this.test = function(argument) {
        this.kernel.log("SampleService.test() was called with argument " + argument + "!", "debug");
        return "You Called Test with argument " + argument + "!";
    }
}
module.exports = SampleService;