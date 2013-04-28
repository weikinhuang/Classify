/* global base */
/* global Namespace */
/* global getNamespace */
/* global destroyNamespace */
/* global getGlobalNamespace */
/* global testNamespace */
QUnit.module("namespace");

QUnit.test("retrieval and creation", function() {
	QUnit.expect(6);
	var ns = getNamespace("Namespace1");

	QUnit.ok(ns instanceof Namespace, "getNamespace returned a namespace");
	QUnit.equal(ns, getNamespace("Namespace1"), "multiple calls to getNamespace returns the same object");
	QUnit.equal(ns.getName(), "Namespace1", "the name of the current namespace is stored");
	QUnit.equal(ns.get("A"), null, "get class with no callback returns the class for use");

	QUnit.equal(getNamespace(ns), ns, "Passing a instance of Namespace to getNamespace returns object as is.");

	QUnit.equal(ns + "", "[namespace Namespace1]", "Namespace toString returns [namespace Name]");
});

QUnit.test("class creation", function() {
	QUnit.expect(13);
	var ns = getNamespace("Namespace2");

	QUnit.ok(!ns.exists("A"), "checking for existience of undefined class");
	QUnit.equal(ns.get("A"), null, "attempting to retieve a undefined class");

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
	QUnit.equal(ns.get("A"), c, "class reference is stored in internal reference array");
	QUnit.equal(c.getNamespace(), ns, "namespaced class has a getter for the current namespace");

	QUnit.equal(c + "", "[object A]", "namespaced class has overriden toString method");

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
	QUnit.equal(ns.get("B.C"), d, "class reference is stored in internal reference array (nested)");
});

QUnit.test("class extension and implementation using named references", function() {
	QUnit.expect(11);
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

	// attempt to extend a non defined class
	QUnit.raises(function(){
		var h = ns.create("Z", "Y", {});
	}, Error, "attempt to extend a undefined class throws an error");

	// using the extend function
	var i = ns.C.extend([ "B" ], {
		c : function() {
			return this;
		}
	});
	QUnit.equal(i.prototype.a.__original_, c.prototype.a, "implementing a class using a named reference with extend");
	QUnit.equal(i.prototype.b, d.prototype.b, "implementing a object with a named reference with implement");
});

QUnit.test("removing named classes", function() {
	QUnit.expect(10);
	var ns = getNamespace("Namespace4");
	var ca = ns.create("A", {});
	var cb = ns.create("B", {});
	var cc = ns.create("A.C", {});
	var cd = ns.create("D", "A", {});
	var ce = ns.create("A.E", "A", {});
	var cf = ns.create("F", "A", {});
	var cg = ns.create("G.a", {});


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
	QUnit.equal(ns.get("A.C"), null, "removed leaf classes from branch namespace");
	QUnit.equal(typeof ns.F, "undefined", "removed class that extended a destroyed class");
	QUnit.equal(ns.get("F"), null, "removed branch namespace that inherited from a removed branch");

	// destroy an nested class
	ns.destroy("G.a");
	QUnit.equal(typeof ns.G.a, "undefined", "removing a nested class from the namespace");

	ns.destroy("H");
	QUnit.equal(typeof ns.H, "undefined", "removing a undefined top level class from the namespace does nothing");

	ns.destroy("I.a");
	QUnit.equal(typeof ns.I, "undefined", "removing a undefined class from the namespace does nothing");

});

QUnit.test("removing namespaces", function() {
	QUnit.expect(3);
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
	QUnit.ok(ns2 !== ns, "new instance of namespace is created after destroyed by name");

	// destroy namespace by object
	destroyNamespace(ns2);
	QUnit.ok(getNamespace("Namespace5") !== ns2, "new instance of namespace is created after destroyed by reference");

	// attempts to remove global namespace
	var global_ns = getGlobalNamespace();
	destroyNamespace("GLOBAL");
	QUnit.equal(getGlobalNamespace(), global_ns, "removing global namespace does nothing");
});

QUnit.test("class autoloading", function() {
	QUnit.expect(5);
	var ns = getNamespace("Namespace6");

	QUnit.equal(ns.get("A"), null, "attempting to retieve a undefined class");

	// create temp class
	var ca = ns.create("A", {});

	var temp = {};
	// setting the autoloader for a specific namespace
	ns.setAutoloader(function(name) {
		QUnit.equal(name, "B", "autoloader only being called if class doesn't exist.");
		return temp;
	});

	// testing autoloader
	QUnit.equal(ns.get("B"), temp, "retrieving class through autoloader method");
	QUnit.equal(ns.get("A"), ca, "retrieving an already existing class");

	// attempt to set autoloader to a non function
	QUnit.raises(function(){
		ns.setAutoloader([]);
	}, Error, "attempt to set non function autoloader throws an error");
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

QUnit.test("testing namespaces", function() {
	QUnit.expect(4);
	var ns = getNamespace("Namespace8");
	var ns2 = getNamespace("Namespace8.Ns8a");

	var ns3 = getNamespace("Namespace9");

	QUnit.equal(testNamespace("Namespace10"), null, "Attempts to test non defined namespace returns null.");

	QUnit.equal(testNamespace("Namespace8"), ns, "Attempts to test defined root level namespace returns namespacec.");

	QUnit.equal(testNamespace("Namespace8.Ns8a"), ns2, "Attempts to test defined nested namespace returns namespace.");

	QUnit.equal(testNamespace("Namespace9.a.b.c"), ns3, "Attempts to retieve non defined namespace returns parent namespace.");
});
