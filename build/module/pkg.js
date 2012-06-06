// include the fs mmodule
var fs = require("fs");

module.exports = function(build, callback) {
	build.printHeader(build.color("Generation package.json file...", "bold"));

	if (!build.options.pkg) {
		callback();
		return;
	}

	var pkgStr = JSON.stringify(build.options.pkg.desc, true, 4);
	pkgStr = pkgStr.replace(/@VERSION\b/g, build.options.version);
	pkgStr = pkgStr.replace(/@DATE\b/g, (new Date()).toUTCString());

	if (build.options.sourceReplace) {
		var replacer = build.options.sourceReplace;
		Object.keys(replacer).forEach(function(key) {
			pkgStr = pkgStr.replace(new RegExp("@" + key + "\\b", "g"), replacer[key]);
		});
	}

	fs.writeFile(build.dir.base + "/" + build.options.pkg.file, pkgStr, "utf8", function() {
		callback();
	});
};
