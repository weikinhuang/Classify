// include the fs mmodule
var fs = require("fs");

module.exports = function(build, callback) {
	build.printHeader(build.color("Minifying source file with UglifyJs...", "bold"));
	build.getSource(function(src) {
		build.getMinifiedSource(function(min) {
			build.getCopyright(function(copyright) {
				try {
					fs.writeFile(build.dir.dist + "/" + build.name + ".min.js", copyright + ";" + min + ";", "utf8", function(error) {
						if (error) {
							return callback({
								error : error
							});
						}

						var length = src.length;
						var minLength = min.length;
						var savingPercentage = ((length - minLength) / length * 100).toFixed(2);
						build.printLine("Saved " + (length - minLength) + " bytes (" + savingPercentage + "%).");
						return callback();
					});
				} catch (e) {
					return callback({
						error : e
					});
				}
			});
		});
	});
};
