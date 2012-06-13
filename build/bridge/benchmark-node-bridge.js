//include the fs module
var fs = require("fs"),
// sandboxing module
vm = require("vm"),
// path utilities
path = require("path"),
// read options from commandline
options = JSON.parse(process.argv[2]);

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
//window/global/root is a circualr reference
sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.root = sandbox;

//create a new context
var context = vm.createContext(sandbox);

// load the benchmark library into the sandbox
context.Benchmark = require(path.join(__dirname, "..", "perf/benchmark.js"));

// create a new global test suite
context.___benchmarks = new context.Benchmark.Suite();

// bind the response handlers to the parent process
context.___benchmarks.on("add", function(e) {
	var i = 0, test = e.target, testData = {
		id : test.id,
		name : test.name
	};

	// bind events
	test.on("start", function(e) {
		i = 0;
		process.send({
			event : "testStart",
			data : testData
		});
	}).on("cycle", function(e) {
		process.send({
			event : "testCycle",
			data : {
				id : this.id,
				name : this.name,
				size : ++i,
				count : this.count
			}
		});
	}).on("error", function(e) {
		process.send({
			event : "testError",
			data : testData
		});
	}).on("reset", function(e) {
		process.send({
			event : "testReset",
			data : testData
		});
	}).on("complete", function(e) {
		var data = {
			id : this.id,
			name : this.name,
			stats : this.stats,
			times : this.times,
			count : this.count,
			cycles : this.cycles,
			hz : this.hz
		};
		if (this.error) {
			data.error = this.error.message;
		}

		process.send({
			event : "testComplete",
			data : data
		});
	});
});

// notify the parent process that tests are finished
context.___benchmarks.on("complete", function() {
	process.send({
		event : "done",
		data : {}
	});
});

// wrapper function to add a test group
context.Benchmark.test = function(group, testGroup) {
	testGroup(function(name, test) {
		context.___benchmarks.add.call(context.___benchmarks, group + "." + name, test);
	});
};

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
load(options.source.src, options.dir.src);

// load up the test files
load(options.source.perf, options.dir.perf);

// start the tests
context.___benchmarks.run({
	async : true,
	queued : true
});
