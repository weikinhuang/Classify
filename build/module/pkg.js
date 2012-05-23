module.exports = (function(root) {

	// include the fs mmodule
	var fs = require("fs");

	return function(options, source, callback) {
		if(!options.pkg) {
			callback();
			return;
		}

		callback.print("Generation package.json file...");

		var pkgStr = JSON.stringify(options.pkg.desc, true, 4);
		pkgStr = pkgStr.replace(/@VERSION\b/g, options.version);
		pkgStr = pkgStr.replace(/@DATE\b/g, (new Date()).toUTCString());

		fs.writeFile(options.dir.base + "/" + options.pkg.file, pkgStr, "utf-8", function() {
			callback();
		});
	};
})(global);