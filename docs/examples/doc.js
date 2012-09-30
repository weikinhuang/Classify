var examples = module.exports = {};

examples["summary-base"] = function() {
	// Different ways to call Classify

	// Calling Classify with a string returns a namespace
	// @see Classify.getNamespace
	Classify("Vehicles") === Classify.getNamespace("Vehicles");

	// Calling Classify with a string ending in a "/" returns a namespace
	// @see Classify.getNamespace
	Classify("Vehicles") === Classify.getNamespace("Vehicles");

	// Calling Classify with a string separated by "/" returns a defined
	// class within a namespace
	// @see Classify.Namespace.get
	Classify("Vehicles/Ship") === Classify.getNamespace("Vehicles").get("Ship");

	// Calling Classify with 2 string parameters returns a defined class within
	// a namespace
	// @see Classify.Namespace.get
	Classify("Vehicles", "Ship") === Classify.getNamespace("Vehicles").get("Ship");

	// Calling Classify with first parameter as a string, and second parameter as
	// an object, creates a class within the namespace
	var Ship = Classify("Vehicles/Ship", {
		init : function() {
		}
	});
	// Calling Classify with first parameter as a string, second parameter as a string, and
	// third parameter as an object, creates a class within the namespace
	var Ship = Classify("Vehicles", "Ship", {
		init : function() {
		}
	});
	// The above 2 statements are the same as the following statement to create classes
	// @see Classify.Namespace.create
	var Ship = Classify.getNamespace("Vehicles").create("Ship", {
		init : function() {
		}
	});

	// To inherit from other classes, the first parameter is the class name, second parameter
	// is the parent (can be from other namespaces with "Namespace/Class"), third parameter
	// is the descriptor
	var Battleship = Classify("Vehicles/Battleship", "Ship", {
		init : function() {
		}
	});
	// The same can be achieved with the following signature
	var Battleship = Classify("Vehicles", "Battleship", "Ship", {
		init : function() {
		}
	});
	// The above 2 statements are the same as the following statement to create classes
	// @see Classify.Namespace.create
	var Battleship = Classify.getNamespace("Vehicles").create("Battleship", "Ship", {
		init : function() {
		}
	});

	// Calling Classify with objects with create classes with the object descriptor.
	// Using the Classify method in this manner is analogous to calling Classify.create()
	// Please see Classify.create for documentation
	// @see Classify.create
	var Energy = Classify({
		init : function() {
		}
	});
	// The above statement is the same as
	var Energy = Classify.create({
		init : function() {
		}
	});
};