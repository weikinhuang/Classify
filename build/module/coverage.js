module.exports = (function(root) {

	// execute system commands
	var exec = require("child_process");

	function processUnitTestResults(results, summary, callback) {
		Object.keys(results).forEach(function(test) {
			callback.log("\x1B[39;1mModule:\x1B[0m " + test);
			results[test].forEach(function(assertion) {
				callback.log("    " + (assertion.result ? "\x1B[38;5;34m\u2714" : "\x1B[38;5;160m\u2716") + " \x1B[0m\x1B[39;1mTest #\x1B[0m " + assertion.index + "/" + summary.total);
				callback.log("        " + assertion.message + " [\x1B[38;5;248m" + assertion.test + "\x1B[0m]");
				if (typeof assertion.expected !== "undefined") {
					callback.log("            -> \x1B[38;5;34mExpected: " + assertion.expected + "\x1B[0m");
					// if test failed, then we need to output the result
					if (!assertion.result) {
						callback.log("            ->   \x1B[38;5;160mResult: " + assertion.actual + "\x1B[0m");
					}
				}
			});
		});

		if (summary.failed > 0) {
			callback.log("\x1B[38;5;160m\u2716 \x1B[0m" + summary.failed + " / " + summary.total + " Failed");
		} else {
			callback.log("\x1B[38;5;34m\u2714 \x1B[0mAll tests [" + summary.passed + " / " + summary.total + "] passed!");
		}
		callback.log("");
	}

	function unitNode(options, callback) {
		var child = exec.fork(options.dir.build + "/lib/coverage-node-bridge.js", [ JSON.stringify({
			src : options.src,
			tests : options.unit
		}) ], {
			env : process.env
		}), results = {}, index = 0;

		child.on("message", function(msg) {
			if (msg.event === "done") {
				child.kill();
				callback(results, msg.data);
			}
		});
	}

	function unitPhantom(options, callback) {
		var child = exec.spawn("phantomjs", [ options.dir.build + "/lib/phantom-bridge.js", options.dir.build + "/lib/coverage-phantom-bridge.html" ], {
			env : process.env
		}), results = {}, index = 0, processEvent = function(msg) {
			if (msg.event === "assertionDone") {
				msg.data.index = ++index;
				if (msg.data.result === false) {
					if (!results[msg.data.module]) {
						results[msg.data.module] = [];
					}
					results[msg.data.module].push(msg.data);
				}
			} else if (msg.event === "done") {
				callback(results, msg.data);
			}
		};

		child.stdout.setEncoding("utf-8");
		child.stdout.on("data", function(stdout) {
			console.log(stdout);
			stdout.toString().split("{\"event\"").forEach(function(data) {
				if (!data) {
					return;
				}
				try {
					var msg = JSON.parse("{\"event\"" + data);
					processEvent(msg);
				} catch (e) {
					throw e;
					return;
				}
			});
		});
		child.on("exit", function(code) {
			// phantomjs doesn't exist
			if (code === 127) {
				callback(true);
			}
		});
	}

	return function(options, source, callback) {
		callback.print("Running unit tests against QUnit...");
		var tests = [], failed = 0, runtime = 0, complete = function(env, results, summary) {
			if (env !== null && results !== true) {
				failed += summary.failed || 0;
				runtime += summary.runtime;
				processUnitTestResults(results, summary, callback);
			}
			if (results === true) {
				callback.log("\x1B[38;5;160m\u2716 \x1B[0mEnvironment " + env + " not found!");
				callback.log("");
			}
			if (tests.length === 0) {
				return callback({
					error : failed > 0 ? new Error(failed + " Unit Test(s) failed.") : null,
					time : runtime
				});
			}
			(tests.shift())();
		};
		if (options.env.node === true) {
			tests.push(function() {
				callback.log("Running in \x1B[39;1mNodeJs\x1B[0m environment...");
				unitNode(options, function(results, summary) {
					complete("NodeJs", results, summary);
				});
			});
		}
		if (options.env.web === true) {
			tests.push(function() {
				callback.log("Running in \x1B[39;1mPhantomJs\x1B[0m environment...");
				unitPhantom(options, function(results, summary) {
					complete("PhantomJs", results, summary);
				});
			});
		}
		// start the unit tests
		complete(null);
	};
})(global);