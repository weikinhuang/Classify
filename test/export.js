/* global create */
/* global Namespace */
/* global getNamespace */
/* global destroyNamespace */
/* global testNamespace */
/* global getGlobalNamespace */
/* global Mutator */
/* global addMutator */
/* global removeMutator */
QUnit.module("export");

QUnit.test("check globally accessable Classify object", function() {
	QUnit.expect(11);
	QUnit.ok(Classify.$$isclass, "Classify global object is a class");

	QUnit.deepEqual(Classify.create, create, "Create functionality is bound to the static instance of the class");
	QUnit.equal(Classify.Namespace, Namespace, "Namespace class is bound to the static instance of the class");
	QUnit.equal(Classify.getNamespace, getNamespace, "get namespace functionality is bound to the static instance of the class");
	QUnit.equal(Classify.destroyNamespace, destroyNamespace, "destroy namespace functionality is bound to the static instance of the class");
	QUnit.equal(Classify.testNamespace, testNamespace, "test namespaces is bound to the static instance of the class");
	QUnit.equal(Classify.getGlobalNamespace, getGlobalNamespace, "get global namespace functionality is bound to the static instance of the class");
	QUnit.equal(Classify.global, getGlobalNamespace(), "Global namespace is bound to the global property");
	QUnit.deepEqual(Classify.Mutator, Mutator, "Mutator class is bound to the static instance of the class");
	QUnit.equal(Classify.addMutator, addMutator, "adding a mutator functionality bound to the static instance of the class");
	QUnit.equal(Classify.removeMutator, removeMutator, "removing a mutator functionality bound to the static instance of the class");
});

QUnit.test("check globally accessable Classify object's utility functions", function() {
	QUnit.expect(16);
	// test utility function to provide functionality to quickly add properties to objects
	var test = {};
	var extens = {
		a : 1,
		valueOf : function() {
			return this.a;
		}
	};
	var extended = Classify.extend(test, extens);

	QUnit.equal(extended, test, "extends returns the object beng extended");
	QUnit.equal(test.a, 1, "extends extended a normal property");
	QUnit.equal(test.valueOf, extens.valueOf, "extends extended a object prototype property");

	// test utility function to provide functionality to allow for name provisioning
	var test2 = {};
	var provided = Classify.provide("A.B.C", test2);

	QUnit.ok(!!(test2.A && test2.A.B && test2.A.B.C), "provisioned a namespace within a object");
	QUnit.equal(provided, test2.A.B.C, "the provisioned namespace is returned by provide");

	QUnit.ok(Classify.isScalar, "isScalar is exported as a utility");
	QUnit.ok(Classify.isFunction, "isFunction is exported as a utility");
	QUnit.ok(Classify.isFunction, "isFunction is exported as a utility");
	QUnit.ok(Classify.isArray, "isArray is exported as a utility");
	QUnit.ok(Classify.isNative, "isNative is exported as a utility");
	QUnit.ok(Classify.keys, "keys is exported as a utility");
	QUnit.ok(Classify.argsToArray, "argsToArray is exported as a utility");
	QUnit.ok(Classify.indexOf, "indexOf is exported as a utility");
	QUnit.ok(Classify.each, "each is exported as a utility");
	QUnit.ok(Classify.map, "map is exported as a utility");
	QUnit.ok(Classify.remove, "remove is exported as a utility");
});

