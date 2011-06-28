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
	test = Classify("Abc.D", {
		a : 1
	});
	equals(test, getNamespace("Abc").D, "named parameter and multiple arguments create a class within a namespace");
});
