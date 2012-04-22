module.exports = (function(root) {
	return function(options, source, callback) {
		callback.print("Checking code quality with JsHint...");
		var jshint = require(options.dir.build + "/lib/jshint").JSHINT;

		// run the linter
		jshint(source.source, options.lint || {});

		var data = jshint.data();

		if (jshint.errors.length > 0) {
			jshint.errors.forEach(function(e) {
				if (!e) {
					return;
				}
				callback.log("    Problem at line " + e.line + ":" + (e.character === true ? "EOL" : e.character) + ": \x1B[38;5;160m" + e.reason + "\x1B[0m");
				callback.log("        " + (e.evidence || "").replace(/\t/g, " ").trim());
			});

			return callback({
				error : new Error(jshint.errors.length + " Linting error(s) found.")
			});
		}

		callback.log("\x1B[38;5;34m\u2714 \x1B[0mCode linting passed!");
		if (data.globals && data.globals.length > 0) {
			callback.log("Globals: \x1B[38;5;33m" + data.globals.join("\x1B[0m, \x1B[38;5;33m") + "\x1B[0m");
		}
		if (data.unused) {
			data.unused.forEach(function(e, i) {
				var msg = "";
				msg += (i === 0 ? "Unused variable: " : "             ");
				msg += "\"\x1B[38;5;73m" + e.name + "\x1B[0m\" at line " + e.line + " in " + e["function"];
				callback.log(msg);
			});
		}
		callback();
	};
})(global);