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
		build : function(config) {
			return Build(config || require(__DIR__ + "/config.js")).build();
		}
	},
	init : function(config) {
		this.sourceCache = {};
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

		// default values for file sources
		this.wrap = {};
		this.src = [];
		this.unit = [];
		this.perf = [];
		this.external = [];
		this.env = {};
		this.name = "";
		this.version = "0.0.0";
		this.repoUrl = "";

		this.optStore = null;
		this.options = {};
		this.taskOptions = {};
		this.replaceTokens = [];
		this.currentStep = null;
		this.defaultTasks = [];

		// call the config function to populate the internal options
		config(this);

		this.writeParsedOptions();
	},

	setNameVersion : function(name, version) {
		this.name = name;
		this.version = version || "0.0.0";
		return this;
	},
	setRepoName : function(repo) {
		this.repoUrl = repo;
		return this;
	},
	addSourceFile : function() {
		this.src.push.apply(this.src, Array.isArray(arguments[0]) ? arguments[0] : arguments);
		return this;
	},
	addUnitTestFile : function() {
		this.unit.push.apply(this.unit, Array.isArray(arguments[0]) ? arguments[0] : arguments);
		return this;
	},
	addBenchmarkFile : function() {
		this.perf.push.apply(this.perf, Array.isArray(arguments[0]) ? arguments[0] : arguments);
		return this;
	},
	addExternalFile : function() {
		this.external.push.apply(this.external, Array.isArray(arguments[0]) ? arguments[0] : arguments);
		return this;
	},
	addCopyright : function() {
		if (!this.wrap.copy) {
			this.wrap.copy = [];
		}
		this.wrap.copy.push.apply(this.wrap.copy, Array.isArray(arguments[0]) ? arguments[0] : arguments);
		return this;
	},
	addSourceWrap : function() {
		if (!this.wrap.wrap) {
			this.wrap.wrap = [];
		}
		this.wrap.wrap.push.apply(this.wrap.wrap, Array.isArray(arguments[0]) ? arguments[0] : arguments);
		return this;
	},
	addReplaceToken : function(name, value) {
		this.replaceTokens.push({
			name : name,
			value : value
		});
		return this;
	},
	enableEnvironment : function() {
		var self = this;
		Array.prototype.slice.call(Array.isArray(arguments[0]) ? arguments[0] : arguments, 0).forEach(function(env) {
			self.env[env] = true;
		});
		return this;
	},
	addTaskOptions : function(name, options) {
		this.taskOptions[name] = options || {};
		return this;
	},
	addOption : function(name, options) {
		this.options[name] = options || {};
		return this;
	},
	setDefaultTasks : function() {
		this.defaultTasks.push.apply(this.defaultTasks, Array.isArray(arguments[0]) ? arguments[0] : arguments);
		return this;
	},
	writeParsedOptions : function() {
		var data = {};
		data.name = this.name;
		data.src = this.src;
		data.unit = this.unit;
		data.perf = this.perf;
		data.external = this.external;
		this.writeCacheFile("options", data, true, "module.exports = %j;");
	},

	getOption : function(name) {
		var self = this, opt = null, temp;

		// try to pull from the task options first
		if (this.currentStep !== null && this.taskOptions[this.currentStep]) {
			// do a nested loop to check the options object
			temp = this.taskOptions[this.currentStep];
			name.split(".").some(function(part, i) {
				// skip the first step if it's name is the same as the step
				if (!part || i === 0 && part === self.currentStep) {
					return;
				}
				if (temp == null || !temp.hasOwnProperty(part)) {
					temp = null;
					return false;
				}
				temp = temp[part];
			});
			if (temp != null) {
				return temp;
			}
		}

		// do a nested loop to check the options object
		temp = this.options;
		name.split(".").some(function(part) {
			if (temp == null || !temp.hasOwnProperty(part)) {
				temp = null;
				return false;
			}
			temp = temp[part];
		});
		if (temp != null) {
			return temp;
		}
		// check params array
		Array.prototype.slice.call(process.argv, 2).some(function(param) {
			if (param.indexOf("--" + name + "=") === 0) {
				opt = param.replace(new RegExp("^--" + name.replace(/\./g, "\\.") + "="), "").replace(/^["']+|["']+$/g, "");
				return false;
			}
		});
		if (opt != null) {
			return opt;
		}
		// then check the local config file
		if (this.optStore === null) {
			this.optStore = this.readCacheFile("config", true) || {};
		}

		// do a nested loop to check the options object
		temp = this.optStore;
		name.split(".").some(function(part) {
			if (temp == null || !temp.hasOwnProperty(part)) {
				temp = null;
				return false;
			}
			temp = temp[part];
		});
		if (temp != null) {
			return temp;
		}

		// lastly try to pull from a different task option
		if (this.taskOptions[name]) {
			return this.taskOptions[name];
		}

		return null;
	},

	getSource : function(callback) {
		if (this.sourceCache.full != null) {
			callback(this.sourceCache.full);
			return;
		}
		var self = this, data = "";
		this.src.forEach(function(file) {
			data += fs.readFileSync(self.dir.src + "/" + file, "utf8");
		});
		(this.wrap && this.wrap.wrap || []).forEach(function(file) {
			data = fs.readFileSync(self.dir.src + "/" + file, "utf8").replace(/"@SOURCE\b";/g, data);
		});

		data = data.replace(/@VERSION\b/g, this.version);
		data.replace(/@DATE\b/g, (new Date()).toUTCString());

		this.replaceTokens.forEach(function(token) {
			data = data.replace(new RegExp("@" + token.name + "\\b", "g"), token.value);
		});
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
		var options = this.getOption("min") || {};
		var self = this;

		this.getSource(function(src) {
			if (options.preparse) {
				src = options.preparse(src);
			}

			// parse code and get the initial AST
			var ast = parser.parse(src, options.strict_semicolons || false);

			if (options.consolidate) {
				ast = consolidator.ast_consolidate(ast);
			}
			if (options.lift_vars) {
				ast = uglify.ast_lift_variables(ast);
			}

			// get a new AST with mangled names
			if (options.mangle) {
				ast = uglify.ast_mangle(ast, options.mangle);
			}

			// get an AST with compression optimizations
			if (options.squeeze) {
				options.squeeze.keep_comps = !(options.unsafe || false);
				ast = uglify.ast_squeeze(ast, options.squeeze);

				// unsafe optimizations
				if (options.unsafe) {
					ast = uglify.ast_squeeze_more(ast);
				}
			}

			// compressed code here
			var data = uglify.gen_code(ast, options.generate);
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
		var self = this, copy = "";
		(this.wrap.copy || []).forEach(function(file) {
			copy += fs.readFileSync(self.dir.src + "/" + file, "utf8");
		});
		copy = copy.replace(/@VERSION\b/g, this.version);
		copy = copy.replace(/@DATE\b/g, (new Date()).toUTCString());
		this.replaceTokens.forEach(function(token) {
			copy = copy.replace(new RegExp("@" + token.name + "\\b", "g"), token.value);
		});
		this.sourceCache.copyright = copy;
		callback(copy);
	},
	readCacheFile : function(name, callback) {
		var filename = this.dir.build + "/.cache." + name + ".json";
		if (callback === true) {
			try {
				return JSON.parse(fs.readFileSync(filename, "utf8"));
			} catch (e) {
				return null;
			}
		} else {
			fs.readFile(filename, "utf8", function(error, data) {
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
		}
	},
	writeCacheFile : function(name, data, callback, format) {
		var filename = this.dir.build + "/.cache." + name + ".json";
		if (callback === true) {
			fs.writeFileSync(filename, util.format(format || "%j", data), "utf8");
		} else {
			fs.writeFile(filename, util.format(format || "%j", data), "utf8", function() {
				callback();
			});
		}
	},
	build : function() {
		var steps = [];
		Array.prototype.slice.call(process.argv, 2).forEach(function(arg) {
			// push which build options we want
			if (/^\w+$/.test(arg)) {
				steps.push(arg);
			}
		});
		this.steps = cArray().getNewObject(steps.length === 0 ? (this.defaultTasks || []) : steps);
		this.startTime = new Date();
		this.steps.serialEach(this.processStep, this.onComplete, this);
	},
	processStep : function(next, step, index) {
		var self = this;
		this.time = (+new Date());
		this.currentStep = step.toLowerCase();
		try {
			require(this.dir.build + "/module/" + this.currentStep + ".js")(this, function(data) {
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
				self.currentStep = null;
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
