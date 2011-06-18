var root = __dirname.replace(/\/(build|test)$/, "");
// should change export to module.exports = QUnit
var QUnit = require(root + "/test/qunit/qunit.js").QUnit;

(function() {
	var is_quiet = process.argv[2] == "-q";
	var stop_watch = {
		start_time : null,
		stop_time : null,

		start : function() {
			this.start_time = new Date();
		},

		stop : function() {
			this.stop_time = new Date();
		},

		elapsed_seconds : function() {
			return (this.stop_time.getMilliseconds() - this.start_time.getMilliseconds()) / 1000;
		}
	};

	QUnit.init();
	QUnit.config.blocking = true;
	QUnit.config.autorun = true;
	QUnit.config.updateRate = 0;

	var final_buffer = null;
	var current_test_name = null;
	var current_test_assertions = [];
	var totals = {
		pass : 0,
		fail : 0
	};
	var printAssertion = function(assertion, index, print_divider) {
		if (is_quiet && assertion.result) {
			return;
		}
		console.log("    +-----+ " + (assertion.result ? "Pass" : "Fail") + " " + index + ". " + assertion.message);
		if (typeof assertion.expected !== "undefined") {
			console.log("    |     +----> Expected: " + assertion.expected);
			// if test failed, then we need to output the result
			if (!assertion.result) {
				console.log("    |     +---->   Result: " + assertion.actual);
			}
		}
		if (!print_divider) {
			console.log("    |");
		}
	};

	QUnit.testStart = function(test) {
		current_test_name = test.name;
		current_test_assertions = [];
	};

	QUnit.testDone = function(test) {
		var name = test.name, i, l;
		if (test.failed > 0) {
			console.log("    + FAIL --------------------- " + name + " --------------------");
			totals.fail += 1;
		} else {
			if (!is_quiet) {
				console.log("    + PASS --------------------- " + name + " --------------------");
			}
			totals.pass += 1;
		}
		for (i = 0, l = current_test_assertions.length; i < l; i++) {
			printAssertion(current_test_assertions[i], i + 1, (i + 1) === l);
		}
		if (!is_quiet || test.failed > 0) {
			console.log("    +------------------------------------------------------------");
			console.log("");
		}
	};

	QUnit.log = function(result) {
		// just push it to the output stack
		current_test_assertions.push(result);
	};

	QUnit.done = function() {
		stop_watch.stop();

		if (final_buffer) {
			clearTimeout(final_buffer);
		}
		// make sure this is only run once!
		final_buffer = setTimeout(function() {
			if (!is_quiet || totals.fail > 0) {
				console.log("--------------------------------------------------------------------------------");
				console.log(" PASS: " + totals.pass + " FAIL: " + totals.fail + " TOTAL: " + (totals.pass + totals.fail));
				console.log(" Finished in " + stop_watch.elapsed_seconds() + " seconds.");
				console.log("--------------------------------------------------------------------------------");
				if(is_quiet){
					throw "Not all units tests have passed.";
				}
			} else {
				console.log("Unit Tests passed.");
			}
		}, 100);
	};

	QUnit.begin = function() {
		stop_watch.start();
	};

})();

// include the source files and the tests
var source = [ "src/core.js", "src/create.js", "src/namespace.js", "src/export.js" ];
var tests = [ "unit/core.js", "unit/create.js", "unit/namespace.js", "unit/export.js" ];
var si = 0, sl = source.length, ti = 0, tl = tests.length;

fs = require("fs");
for (; si < sl; si++) {
	eval(fs.readFileSync(root + "/" + source[si], "utf-8") + "");
}
for (; ti < tl; ti++) {
	eval("with (QUnit) {" + fs.readFileSync(root + "/test/" + tests[ti], "utf-8") + "}");
}

// hacked b/c currently QUnit.begin is normally called on document.load
QUnit.begin();
QUnit.start();
