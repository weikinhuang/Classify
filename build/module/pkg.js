// include the fs mmodule
var fs = require("fs");

module.exports = function(build, callback) {
	build.printHeader(build.color("Generation package.json file...", "bold"));

	if (!build.getOption("pkg")) {
		callback();
		return;
	}

	var pkgStr = JSON.stringify(build.getOption("pkg.desc"), true, 4);
	pkgStr = pkgStr.replace(/@VERSION\b/g, build.version);
	pkgStr = pkgStr.replace(/@DATE\b/g, (new Date()).toUTCString());
	build.replaceTokens.forEach(function(token) {
		pkgStr = pkgStr.replace(new RegExp("@" + token.name + "\\b", "g"), token.value);
	});

	fs.writeFile(build.dir.base + "/" + build.getOption("pkg.file"), pkgStr, "utf8", function() {
		callback();
	});
};
