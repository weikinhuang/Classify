QUnit.module("mutator.nowrap");

QUnit.test("non wrapped properties", function() {
	QUnit.expect(3);
	// testing class creation with static properties
	var test = create({
		__nowrap_a : 2,
		__nowrap_b : Array.prototype.push,
		length : 0
	});

	QUnit.equal((new test()).a, 2, "Reading non wrapped property of an class");
	QUnit.equal((new test()).b, Array.prototype.push, "Reading non wrapped method of an class");
	// calling non wrapped property
	var test_instance = new test();
	test_instance.b("a");
	QUnit.equal(test_instance[0], "a", "Invoking non wrapped function is called within instance context");
});

QUnit.test("non wrapped properties defined in container", function() {
	QUnit.expect(3);
	// testing class creation with static properties
	var test = create({
		__nowrap_ : {
			a : 2,
			b : Array.prototype.push
		},
		length : 0
	});

	QUnit.equal((new test()).a, 2, "Reading non wrapped property of an class when defined within container");
	QUnit.equal((new test()).b, Array.prototype.push, "Reading non wrapped method of an class when defined within container");
	// calling non wrapped property
	var test_instance = new test();
	test_instance.b("a");
	QUnit.equal(test_instance[0], "a", "Invoking non wrapped function is called within instance context when defined within container");
});


QUnit.test("adding new unwrapped properties after class definition", function() {
	QUnit.expect(1);
	// testing class for known properties in every defined class
	var test = create({});

	// testing adding non wrapped properties
	test.addUnwrappedProperty("m", Array.prototype.push);
	QUnit.equal((new test()).m, Array.prototype.push, "testing a method added using addUnwrappedProperty method.");
});