module.exports = (function(root) {
	// include the fs mmodule
	var fs = require("fs"),
	// path utilities
	path = require("path"),
	// quick reference to root dir
	workdir = path.dirname(__dirname),
	// default options
	defaultOptions = {
		name : "build",
		pkg : "package.json",
		version : "0.0.0",
		wrap : {},
		src : [],
		unit : [],
		perf : [],
		docs : [],
		env : {},
		lint : {},
		min : {},
		doc : {},
		build : "clean concat lint unit min size"
	};

	// function to init the parameters
	function processor(steps, options) {
		// merge the default options into the options array
		Object.keys(defaultOptions).forEach(function(key) {
			if (options[key] == null) {
				options[key] = defaultOptions[key];
			}
		});
		var exclude = [], i, l;
		for (i = 0, l = steps.length; i < l; i++) {
			if (/^-/.test(steps[i])) {
				exclude.push(steps[i].replace(/^-/, ""));
			}
		}
		// we passed in options to exclude items instead of including them
		if (exclude.length !== 0) {
			steps = options.build.split(" ");
			for (i = 0, l = exclude.length; i < l; i++) {
				if (steps.indexOf(exclude[i]) > -1) {
					steps.splice(steps.indexOf(exclude[i]), 1);
				}
			}
		}
		options.dir = {
			base : workdir,
			build : workdir + "/build",
			dist : workdir + "/dist",
			src : workdir + "/src",
			coverage : workdir + "/coverage",
			doc : workdir + "/docs"
		};
		build(steps, options);
	}

	function getSource(options) {
		var intro = "", outro = "", src = "", data;
		(options.wrap && options.wrap.intro || []).forEach(function(file) {
			intro += fs.readFileSync(options.dir.src + "/" + file, "utf-8");
		});
		(options.wrap && options.wrap.outro || []).forEach(function(file) {
			outro += fs.readFileSync(options.dir.src + "/" + file, "utf-8");
		});
		(options.src || []).forEach(function(file) {
			src += fs.readFileSync(options.dir.src + "/" + file, "utf-8");
		});

		data = intro + src + outro;
		data = data.replace(/@VERSION\b/g, options.version);
		return data.replace(/@DATE\b/g, (new Date()).toUTCString());
	}

	function getMinifiedSource(options, src) {
		var parser = require(options.dir.build + "/lib/parse-js");
		var uglify = require(options.dir.build + "/lib/process");
		var consolidator = require(options.dir.build + "/lib/consolidator");

		options.min = options.min || {};

		if (options.min.preparse) {
			src = options.min.preparse(src);
		}

		// parse code and get the initial AST
		var ast = parser.parse(src, options.min.strict_semicolons || false);

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
		return uglify.gen_code(ast, options.min.generate);
	}

	function getCopyright(options) {
		var copy = "";
		(options.wrap && options.wrap.copy || []).forEach(function(file) {
			copy += fs.readFileSync(options.dir.src + "/" + file, "utf-8");
		});
		copy = copy.replace(/@VERSION\b/g, options.version);
		copy = copy.replace(/@DATE\b/g, (new Date()).toUTCString());
		return copy;
	}

	function build(steps, options) {
		var requirements = [], start = +new Date(), src = getSource(options), source = {
			source : src,
			minSource : getMinifiedSource(options, src),
			copyright : getCopyright(options)
		};
		steps.forEach(function(step) {
			requirements.push({
				name : step,
				exec : require(options.dir.build + "/module/" + step)
			});
		});

		// execute a step
		function exec() {
			var step = requirements.shift(), messages = [], callback;
			if (!step) {
				return onComplete(+new Date() - start);
			}
			source.time = (+new Date());
			callback = function(response) {
				response = response || {};
				response.name = step.name;
				if (!response.time) {
					response.time = (+new Date()) - source.time;
				}
				response.messages = messages;
				// trigger error handler
				if (response.error) {
					return onError(response);
				}
				onSuccess(response);
				exec();
			};
			callback.log = function(message) {
				messages.push(message);
			};
			callback.print = function(message) {
				console.log(message);
			};
			try {
				step.exec(options, source, callback);
			} catch (e) {
				onError({
					name : step.name,
					messages : messages,
					error : e,
					time : 0
				});
			}
		}

		// start the process
		exec();
	}

	function onComplete(time) {
		console.log("\x1B[38;5;34m\u2714 \x1B[0mBuild process completed in \x1B[38;5;171m" + (time / 1000).toFixed(3) + "\x1B[0m seconds.");
		console.log("");
		setTimeout(function() {
			process.exit(0);
		}, 1);
	}

	function onSuccess(data) {
		data.messages.forEach(function(m) {
			console.log("    " + m);
		});
		console.log("    Finished in \x1B[38;5;171m" + (data.time / 1000).toFixed(3) + "\x1B[0m seconds.");
		console.log("");
	}

	function onError(data) {
		console.log("");
		console.log("\x1B[38;5;160m\u2716 \x1B[0mBuild process failed on: \x1B[38;5;160m" + data.name + "\x1B[0m [" + data.error.message + "]");
		data.messages.forEach(function(m) {
			console.log("    " + m);
		});
		console.log("");
		setTimeout(function() {
			process.exit(1);
		}, 1);
	}

	// export the execution function
	return {
		process : function(options) {
			processor(process.argv.length > 2 ? Array.prototype.slice.call(process.argv, 2) : options.build.split(" "), options);
		}
	};
})(global);
