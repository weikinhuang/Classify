// include the fs mmodule
var fs = require("fs");

module.exports = function(build, callback) {
	build.printHeader(build.color("Checking sizes against previous build...", "bold"));

	build.getSource(function(src) {
		build.getMinifiedSource(function(min) {
			build.getGzippedSource(function(zip) {
				build.readCacheFile("size", function(data) {
					data = data || {};
					var sizes = {};
					sizes[build.name + ".js"] = src.length;
					sizes[build.name + ".min.js"] = min.length;
					sizes[build.name + ".min.js.gz"] = zip.length;

					Object.keys(sizes).forEach(function(key) {
						var diff = data[key] && (sizes[key] - data[key]);
						if (diff > 0) {
							diff = "+" + diff;
						}
						build.printLine(build.lpad(sizes[key], 8) + " " + build.lpad(diff ? "(" + diff + ")" : "(-)", 8) + " " + key);
					});

					build.writeCacheFile("size", sizes, callback);
				});
			});
		});
	});
};