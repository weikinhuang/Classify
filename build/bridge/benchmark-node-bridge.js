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
	console : console,
	Object : Object,
	Function : Function,
	Boolean : Boolean,
	Number : Number,
	String : String,
	RegExp : RegExp,
	Array : Array,
	Date : Date,
	Error : Error
};
// window is a circualr reference
sandbox.window = sandbox;

// load the benchmark library into the sandbox
sandbox.Benchmark = require(path.join(__dirname, "..", "perf/benchmark.js"));

// keep a reference to the "root" variable
sandbox.root = sandbox.window;

// create a new global test suite
sandbox.___benchmarks = new sandbox.Benchmark.Suite();

// bind the response handlers to the parent process
sandbox.___benchmarks.on("add", function(e) {
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
sandbox.___benchmarks.on("complete", function() {
	process.send({
		event : "done",
		data : {}
	});
});

// wrapper function to add a test group
sandbox.Benchmark.test = function(group, testGroup) {
	testGroup(function(name, test) {
		sandbox.___benchmarks.add.call(sandbox.___benchmarks, group + "." + name, test);
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
		vm.runInNewContext(files.join("\n"), sandbox);
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
sandbox.___benchmarks.run({
	async : true,
	queued : true
});
