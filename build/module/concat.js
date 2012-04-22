module.exports = (function(root) {
	// include the fs mmodule
	var fs = require("fs");

	return function(options, source, callback) {
		callback.print("Building the source file from parts...");
		try {
			fs.writeFile(options.dir.dist + "/" + options.name + ".js", source.copyright + "\n" + source.source, "utf-8", function(error) {
				if (error != null) {
					return callback({
						error : error
					});
				}
				return callback();
			});
		} catch (e) {
			return callback({
				error : e
			});
		}
	};
})(global);