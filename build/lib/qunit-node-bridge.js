// include the fs module
var fs = require("fs"),
// sandboxing module
vm = require("vm"),
// path utilities
path = require("path"),
// quick reference to root dir
workdir = path.dirname(path.dirname(__dirname)),
// path the the src dir
srcdir = workdir + "/src",
// path the the test dir
testdir = workdir + "/test",
// read options from commandline
options = JSON.parse(process.argv[2]),
// path to the qunit library
qunitPath = path.join(__dirname, "..", "qunit/qunit.js"),
// misc variables
currentTest;

// globals needed by qunit
var sandbox = {
	require : require,
	exports : {},
	window : {
		setTimeout : setTimeout,
		setInterval : setInterval
	},
	console : console,
	clearTimeout : clearTimeout,
	clearInterval : clearInterval
};

try {
	vm.runInNewContext(fs.readFileSync(qunitPath, "utf-8"), sandbox, qunitPath);
} catch (err) {
	process.exit(1);
}

// append these properties to the sandbox
sandbox.root = sandbox.window;
sandbox.QUnit = sandbox.exports;

sandbox.QUnit.testStart(function(test) {
	// currentTest is undefined while first test is not done yet
	currentTest = test.name;

	// use last module name if no module name defined
	currentModule = test.module || currentModule;
});

sandbox.QUnit.log(function(data) {
	data.test = this.config.current.testName;
	data.module = currentModule;
	process.send({
		event : "assertionDone",
		data : data
	});
});

sandbox.QUnit.testDone(function(data) {
	// use last module name if no module name defined
	data.module = data.module || currentModule;

	process.send({
		event : "testDone",
		data : data
	});
});

sandbox.QUnit.done((function() {
	var timeout, later = function(data) {
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

function load(src, root) {
	// keep appending the source to the sandbox
	src.forEach(function(file) {
		try {
			vm.runInNewContext(fs.readFileSync(root + "/" + file, "utf-8"), sandbox, qunitPath);
		} catch (e) {
			console.log(e.message);
			console.log(file);
		}
	});
}

// load up the source files
load(options.src, srcdir);

// load up the test files
load(options.tests, testdir);