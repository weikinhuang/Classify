// include the fs mmodule
var fs = require("fs");

module.exports = function(build, callback) {
	build.printHeader(build.color("Cleaning up the distribution directory...", "bold"));
	try {
		// delete contents of directory
		fs.readdirSync(build.dir.dist).forEach(function(file) {
			fs.unlinkSync(build.dir.dist + "/" + file);
		});
	} catch (e) {
		return callback({
			error : e
		});
	}
	try {
		// create the dist dir for next iteration
		fs.mkdir(build.dir.dist);
	} catch (e) {
		return callback({
			error : e
		});
	}
	callback();
};
