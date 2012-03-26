module.exports = (function(root) {
	// include the fs mmodule
	var fs = require("fs"),
	// execute system commands
	exec = require("child_process"),
	// path utilities
	path = require("path"),
	// quick reference to root dir
	workdir = path.dirname(__dirname),
	// path to the build directory
	builddir = workdir + "/build",
	// path to distribution directory
	distdir = workdir + "/dist",
	// path the the src dir
	srcdir = workdir + "/src",
	// reference to the full source file
	data = null, min_data = null, copy_data = null;

	// process.stdout.getWindowSize()[0]; //cols
	// process.stdout.getWindowSize()[1]; //rows

	var build_opts = {
		clean : function(options, callback) {
			return clean.apply(null, arguments);
		},
		concat : function(options, callback) {
			return concat.apply(null, arguments);
		},
		unit : function(options, callback) {
			return unit.apply(null, arguments);
		},
		lint : function(options, callback) {
			return lint.apply(null, arguments);
		},
		min : function(options, callback) {
			return min.apply(null, arguments);
		},
		size : function(options, callback) {
			return size.apply(null, arguments);
		}
	};

	var build_messages = {
		clean : "Cleaning up the distribution directory...",
		concat : "Building the source file from parts...",
		unit : "Running unit tests against QUnit...",
		lint : "Checking code quality with JsHint...",
		min : "Minifying source file with UglifyJs...",
		size : "Checking sizes against previous build..."
	};

	function build(steps, options) {
		var current = "", next = "", timer = 0;
		function chain(success, runtime) {
			current = next;
			next = steps.shift();
			if (success === false) {
				console.log("Build process failed on step: " + current);
				console.log("");
				clean({}, function() {
					process.exit(1);
				});
				return;
			}
			if (success === true) {
				console.log("    Finished in \x1B[35m" + ((runtime || (+new Date() - timer)) / 1000).toFixed(3) + "\x1B[0m seconds.");
				console.log("");
			}
			if (next != null) {
				if (build_opts[next]) {
					if (build_messages[next]) {
						console.log(build_messages[next] || "");
					}
					timer = +new Date();
					build_opts[next](options, chain);
				} else {
					console.log("Unknown build command: " + next);
					process.exit(2);
				}
			}
		}
		chain();
	}

	function clean(options, callback) {
		try {
			// delete contents of directory
			fs.readdirSync(distdir).forEach(function(file) {
				fs.unlinkSync(distdir + "/" + file);
			});
		} catch (e) {
		}
		try {
			// create the dist dir for next iteration
			fs.mkdir(distdir);
		} catch (e) {
		}
		return callback(true);
	}

	function concat(options, callback) {
		fs.writeFile(distdir + "/" + options.name + ".js", getCopyright(options) + "\n" + getFullSource(options), "utf-8", function(error) {
			if (error != null) {
				console.log(error);
				callback(false);
				return;
			}
			callback(true);
		});
	}

	function unit(options, callback) {
		var child = exec.fork(builddir + "/lib/qunit-node-bridge.js", [ JSON.stringify({
			src : options.src,
			tests : options.unit
		}) ], {
			env : process.env
		}), results = {}, index = 0;

		function processResults(summary) {
			Object.keys(results).forEach(function(test) {
				console.log("     \x1B[39;1mModule:\x1B[0m " + test);
				results[test].forEach(function(assertion) {
					console.log("        " + (assertion.result ? "\x1B[32m\u2714" : "\x1B[31m\u2716") + " \x1B[0m\x1B[39;1mTest #\x1B[0m " + assertion.index + "/" + summary.total);
					console.log("            " + assertion.message + " [\x1B[37m" + assertion.test + "\x1B[0m]");
					if (typeof assertion.expected !== "undefined") {
						console.log("                -> \x1B[32mExpected: " + assertion.expected + "\x1B[0m");
						// if test failed, then we need to output the result
						if (!assertion.result) {
							console.log("                ->   \x1B[31mResult: " + assertion.actual + "\x1B[0m");
						}
					}
				});
			});

			if (summary.failed > 0) {
				console.log("    \x1B[31m\u2716 \x1B[0m" + summary.failed + " / " + summary.total + " Failed");
			} else {
				console.log("    \x1B[32m\u2714 \x1B[0mAll tests passed!");
			}
			callback(summary.failed === 0, summary.runtime);
		}

		child.on("message", function(msg) {
			if (msg.event === "assertionDone") {
				msg.data.index = ++index;
				if (msg.data.result === false) {
					if (!results[msg.data.module]) {
						results[msg.data.module] = [];
					}
					results[msg.data.module].push(msg.data);
				}
			} else if (msg.event === "testDone") {
			} else if (msg.event === "done") {
				child.kill();
				processResults(msg.data);
			}
		});
	}

	function lint(options, callback) {
		var jshint = require("./lib/jshint").JSHINT;

		// run the linter
		jshint(getFullSource(options), options.lint || {});

		var data = jshint.data();

		if (jshint.errors.length > 0) {
			console.log("    \x1B[31m\u2716 \x1B[0m" + jshint.errors.length + " Linting error(s) found.");
			jshint.errors.forEach(function(e) {
				if (!e) {
					return;
				}
				console.log("        Problem at line " + e.line + ":" + (e.character === true ? "EOL" : e.character) + ": \x1B[31m" + e.reason + "\x1B[0m");
				console.log("            " + (e.evidence || "").replace(/\t/g, " ").trim());
			});

			callback(false);
			return;
		}

		console.log("    \x1B[32m\u2714 \x1B[0mCode linting passed!");
		if (data.globals && data.globals.length > 0) {
			console.log("    Globals: \x1B[36m" + data.globals.join("\x1B[0m, \x1B[36m") + "\x1B[0m");
		}
		if (data.unused) {
			data.unused.forEach(function(e, i) {
				var msg = "    ";
				msg += (i === 0 ? "Unused variable: " : "                 ");
				msg += "\"" + e.name + "\" at line " + e.line + " in " + e["function"];
				console.log(msg);
			});
		}
		callback(true);
	}

	function min(options, callback) {
		var min_source = getMinSource(options);

		fs.writeFile(distdir + "/" + options.name + ".min.js", getCopyright(options) + ";" + min_source, "utf-8", function(error) {
			if (error) {
				callback(false);
			}
			var full_source_length = getFullSource(options).length;
			var saving_percentage = ((full_source_length - min_source.length) / full_source_length * 100).toFixed(2);
			console.log("    Saved " + (full_source_length - min_source.length) + " bytes (" + saving_percentage + "%).");
			callback(true);
		});
	}

	function size(options, callback) {
		var oldsizes = {}, sizes = {}, key = null;
		try {
			oldsizes = JSON.parse(fs.readFileSync(builddir + "/.sizecache.json", "utf-8"));
		} catch (e) {
		}

		sizes[options.name + ".js"] = getFullSource(options).length;
		sizes[options.name + ".min.js"] = getMinSource(options).length;

		gzip(getMinSource(options), function(data, length) {
			sizes[options.name + ".min.js.gz"] = length;
			fs.writeFileSync(builddir + "/.sizecache.json", JSON.stringify(sizes, true), "utf-8");
			for (key in sizes) {
				var diff = oldsizes[key] && (sizes[key] - oldsizes[key]);
				if (diff > 0) {
					diff = "+" + diff;
				}
				console.log("%s %s %s", lpad(sizes[key], 8), lpad(diff ? "(" + diff + ")" : "(-)", 8), key);
			}
			callback(true);
		});
	}

	function lpad(str, len, chr) {
		return (Array(len + 1).join(chr || " ") + str).substr(-len);
	}

	function gzip(data, callback) {
		var gzip = exec.spawn("gzip", [ "-c", "-q", "-" ]), output = "";
		// Promise events
		gzip.stdout.setEncoding("utf-8");
		gzip.stdout.on("data", function(stdout) {
			output += stdout.toString();
		});
		gzip.on("exit", function(code) {
			callback(output, output.length);
		});
		gzip.stdin.end((data || "").toString(), "utf-8");
	}

	function getCopyright(options) {
		if (copy_data !== null) {
			return copy_data;
		}
		copy_data = "";
		(options.wrap && options.wrap.copy || []).forEach(function(file) {
			copy_data += fs.readFileSync(srcdir + "/" + file, "utf-8");
		});
		copy_data = copy_data.replace(/@VERSION\b/g, options.version);
		copy_data = copy_data.replace(/@DATE\b/g, (new Date()).toUTCString());
		return copy_data;
	}

	function getFullSource(options) {
		if (data !== null) {
			return data;
		}
		var intro = "", outro = "", src = "";
		(options.wrap && options.wrap.intro || []).forEach(function(file) {
			intro += fs.readFileSync(srcdir + "/" + file, "utf-8");
		});
		(options.wrap && options.wrap.outro || []).forEach(function(file) {
			outro += fs.readFileSync(srcdir + "/" + file, "utf-8");
		});
		(options.src || []).forEach(function(file) {
			src += fs.readFileSync(srcdir + "/" + file, "utf-8");
		});

		data = intro + src + outro;
		data = data.replace(/@VERSION\b/g, options.version);
		data = data.replace(/@DATE\b/g, (new Date()).toUTCString());
		return data;
	}

	function getMinSource(options) {
		if (min_data !== null) {
			return min_data;
		}
		var parser = require("./lib/parse-js");
		var uglify = require("./lib/process");
		var consolidator = require("./lib/consolidator");

		options.min = options.min || {};

		var code = getFullSource(options);

		if (options.min.preparse) {
			code = options.min.preparse(code);
		}

		// parse code and get the initial AST
		var ast = parser.parse(code, options.min.strict_semicolons || false);

		if (options.consolidate) {
			ast = consolidator.ast_consolidate(ast);
		}
		if (options.lift_vars) {
			ast = uglify.ast_lift_variables(ast);
		}

		// get a new AST with mangled names
		if (options.min.mangle) {
			ast = uglify.ast_mangle(ast, options.min.mangle);
		}

		// get an AST with compression optimizations
		if (options.min.squeeze) {
			options.min.squeeze.keep_comps = !(options.min.unsafe || false);
			ast = uglify.ast_squeeze(ast, options.min.squeeze);

			// unsafe optimizations
			if (options.min.unsafe) {
				ast = uglify.ast_squeeze_more(ast);
			}
		}

		// compressed code here
		min_data = uglify.gen_code(ast, options.min.generate);
		return min_data;
	}

	// export the execution function
	return {
		process : function(options) {
			build(options.build.split(" "), options);
		}
	};
})(global);