// quick reference to the seperator string
var namespace_separator = "/",
// Create a wrapped reference to the Classify object.
Classify = create({
	invoke : function() {
		var args = argsToArray(arguments), length = args.length, ns, tmp;
		// no arguments will return the global namespace
		if (length === 0) {
			return getNamespace();
		}
		// if the first parameter is a string
		if (typeof args[0] === string) {
			// and there is only 1 arguments
			if (length === 1) {
				tmp = args[0].split(namespace_separator);
				ns = getNamespace(tmp[0]);
				// and it was separated with "/" then get the class
				if (tmp[1]) {
					return ns.get(tmp[1]);
				}
				// otherwise we just want the namespace
				return ns;
			}
			// if we passed in 2 arguments of strings then we want a class within a namespace
			if (length === 2 && typeof args[1] === string) {
				return getNamespace(args[0]).get(args[1]);
			}
			// otherwise we will assume the first parameter is the namespace
			tmp = args.shift().split(namespace_separator);
			ns = getNamespace(tmp[0]);
			// if the first parameter was a string, and separated with "/" then that is the class name
			if (tmp[1]) {
				args.unshift(tmp[1]);
			}
			// now create a new class within the context of the selected namespace
			return ns.create.apply(ns, args);
		}
		// otherwise they are just class creation parameters
		return create.apply(null, args);
	},
	init : function() {
		var args = argsToArray(arguments), params, tmp;
		if (args.length < 1) {
			throw new Error("Classify object cannot be instantiated!");
		}
		params = isArray(args[args.length - 1]) ? args.pop() : [];
		tmp = Classify.invoke.apply(null, args);
		// if we found a class, instantiate it
		if (tmp.__isclass_) {
			return tmp.applicate(params);
		}
		// otherwise, just return it
		return tmp;
	}
});

// store clean references to these methods
extend(Classify, {
	// object version number
	version : "@VERSION",

	// direct access functions
	create : create,
	getNamespace : getNamespace,
	destroyNamespace : destroyNamespace,
	testNamespace : testNamespace,
	getGlobalNamespace : getGlobalNamespace,

	// utility function to provide functionality to quickly add properties to objects
	extend : extend,
	// utility function to provide functionality to allow for name provisioning
	provide : function(namespace, base) {
		return provide(namespace.split("."), base || root || {});
	}
});

// Export the Classify object for **CommonJS**, with backwards-compatibility for the
// old "require()" API. If we're not in CommonJS, add "Classify" to the global object.
if (typeof root.module !== "undefined" && root.module.exports) {
	root.module.exports = Classify;
	// create a circular reference
	Classify.Classify = Classify;
} else if (typeof root.define === "function" && root.define.amd) {
	// Export Classify as an AMD module only if there is a AMD module loader,
	// use lowercase classify, because AMD modules are usually loaded with filenames
	// and Classify would usually be loaded with lowercase classify.js
	root.define("classify", function() {
		return Classify;
	});
} else {
	// store previous value of root.Classify
	var root_value = root.Classify;

	// otherwise attempt to make a global reference
	root.Classify = Classify;

	// Run Classify.js in "noConflict" mode, returning the "Classify" variable to its
	// previous value. Returns a reference to the Classify object.
	Classify.noConflict = function() {
		if (root_value === undefined) {
			delete root.Classify;
		} else {
			root.Classify = root_value;
		}
		return Classify;
	};
}