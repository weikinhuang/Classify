var jshint = require("./lib/jshint").JSHINT,
	src = require("fs").readFileSync(process.argv[2], "utf8");

// run the linter
jshint(src, {
	expr : true,
	node : true,
	browser : true
});
var data = jshint.data(), i;

if (jshint.errors.length > 0) {
	console.log(jshint.errors.length + " Error(s) found.");
	jshint.errors.forEach(function(e) {
		if (!e) {
			return;
		}
		console.log("    Problem at line " + e.line + ":" + (e.character === true ? "EOL" : e.character) + ": " + e.reason);
		console.log("        " + (e.evidence || "").replace(/\t/g, " ").trim());
		console.log("");
	});
	
	console.log("JSHint check failed");
	process.exit(1);
} else {
	console.log("JSHint check passed.");
	if(data.globals && data.globals.length > 0) {
		console.log("    Globals: " + data.globals.join(", "));
	}
	if(data.unused) {
		for (i = 0; i < data.unused.length; i++) {
			console.log("    Unused variable: \"" + data.unused[i].name+ "\" at line " + data.unused[i].line + " in " + data.unused[i]["function"]);
		}
	}
}
console.log("");