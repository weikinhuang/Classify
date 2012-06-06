// include the fs mmodule
var fs = require("fs");

module.exports = function(build, callback) {
	build.printHeader(build.color("Generating Code Coverage Report...", "bold"));

	build.readCacheFile("coverage", function(data) {
		data = data || [];
		if (data.length === 0) {
			return callback({
				error : new Error("Code Coverage reports not yet generated!")
			});
		}
		data.forEach(function(msg) {
			build.printLine(msg);
		});
		callback();
	});
};
