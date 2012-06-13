// execute system commands
var childProcess = require("child_process");
// classify library
var Classify = require("../vendor/classify/classify.min.js");
// require the special array library
require("../vendor/classify/classify-array.min.js")(Classify);
var cArray = Classify("/Array");

var UnitTest = Classify.create({
	init : function(name, build) {
		this.build = build;
		this.name = name;
		this.runtime = 0;
		this.failed = 0;
		this.passed = 0;
		this.total = 0;
		this.results = {};
	},
	setCallback : function(callback) {
		this.callback = callback;
		return this;
	},
	onComplete : function() {
		this.build.printLine();
		this.callback();
	},
	start : function() {
		this.build.printLine("Running in " + this.build.color(this.name, "bold") + " environment...");
	},
	logEvent : function(type, data) {
		switch (type) {
			case "assertionDone":
				if (data.result === false) {
					if (!this.results[data.module]) {
						this.results[data.module] = [];
					}
					this.results[data.module].push(data);
				}
				break;
			case "testStart":
				this.build.printTemp("Running: " + this.build.color(data.module, "bold") + " " + data.name);
				break;
			case "testDone":
				break;
			case "moduleStart":
				break;
			case "moduleDone":
				break;
			case "done":
				this.build.printTemp("Unit tests done.");
				this.failed = data.failed;
				this.passed = data.passed;
				this.total = data.total;
				this.runtime = data.runtime;
				this.process();
				break;
		}
	},
	process : function() {
		var self = this, build = this.build;
		Object.keys(this.results).forEach(function(test) {
			build.printLine(build.color("Module: ", "bold") + test);
			self.results[test].forEach(function(assertion) {
				build.printLine("    " + (assertion.result ? build.color("\u2714  ", 34) : build.color("\u2716 ", 160)) + build.color("Test # ", "bold") + assertion.index + "/" + self.total);
				build.printLine("        " + assertion.message + " [" + build.color(assertion.test, 248) + "]");
				if (typeof assertion.expected !== "undefined") {
					build.printLine("            -> " + build.color("Expected: " + assertion.expected, 34));
					// if test failed, then we need to output the result
					if (!assertion.result) {
						build.printLine("            ->   " + build.color("Result: " + assertion.actual, 160));
					}
				}
			});
		});

		if (this.failed > 0) {
			build.printLine(build.color("\u2716 ", 160) + this.failed + " / " + this.total + " Failed");
		} else {
			build.printLine(build.color("\u2714 ", 34) + "All tests [" + this.passed + " / " + this.total + "] passed!");
		}
		this.onComplete();
	}
});

var UnitTestNodeJs = Classify.create(UnitTest, {
	init : function(build) {
		this.parent("NodeJs", build);
	},
	start : function() {
		this.parent();
		var self = this, index = 0, child;

		child = childProcess.fork(this.build.dir.build + "/bridge/qunit-node-bridge.js", [ JSON.stringify({
			source : {
				src : this.build.src,
				tests : this.build.unit,
				external : this.build.external
			},
			dir : this.build.dir
		}) ], {
			env : process.env
		});

		child.on("message", function(message) {
			if (message.event === "assertionDone") {
				message.data.index = ++index;
			}
			if (message.event === "done") {
				child.kill();
			}
			self.logEvent(message.event, message.data || {});
		});
	}
});

var UnitTestPhantomJs = Classify.create(UnitTest, {
	init : function(build) {
		this.parent("PhantomJs", build);
	},
	start : function() {
		this.parent();
		var self = this, index = 0, child;

		child = childProcess.spawn("phantomjs", [ this.build.dir.build + "/bridge/phantom-bridge.js", this.build.dir.build + "/bridge/qunit-phantom-bridge.html" ], {
			env : process.env
		});

		child.stdout.setEncoding("utf8");
		child.stdout.on("data", function(stdout) {
			stdout.toString().split("{\"event\"").forEach(function(data) {
				if (!data) {
					return;
				}
				var message = {};
				try {
					message = JSON.parse("{\"event\"" + data);
				} catch (e) {
					throw e;
				}

				if (message.event === "assertionDone") {
					message.data.index = ++index;
				}
				if (message.event === "done") {
					child.kill();
				}
				self.logEvent(message.event, message.data || {});
			});
		});
		child.on("exit", function(code) {
			// phantomjs doesn't exist
			if (code === 127) {
				self.build.printLine(self.build.color("\u2716 ", 160) + "Environment " + self.name + " not found!");
				self.onComplete();
			}
		});
	}
});

module.exports = function(build, callback) {
	build.printHeader(build.color("Running unit tests against QUnit...", "bold"));
	var tests = cArray();
	if (build.env.node === true) {
		tests.push(new UnitTestNodeJs(build));
	}
	if (build.env.web === true) {
		tests.push(new UnitTestPhantomJs(build));
	}
	tests.serialEach(function(next, test) {
		test.setCallback(next).start();
	}, function() {
		var failed = 0, runtime = 0;
		tests.forEach(function(test) {
			failed += test.failed;
			runtime += test.runtime;
		});
		callback({
			error : failed > 0 ? new Error(failed + " Unit Test(s) failed.") : null,
			time : runtime
		});
	});
};
