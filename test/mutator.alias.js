/* global create */
QUnit.module("mutator.alias");

QUnit.test("alias properties", function() {
	QUnit.expect(8);
	// testing basic alias methods
	var test = create({
		__alias_z : "a",
		x : 0,
		y : 0,
		a : function() {
			return ++this.x;
		},
		b : function() {
			return ++this.y;
		}
	});

	var test_instance = new test();
	// call the main function
	QUnit.equal(test_instance.x, 0, "Initial value of counter is 0.");

	// call defined function
	QUnit.equal(test_instance.a(), 1, "Calling original function.");

	// call aliased function
	QUnit.equal(test_instance.z(), 2, "Calling alias calls original function.");

	// test aliases working against inheritance
	var subclass = create(test, {
		__alias_y : "b",
		__alias_b : "a",
		c : function() {
			return 3;
		},
		z : function() {
			return this.$$parent();
		}
	});

	var subclass_instance = new subclass();
	// call the main function
	QUnit.equal(subclass_instance.x, 0, "Initial value of counter is 0.");

	// call defined function
	QUnit.equal(subclass_instance.a(), 1, "Calling original function.");

	// call defined function
	QUnit.equal(subclass_instance.b(), 2, "Calling overridden aliased function.");

	// call aliased function
	QUnit.equal(subclass_instance.z(), 3, "Calling alias calls original function's parent.");

	// test aliases working against inheritance
	var test2 = create({
		__alias_ : {
			z : "a"
		},
		x : 0,
		a : function() {
			return ++this.x;
		}
	});

	var test2_instance = new test2();
	// call defined function
	test2_instance.a();

	// call aliased function
	QUnit.equal(test2_instance.z(), 2, "Calling alias defined in object calls original function's parent.");
});

QUnit.test("adding new aliased properties after class definition", function() {
	QUnit.expect(3);
	// testing class for known properties in every defined class
	var test = create({});

	// adding properties to the prototype
	test.prototype.b = function() {
		return 1;
	};

	// testing adding aliases
	test.addAliasedProperty("j", "b");
	QUnit.equal((new test()).j(), 1, "invoking a method added using addAliasedProperty method.");

	// test adding multiple properties
	test.addProperty({
		e : function() {
			return 1;
		}
	});

	// testing adding aliases
	test.addAliasedProperty({
		k : "e"
	});
	QUnit.equal((new test()).k(), 1, "adding multiple aliased properties to the class with addAliasedProperty.");

	// test adding properties to parent classes
	var subclass = create(test, {
		g : function() {
			return 3;
		},
		h : function() {
			return this.$$parent();
		}
	});

	// testing adding aliases
	test.addAliasedProperty("l", "b");
	QUnit.equal((new subclass()).l(), 1, "invoking a method added using addAliasedProperty to parent prototype after definition with existing child method.");
});
