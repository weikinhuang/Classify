var examples = module.exports = {};

examples["summary-base"] = function() {
	// Different ways to call Classify

	// Calling Classify with a string returns a namespace
	// @see Classify.getNamespace
	Classify("Life") === Classify.getNamespace("Life");

	// Calling Classify with a string ending in a "/" returns a namespace
	// @see Classify.getNamespace
	Classify("Life/") === Classify.getNamespace("Life");

	// Calling Classify with a string separated by "/" returns a defined
	// class within a namespace
	// @see Classify.Namespace.get
	Classify("Life/Eukaryotes") === Classify.getNamespace("Life").get("Eukaryotes");

	// Calling Classify with 2 string parameters returns a defined class within
	// a namespace
	// @see Classify.Namespace.get
	Classify("Life", "Eukaryotes") === Classify.getNamespace("Life").get("Eukaryotes");

	// Calling Classify with first parameter as a string, and second parameter as
	// an object, creates a class within the namespace
	var Eukaryotes = Classify("Life/Eukaryotes", {
		init : function() {
		}
	});
	// Calling Classify with first parameter as a string, second parameter as a string, and
	// third parameter as an object, creates a class within the namespace
	var Eukaryotes = Classify("Life", "Eukaryotes", {
		init : function() {
		}
	});
	// The above 2 statements are the same as the following statement to create classes
	// @see Classify.Namespace.create
	var Eukaryotes = Classify.getNamespace("Life").create("Eukaryotes", {
		init : function() {
		}
	});

	// To inherit from other classes, the first parameter is the class name, second parameter
	// is the parent (can be from other namespaces with "Namespace/Class"), third parameter
	// is the descriptor
	var Plantae = Classify("Life/Plantae", "Eukaryotes", {
		init : function() {
		}
	});
	// The same can be achieved with the following signature
	var Plantae = Classify("Life", "Plantae", "Eukaryotes", {
		init : function() {
		}
	});
	// The above 2 statements are the same as the following statement to create classes
	// @see Classify.Namespace.create
	var Plantae = Classify.getNamespace("Life").create("Plantae", "Eukaryotes", {
		init : function() {
		}
	});

	// Calling Classify with objects with create classes with the object descriptor.
	// Using the Classify method in this manner is analogous to calling Classify.create()
	// Please see Classify.create for documentation
	// @see Classify.create
	var Embryophytes = Classify({
		init : function() {
		}
	});
	// The above statement is the same as
	var Embryophytes = Classify.create({
		init : function() {
		}
	});
}