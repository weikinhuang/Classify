QUnit.module("mutator.observable");

QUnit.test("instantiating observer as part of object initialization", function() {
	QUnit.expect(7);
	var test = create({
		__observable_x : 10,
		__observable_y : {
			value : 100,
			get : function(value) {
				return value * 10;
			},
			set : function(value, original) {
				return this.a();
			}
		},
		__observable_z : 1000,
		a : function() {
			return 1;
		},
		b : function(value) {
			QUnit.equal(value, 1, "Observable event listener called internal function.");
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	// test that observers are created
	QUnit.ok(testinstance.x instanceof Observer, "Instantiated class has instance of observer.");

	QUnit.equal(testinstance.x.get(), 10, "Calling observer from object context.");
	QUnit.equal(testinstance.y.get(), 1000, "Calling observer from object context with defined getter.");
	QUnit.ok(testinstance.y.set() === testinstance, "The return value of setter function is a chain of parent instance.");
	QUnit.equal(testinstance.y.get(), 10, "Calling observer from object context with setter referencing parent function.");

	// add an event listener
	testinstance.z.addListener(function(value) {
		this.b(value);
	});
	testinstance.z.set(1);

	// test separate instances of instantiated class
	var testinstance2 = new test();
	QUnit.ok(testinstance.x !== testinstance2.x, "Separate instances of classes have different observers.");
});

QUnit.test("instantiating observer as part of object initialization with applicate", function() {
	QUnit.expect(7);
	var test = create({
		__observable_x : 10,
		__observable_y : {
			value : 100,
			get : function(value) {
				return value * 10;
			},
			set : function(value, original) {
				return this.a();
			}
		},
		__observable_z : 1000,
		a : function() {
			return 1;
		},
		b : function(value) {
			QUnit.equal(value, 1, "Observable event listener called internal function through applicate.");
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = test.applicate([ 2 ]);

	// test that observers are created
	QUnit.ok(testinstance.x instanceof Observer, "Applied class has instance of observer.");

	QUnit.equal(testinstance.x.get(), 10, "Calling observer from object context.");
	QUnit.equal(testinstance.y.get(), 1000, "Calling observer from object context with defined getter.");
	QUnit.ok(testinstance.y.set() === testinstance, "The return value of setter function is a chain of parent instance.");
	QUnit.equal(testinstance.y.get(), 10, "Calling observer from object context with setter referencing parent function.");

	// add an event listener
	testinstance.z.addListener(function(value) {
		this.b(value);
	});
	testinstance.z.set(1);

	// test separate instances of instantiated class
	var testinstance2 = test.applicate([ 3 ]);
	QUnit.ok(testinstance.x !== testinstance2.x, "Separate instances of classes have different observers.");
});

QUnit.test("instantiating observer as part of object initialization when defined in container", function() {
	QUnit.expect(7);
	var test = create({
		__observable_ : {
			x : 10,
			y : {
				value : 100,
				get : function(value) {
					return value * 10;
				},
				set : function(value, original) {
					return this.a();
				}
			},
			z : 1000
		},
		a : function() {
			return 1;
		},
		b : function(value) {
			QUnit.equal(value, 1, "Observable event listener called internal function.");
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	// test that observers are created
	QUnit.ok(testinstance.x instanceof Observer, "Instantiated class has instance of observer.");

	QUnit.equal(testinstance.x.get(), 10, "Calling observer from object context.");
	QUnit.equal(testinstance.y.get(), 1000, "Calling observer from object context with defined getter.");
	QUnit.ok(testinstance.y.set() === testinstance, "The return value of setter function is a chain of parent instance.");
	QUnit.equal(testinstance.y.get(), 10, "Calling observer from object context with setter referencing parent function.");

	// add an event listener
	testinstance.z.addListener(function(value) {
		this.b(value);
	});
	testinstance.z.set(1);

	// test separate instances of instantiated class
	var testinstance2 = new test();
	QUnit.ok(testinstance.x !== testinstance2.x, "Separate instances of classes have different observers.");
});

QUnit.test("adding observable properties after class definition", function() {
	QUnit.expect(2);
	var test = create({
		a : function() {
			return 1;
		}
	});
	// add a new observable property
	test.addObservableProperty("x", 10);

	var testinstance = new test();

	// test that observers are created
	QUnit.ok(testinstance.x instanceof Observer, "Instantiated class has instance of observer with addObservableProperty.");

	var test2 = create({
		a : function() {
			return 1;
		}
	});

	var test3 = create(test2, {
		b : function() {
			return 2;
		}
	});

	// add a new observable property to parent class
	test2.addObservableProperty("x", 10);

	var testinstance3 = new test3();

	// test that observers are created in child class
	QUnit.ok(testinstance3.x instanceof Observer, "Instantiated child class has instance of observer with addObservableProperty.");
});

QUnit.test("removing observable properties after class definition", function() {
	QUnit.expect(2);
	var test = create({
		__observable_x : 10,
		a : function() {
			return 1;
		}
	});
	// add a new observable property
	test.removeObservableProperty("x");

	var testinstance = new test();

	// test that observers are not created
	QUnit.equal(testinstance.x, undefined, "Instantiated class does not have instance of observer after removeObservableProperty.");

	var test2 = create({
		__observable_x : 10,
		a : function() {
			return 1;
		}
	});

	var test3 = create(test2, {
		b : function() {
			return 2;
		}
	});

	// add a new observable property to parent class
	test2.removeObservableProperty("x");

	var testinstance3 = new test3();

	// test that observers are created in child class
	QUnit.equal(testinstance3.x, undefined, "Instantiated child class does not have instance of observer after removeObservableProperty.");
});
