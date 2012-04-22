module.exports = (function(root) {
	// include the fs mmodule
	var fs = require("fs");

	return function(options, source, callback) {
		callback.print("Cleaning up the distribution directory...");
		try {
			// delete contents of directory
			fs.readdirSync(options.dir.dist).forEach(function(file) {
				fs.unlinkSync(options.dir.dist + "/" + file);
			});
		} catch (e) {
			return callback({
				error : e
			});
		}
		try {
			// create the dist dir for next iteration
			fs.mkdir(options.dir.dist);
		} catch (e) {
			return callback({
				error : e
			});
		}
		return callback();
	};
})(global);