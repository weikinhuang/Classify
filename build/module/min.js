module.exports = (function(root) {

	// include the fs mmodule
	var fs = require("fs");

	return function(options, source, callback) {
		callback.print("Minifying source file with UglifyJs...");
		try {
			fs.writeFile(options.dir.dist + "/" + options.name + ".min.js", source.copyright + ";" + source.minSource, "utf-8", function(error) {
				if (error) {
					return callback({
						error : error
					});
				}
				var length = source.source.length;
				var minLength = source.minSource.length;
				var savingPercentage = ((length - minLength) / length * 100).toFixed(2);
				callback.log("Saved " + (length - minLength) + " bytes (" + savingPercentage + "%).");
				return callback();
			});
		} catch (e) {
			return callback({
				error : e
			});
		}
	};
})(global);