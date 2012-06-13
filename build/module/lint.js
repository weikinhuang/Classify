var fs = require("fs");
var jshint = require("../vendor/jshint/jshint").JSHINT;

var lint = function(build, src) {
	// run the linter
	jshint(src, build.getOption("lint.options"));
	return {
		data : jshint.data(),
		errors : jshint.errors || []
	};
};

var output = function(build, data) {
	if (data.errors.length > 0) {
		data.errors.forEach(function(e) {
			if (!e) {
				return;
			}
			build.printLine("    Problem at line " + e.line + ":" + (e.character === true ? "EOL" : e.character) + ": " + build.color(e.reason, 160));
			build.printLine("        " + (e.evidence || "").replace(/\t/g, " ").trim());
		});
		return;
	}
	build.printLine(build.color("\u2714 ", 34) + "Code linting passed!");
	if (data.data.globals && data.data.globals.length > 0) {
		build.printLine("Globals: \x1B[38;5;33m" + data.data.globals.join("\x1B[0m, \x1B[38;5;33m") + "\x1B[0m");
	}
	if (data.data.unused) {
		data.data.unused.forEach(function(e, i) {
			var msg = "";
			msg += (i === 0 ? "Unused variable: " : "             ");
			msg += "\"" + build.color(e.name, 73) + "\" at line " + e.line + " in " + e["function"];
			build.printLine(msg);
		});
	}
};

module.exports = function(build, callback) {
	build.printHeader(build.color("Checking code quality with JsHint...", "bold"));

	// if we want to lint on a per file basis
	if (build.getOption("lint.perFile") === true) {
		var passed = true;
		build.src.some(function(file) {
			var src = fs.readFileSync(build.dir.src + "/" + file, "utf8");
			var data = lint(build, src);
			build.printLine("Linting file: " + build.color(file, "bold"));
			output(build, data);
			if (data.errors.length > 0) {
				callback({
					error : new Error(jshint.errors.length + " Linting error(s) found.")
				});
				passed = false;
				return false;
			}
		});
		if(passed) {
			callback();
		}
	} else {
		build.getSource(function(src) {
			var data = lint(build, src);
			output(build, data);
			if (data.errors.length > 0) {
				return callback({
					error : new Error(jshint.errors.length + " Linting error(s) found.")
				});
			}
			callback();
		});
	}
};
