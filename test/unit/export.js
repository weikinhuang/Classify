module("export");

test("check globally accessable Classify object", function() {
	ok(Classify.__isclass_, "Classify global object is a class");

	same(Classify.Create, Create, "Create functionality is bound to the static instance of the class");
	equals(Classify.GetNamespace, getNamespace, "get namespace functionality is bound to the static instance of the class");
	equals(Classify.DestroyNamespace, destroyNamespace, "destroy namespace functionality is bound to the static instance of the class");
});

