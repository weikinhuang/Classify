// Create a wrapped reference to the Classify object.
var Classify = function() {
	return Classify.Create.apply(null, arguments);
};

// Export the Underscore object for **CommonJS**, with backwards-compatibility for the
// old "require()" API. If we're not in CommonJS, add "Classify" to the global object.
if (typeof module !== "undefined" && module.exports) {
	module.exports = Classify;
	// create a circular reference
	Classify.Classify = Classify;
}

// always attempt to make a global reference
root.Classify = Classify;