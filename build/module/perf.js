// execute system commands
var childProcess = require("child_process");
// classify library
var Classify = require("../vendor/classify/classify.min.js");
// require the special array library
require("../vendor/classify/classify-array.min.js")(Classify);
var cArray = Classify("/Array");

var Benchmark = Classify.create({
	init : function(name, build) {
		this.build = build;
		this.name = name;
		this.failed = 0;
		this.passed = 0;
		this.total = 0;
		this.results = [];
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
		var modules;
		switch (type) {
			case "testStart":
				modules = data.name.split(".");
				this.build.printTemp("Starting: " + this.build.color(modules.shift(), "bold") + " " + modules.join("."));
				break;
			case "testCycle":
				modules = data.name.split(".");
				this.build.printTemp(this.build.color(modules.shift(), "bold") + " " + modules.join(".") + " x " + this.build.formatNumber(data.count) + " (" + data.size + " sample" + (data.size == 1 ? "" : "s") + ")");
				break;
			case "testError":
				break;
			case "testComplete":
				this[data.error ? "failed" : "passed"]++;
				this.results.push(data);
				break;
			case "done":
				this.build.printTemp("Benchmarks done.");
				this.total = this.results.length;
				this.process();
				break;
		}
	},
	process : function(prevResults) {
		var self = this;
		this.build.readCacheFile("perf." + this.name, function(data) {
			var currentPerfStats = {};
			self.results.forEach(function(test) {
				currentPerfStats[test.name] = test;
			});
			self.build.writeCacheFile("perf." + self.name, currentPerfStats, function() {
				self.output(data || {});
			});
		});
	},
	output : function(prevResults) {
		var self = this;
		this.results.forEach(function(test) {
			self.outputTest(test, prevResults[test.name]);
		});

		if (this.failed > 0) {
			this.build.printLine(this.build.color("\u2716 ", 160) + this.failed + " / " + this.total + " Failed");
		} else {
			this.build.printLine(this.build.color("\u2714 ", 34) + "All benchmarks run successfully!");
		}
		this.build.printLine();
		this.onComplete();
	},
	outputTest : function(test, prev) {
		var message = [ "  " ], prevCompare;
		if (test.error) {
			message.push(this.build.color(this.build.rpad(test.name, 35), 160));
		} else {
			message.push(this.build.rpad(test.name, 35));
		}
		message.push(this.build.lpad(this.build.formatNumber(test.hz.toFixed(test.hz < 100 ? 2 : 0)), 12));
		message.push(" ops/s (\u00B1" + test.stats.rme.toFixed(2) + "%)");
		message.push(" [" + this.build.formatNumber(test.count) + "x in " + test.times.cycle.toFixed(3) + "s]");

		if (prev) {
			prevCompare = test.hz - prev.hz;
			message.push(" [Vs. ");
			message.push(prevCompare >= 0 ? "+" : "-");
			message.push(this.build.formatNumber(Math.abs(prevCompare).toFixed(Math.abs(prevCompare) < 100 ? 2 : 0)));
			message.push(" ops/s ");
			message.push("(");
			message.push(prevCompare >= 0 ? "+" : "-");
			message.push(Math.abs(((test.hz - prev.hz) / test.hz) * 100).toFixed(3) + "%");
			message.push(")");
			message.push("]");
		}

		this.build.printLine(message.join(""));
		if (test.error) {
			this.build.printLine("    " + this.build.color("\u2716 ", 160) + test.error);
		}
	}
});

var BenchmarkNodeJs = Classify.create(Benchmark, {
	init : function(build) {
		this.parent("NodeJs", build);
	},
	start : function() {
		this.parent();

		var self = this, index = 0, child;
		child = childProcess.fork(this.build.dir.build + "/bridge/benchmark-node-bridge.js", [ JSON.stringify({
			source : {
				src : this.build.src,
				perf : this.build.perf,
				external : this.build.external
			},
			dir : this.build.dir
		}) ], {
			env : process.env
		});

		child.on("message", function(message) {
			if (message.event === "testComplete") {
				message.data.index = ++index;
			}
			if (message.event === "done") {
				child.kill();
			}
			self.logEvent(message.event, message.data || {});
		});
	}
});

var BenchmarkPhantomJs = Classify.create(Benchmark, {
	init : function(build) {
		this.parent("PhantomJs", build);
	},
	start : function() {
		this.parent();
		var self = this, index = 0, child;

		child = childProcess.spawn("phantomjs", [ this.build.dir.build + "/bridge/phantom-bridge.js", this.build.dir.build + "/bridge/benchmark-phantom-bridge.html" ], {
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

				if (message.event === "testComplete") {
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
	build.printHeader(build.color("Running benchmarks with Benchmark.js...", "bold"));
	var tests = cArray();
	if (build.env.node === true) {
		tests.push(new BenchmarkNodeJs(build));
	}
	if (build.env.web === true) {
		tests.push(new BenchmarkPhantomJs(build));
	}
	tests.serialEach(function(next, test) {
		test.setCallback(next).start();
	}, function() {
		var failed = 0;
		tests.forEach(function(test) {
			failed += test.failed;
		});
		callback({
			error : failed > 0 ? new Error(failed + " Benchmarks(s) failed.") : null
		});
	});
};
