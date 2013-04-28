/* global create */
QUnit.module("mutator.static");

QUnit.test("static properties", function() {
	QUnit.expect(7);
	// testing class creation with static properties
	var test = create({
		a : 1,
		__static_a : 2,
		b : function() {
			return this.a;
		},
		__static_b : function() {
			// the internal "this" reference should always point to the class definition in a static context
			return this.a;
		},
		c : function() {
			return test.a;
		},
		d : function() {
			return this.self;
		},
		e : function() {
			return this.self.a;
		}
	});

	QUnit.equal(test.a, 2, "Reading static property of an class");
	QUnit.equal((new test()).a, 1, "Reading non static property of an class");
	QUnit.equal(test.b(), 2, "Invoking static function of a class");
	QUnit.equal((new test()).b(), 1, "Invoking dynamic function of a class");
	QUnit.equal((new test()).c(), 2, "Reading static property by name within a class");
	QUnit.equal((new test()).d(), test, "Reading static definition within a class");
	QUnit.equal((new test()).e(), 2, "Reading static property by using self within a class");
});

QUnit.test("static properties defined in container", function() {
	QUnit.expect(4);
	// testing class creation with static properties defined in container
	var test = create({
		__static_ : {
			a : 2,
			b : function() {
				// the internal "this" reference should always point to the class definition in a static context
				return this.a;
			}
		},
		a : 1,
		b : function() {
			return this.a;
		},
		c : function() {
			return test.a;
		},
		d : function() {
			return this.self;
		},
		e : function() {
			return this.self.a;
		}
	});

	QUnit.equal(test.a, 2, "Reading static property of an class when defined within container");
	QUnit.equal(test.b(), 2, "Invoking static function of a class when defined within container");
	QUnit.equal((new test()).c(), 2, "Reading static property by name within a class when defined within container");
	QUnit.equal((new test()).e(), 2, "Reading static property by using self within a class when defined within container");
});

QUnit.test("static properties that are instances of a class", function() {
	QUnit.expect(3);
	// create a class
	var prop = create({
		g : 2,
		__static_a : 1,
		__static_f : function() {
			return this.a;
		}
	});
	// testing class creation with static properties
	var test = create({
		__static_b : prop,
		d : function() {
			return this.self;
		}
	});

	QUnit.equal(test.b, prop, "Static property of a class is an unwrapped class");
	QUnit.equal(test.b.f(), 1, "Static property of an internal class is defined properly");
	QUnit.equal((new test.b()).g, 2, "Instantiating static class defined within another class");
});


QUnit.test("adding new static properties after class definition", function() {
	QUnit.expect(6);
	// testing class for known properties in every defined class
	var test = create({});

	// adding properties to the object
	test.b = function() {
		return 1;
	};
	QUnit.equal(test.b(), 1, "invoking a method added using classical method");
	test.addStaticProperty("c", function() {
		return 1;
	});
	QUnit.equal(test.c(), 1, "invoking a method added using addStaticProperty method");

	// test that references is proper
	test.addStaticProperty("d", function() {
		QUnit.equal(this, test, "assuring the 'this' reference of a method added using addStaticProperty method is the constructor");
		return 1;
	});
	test.d();

	// test adding multiple properties
	test.addStaticProperty({
		f : function() {
			return 2;
		}
	});
	QUnit.equal(test.f(), 2, "adding multiple static properties to the class with addStaticProperty");

	// test adding properties to parent classes
	var subclass = create(test, {
		g : function() {
			return 3;
		},
		h : function() {
			return this.parent();
		}
	});

	// attempts to override special properties are forbidden
	var temp_prop = subclass.superclass;
	subclass.addStaticProperty("superclass", []);
	QUnit.equal(subclass.superclass, temp_prop, "attempts to override special properties with addStaticProperty are forbidden.");

	subclass.addProperty("__static_superclass", []);
	QUnit.equal(subclass.superclass, temp_prop, "attempts to override special properties with addProperty are forbidden.");
});

QUnit.test("removing existing static properties", function() {
	QUnit.expect(3);
	// testing class for known properties in every defined class
	var test = create({
		__static_z : function() {
			return 1;
		},
		__static_y : 1,
		x : 1,
		a : function() {
			return 1;
		}
	});

	// remove a static function
	test.removeStaticProperty("z");
	QUnit.equal(test.z, undefined, "static function removed from class.");

	// remove a static value
	test.removeStaticProperty("y");
	QUnit.equal(test.y, undefined, "static property removed from class.");

	// attempt to remove special properties fail
	var test2 = create(test, {});
	var temp_prop = test2.superclass;
	test2.removeStaticProperty("superclass");
	QUnit.equal(test2.superclass, temp_prop, "Attempting to remove special properties fail.");
});
