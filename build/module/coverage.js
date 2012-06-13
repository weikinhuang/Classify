// include the fs mmodule
var fs = require("fs"),
// execute system commands
childProcess = require("child_process");
// classify library
var Classify = require("../vendor/classify/classify.min.js");
// require the special array library
require("../vendor/classify/classify-array.min.js")(Classify);
var cArray = Classify("/Array");

var CodeCoverage = Classify.create({
	__static_ : {
		instrument : function(build, callback) {
			var error = [];
			fs.readdir(build.dir.src, function(e, files) {
				if (e) {
					return;
				}
				var filter = [];
				files.forEach(function(v) {
					if (build.src.indexOf(v) === -1) {
						filter.push(v);
					}
				});
				var params = [];
				filter.forEach(function(v) {
					params.push("--no-instrument=" + v);
				});
				params.push("src");
				params.push("coverage");

				// delete contents of directory
				try {
					fs.readdirSync(build.dir.coverage).forEach(function(file) {
						fs.unlinkSync(build.dir.coverage + "/" + file);
					});
					fs.unlinkSync(build.dir.coverage);
				} catch (e) {
				}

				var child = childProcess.spawn("jscoverage", params, {
					env : process.env
				});
				child.stderr.setEncoding("utf8");
				child.stderr.on("data", function(stderr) {
					error.push(stderr.toString());
				});
				child.on("exit", function(code) {
					if (code === 127) {
						return callback(null);
					}
					if (code !== 0) {
						return callback(false, error);
					}
					// delete files that were not instrumented
					fs.readdir(build.dir.coverage, function(e, files) {
						if (e) {
							return;
						}
						files.forEach(function(v) {
							if (build.src.indexOf(v) === -1) {
								fs.unlinkSync(build.dir.coverage + "/" + v);
							}
						});
					});
					return callback(true);
				});
			});
		}
	},
	init : function(build) {
		this.build = build;
		this.runtime = 0;
		this.failed = 0;
		this.passed = 0;
		this.total = 0;
		this.files = 0;
		this.executed = 0;
		this.statements = 0;
		this.coverage = {};
		this.missedLines = [];
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
				this.coverage = data.coverage;
				this.process();
				break;
		}
	},
	process : function() {
		var self = this;
		this.processCoverageData(function(summary) {
			self.outputSummaryTable(summary);
			self.generateReport(summary);
			self.onComplete();
		});
	},
	processCoverageData : function(callback) {
		var self = this, files = [], summary = [];
		this.build.src.forEach(function(v) {
			if (self.coverage.hasOwnProperty(v)) {
				files.push(v);
			}
		});
		// generage the coverage data
		files.forEach(function(filename) {
			var executed = 0, statements = 0, missing = [], coverage = {}, conditionals = self.coverage[filename].conditionals, currentConditionalEnd = 0;
			self.coverage[filename].lines.forEach(function(n, ln) {
				// skip conditional lines that were not executed
				if (ln === currentConditionalEnd) {
					currentConditionalEnd = 0;
				} else if (currentConditionalEnd === 0 && conditionals[ln]) {
					currentConditionalEnd = conditionals[ln];
				}
				if (currentConditionalEnd !== 0 || n === undefined || n === null) {
					return;
				}
				if (n === 0) {
					missing.push(ln);
				} else {
					executed++;
				}
				statements++;
			});
			coverage.executed = executed;
			coverage.statements = statements;
			coverage.missing = missing;
			coverage.name = filename;

			self.files++;
			self.executed += executed;
			self.statements += statements;

			var source = fs.readFileSync(self.build.dir.src + "/" + filename, "utf8").replace(/\r/g, "").replace(/\t/g, "  ").split("\n");
			source.unshift(null);
			coverage.source = source;
			summary.push(coverage);
		});
		callback(summary);
	},
	outputSummaryTable : function(summary) {
		var self = this, longestName = 0;
		this.build.src.forEach(function(filename) {
			if (self.coverage.hasOwnProperty(filename) && longestName < filename.length) {
				longestName = filename.length;
			}
		});

		// print header
		var rowHeader = [];
		rowHeader.push(this.build.rpad("File", longestName + 4));
		rowHeader.push(this.build.lpad("CLOC", 6));
		rowHeader.push(this.build.lpad("LOC", 6));
		rowHeader.push(this.build.lpad("%", 5));
		rowHeader.push("Missing");
		this.build.printLine(rowHeader.join(" | "));

		// print divider
		this.build.printLine(this.build.rpad("", 50, "-"));

		// print summary
		var total_percentage = (this.statements === 0 ? 0 : parseInt(100 * this.executed / this.statements, 10));
		var rowSummary = [];
		rowSummary.push(this.build.lpad(this.files, longestName + 4));
		rowSummary.push(this.build.lpad(this.executed, 6));
		rowSummary.push(this.build.lpad(this.statements, 6));
		rowSummary.push(this.build.lpad(total_percentage + " %", 5));
		rowSummary.push("");
		this.build.printLine(rowSummary.join(" | "));

		// print divider
		this.build.printLine(this.build.rpad("", 50, "-"));

		summary.forEach(function(report) {
			var percentage = (report.statements === 0 ? 0 : parseInt(100 * report.executed / report.statements, 10));
			var row = [], missing = [], missingLnStart = -1;
			row.push(self.build.rpad(report.name, longestName + 4));
			row.push(self.build.lpad(report.executed, 6));
			row.push(self.build.lpad(report.statements, 6));
			row.push(self.build.lpad(percentage + " %", 5));

			// group up non covered lines to 1,2,3,5,7,8,9 => 1-3,5,7-9
			report.missing.forEach(function(ln, idx) {
				if (missingLnStart === -1 && ln + 1 === report.missing[idx + 1]) {
					missingLnStart = ln;
					return;
				}
				if (ln + 1 === report.missing[idx + 1]) {
					return;
				}
				if (missingLnStart !== -1) {
					missing.push(missingLnStart + "-" + ln);
					missingLnStart = -1;
					return;
				}
				missingLnStart = -1;
				missing.push(ln);
			});
			row.push(missing.join(","));

			self.build.printLine(row.join(" | "));
		});
	},
	generateReport : function(summary) {
		var self = this;
		summary.forEach(function(report) {
			var is_continue = false;

			self.missedLines.push("");
			self.missedLines.push(self.build.color(self.build.rpad(report.name + " ", 80, "="), "bold"));

			report.missing.forEach(function(line, i) {
				if (line > 1 && !is_continue) {
					// context line
					self.missedLines.push(self.build.lpad(line - 1, 5) + " | " + report.source[line - 1]);
				}
				// the current line
				self.missedLines.push(self.build.lpad(line, 5) + " | " + self.build.color(report.source[line], 160));

				// if the next line is also missing then just continue
				if (report.missing[i + 1] === line + 1) {
					is_continue = true;
				} else {
					// otherwise output another context line
					is_continue = false;
					if (report.source[line + 1]) {
						// context line
						self.missedLines.push(self.build.lpad(line + 1, 5) + " | " + report.source[line + 1]);
						self.missedLines.push("");
					}
				}
			});
		});
	}
});

