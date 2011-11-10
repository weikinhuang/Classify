module("namespace");

test("retrieval and creation", function() {
	var ns = getNamespace("Namespace1");

	ok(ns instanceof Namespace, "getNamespace returned a namespace");
	equal(ns, getNamespace("Namespace1"), "multiple calls to getNamespace returns the same object");
	equal(ns.getName(), "Namespace1", "the name of the current namespace is stored");
	equal(ns.get("A"), null, "get class with no callback returns the class for use");
	equal(ns.get("A", function(c) {
		equal(c, null, "async call to get returns null as class doesn't yet exist");
	}), ns, "get class returns the namespace for chaining and gives ability to load up a class in a async manner");
});

test("class creation", function() {
	var ns = getNamespace("Namespace2");

	ok(!ns.exists("A"), "checking for existience of undefined class");
	ns.get("A", function(k) {
		equal(k, null, "attempting to retieve a undefined class");
	});

	// creating a single class
	var c = ns.create("A", {
		invoke : function() {
			return "invoke";
		},
		a : function() {
			return this;
		}
	});
	ok(!!c.__isclass_, "class created is a class object");
	ok(new c() instanceof base, "class creation created by extending the base class");
	equal(ns.A(), "invoke", "class reference within namespace object can still be invoked");
	ns.get("A", function(k) {
		equal(k, c, "class reference is stored in internal reference array");
	});
	equal(c.getNamespace(), ns, "namespaced class has a getter for the current namespace");

	// creating nested classes
	var d = ns.create("B.C", {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	equal(typeof ns.B, "object", "an intermediate container object is created by the namespace");
	ok(new d() instanceof base, "class creation created by extending the base class");
	equal(ns.B.C, d, "class reference is stored directly within namespace object (nested)");
	equal(ns.B.C(), "invoke", "class reference within namespace object can still be invoked");
	ns.get("B.C", function(k) {
		equal(k, d, "class reference is stored in internal reference array (nested)");
	});
});

test("class extension and implementation using named references", function() {
	var ns = getNamespace("Namespace3");

	// extending a class with a named instance
	var c = ns.create("A", {
		a : function() {
			return 1;
		}
	});

	// extending a named reference in a namespace
	var d = ns.create("B", "A", {
		b : function() {
			return 2;
		}
	});
	equal(d.superclass, c, "extending classes using named references");
	equal(ns.B, d, "named reference is created within the namespace");

	// implementing classes using named references
	var e = ns.create("C", [ "A" ], {
		c : function() {
			return this;
		}
	});
	equal(e.prototype.a, c.prototype.a, "implementing a class using a named reference");
	equal(e.implement[0], c, "implement class reference stored internally");

	// implementing classes using a mixed reference
	var f = {
		d : function() {
			return 3;
		}
	};
	var g = ns.create("D", [ "A", f ], {
		e : function() {
			return 4;
		}
	});
	equal(g.prototype.a, c.prototype.a, "implementing a class using a named reference");
	equal(g.prototype.d, f.d, "implementing a object with a named reference");
	equal(g.implement[0], c, "implement class reference stored internally");
	equal(g.implement[1], f, "implement object reference stored internally");
});

test("removing named classes", function() {
	var ns = getNamespace("Namespace4");
	var ca = ns.create("A", {});
	var cb = ns.create("B", {});
	var cc = ns.create("A.C", {});
	var cd = ns.create("D", "A", {});
	var ce = ns.create("A.E", "A", {});
	var cf = ns.create("F", "A", {});

	// destroy an individual class
	ns.destroy("B");
	equal(typeof ns.B, "undefined", "removing a named class from the namespace");

	// destroy a class that is inherited from another class
	ns.destroy("D");
	equal(typeof ns.D, "undefined", "removing a named class from the namespace");
	var index = -1, l = ns.A.subclass.length;
	while (l--) {
		if (ns.A.subclass[l] === cd) {
			index = l;
		}
	}
	equal(l, -1, "remove class from the list of subclasses in the parent");

	// destroy a class namespace
	ns.destroy("A");
	equal(typeof ns.A, "undefined", "removing a named class from the namespace");
	ns.get("A.C", function(k) {
		equal(k, null, "removed leaf classes from branch namespace");
	});
	equal(typeof ns.F, "undefined", "removed class that extended a destroyed class");
	ns.get("F", function(k) {
		equal(k, null, "removed branch namespace that inherited from a removed branch");
	});
});

test("removing namespaces", function() {
	var ns = getNamespace("Namespace5");
	var ca = ns.create("A", {});
	var cb = ns.create("B", {});
	var cc = ns.create("A.C", {});
	var cd = ns.create("D", "A", {});
	var ce = ns.create("A.E", "A", {});
	var cf = ns.create("F", "A", {});

	destroyNamespace("Namespace5");

	// try to retrieve another instance of the "Namespace5" namespace
	var ns2 = getNamespace("Namespace5");
	ok(ns2 !== ns, "new instance of namespace is created");
});

test("class autoloading", function() {
	var ns = getNamespace("Namespace6");

	ns.get("A", function(k) {
		equal(k, null, "attempting to retieve a undefined class");
	});

	// create temp class
	var ca = ns.create("A", {});

	var temp = {};
	// setting the autoloader fora specific namespace
	ns.setAutoloader(function(name, callback) {
		equal(name, "B", "autoloader only being called if class doesn't exist.");
		callback(temp);
	});

	// testing autoloader
	ns.get("B", function(k) {
		equal(k, temp, "retrieving class through autoloader method");
	});
	ns.get("A", function(k) {
		equal(k, ca, "retrieving class already existing class");
	});
});

test("global namespace inheritance", function() {
	// testing the getGlobalNamespace function
	equal(getGlobalNamespace(), getNamespace("GLOBAL"), "global namespace retrieval is a normal namespace");
	equal(getNamespace(), getNamespace("GLOBAL"), "global namespace retrieval with no parameters");

	var ns = getNamespace("Namespace7");
	// add a class to the global namespace
	var x = getGlobalNamespace().create("X", {});
	// create temp class
	var ca = ns.create("A", "X", {});

	var y = new ca();
	ok(y instanceof x, "object extending GLOBAL class is an instance of the global class");

	// retrieval of named classes cascades into the global namespace
	equal(ns.get("X"), x, "retrieval of named class in namespace cascades into the global namespace");
});
