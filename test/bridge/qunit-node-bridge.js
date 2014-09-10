"use strict";
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
	console : console,
	attachEvent : function(event, method) {
		setTimeout(function() {
			method.call(sandbox);
		}, 1);
	}
};
// window/global/root is a circualr reference
sandbox.window = sandbox;
sandbox.global = sandbox;

// create a new context
var context = vm.createContext(sandbox);

// load source and tests into the sandbox
function load(src) {
	if (!src) {
		return;
	}
	if (!Array.isArray(src)) {
		src = [ src ];
	}
	// build up the source file
	src.forEach(function(file) {
		try {
			vm.runInContext(fs.readFileSync(path.join(options.dir, file), "utf8"), context, path.join(options.dir, file));
		} catch (e) {
			console.log(e.message + " in " + file);
			process.exit(1);
		}
	});
}

// have a global reference to QUnit within the sandbox
context.QUnit = require(path.join(options.dir, "vendor/qunit/qunit/qunit.js"));
context.exports = {};
delete context.window;

// don't have qunit reorder tests
context.QUnit.config = context.QUnit.config || {};
context.QUnit.config.reorder = false;
context.QUnit.config.autorun = true;

// add event listeners to the qunit test events
context.QUnit.log(function(data) {
	data.test = data.name;
	data.module = currentmodule;
	process.send({
		event : "assertionDone",
		data : data
	});
});
context.QUnit.testStart(function(data) {
	// use last module name if no module name defined
	currentmodule = data.module || currentmodule;
	data.test = data.name;
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

if (options.setUp) {
	vm.runInContext("(" + options.setUp + ").call(this);", context);
}

// load dependencies
load(options.data.deps);

// load up the source files
load(options.data.code);

// load up the test files
load(options.data.tests);

// start the qunit tests...
context.QUnit.load();
