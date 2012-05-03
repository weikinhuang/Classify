module.exports = (function(root) {

	// include the fs mmodule
	var fs = require("fs"),
	// execute system commands
	exec = require("child_process");

	function generateInstrumentedCode(options, callback) {
		var error = [];
		fs.readdir(options.dir.src, function(e, files) {
			if (e) {
				return;
			}
			var filter = [];
			files.forEach(function(v) {
				if (options.src.indexOf(v) === -1) {
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
				fs.readdirSync(options.dir.coverage).forEach(function(file) {
					fs.unlinkSync(options.dir.coverage + "/" + file);
				});
				fs.unlinkSync(options.dir.coverage);
			} catch (e) {
			}

			var child = exec.spawn("jscoverage", params, {
				env : process.env
			});
			child.stderr.setEncoding("utf-8");
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
				fs.readdir(options.dir.coverage, function(e, files) {
					if (e) {
						return;
					}
					files.forEach(function(v) {
						if (options.src.indexOf(v) === -1) {
							fs.unlinkSync(options.dir.coverage + "/" + v);
						}
					});
				});
				return callback(true);
			});
		});
	}

	function coverageNode(options, callback) {
		var child = exec.fork(options.dir.build + "/lib/coverage-node-bridge.js", [ JSON.stringify({
			src : options.src,
			tests : options.unit
		}) ], {
			env : process.env
		});
		child.on("message", function(msg) {
			if (msg.event === "done") {
				child.kill();
				callback(msg.coverage);
			}
		});
	}

	function coveragePhantom(options, callback) {
		var child = exec.spawn("phantomjs", [ options.dir.build + "/lib/phantom-bridge.js", options.dir.build + "/lib/coverage-phantom-bridge.html" ], {
			env : process.env
		});

		child.stdout.setEncoding("utf-8");
		child.stdout.on("data", function(stdout) {
			stdout.toString().split("{\"event\"").forEach(function(data) {
				if (!data) {
					return;
				}
				try {
					var msg = JSON.parse("{\"event\"" + data);
					if (msg.event === "done") {
						callback(msg.coverage);
					}
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

	function lpad(str, len, chr) {
		return (Array(len + 1).join(chr || " ") + str).substr(-len);
	}

	function rpad(str, len, chr) {
		return (str + Array(len + 1).join(chr || " ")).substr(0, len);
	}

	function processCoverageReport(options, report, callback) {
		var files = [], summary = [], totals = {
			files : 0,
			statements : 0,
			executed : 0
		}, longestName = 0, reports = [];
		options.src.forEach(function(v) {
			if (report.hasOwnProperty(v)) {
				files.push(v);
			}
		});
		// generage the coverage data
		files.forEach(function(filename) {
			var executed = 0, statements = 0, missing = [], coverage = {};
			report[filename].forEach(function(n, ln) {
				if (n === undefined || n === null) {
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

			totals.files++;
			totals.executed += executed;
			totals.statements += statements;

			var source = fs.readFileSync(options.dir.src + "/" + filename, "utf-8").replace(/\r/g, "").replace(/\t/g, "  ").split("\n");
			source.unshift(null);
			coverage.source = source;
			summary.push(coverage);

			if (longestName < filename.length) {
				longestName = filename.length;
			}
		});

		callback.log(rpad("File", longestName + 4) + " | " + lpad("CLOC", 6) + " | " + lpad("LOC", 6) + " | " + lpad("%", 5) + " | " + "Missing");
		callback.log(rpad("", 50, "-"));
		var total_percentage = (totals.statements === 0 ? 0 : parseInt(100 * totals.executed / totals.statements));
		callback.log(lpad(totals.files, longestName + 4) + " | " + lpad(totals.executed, 6) + " | " + lpad(totals.statements, 6) + " | " + lpad(total_percentage + " %", 5) + " | ");
		callback.log(rpad("", 50, "-"));
		summary.forEach(function(report) {
			var percentage = (report.statements === 0 ? 0 : parseInt(100 * report.executed / report.statements));
			callback.log(rpad(report.name, longestName + 4) + " | " + lpad(report.executed, 6) + " | " + lpad(report.statements, 6) + " | " + lpad(percentage + " %", 5) + " | " + report.missing.join(","));

			var is_continue = false, code = [];
			report.missing.forEach(function(line, i) {
				if (line > 1 && !is_continue) {
					// context line
					code.push(lpad(line - 1, 5) + " | " + report.source[line - 1]);
				}
				// the current line
				code.push(lpad(line, 5) + " | \x1B[38;5;160m" + report.source[line] + "\x1B[0m");

				// if the next line is also missing then just continue
				if (report.missing[i + 1] === line + 1) {
					is_continue = true;
				} else {
					// otherwise output another context line
					is_continue = false;
					if (report.source[line + 1]) {
						// context line
						code.push(lpad(line + 1, 5) + " | " + report.source[line + 1]);
						code.push("");
					}
				}
			});
			reports.push({
				name : report.name,
				source : code
			});
		});
		reports.forEach(function(report) {
			callback.store("");
			callback.store("\x1B[39;1m" + rpad(report.name + " ", 80, "=") + "\x1B[0m");
			report.source.forEach(function(line) {
				callback.store(line);
			});
		});

	}

	return function(options, source, callback) {
		callback.print("Generating Code Coverage Report with JsCoverage...");
		generateInstrumentedCode(options, function(result, data) {
			if (result === null) {
				callback.log("\x1B[38;5;160m\u2716 \x1B[0mJsCoverage not found!");
				callback.log("");
				return callback();
			}
			if (result === false) {
				if (data) {
					data.forEach(function(msg) {
						msg = msg.replace(/^\s*jscoverage:\s*/, "");
						if (msg) {
							callback.log(msg);
						}
					});
				}
				callback.log("");
				return callback({
					error : new Error("Parsing javascript files failed.")
				});
			}

			var tests = [], store = [], complete = function(env, data) {
				if (env !== null && data !== true) {
					store.push("Coverage Report for \x1B[39;1m" + env + "\x1B[0m environment.");
					processCoverageReport(options, data, {
						log : function(msg) {
							store.push(msg);
							callback.log(msg);
						},
						store : function(msg) {
							store.push(msg);
						}
					});
					callback.log("");
				}
				if (data === true) {
					callback.log("\x1B[38;5;160m\u2716 \x1B[0mEnvironment " + env + " not found!");
					callback.log("");
				}
				if (tests.length === 0) {
					fs.writeFileSync(options.dir.build + "/.coveragecache.json", JSON.stringify(store, true), "utf-8");
					return callback();
				}
				(tests.shift())();
			};
			if (options.env.node === true) {
				tests.push(function() {
					callback.log("Running in \x1B[39;1mNodeJs\x1B[0m environment...");
					coverageNode(options, function(data) {
						complete("NodeJs", data);
					});
				});
			}
			if (options.env.web === true) {
				tests.push(function() {
					callback.log("Running in \x1B[39;1mPhantomJs\x1B[0m environment...");
					coveragePhantom(options, function(data) {
						complete("PhantomJs", data);
					});
				});
			}
			// start the unit tests
			complete(null);
		});
	};
})(global);
