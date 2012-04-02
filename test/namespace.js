QUnit.module("namespace");

QUnit.test("retrieval and creation", function() {
	QUnit.expect(6);
	var ns = getNamespace("Namespace1");

	QUnit.ok(ns instanceof Namespace, "getNamespace returned a namespace");
	QUnit.equal(ns, getNamespace("Namespace1"), "multiple calls to getNamespace returns the same object");
	QUnit.equal(ns.getName(), "Namespace1", "the name of the current namespace is stored");
	QUnit.equal(ns.get("A"), null, "get class with no callback returns the class for use");
	QUnit.equal(ns.get("A", function(c) {
		QUnit.equal(c, null, "async call to get returns null as class doesn't yet exist");
	}), ns, "get class returns the namespace for chaining and gives ability to load up a class in a async manner");
});

QUnit.test("class creation", function() {
	QUnit.expect(12);
	var ns = getNamespace("Namespace2");

	QUnit.ok(!ns.exists("A"), "checking for existience of undefined class");
	ns.get("A", function(k) {
		QUnit.equal(k, null, "attempting to retieve a undefined class");
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
	QUnit.ok(!!c.__isclass_, "class created is a class object");
	QUnit.ok(new c() instanceof base, "class creation created by extending the base class");
	QUnit.equal(ns.A(), "invoke", "class reference within namespace object can still be invoked");
	ns.get("A", function(k) {
		QUnit.equal(k, c, "class reference is stored in internal reference array");
	});
	QUnit.equal(c.getNamespace(), ns, "namespaced class has a getter for the current namespace");

	// creating nested classes
	var d = ns.create("B.C", {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(typeof ns.B, "object", "an intermediate container object is created by the namespace");
	QUnit.ok(new d() instanceof base, "class creation created by extending the base class");
	QUnit.equal(ns.B.C, d, "class reference is stored directly within namespace object (nested)");
	QUnit.equal(ns.B.C(), "invoke", "class reference within namespace object can still be invoked");
	ns.get("B.C", function(k) {
		QUnit.equal(k, d, "class reference is stored in internal reference array (nested)");
	});
});

QUnit.test("class extension and implementation using named references", function() {
	QUnit.expect(8);
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
	QUnit.equal(d.superclass, c, "extending classes using named references");
	QUnit.equal(ns.B, d, "named reference is created within the namespace");

	// implementing classes using named references
	var e = ns.create("C", [ "A" ], {
		c : function() {
			return this;
		}
	});
	QUnit.equal(e.prototype.a, c.prototype.a, "implementing a class using a named reference");
	QUnit.equal(e.implement[0], c, "implement class reference stored internally");

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
	QUnit.equal(g.prototype.a, c.prototype.a, "implementing a class using a named reference");
	QUnit.equal(g.prototype.d, f.d, "implementing a object with a named reference");
	QUnit.equal(g.implement[0], c, "implement class reference stored internally");
	QUnit.equal(g.implement[1], f, "implement object reference stored internally");
});

QUnit.test("removing named classes", function() {
	QUnit.expect(7);
	var ns = getNamespace("Namespace4");
	var ca = ns.create("A", {});
	var cb = ns.create("B", {});
	var cc = ns.create("A.C", {});
	var cd = ns.create("D", "A", {});
	var ce = ns.create("A.E", "A", {});
	var cf = ns.create("F", "A", {});

	// destroy an individual class
	ns.destroy("B");
	QUnit.equal(typeof ns.B, "undefined", "removing a named class from the namespace");

	// destroy a class that is inherited from another class
	ns.destroy("D");
	QUnit.equal(typeof ns.D, "undefined", "removing a named class from the namespace");
	var index = -1, l = ns.A.subclass.length;
	while (l--) {
		if (ns.A.subclass[l] === cd) {
			index = l;
		}
	}
	QUnit.equal(l, -1, "remove class from the list of subclasses in the parent");

	// destroy a class namespace
	ns.destroy("A");
	QUnit.equal(typeof ns.A, "undefined", "removing a named class from the namespace");
	ns.get("A.C", function(k) {
		QUnit.equal(k, null, "removed leaf classes from branch namespace");
	});
	QUnit.equal(typeof ns.F, "undefined", "removed class that extended a destroyed class");
	ns.get("F", function(k) {
		QUnit.equal(k, null, "removed branch namespace that inherited from a removed branch");
	});
});

QUnit.test("removing namespaces", function() {
	QUnit.expect(1);
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
	QUnit.ok(ns2 !== ns, "new instance of namespace is created");
});

QUnit.test("class autoloading", function() {
	QUnit.expect(4);
	var ns = getNamespace("Namespace6");

	ns.get("A", function(k) {
		QUnit.equal(k, null, "attempting to retieve a undefined class");
	});

	// create temp class
	var ca = ns.create("A", {});

	var temp = {};
	// setting the autoloader fora specific namespace
	ns.setAutoloader(function(name, callback) {
		QUnit.equal(name, "B", "autoloader only being called if class doesn't exist.");
		callback(temp);
	});

	// testing autoloader
	ns.get("B", function(k) {
		QUnit.equal(k, temp, "retrieving class through autoloader method");
	});
	ns.get("A", function(k) {
		QUnit.equal(k, ca, "retrieving class already existing class");
	});
});

QUnit.test("global namespace inheritance", function() {
	QUnit.expect(4);
	// testing the getGlobalNamespace function
	QUnit.equal(getGlobalNamespace(), getNamespace("GLOBAL"), "global namespace retrieval is a normal namespace");
	QUnit.equal(getNamespace(), getNamespace("GLOBAL"), "global namespace retrieval with no parameters");

	var ns = getNamespace("Namespace7");
	// add a class to the global namespace
	var x = getGlobalNamespace().create("X", {});
	// create temp class
	var ca = ns.create("A", "X", {});

	var y = new ca();
	QUnit.ok(y instanceof x, "object extending GLOBAL class is an instance of the global class");

	// retrieval of named classes cascades into the global namespace
	QUnit.equal(ns.get("X"), x, "retrieval of named class in namespace cascades into the global namespace");
});
