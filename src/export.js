// Create a wrapped reference to the Classify object.
var Classify = create({
	invoke : function() {
		var args = argsToArray(arguments), ns, length = args.length;
		// if the first parameter is a string
		if (typeof args[0] === string) {
			// and there is only 1 arguments, then we just want the namespace
			if (length === 1) {
				return getNamespace(args[0]);
			}
			// if we passed in 2 arguments of strings then we want a class within a namespace
			if (length === 2 && typeof args[1] === string) {
				return getNamespace(args[0]).ref[args[1]];
			}
			// otherwise we will assume the first parameter is the namespace and the others are creation parameters
			ns = getNamespace(args.shift());
			return ns.create.apply(ns, args);
		}
		return create.apply(null, args);
	},
	init : function() {
		var args = argsToArray(arguments), params = args.pop(), tmp;
		if (args.length < 1) {
			throw "Classify object cannot be instantiated!";
		}
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
Classify.create = create;
Classify.getNamespace = getNamespace;
Classify.destroyNamespace = destroyNamespace;
Classify.testNamespace = testNamespace;
Classify.getGlobalNamespace = getGlobalNamespace;

// provide functionality to allow for name provisioning
Classify.provide = function(namespace, base) {
	return provide(namespace, base || root || {});
};

// Export the Classify object for **CommonJS**, with backwards-compatibility for the
// old "require()" API. If we're not in CommonJS, add "Classify" to the global object.
if (typeof module !== "undefined" && module.exports) {
	module.exports = Classify;
	// create a circular reference
	Classify.Classify = Classify;
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
