module.exports = function(build, callback) {
	build.printHeader(build.color("Checking code quality with JsHint...", "bold"));

	var jshint = require(build.dir.build + "/vendor/jshint/jshint").JSHINT;

	build.getSource(function(src) {
		// run the linter
		jshint(src, build.options.lint);

		var data = jshint.data();

		if (jshint.errors.length > 0) {
			jshint.errors.forEach(function(e) {
				if (!e) {
					return;
				}
				build.printLine("    Problem at line " + e.line + ":" + (e.character === true ? "EOL" : e.character) + ": " + build.color(e.reason, 160));
				build.printLine("        " + (e.evidence || "").replace(/\t/g, " ").trim());
			});

			return callback({
				error : new Error(jshint.errors.length + " Linting error(s) found.")
			});
		}
		build.printLine(build.color("\u2714 ", 34) + "Code linting passed!");
		if (data.globals && data.globals.length > 0) {
			build.printLine("Globals: \x1B[38;5;33m" + data.globals.join("\x1B[0m, \x1B[38;5;33m") + "\x1B[0m");
		}
		if (data.unused) {
			data.unused.forEach(function(e, i) {
				var msg = "";
				msg += (i === 0 ? "Unused variable: " : "             ");
				msg += "\"" + build.color(e.name, 73) + "\" at line " + e.line + " in " + e["function"];
				build.printLine(msg);
			});
		}
		callback();
	});
};