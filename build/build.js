// include the fs mmodule
var fs = require("fs"),
// path utilities
path = require("path"),
// execute system commands
childProcess = require("child_process"),
// the util library
util = require("util"),
// quick reference to root dir
__DIR__ = path.dirname(__dirname),
// classify library
Classify = require("./vendor/classify/classify.min.js");
// require the special array library
require("./vendor/classify/classify-array.min.js")(Classify);
var cArray = Classify("/Array");
var colors = {
	black : 30,
	red : 31,
	green : 32,
	yellow : 33,
	blue : 34,
	magenta : 35,
	purple : 35,
	cyan : 36,
	white : 37
};

function gzip(data, callback) {
	var child = childProcess.spawn("gzip", [ "-c", "-q", "-" ]), output = "";
	// Promise events
	child.stdout.setEncoding("utf8");
	child.stdout.on("data", function(stdout) {
		output += stdout.toString();
	});
	child.on("exit", function(code) {
		callback(output, output.length);
	});
	child.stdin.end((data || "").toString(), "utf8");
}

var Build = Classify.create({
	__static_ : {
		defaultOptions : {
			name : "build",
			pkg : "package.json",
			version : "0.0.0",
			wrap : {},
			src : [],
			unit : [],
			perf : [],
			docs : [],
			external : [],
			env : {},
			lint : {},
			min : {},
			doc : {},
			build : "clean lint unit size concat min"
		},
		parseParams : function(params) {
			var opts = {
				build : [],
				subtract : []
			};
			params.forEach(function(arg) {
				// push which build options we want
				if (/^\w+$/.test(arg)) {
					opts.build.push(arg);
					return;
				}
				// push which build options we want to remove from the default build
				if (/^-\w+$/.test(arg)) {
					opts.subtract.push(arg);
					return;
				}
				// which options we want to parse for src, unit, perf, external
				if (/^-?\w+=/.test(arg)) {
					var parts = arg.split("="), name = parts.shift();
					opts[name] = parts.join("=").split(",");
					return;
				}
			});
			return opts;
		},
		build : function(options) {
			return Build(options, Array.prototype.slice.call(process.argv, 2)).build();
		}
	},
	init : function(options, params) {
		// merge the default options into the options array
		Object.keys(Build.defaultOptions).forEach(function(key) {
			if (options[key] == null) {
				options[key] = Build.defaultOptions[key];
			}
		});
		this.options = options;
		this.params = Build.parseParams(params);
		this.modifyOptionsFromParams();
		this.dir = {
			base : __DIR__,
			build : __DIR__ + "/build",
			dist : __DIR__ + "/dist",
			src : __DIR__ + "/src",
			perf : __DIR__ + "/perf",
			test : __DIR__ + "/test",
			coverage : __DIR__ + "/coverage",
			doc : __DIR__ + "/docs",
			vendor : __DIR__ + "/vendor"
		};
		this.sourceCache = {};
	},
	modifyOptionsFromParams : function() {
		var build = cArray().getNewObject(this.options.build ? this.options.build.split(" ") : []);

		if (this.params.build.length > 0) {
			build = cArray().getNewObject(this.params.build);
		} else if (this.params.subtract.length > 0) {
			build = build.diff(this.params.subtract);
		}

		this.steps = build;
	},
	getSource : function(callback) {
		if (this.sourceCache.full != null) {
			callback(this.sourceCache.full);
			return;
		}
		var self = this, intro = "", outro = "", src = "", data, options = this.options;
		(options.wrap && options.wrap.intro || []).forEach(function(file) {
			intro += fs.readFileSync(self.dir.src + "/" + file, "utf-8");
		});
		(options.wrap && options.wrap.outro || []).forEach(function(file) {
			outro += fs.readFileSync(self.dir.src + "/" + file, "utf-8");
		});
		(options.src || []).forEach(function(file) {
			src += fs.readFileSync(self.dir.src + "/" + file, "utf-8");
		});

		data = intro + src + outro;
		data = data.replace(/@VERSION\b/g, options.version);
		data.replace(/@DATE\b/g, (new Date()).toUTCString());
		if (this.options.sourceReplace) {
			var replacer = this.options.sourceReplace;
			Object.keys(replacer).forEach(function(key) {
				data = data.replace(new RegExp("@" + key + "\\b", "g"), replacer[key]);
			});
		}
		this.sourceCache.full = data;
		callback(data);
	},
	getMinifiedSource : function(callback) {
		if (this.sourceCache.min != null) {
			callback(this.sourceCache.min);
			return;
		}
		var parser = require(this.dir.build + "/vendor/uglify/parse-js");
		var uglify = require(this.dir.build + "/vendor/uglify/process");
		var consolidator = require(this.dir.build + "/vendor/uglify/consolidator");
		var options = this.options;
		var self = this;

		this.getSource(function(src) {
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
			var data = uglify.gen_code(ast, options.min.generate);
			self.sourceCache.min = data;
			callback(data);
		});
	},
	getGzippedSource : function(callback) {
		if (this.sourceCache.gzip != null) {
			callback(this.sourceCache.gzip);
			return;
		}
		var self = this;
		this.getMinifiedSource(function(src) {
			gzip(src, function(data) {
				self.sourceCache.gzip = data;
				callback(data);
			});
		});
	},
	getCopyright : function(callback) {
		if (this.sourceCache.copyright != null) {
			callback(this.sourceCache.copyright);
			return;
		}
		var self = this, copy = "", options = this.options;
		(options.wrap.copy || []).forEach(function(file) {
			copy += fs.readFileSync(self.dir.src + "/" + file, "utf-8");
		});
		copy = copy.replace(/@VERSION\b/g, options.version);
		copy = copy.replace(/@DATE\b/g, (new Date()).toUTCString());
		if (this.options.sourceReplace) {
			var replacer = this.options.sourceReplace;
			Object.keys(replacer).forEach(function(key) {
				copy = copy.replace(new RegExp("@" + key + "\\b", "g"), replacer[key]);
			});
		}
		this.sourceCache.copyright = copy;
		callback(copy);
	},
	readCacheFile : function(name, callback) {
		fs.readFile(this.dir.build + "/.cache." + name + ".json", "utf8", function(error, data) {
			if (error) {
				callback(null);
				return;
			}
			try {
				callback(JSON.parse(data));
			} catch (e) {
				callback(null);
			}
		});
	},
	writeCacheFile : function(name, data, callback) {
		fs.writeFile(this.dir.build + "/.cache." + name + ".json", JSON.stringify(data, true), "utf8", function() {
			callback();
		});
	},
	build : function() {
		this.startTime = new Date();
		this.steps.serialEach(this.processStep, this.onComplete, this);
	},
	processStep : function(next, step, index) {
		var self = this;
		this.time = (+new Date());
		try {
			require(this.dir.build + "/module/" + step.toLowerCase())(this, function(data) {
				data = data || {};
				data.name = step;
				if (!data.time) {
					data.time = (+new Date()) - self.time;
				}
				// trigger error handler
				if (data.error) {
					self.onError(data);
					return;
				}
				self.printLine("Finished in " + self.color((data.time / 1000).toFixed(3), 171) + " seconds.\n");
				next();
			});
		} catch (e) {
			this.onError({
				name : step,
				error : e,
				time : 0
			});
		}
	},
	onError : function(data) {
		this.printLine();
		this.printHeader(this.color("\u2716 ", 160) + "Build process failed on: " + this.color(data.name, 160) + " [" + data.error.message + " " + (data.error.stack.split("\n")[1] || "").trim() + "]\n");
		this.stop();
	},
	onComplete : function() {
		var time = (+new Date()) - this.startTime;
		this.printHeader(this.color("\u2714 ", 34) + "Build process completed in " + this.color((time / 1000).toFixed(3), 171) + " seconds.\n");
		setTimeout(function() {
			process.exit(0);
		}, 1);
	},
	printHeader : function() {
		process.stdout.write("\x1B[2K" + util.format.apply(this, arguments) + "\n");
	},
	printLine : function() {
		process.stdout.write("\x1B[2K" + "    " + util.format.apply(this, arguments) + "\n");
	},
	printTemp : function() {
		process.stdout.write("\x1B[2K" + "    " + util.format.apply(this, arguments) + "\r");
	},
	print : function() {
		process.stdout.write(util.format.apply(this, arguments));
	},
	lpad : function(str, len, chr) {
		var padLength = len - (str + "").replace(/\\x1B\[[0-9;]+m/g, "").length;
		return Array(padLength + 1).join(chr || " ") + str;
	},
	rpad : function(str, len, chr) {
		var padLength = len - (str + "").replace(/\\x1B\[[0-9;]+m/g, "").length;
		return str + Array(padLength + 1).join(chr || " ");
	},
	color : function(string, color) {
		if (typeof color === "number") {
			return "\x1B[38;5;" + color + "m" + string + "\x1B[0m";
		}
		if (color === "bold") {
			return "\x1B[1m" + string + "\x1B[0m";
		}
		return "\x1B[" + colors[color] + "m" + string + "\x1B[0m";
	},
	formatNumber : function(number) {
		number = String(number).split(".");
		return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ",") + (number[1] ? "." + number[1] : "");
	},
	stop : function() {
		setTimeout(function() {
			process.exit(1);
		}, 1);
	}
});

module.exports = Build;
