/* global Base */
/* global create */
/* global Mutator */
/* global addMutator */
/* global removeMutator */
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
	QUnit.expect(8);
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
	QUnit.ok(!!c.$$isclass, "class created is a class object");
	QUnit.ok(new c() instanceof Base, "class creation created by extending the base class");
	QUnit.equal(ns.A(), "invoke", "class reference within namespace object can still be invoked");
	QUnit.equal(ns.get("A"), c, "class reference is stored in internal reference array");
	QUnit.equal(c.getNamespace(), ns, "namespaced class has a getter for the current namespace");

	QUnit.equal(c + "", "[object A]", "namespaced class has overriden toString method");
});

QUnit.test("class creation of nested class names", function() {
	QUnit.expect(5);
	var ns = getNamespace("Namespace2A");
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
	QUnit.ok(new d() instanceof Base, "class creation created by extending the base class");
	QUnit.equal(ns.B.C, d, "class reference is stored directly within namespace object (nested)");
	QUnit.equal(ns.B.C(), "invoke", "class reference within namespace object can still be invoked");
	QUnit.equal(ns.get("B.C"), d, "class reference is stored in internal reference array (nested)");
});

QUnit.test("class extension using definition reference", function() {
	QUnit.expect(4);
	var ns = getNamespace("Namespace2B");
	// creating inherited classes
	var e = create({});
	var f = ns.create("C.D", e, {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.ok(new f() instanceof Base, "class creation created by extending the base class");
	QUnit.ok(new f() instanceof e, "class creation created by extending the base class");
	QUnit.equal(ns.C.D, f, "class reference is stored directly within namespace object (nested)");
	QUnit.equal(ns.get("C.D"), f, "class reference is stored in internal reference array (nested)");
});

QUnit.test("class implementation using definition reference", function() {
	QUnit.expect(8);
	var ns = getNamespace("Namespace2C");
	// creating inherited classes
	var a = create({});
	// extending a class with a named instance
	var impl = create({
		a : function() {
			return 1;
		}
	});
	var c = ns.create("D.A", [ impl ], {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(c.prototype.a, impl.prototype.a, "implementing a class using a definition reference");
	QUnit.equal(c.$$implement[0], impl, "implement class reference stored internally");

	var d = ns.create("D.B", a, [ impl ], {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(d.prototype.a, impl.prototype.a, "implementing a class using a definition reference");
	QUnit.equal(d.$$implement[0], impl, "implement class reference stored internally");
	QUnit.ok(new d() instanceof Base, "class creation created by extending the base class");
	QUnit.ok(new d() instanceof a, "class creation created by extending the base class");
	QUnit.equal(ns.D.B, d, "class reference is stored directly within namespace object (nested)");
	QUnit.equal(ns.get("D.B"), d, "class reference is stored in internal reference array (nested)");
});

QUnit.test("local class mutation", function() {
	QUnit.expect(26);
	var ns = getNamespace("Namespace2D");
	// creating inherited classes
	var a = create({});
	// extending a class with a named instance
	var impl = create({
		a : function() {
			return 1;
		}
	});
	var mutator = Mutator("test", {
		onCreate : function(klass, parent) {
			klass.mut = 1;
			QUnit.ok(true, "onCreate in mutator was called when the class is created");
			QUnit.ok(!Object.prototype.hasOwnProperty.call(klass.prototype, "xyz"), "onCreate in mutator was called before properties have been added");
		}
	});

	var test = ns.create("E.A", [ mutator ], {
		xyz : function() {
		}
	});
	QUnit.equal(test.mut, 1, "onCreate mutator modified the class during creation");

	var c = ns.create("E.B", [ impl ], mutator, {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(c.prototype.a, impl.prototype.a, "implementing a class using a definition reference");
	QUnit.equal(c.$$implement[0], impl, "implement class reference stored internally");
	QUnit.equal(c.mut, 1, "onCreate mutator modified the class during creation with implement");

	var d = ns.create("E.C", a, [ impl ], mutator, {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(d.prototype.a, impl.prototype.a, "implementing a class using a definition reference");
	QUnit.equal(d.$$implement[0], impl, "implement class reference stored internally");
	QUnit.ok(new d() instanceof Base, "class creation created by extending the base class");
	QUnit.ok(new d() instanceof a, "class creation created by extending the base class");
	QUnit.equal(ns.E.C, d, "class reference is stored directly within namespace object (nested)");
	QUnit.equal(ns.get("E.C"), d, "class reference is stored in internal reference array (nested)");
	QUnit.equal(d.mut, 1, "onCreate mutator modified the class during creation with implement");

	var e = ns.create("E.D", a, [ impl ], [ mutator ], {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(e.prototype.a, impl.prototype.a, "implementing a class using a definition reference");
	QUnit.equal(e.$$implement[0], impl, "implement class reference stored internally");
	QUnit.ok(new e() instanceof Base, "class creation created by extending the base class");
	QUnit.ok(new e() instanceof a, "class creation created by extending the base class");
	QUnit.equal(ns.E.D, e, "class reference is stored directly within namespace object (nested)");
	QUnit.equal(ns.get("E.D"), e, "class reference is stored in internal reference array (nested)");
	QUnit.equal(e.mut, 1, "onCreate mutator modified the class during creation with implement and array mutators");
});

QUnit.test("class extension using named references", function() {
	QUnit.expect(2);
	var ns = getNamespace("Namespace3A");

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
	QUnit.equal(d.$$superclass, c, "extending classes using named references");
	QUnit.equal(ns.B, d, "named reference is created within the namespace");
});

QUnit.test("class implementation using named references", function() {
	QUnit.expect(6);
	var ns = getNamespace("Namespace3B");
	// extending a class with a named instance
	var c = ns.create("A", {
		a : function() {
			return 1;
		}
	});
	// implementing classes using named references
	var e = ns.create("C", [ "A" ], {
		c : function() {
			return this;
		}
	});
	QUnit.equal(e.prototype.a, c.prototype.a, "implementing a class using a named reference");
	QUnit.equal(e.$$implement[0], c, "implement class reference stored internally");

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
	QUnit.equal(g.$$implement[0], c, "implement class reference stored internally");
	QUnit.equal(g.$$implement[1], f, "implement object reference stored internally");
});

QUnit.test("local class mutation with named references", function() {
	QUnit.expect(26);
	var ns = getNamespace("Namespace3C");
	// creating inherited classes
	var a = ns.create("A", {
		c : function() {
			return 1;
		}
	});
	// extending a class with a named instance
	var impl = ns.create("B", {
		a : function() {
			return 1;
		}
	});
	var mutator = Mutator("test", {
		onCreate : function(klass, parent) {
			klass.mut = 1;
			QUnit.ok(true, "onCreate in mutator was called when the class is created");
			QUnit.ok(!Object.prototype.hasOwnProperty.call(klass.prototype, "xyz"), "onCreate in mutator was called before properties have been added");
		}
	});

	var test = ns.create("E.A", [ mutator ], {
		xyz : function() {
		}
	});
	QUnit.equal(test.mut, 1, "onCreate mutator modified the class during creation");

	var c = ns.create("E.B", [ "B" ], mutator, {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(c.prototype.a, impl.prototype.a, "implementing a class using a definition reference");
	QUnit.equal(c.$$implement[0], impl, "implement class reference stored internally");
	QUnit.equal(c.mut, 1, "onCreate mutator modified the class during creation with implement");

	var d = ns.create("E.C", "A", [ "B" ], mutator, {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(d.prototype.a, impl.prototype.a, "implementing a class using a definition reference");
	QUnit.equal(d.$$implement[0], impl, "implement class reference stored internally");
	QUnit.ok(new d() instanceof Base, "class creation created by extending the base class");
	QUnit.ok(new d() instanceof a, "class creation created by extending the base class");
	QUnit.equal(ns.E.C, d, "class reference is stored directly within namespace object (nested)");
	QUnit.equal(ns.get("E.C"), d, "class reference is stored in internal reference array (nested)");
	QUnit.equal(d.mut, 1, "onCreate mutator modified the class during creation with implement");

	var e = ns.create("E.D", "A", [ "B" ], [ mutator ], {
		invoke : function() {
			return "invoke";
		},
		b : function() {
			return this;
		}
	});
	QUnit.equal(e.prototype.a, impl.prototype.a, "implementing a class using a definition reference");
	QUnit.equal(e.$$implement[0], impl, "implement class reference stored internally");
	QUnit.ok(new e() instanceof Base, "class creation created by extending the base class");
	QUnit.ok(new e() instanceof a, "class creation created by extending the base class");
	QUnit.equal(ns.E.D, e, "class reference is stored directly within namespace object (nested)");
	QUnit.equal(ns.get("E.D"), e, "class reference is stored in internal reference array (nested)");
	QUnit.equal(e.mut, 1, "onCreate mutator modified the class during creation with implement and array mutators");
});

QUnit.test("extending unknown classes", function() {
	QUnit.expect(1);
	var ns = getNamespace("Namespace3D");
	// attempt to extend a non defined class
	QUnit.throws(function() {
		ns.create("Z", "Y", {});
	}, Error, "attempt to extend a undefined class throws an error");
});

QUnit.test("using the ns defined class extend function", function() {
	QUnit.expect(2);
	var ns = getNamespace("Namespace3E");
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
	// implementing classes using named references
	var e = ns.create("C", [ "A" ], {
		c : function() {
			return this;
		}
	});
	// using the extend function
	var i = ns.C.extend([ "B" ], {
		c : function() {
			return this;
		}
	});
	QUnit.equal(i.prototype.a.$$original, c.prototype.a, "implementing a class using a named reference with extend");
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
	var index = -1, l = ns.A.$$subclass.length;
	while (l--) {
		if (ns.A.$$subclass[l] === cd) {
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
	QUnit.throws(function() {
		ns.setAutoloader([]);
	}, Error, "attempt to set non function autoloader throws an error");
});

QUnit.test("adding and removing namespace mutators", function() {
	QUnit.expect(3);
	var ns = getNamespace("Namespace6B");

	ns.addMutator("test", {});

	// adding duplicate mutators will throw an error
	QUnit.throws(function() {
		ns.addMutator("test", {});
	}, Error, "Attempts to add an existing mutator throws a error.");

	// add global mutator
	addMutator("testa", {});
	// adding duplicate global mutators will throw an error
	QUnit.throws(function() {
		ns.addMutator("testa", {});
	}, Error, "Attempts to add an existing global mutator on namespace throws a error.");
	removeMutator("testa");

	ns.removeMutator("test");
	QUnit.throws(function() {
		ns.removeMutator("test");
	}, Error, "Attempts to remove an non existing mutator throws a error.");
});

QUnit.test("adding and removing namespace mutators to the on create hook", function() {
	QUnit.expect(4);
	var ns = getNamespace("Namespace6C");

	ns.addMutator("test", {
		onCreate : function(klass, parent) {
			klass.a = 1;
			QUnit.ok(true, "onCreate in mutator was called when the class is created");
			QUnit.ok(!Object.prototype.hasOwnProperty.call(klass.prototype, "xyz"), "onCreate in mutator was called before properties have been added");
		}
	});

	var test = ns.create("A", {
		xyz : function() {
		}
	});
	QUnit.equal(test.a, 1, "onCreate mutator modified the class during creation");

	ns.removeMutator("test");

	// after removal, hooks are no longer called
	var test2 = ns.create("B", {});
	QUnit.ok(!test2.hasOwnProperty("a"), "removed onCreate mutator is no longer called during creation");
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

QUnit.test("creating namespaces from existing plain objects", function() {
	QUnit.expect(8);

	var ns = Namespace.from("Plain", {});

	// creating a single class
	var c = ns.create("A", {
		invoke : function() {
			return "invoke";
		},
		a : function() {
			return this;
		}
	});
	QUnit.ok(!!ns.$$isnamespace, "namespace created is a namespace object");
	QUnit.ok(!!c.$$isclass, "class created is a class object");
	QUnit.ok(new c() instanceof Base, "class creation created by extending the base class");
	QUnit.equal(ns.A(), "invoke", "class reference within namespace object can still be invoked");
	QUnit.equal(ns.get("A"), c, "class reference is stored in internal reference array");
	QUnit.equal(c.getNamespace(), ns, "namespaced class has a getter for the current namespace");
	QUnit.equal(c.getNamespace().getName(), "Plain", "namespace name is available");

	QUnit.equal(c + "", "[object A]", "namespaced class has overriden toString method");
});

QUnit.test("creating namespaces from existing Classify classes", function() {
	QUnit.expect(8);

	var a = create({
		a : 1,
		b : function() {
			return this.a;
		}
	});
	var ns = Namespace.from("ClassObj", a);

	// creating a single class
	var c = ns.create("A", {
		invoke : function() {
			return "invoke";
		},
		a : function() {
			return this;
		}
	});
	QUnit.ok(!!ns.$$isnamespace, "namespace created is a namespace object");
	QUnit.ok(!!c.$$isclass, "class created is a class object");
	QUnit.ok(new c() instanceof Base, "class creation created by extending the base class");
	QUnit.equal(ns.A(), "invoke", "class reference within namespace object can still be invoked");
	QUnit.equal(ns.get("A"), c, "class reference is stored in internal reference array");
	QUnit.equal(c.getNamespace(), ns, "namespaced class has a getter for the current namespace");
	QUnit.equal(c.getNamespace().getName(), "ClassObj", "namespace name is available");

	QUnit.equal(c + "", "[object A]", "namespaced class has overriden toString method");
});

QUnit.test("creating namespaces from existing Classify object instances", function() {
	QUnit.expect(8);

	var a = create({
		a : 1,
		b : function() {
			return this.a;
		}
	});
	var ns = Namespace.from("ClassInst", new a());

	// creating a single class
	var c = ns.create("A", {
		invoke : function() {
			return "invoke";
		},
		a : function() {
			return this;
		}
	});
	QUnit.ok(!!ns.$$isnamespace, "namespace created is a namespace object");
	QUnit.ok(!!c.$$isclass, "class created is a class object");
	QUnit.ok(new c() instanceof Base, "class creation created by extending the base class");
	QUnit.equal(ns.A(), "invoke", "class reference within namespace object can still be invoked");
	QUnit.equal(ns.get("A"), c, "class reference is stored in internal reference array");
	QUnit.equal(c.getNamespace(), ns, "namespaced class has a getter for the current namespace");
	QUnit.equal(c.getNamespace().getName(), "ClassInst", "namespace name is available");

	QUnit.equal(c + "", "[object A]", "namespaced class has overriden toString method");
});

QUnit.test("creating namespaces from existing Classify object instances", function() {
	QUnit.expect(1);

	var ns = new Namespace("Somenamespace");

	// adding duplicate global mutators will throw an error
	QUnit.throws(function() {
		Namespace.from("Plain", ns);
	}, Error, "Attempts to create a namespace from an namespace throws a error.");
});

QUnit.test("creating internalized namespaces with Namespace.from", function() {
	QUnit.expect(4);

	var ns = Namespace.from("Plain", {}, true);

	QUnit.ok(!!ns.$$isnamespace, "namespace created is a namespace object");
	QUnit.equal(getNamespace("Plain"), ns, "Passing a internalized namespace name to getNamespace returns namespace.");
	QUnit.equal(getNamespace(ns), ns, "Passing a instance of internalized namespace to getNamespace returns object as is.");

	destroyNamespace("Plain");
	QUnit.equal(testNamespace("Plain"), null, "Internalized namespace removed when destroyNamespace is called.");
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
