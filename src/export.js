// Create a wrapped reference to the Classify object.
var Classify = Create({
	_invoke_ : function() {
		return Create.apply(null, arguments);
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
