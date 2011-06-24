// Create a wrapped reference to the Classify object.
var Classify = Create({
	_invoke_ : function() {
		var args = argsToArray(arguments), ns, name;
		// if the first parameter is a string
		if (typeof args[0] === "string") {
			// and there is only 1 arguments, then we just want the namespace
			if (args.length === 1) {
				return getNamespace(args[0]);
			}
			// otherwise the first dot name is the namespace and we want to create a class
			name = args[0].split(".");
			if (name.length < 2) {
				throw "A named call must contain the namespace and class name";
			}
			ns = getNamespace(name.shift());
			args[0] = name.join(".");
			return ns.create.apply(ns, args);
		}
		return Create.apply(null, args);
	},
	_construct_ : function() {
		throw "Classify object cannot be instantiated!";
	}
});
// store clean references to these methods
Classify.Create = Create;
Classify.GetNamespace = getNamespace;
Classify.DestroyNamespace = destroyNamespace;

// Export the Classify object for **CommonJS**, with backwards-compatibility for the
// old "require()" API. If we're not in CommonJS, add "Classify" to the global object.
if (typeof module !== "undefined" && module.exports) {
	module.exports = Classify;
	// create a circular reference
	Classify.Classify = Classify;
}

// always attempt to make a global reference
root.Classify = Classify;
