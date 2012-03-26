module.exports = (function(root) {
	// include the utils module
	var sys = require(/^v0\.[012]/.test(process.version) ? "sys" : "util"),
	// include the fs mmodule
	fs = require("fs"),
	// execute system commands
	exec = require('child_process'),
	// path utilities
	path = require('path'),
	// quick reference to root dir
	workdir = path.dirname(__dirname),
	// path to the build directory
	builddir = workdir + "/build",
	// path to distribution directory
	distdir = workdir + "/dist",
	// path the the src dir
	srcdir = workdir + "/src",
	// reference to the full source file
	data = null, min_data = null;

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

	function build(steps, options) {
		var cur = "", next = "";
		function chain(success) {
			cur = next;
			next = steps.shift();
			if (success === false) {
				console.log("Build process failed on step: " + cur);
				clean({}, function() {
					process.exit(1);
				});
				return;
			}
			if (next != null) {
				if (build_opts[next]) {
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
		console.log("Cleaning up the distribution directory...");
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
		// console.log("\x1B[1ACleaning up the distribution directory... Done!");
		return callback(true);
	}

	function concat(options, callback) {
		console.log("Building the source file from src...");

		fs.writeFile(distdir + "/" + options.name + ".js", getFullSource(options), "utf-8", function(error) {
			// console.log("\x1B[1ABuilding the source file from src... Done!");
			if (error != null) {
				console.log(error);
				callback(false);
				return;
			}
			callback(true);
		});
	}

	function unit(options, callback) {
		console.log("Running unit tests...");

		var child = exec.fork(builddir + '/lib/qunit-node-bridge.js', [ JSON.stringify({
			src : options.src,
			tests : options.unit
		}) ], {
			env : process.env
		});

		child.on('message', function(msg) {
			if (msg.event === 'assertionDone') {
				console.log(msg.data);
			} else if (msg.event === 'testDone') {
				console.log(msg.data);
			} else if (msg.event === 'done') {
				console.log(msg.data);
				// callback(msg.data);
				child.kill();
			}
		});
	}

	function lint(options, callback) {
		console.log("Running linting tests...");
		var jshint = require("./lib/jshint").JSHINT;

		// run the linter
		jshint(getFullSource(options), options.lint || {});

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

			console.log("JSHint check failed!");
			// callback(false);
			return;
		}

		console.log("JSHint check passed.");
		if (data.globals && data.globals.length > 0) {
			console.log("    Globals: " + data.globals.join(", "));
		}
		if (data.unused) {
			for (i = 0; i < data.unused.length; i++) {
				console.log("    Unused variable: \"" + data.unused[i].name + "\" at line " + data.unused[i].line + " in " + data.unused[i]["function"]);
			}
		}
		console.log("");
		callback(true);
	}

	function min(options, callback) {
		console.log("Minifying source file with UglifyJs...");

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
		var final_code = getMinSource(options);

		fs.writeFile(distdir + "/" + options.name + ".min.js", final_code, "utf-8", function(error) {
			// console.log("\x1B[1AMinifying source file with UglifyJs... Done!");
			if (error) {
				callback(false);
			}
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
		var gzip = exec.spawn('gzip', [ '-c', '-q', '-' ]), output = "";
		// Promise events
		gzip.stdout.setEncoding("utf-8");
		gzip.stdout.on('data', function(stdout) {
			output += stdout.toString();
		});
		gzip.on('exit', function(code) {
			callback(output, output.length);
		});
		gzip.stdin.end((data || "").toString(), "utf-8");
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