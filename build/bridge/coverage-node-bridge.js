// include the fs module
var fs = require("fs"),
// sandboxing module
vm = require("vm"),
// path utilities
path = require("path"),
// read options from commandline
options = JSON.parse(process.argv[2]),
// misc variables
currentmodule;

// globals needed by qunit sandbox
var sandbox = {
	require : require,
	exports : {},
	setTimeout : setTimeout,
	setInterval : setInterval,
	clearTimeout : clearTimeout,
	clearInterval : clearInterval,
	console : console
};
// window/global/root is a circualr reference
sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.root = sandbox;

// create a new context
var context = vm.createContext(sandbox);

try {
	vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "qunit/qunit.js"), "utf8"), context);
} catch (err) {
	process.exit(1);
}

// have a global reference to QUnit within the sandbox
context.QUnit = context.exports;
context.exports = {};

// don't have qunit reorder tests
context.QUnit.config.reorder = false;

// add event listeners to the qunit test events
context.QUnit.log(function(data) {
	data.test = this.config.current.testName;
	data.module = currentmodule;
	process.send({
		event : "assertionDone",
		data : data
	});
});
context.QUnit.testStart(function(data) {
	// use last module name if no module name defined
	currentmodule = data.module || currentmodule;
	data.test = this.config.current.testName;
	data.module = currentmodule;
	process.send({
		event : "testStart",
		data : data
	});
});
context.QUnit.testDone(function(data) {
	// use last module name if no module name defined
	data.module = data.module || currentmodule;
	process.send({
		event : "testDone",
		data : data
	});
});
context.QUnit.moduleStart(function(data) {
	process.send({
		event : "moduleStart",
		data : data
	});
});
context.QUnit.moduleDone(function(data) {
	process.send({
		event : "moduleDone",
		data : data
	});
});

// override the done function to signal back to the parent process that this unit test is done
context.QUnit.done((function() {
	var timeout = null, later = function(data) {
		timeout = null;

		var coverage = {};
		Object.keys(context._$jscoverage).forEach(function(key) {
			coverage[key] = {
				lines : Array.prototype.slice.call(context._$jscoverage[key], 0),
				conditionals : context._$jscoverage[key].conditionals || []
			};
		});
		data.coverage = coverage;

		process.send({
			event : "done",
			data : data
		});
	};
	return function(data) {
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			later(data);
		}, 1000);
	};
})());

// load source and tests into the sandbox
function load(src, root) {
	var files = [];
	// build up the source file
	src.forEach(function(file) {
		try {
			files.push(fs.readFileSync(root + "/" + file, "utf8"));
		} catch (e) {
			console.log(e.message + " in " + file);
			process.exit(1);
		}
	});

	// run the source in the sandbox
	try {
		vm.runInContext(files.join("\n"), context);
	} catch (e) {
		console.log(e.message);
		process.exit(1);
	}
}

// load dependencies
load(options.source.external, options.dir.vendor);

// load up the source files
load(options.source.src, options.dir.coverage);

// load up the test files
load(options.source.tests, options.dir.test);