QUnit.test("invoking global Classify object with string", function() {
	QUnit.expect(13);
	// calling classify with no parameters
	QUnit.equal(Classify(), getGlobalNamespace(), "Classify with no parameters provides global namespace");

	var export1 = getNamespace("Export1");
	var test = export1.create("A", {
		a : 1
	});

	// calling classify with single string parameter
	// single string parameter returns the namespace
	QUnit.equal(Classify("Export1"), getNamespace("Export1"), "single string parameter returns the namespace");

	// single string parameter with a / and nothing after should return a namespace
	QUnit.equal(Classify("Export1/"), getNamespace("Export1"), "single string parameter returns the namespace");

	// single string parameter with a / and nothing after should return a namespace
	QUnit.equal(Classify("Export1/A"), test, "single string parameter with a '/' return a class within the namespace");
	QUnit.equal(Classify("Export1/nonexist"), null, "single string parameter with a '/' with non existient class returns null");

	// calling classify with two string parameters
	QUnit.equal(Classify("Export1", "A"), test, "two string parameters return a class within the namespace");
	QUnit.equal(Classify("Export1", "nonexist"), null, "two string parameters with non existient class returns null");

	// calling classify with first parameter string and mixed parameters
	QUnit.equal(Classify("Export1/B", {}), getNamespace("Export1").get("B"), "first parameter string with '/' creates a class in namespace");
	QUnit.equal(Classify("Export1", "C", {}), getNamespace("Export1").get("C"), "two string parameters creates a class in namespace");

	// calling classify with first parameter string and parent class creation
	test = Classify("Export1", "D", "C", {});
	QUnit.equal(test, getNamespace("Export1").get("D"), "3 string parameters create a class in namespace with parent");
	QUnit.ok((new test()) instanceof getNamespace("Export1").get("C"), "3 string parameters create a class in namespace with parent is instance of parent");

	test = Classify("Export1/E", "C", {});
	QUnit.equal(test, getNamespace("Export1").get("E"), "2 string parameters create a class in namespace with parent");
	QUnit.ok((new test()) instanceof getNamespace("Export1").get("C"), "2 string parameters create a class in namespace with parent is instance of parent");
});

QUnit.test("invoking global Classify object with object", function() {
	QUnit.expect(5);
	// object parameters creates class objects
	var test = Classify({
		a : 1
	});
	QUnit.equal(typeof test, "function", "object parameter creates a class");
	QUnit.ok(test.$$isclass, "object parameter creates a class with create");

	// 2 object parameters creates class objects
	var test2 = Classify(test, {});
	QUnit.equal(typeof test2, "function", "2 object parameters creates a class");
	QUnit.ok(test2.$$isclass, "2 object parameters creates a class with create");
	QUnit.ok(new test2() instanceof test, "2 object parameters creates a class with inheritance");
});

QUnit.test("constructing global Classify object", function() {
	QUnit.expect(10);
	var definition = {
		a : 0,
		init : function(a) {
			this.a = a || 0;
		}
	};

	// creating a new class and instantiating it
	var test = new Classify(definition);
	QUnit.equal(typeof test, "object", "instantiated Classify object is an object");
	QUnit.equal(test.a, 0, "instantiated Classify object calls new class constructor and is an instance of created class");

	// creating a new class and instantiating it with parameters
	test = new Classify(definition, [ 1 ]);
	QUnit.equal(typeof test, "object", "instantiated Classify object with parameters is an object");
	QUnit.equal(test.a, 1, "instantiated Classify object with parameters calls new class constructor and is an instance of created class");

	// instantiating but retrieving a namespace
	test = new Classify("Export3");
	QUnit.equal(test, getNamespace("Export3"), "instantiated Classify object for namespace will return the namespace");

	// constructing a new class through the use of "new Classify"
	test = getNamespace("Export3").create("E", definition);
	QUnit.ok(new Classify("Export3", "E") instanceof test, "instantiated Classify object is an instance of the instantiated class");
	QUnit.ok(!(new Classify("Export3", "E") instanceof Classify), "instantiated Classify object is not an instance of the instantiated Classify");

	QUnit.ok(new Classify("Export3", "E", [ 1 ]) instanceof test, "instantiated Classify object with parameters is an instance of the instantiated class");
	QUnit.ok(!(new Classify("Export3", "E", [ 1 ]) instanceof Classify), "instantiated Classify object with parameters is not an instance of the instantiated Classify");

	QUnit.throws(function(){
		var test2 = new Classify();
	}, Error, "Calling Classify with no arguments throws an error.");
});

QUnit.test("using noConflict mode", function() {
	QUnit.expect(1);

	var original = Classify;

	var temp = Classify.noConflict();

	QUnit.equal(original, temp, "no conflict mode returned defined classify object");
});
