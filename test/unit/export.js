module("export");

test("check globally accessable Classify object", function() {
	ok(Classify.__isclass_, "Classify global object is a class");

	same(Classify.create, create, "Create functionality is bound to the static instance of the class");
	equals(Classify.getNamespace, getNamespace, "get namespace functionality is bound to the static instance of the class");
	equals(Classify.destroyNamespace, destroyNamespace, "destroy namespace functionality is bound to the static instance of the class");
});

test("invoking global Classify object", function() {
	// object parameters creates class objects
	var test = Classify({
		a : 1
	});
	equals(typeof test, "function", "object parameter creates a class");

	// single string parameter returns the namespace
	equals(Classify("Abc"), getNamespace("Abc"), "single string parameter returns the namespace");

	// multiple parameters starting with a string returns a class within a namespace
	test = Classify("Abc", "D", {
		a : 1
	});
	equals(test, getNamespace("Abc").D, "named parameter and multiple arguments create a class within a namespace");
});

test("constructing global Classify object", function() {
	// creating a new class and instantiating it
	var test = new Classify({
		a : 0,
		init : function(a) {
			this.a = a;
		}
	}, [ 1 ]);
	equals(typeof test, "object", "instantiated Classify object is an object");
	equals(test.a, 1, "instantiated Classify object calls new class constructor and is an instance of created class");

	// constructing a new class through the use of "new Classify"
	test = getNamespace("Abcd").create("E", {
		a : 1
	});
	ok(new Classify("Abcd", "E", []) instanceof test, "instantiated Classify object is an instance of the instantiated class");
	ok(!(new Classify("Abcd", "E", []) instanceof Classify), "instantiated Classify object is not an instance of the instantiated Classify");
});