var CodeCoverageNodeJs = Classify.create(CodeCoverage, {
	name : "NodeJs",
	start : function() {
		this.parent();
		var self = this, child;

		child = childProcess.fork(this.build.dir.build + "/bridge/coverage-node-bridge.js", [ JSON.stringify({
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
			if (message.event === "done") {
				child.kill();
			}
			self.logEvent(message.event, message.data || {});
		});
	}
});

var CodeCoveragePhantomJs = Classify.create(CodeCoverage, {
	name : "PhantomJs",
	start : function() {
		var self = this, child;
		this.parent();

		child = childProcess.spawn("phantomjs", [ this.build.dir.build + "/bridge/phantom-bridge.js", this.build.dir.build + "/bridge/coverage-phantom-bridge.html" ], {
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
	build.printHeader(build.color("Generating Code Coverage Report with JsCoverage...", "bold"));
	CodeCoverage.instrument(build, function(result, data) {
		if (result === null) {
			build.printLine(build.color("\u2716 ", 160) + "JsCoverage not found!");
			build.printLine();
			return callback();
		}
		if (result === false) {
			if (data) {
				data.forEach(function(msg) {
					msg = msg.replace(/^\s*jscoverage:\s*/, "");
					if (msg) {
						build.printLine(msg);
					}
				});
			}
			build.printLine();
			return callback({
				error : new Error("Parsing javascript files failed.")
			});
		}

		var tests = cArray();
		if (build.env.node === true) {
			tests.push(new CodeCoverageNodeJs(build));
		}
		if (build.env.web === true) {
			tests.push(new CodeCoveragePhantomJs(build));
		}
		tests.serialEach(function(next, test) {
			test.setCallback(next).start();
		}, function() {
			var logs = [];
			tests.forEach(function(test) {
				logs.push.apply(logs, test.missedLines);
			});
			build.writeCacheFile("coverage", logs, function() {
				callback();
			});
		});
	});
};
