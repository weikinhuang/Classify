QUnit.module("mutator.bind");

QUnit.test("bound properties", function() {
	QUnit.expect(9);
	// testing class creation with bound properties
	var test = create({
		a : 1,
		__bind_z : 1,
		__bind_b : function() {
			QUnit.ok(this instanceof test, "Bound function's reference to 'this' is of class");
			// the internal "this" reference should always point to the class definition
			return this;
		},
		__bind_c : function() {
			// the internal "this" reference should always point to the class definition
			return this.a;
		}
	});

	var instance = new test();
	QUnit.equal(instance.b.call([]), instance, "Modified context is ignored for bound functions");
	QUnit.equal(instance.c.call([]), 1, "Return value of bound functions is passed through");
	QUnit.equal(instance.z, 1, "Non Function properties are not wrapped");

	// testing class creation with bound properties
	var test2 = create(test, {
		__bind_c : function() {
			QUnit.ok(this instanceof test2, "Overriden bound function's reference to 'this' is of class");
			// the internal "this" reference should always point to the class definition
			return this.a;
		},
		__bind_d : function() {
			// the internal "this" reference should always point to the class definition
			return this;
		}
	});
	var instance2 = new test2();
	QUnit.ok(instance2.b.call([]) instanceof test2, "Inherited bound function's reference to 'this' is of class");
	QUnit.equal(instance2.c.call([]), 1, "Return value of overriden bound functions is passed through");
	QUnit.equal(instance2.d.call([]), instance2, "Modified context is ignored for bound functions when inheriting");
});

QUnit.test("bound properties defined in container", function() {
	QUnit.expect(8);
	// testing class creation with bound properties
	var test = create({
		a : 1,
		__bind_ : {
			b : function() {
				QUnit.ok(this instanceof test, "Bound function's reference to 'this' is of class when defined in a container");
				// the internal "this" reference should always point to the class definition
				return this;
			},
			c : function() {
				// the internal "this" reference should always point to the class definition
				return this.a;
			}
		}
	});

	var instance = new test();
	QUnit.equal(instance.b.call([]), instance, "Modified context is ignored for bound functions when defined in a container");
	QUnit.equal(instance.c.call([]), 1, "Return value of bound functions is passed through when defined in a container");

	// testing class creation with bound properties
	var test2 = create(test, {
		__bind_ : {
			c : function() {
				QUnit.ok(this instanceof test2, "Overriden bound function's reference to 'this' is of class when defined in a container");
				// the internal "this" reference should always point to the class definition
				return this.a;
			},
			d : function() {
				// the internal "this" reference should always point to the class definition
				return this;
			}
		}
	});
	var instance2 = new test2();
	QUnit.ok(instance2.b.call([]) instanceof test2, "Inherited bound function's reference to 'this' is of class when defined in a container");
	QUnit.equal(instance2.c.call([]), 1, "Return value of overriden bound functions is passed through when defined in a container");
	QUnit.equal(instance2.d.call([]), instance2, "Modified context is ignored for bound functions when inheriting and defined in a container");
});

QUnit.test("bound properties that are instances of a class", function() {
	QUnit.expect(2);
	// create a class
	var prop = create({
		g : 2,
		__bind_f : function() {
			return this;
		}
	});
	prop.h = 1;

	// testing class creation with bound properties
	var test = create({
		__bind_b : prop,
		__bind_d : function() {
			return this.self;
		}
	});

	QUnit.equal((new test()).b, prop, "Bound property of a class is an unbound class");
	QUnit.ok((new (new test()).b()).f.call([]) instanceof prop, "Bound property of an internal class is bound defined properly");
});

QUnit.test("adding new bound properties after class definition", function() {
	QUnit.expect(4);
	var test = create({
		z : 1
	});

	test.addBoundProperty("a", function() {
		return this;
	});
	test.addBoundProperty("b", function() {
		return this.z;
	});

	var instance = new test();
	QUnit.ok(instance.a.call([]) instanceof test, "Bound function's reference to 'this' is of class when defined after creation");
	QUnit.equal(instance.b.call([]), 1, "Return value of bound functions is passed through when defined after creation");

	// adding a inherited bound property
	var test2 = create(test, {});
	test2.addBoundProperty("b", function() {
		return this.parent();
	});
	test2.addBoundProperty("c", function() {
		return this;
	});
	var instance2 = new test2();
	QUnit.ok(instance2.a.call([]) instanceof test2, "Bound inherited function's reference to 'this' is of class when defined after creation");
	QUnit.equal(instance2.b.call([]), 1, "Return value of bound functions is passed through and able to access parent method when defined after creation");
});

QUnit.test("removing existing bound properties", function() {
//	QUnit.expect(3);
	var test = create({
		__bind_a : function() {
			return this;
		},
		__bind_b : function() {
			return this;
		},
		__bind_c : function() {
			return this;
		},
		d : function() {
			return 1;
		}
	});

	test.removeBoundProperty("a");

	QUnit.ok(!test.prototype.hasOwnProperty("a"), "Removed bound function removes function definition");

	// removing bound property
	test.removeBoundProperty("d");
	QUnit.ok(test.prototype.hasOwnProperty("c"), "Removed non bound function's reference does nothing");

	// removing a inherited bound property
	var test2 = create(test, {
		__bind_c : function() {
			return this;
		}
	});

	test.removeBoundProperty("b");
	QUnit.ok(!test2.prototype.hasOwnProperty("b"), "Bound inherited function reference is removed when parent's definition is removed");

	test.removeBoundProperty("c");
	QUnit.ok(test2.prototype.hasOwnProperty("c"), "Bound overriden function is not removed when parent bound function is removed");
});
