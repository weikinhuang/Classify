var JSLINT = require("./lib/jslint").JSLINT,
	print = require("sys").print,
	src = require("fs").readFileSync(process.argv[2], "utf8");

//bitwise    true, if bitwise operators should be allowed
//confusion  true, if types can be used inconsistently
//'continue' true, if the continuation statement should be tolerated
//debug      true, if debugger statements should be allowed
//devel      true, if logging should be allowed (console, alert, etc.)
//eqeq       true, if == should be allowed
//es5        true, if ES5 syntax should be allowed
//evil       true, if eval should be allowed
//forin      true, if for in statements need not filter
//newcap     true, if constructor names capitalization is ignored
//nomen      true, if names may have dangling _
//plusplus   true, if increment/decrement should be allowed
//regexp     true, if the . should be allowed in regexp literals
//undef      true, if variables can be declared out of order
//unparam    true, if unused parameters should be tolerated
//safe       true, if use of some browser features should be restricted
//sloppy     true, if the 'use strict'; pragma is optional
//sub        true, if all forms of subscript notation are tolerated
//vars       true, if multiple var statements per function should be allowed
//white      true, if sloppy whitespace is tolerated

//browser    true, if the standard browser globals should be predefined
//node       true, if Node.js globals should be predefined
//rhino      true, if the Rhino environment globals should be predefined
JSLINT(src, {
	bitwise: false,
	confusion: true,
	"continue": false,
	debug: false,
	devel: false,
	eqeq: false,
	es5: false,
	evil: false,
	forin: true,
	maxerr : 100,
	newcap: false,
	nomen: true,
	plusplus: true,
	regexp: false,
	safe: false,
	sloppy: false,
	sub: false,
	undef: false,
	unparam: false,
	vars: true,
	white: true,

	browser : true,
	node : true,
	rhino : true
});

// All of the following are known issues that we think are 'ok'
// (in contradiction with JSLint) more information here:
var ok = {
	"Expected an identifier and instead saw 'undefined' (a reserved word)." : true,
	"Use '===' to compare with 'null'." : true,
	"Use '!==' to compare with 'null'." : true,
	"Expected an assignment or function call and instead saw an expression." : true,
	"Expected a 'break' statement before 'case'." : true,
	"Move the invocation into the parens that contain the function." : true,
	"Use the array literal notation []." : true,
	"Unexpected 'in'. Compare with undefined, or use the hasOwnProperty method instead." : true
};

var e = JSLINT.errors, found = 0, w, d = JSLINT.data();

for ( var i = 0; i < e.length; i++) {
	w = e[i];

	if (!ok[w.reason]) {
		found++;
		print("\n" + w.evidence + "\n");
		print("    Problem at line " + w.line + " character " + w.character + ": " + w.reason);
	}
}

if (found > 0) {
	print("\n" + found + " Error(s) found.\n");
	throw "JSLint check failed";
} else {
	print("JSLint check passed.\n");
	if(d.globals.length > 0) {
		print("    Globals: " + d.globals.join(", ") + "\n");
	}
	for ( var i = 0; i < d.unused.length; i++) {
		print("    Unused variable: \"" + d.unused[i].name+ "\" at line " + d.unused[i].line + " in " + d.unused[i]["function"] + "\n");
	}
}