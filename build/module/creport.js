module.exports = (function(root) {

	// include the fs mmodule
	var fs = require("fs");

	return function(options, source, callback) {
		callback.print("Generating Code Coverage Report...");
		var report;
		try {
			report = JSON.parse(fs.readFileSync(options.dir.build + "/.coveragecache.json", "utf-8"));
		} catch (e) {
			report = [];
		}

		if (report.length === 0) {
			return callback({
				error : new Error("Code Coverage reports not yet generated!")
			});
		}

		report.forEach(function(msg) {
			callback.log(msg);
		});

		callback();
	};
})(global);
