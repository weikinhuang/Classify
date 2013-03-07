module.exports = function(build) {
	// adds a list of benchmark tests that will be run
	build.addBenchmarkFile("create.js");

	// sets the list of environments that this code can run against
	build.enableEnvironment("node", "web");

	// set the default set of tasks that should be run by default when called with no build args
	build.setDefaultTasks("unit", "size");

	// set options for the documentation generator
	build.addTaskOptions("doc", {
		markdown : "README",
		html : "classifyjs.com",
		files : [ "classify.docs.js" ],
		examples : [
					"examples/doc.js",
					"examples/Classify.js",
					"examples/Classify.Class.js",
					"examples/Classify.Namespace.js",
					"examples/Classify.Observer.js",
					"examples/Classify.export.js",
					"examples/mutator.js",
					"examples/mutator.alias.js",
					"examples/mutator.bind.js",
					"examples/mutator.nowrap.js",
					"examples/mutator.observable.js",
					"examples/mutator.static.js"
					]
	});
};
