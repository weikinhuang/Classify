module("export");

test("check globally accessable Classify object", function() {
	ok(Classify.__isclass_, "Classify global object is a class");

	same(Classify.create, create, "Create functionality is bound to the static instance of the class");
	equals(Classify.getNamespace, getNamespace, "get namespace functionality is bound to the static instance of the class");
	equals(Classify.destroyNamespace, destroyNamespace, "destroy namespace functionality is bound to the static instance of the class");
	equals(Classify.testNamespace, testNamespace, "test namespaces is bound to the static instance of the class");
	equals(Classify.getGlobalNamespace, getGlobalNamespace, "get global namespace functionality is bound to the static instance of the class");
});

test("invoking global Classify object with string", function() {
	// calling classify with no parameters
	equals(Classify(), getGlobalNamespace(), "Classify with no parameters provides global namespace");

	var export1 = getNamespace("Export1");
	var test = export1.create("A", {
		a : 1
	});

	// calling classify with single string parameter
	// single string parameter returns the namespace
	equals(Classify("Export1"), getNamespace("Export1"), "single string parameter returns the namespace");

	// single string parameter with a / and nothing after should return a namespace
	equals(Classify("Export1/"), getNamespace("Export1"), "single string parameter returns the namespace");

	// single string parameter with a / and nothing after should return a namespace
	equals(Classify("Export1/A"), test, "single string parameter with a '/' return a class within the namespace");
	equals(Classify("Export1/nonexist"), null, "single string parameter with a '/' with non existient class returns null");

	// calling classify with two string parameters
	equals(Classify("Export1", "A"), test, "two string parameters return a class within the namespace");
	equals(Classify("Export1", "nonexist"), null, "two string parameters with non existient class returns null");

	// calling classify with first parameter string and mixed parameters
	equals(Classify("Export1/B", {}), getNamespace("Export1").get("B"), "first parameter string with '/' creates a class in namespace");
	equals(Classify("Export1", "C", {}), getNamespace("Export1").get("C"), "two string parameters creates a class in namespace");

	// calling classify with first parameter string and parent class creation
	test = Classify("Export1", "D", "C", {});
	equals(test, getNamespace("Export1").get("D"), "3 string parameters create a class in namespace with parent");
	ok((new test()) instanceof getNamespace("Export1").get("C"), "3 string parameters create a class in namespace with parent is instance of parent");

	test = Classify("Export1/E", "C", {});
	equals(test, getNamespace("Export1").get("E"), "2 string parameters create a class in namespace with parent");
	ok((new test()) instanceof getNamespace("Export1").get("C"), "2 string parameters create a class in namespace with parent is instance of parent");
});

test("invoking global Classify object with object", function() {
	// object parameters creates class objects
	var test = Classify({
		a : 1
	});
	equals(typeof test, "function", "object parameter creates a class");
	ok(test.__isclass_, "object parameter creates a class with create");

	// 2 object parameters creates class objects
	var test2 = Classify(test, {});
	equals(typeof test2, "function", "2 object parameters creates a class");
	ok(test2.__isclass_, "2 object parameters creates a class with create");
	ok(new test2() instanceof test, "2 object parameters creates a class with inheritance");
});

test("constructing global Classify object", function() {
	var definition = {
		a : 0,
		init : function(a) {
			this.a = a || 0;
		}
	};

	// creating a new class and instantiating it
	var test = new Classify(definition);
	equals(typeof test, "object", "instantiated Classify object is an object");
	equals(test.a, 0, "instantiated Classify object calls new class constructor and is an instance of created class");

	// creating a new class and instantiating it with parameters
	test = new Classify(definition, [ 1 ]);
	equals(typeof test, "object", "instantiated Classify object with parameters is an object");
	equals(test.a, 1, "instantiated Classify object with parameters calls new class constructor and is an instance of created class");

	// instantiating but retrieving a namespace
	test = new Classify("Export3");
	equals(test, getNamespace("Export3"), "instantiated Classify object for namespace will return the namespace");

	// constructing a new class through the use of "new Classify"
	test = getNamespace("Export3").create("E", definition);
	ok(new Classify("Export3", "E") instanceof test, "instantiated Classify object is an instance of the instantiated class");
	ok(!(new Classify("Export3", "E") instanceof Classify), "instantiated Classify object is not an instance of the instantiated Classify");

	ok(new Classify("Export3", "E", [ 1 ]) instanceof test, "instantiated Classify object with parameters is an instance of the instantiated class");
	ok(!(new Classify("Export3", "E", [ 1 ]) instanceof Classify), "instantiated Classify object with parameters is not an instance of the instantiated Classify");
});
