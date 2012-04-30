QUnit.module("observer");

QUnit.test("basic observer creation", function() {
	QUnit.expect(5);
	var test = create({
		a : function() {
			return 1;
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	var val = 10;
	// create basic observer
	var observer = new Observer(testinstance, "z", val);
	testinstance.z = observer;

	// test instance
	QUnit.ok(observer instanceof Observer, "observer is an instance of Observer.");

	// test toString method
	QUnit.equal(observer.toString(), "[observer z]", "Observer toString function returned [observer name].");
	QUnit.equal(observer.toString(), observer + "", "Observer toString function returned equivalent to string concat.");

	// test toValue method
	QUnit.equal(observer.toValue(), val, "Observer toValue function returned basic value of the internal value.");

	try {
		var observer2 = new Observer(null, "z", val);
		testinstance.z = observer2;
	} catch (e) {
		QUnit.ok(!!e, "Observer null context throws error on instantiation.");
	}
});

QUnit.test("observer getter with 'get' functionality", function() {
	QUnit.expect(5);
	var test = create({
		a : function() {
			return 1;
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	var val = 10;
	// create basic observer
	var observer = new Observer(testinstance, "z", val);
	testinstance.z = observer;

	// test default getter functionality
	QUnit.equal(observer.get(), val, "observer default get returns internal value unmodified.");

	var observer2 = new Observer(testinstance, "y", {
		value : val,
		get : function(value) {
			// make sure unmodified value is passed along
			QUnit.equal(value, val, "observer defined get passes internal value.");
			// make sure context is passed through (cannot use equal, node throws "Converting circular structure to JSON")
			QUnit.ok(this === testinstance, "observer defined get passes context of parent.");
			return value * 10;
		}
	});
	testinstance.y = observer2;

	// test defined getter functionality
	QUnit.equal(observer2.get(), val * 10, "observer defined get returns a modified internal value.");

	var observer3 = new Observer(testinstance, "x", {
		value : val,
		get : function(value) {
			// test that the observer's getter can access the observed context's functions
			return this.a();
		}
	});
	testinstance.x = observer3;

	// test defined getter
	QUnit.equal(observer3.get(), 1, "observer defined get returns a modified internal value from context.");
});

QUnit.test("observer setter with 'set' functionality", function() {
	QUnit.expect(8);
	var test = create({
		a : function() {
			return 1;
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	var val = 10;
	var newvalue = 100;
	// create basic observer
	var observer = new Observer(testinstance, "z", val);
	testinstance.z = observer;

	// test default setter functionality
	QUnit.ok(observer.set(newvalue) === testinstance, "The return value of the setter should be a chain of internal instance.");
	// check that the internal value was propertly set
	QUnit.equal(observer.get(), newvalue, "The internal value of the observer was modified by the setter.");

	var observer2 = new Observer(testinstance, "y", {
		value : val,
		set : function(value, original) {
			// make sure new value is passed along
			QUnit.equal(value, newvalue, "observer defined set passes new value as first parameter.");
			// make sure original value is passed along
			QUnit.equal(original, val, "observer defined set passes internal value as second parameter.");
			// make sure context is passed through (cannot use equal, node throws "Converting circular structure to JSON")
			QUnit.ok(this === testinstance, "observer defined set passes context of parent.");
			return newvalue;
		}
	});
	testinstance.y = observer2;

	// test defined setter functionality
	QUnit.ok(observer2.set(newvalue) === testinstance, "The return value of the setter is a chain of internal instance.");
	// test defined getter
	QUnit.equal(observer2.get(), newvalue, "observer defined set returns a modified internal value.");

	var observer3 = new Observer(testinstance, "x", {
		value : val,
		set : function(value, original) {
			// test that the observer's getter can access the observed context's functions
			return this.a();
		}
	});
	testinstance.x = observer3;

	observer3.set(newvalue);
	// test defined getter
	QUnit.equal(observer3.get(), 1, "observer defined set returns a modified internal value from context.");
});

QUnit.test("observer readonly with 'writable' functionality", function() {
	QUnit.expect(3);
	var test = create({
		a : function() {
			return 1;
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	var val = 10;
	var newvalue = 100;
	// create observer with writable flag true
	var observer = new Observer(testinstance, "z", {
		value : val,
		writable : true
	});
	testinstance.z = observer;
	// set the value
	observer.set(newvalue);
	// check that the internal value was propertly set
	QUnit.equal(observer.get(), newvalue, "The internal value of the observer was modified by the setter when writable.");

	// create observer with writable flag false
	var observer2 = new Observer(testinstance, "y", {
		value : val,
		writable : false
	});
	testinstance.y = observer2;
	// set the value
	observer2.set(newvalue);
	// check that the internal value was not modified
	QUnit.equal(observer2.get(), val, "The internal value of the observer was not modified by the setter when not writable.");

	// create observer with writable flag true
	var observer3 = new Observer(testinstance, "x", {
		value : val,
		writable : true
	});
	testinstance.x = observer3;
	// adjust the writable flag
	observer3.writable = false;
	// set the value
	observer3.set(newvalue);
	// check that the internal value was not modified
	QUnit.equal(observer2.get(), val, "The internal value of the observer was not modified by the setter when not writable.");
});

QUnit.test("observer called in context with class", function() {
	QUnit.expect(4);
	var test = create({
		a : function() {
			return 1;
		},
		b : function() {
			return this.z.get();
		},
		c : function() {
			this.z.set(1000);
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	var val = 10;
	var newvalue = 100;
	// create observer with writable flag true
	testinstance.z = new Observer(testinstance, "z", {
		value : val,
		writable : true
	});

	// test default setter functionality
	QUnit.ok(testinstance.z.set(newvalue) === testinstance, "The return value of the setter is a chain of internal instance.");
	// check that the internal value was propertly set
	QUnit.equal(testinstance.z.get(), newvalue, "The internal value of the observer was modified by the setter.");

	// test that we can access the observer from within the object
	QUnit.equal(testinstance.b(), newvalue, "Observer called from within object instance can be accessed.");

	testinstance.c();

	// check that the internal value was propertly set
	QUnit.equal(testinstance.z.get(), 1000, "The internal value of the observer was modified internally by context object.");
});

QUnit.test("observer with bound setter event listeners", function() {
	QUnit.expect(9);
	var test = create({
		a : function() {
			return 1;
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	var val = 10;
	var newvalue = 100;
	// create observer with writable flag true
	var observer = new Observer(testinstance, "z", val);

	var first_listener = function(value, original) {
		QUnit.ok(true, "First bound event listener called.");
		QUnit.equal(value, newvalue, "Set value passed to event listener as first parameter.");
		QUnit.equal(original, val, "Original value passed to event listener as second parameter.");
		QUnit.ok(this === testinstance, "Context of base object passed to event listener.");
	};
	var second_listener = function(value, original) {
		QUnit.ok(true, "Second bound event listener called.");
	};

	// add event listeners
	QUnit.ok(observer.addListener(first_listener) === testinstance, "The return value of addListener is a chain of internal instance.");

	// add event listeners
	observer.addListener(second_listener);

	// trigger the event listeners
	observer.set(newvalue);

	// create observer with writable flag true
	var observer2 = new Observer(testinstance, "y", val);

	// add event listeners
	observer2.addListener(function(value, original) {
		throw new Error("Unmodified value should not call this listener");
	});

	// attempt to trigger the event listeners
	observer2.set(val);

	// get the list of event listeners
	var listeners = observer.listeners();
	QUnit.ok(isArray(listeners), "observers listeners method returned an array of bound listeners.");
	QUnit.equal(listeners.length, 2, "observers listeners method returned an array or proper number of events.");
	QUnit.equal(listeners[0], first_listener, "observers listeners method returned an array of bound listeners unmodified.");
});

QUnit.test("removing bound event listeners from observer", function() {
	QUnit.expect(8);
	var test = create({
		a : function() {
			return 1;
		},
		e : function() {
			return this.constructor;
		}
	});
	var testinstance = new test();

	var val = 10;
	var newvalue = 100;
	// create observer with writable flag true
	var observer = new Observer(testinstance, "z", val);

	var first_listener = function(value, original) {
		throw new Error("First event listener called.");
	};
	var second_listener = function(value, original) {
		QUnit.ok(true, "Second bound event listener called.");
	};
	// add event listener
	observer.addListener(first_listener);

	// add event listener
	observer.addListener(second_listener);

	// remove event listener
	QUnit.ok(observer.removeListener(first_listener) === testinstance, "The return value of removeListener is a chain of internal instance.");

	// trigger the event listeners
	observer.set(newvalue);

	// get the list of event listeners
	var listeners = observer.listeners();
	QUnit.ok(isArray(listeners), "observers listeners method returned an array of bound listeners.");
	QUnit.equal(listeners.length, 1, "observers listeners method returned an array or proper number of events.");
	QUnit.equal(listeners[0], second_listener, "observers listeners method returned an array of bound listeners unmodified.");

	// add event listener
	observer.addListener(function(value, original) {
		throw new Error("Third event listener called.");
	});

	// testing removing all event listeners
	QUnit.ok(observer.removeAllListeners() === testinstance, "The return value of removeAllListeners is a chain of internal instance.");

	// trigger the event listeners
	observer.set(val);

	// get the list of event listeners
	var listeners = observer.listeners();
	QUnit.ok(isArray(listeners), "observers listeners method returned an array of bound listeners.");
	QUnit.equal(listeners.length, 0, "observers listeners method returned an array or proper number of events after removal of all listeners.");
});

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
	testinstance.z.addListener(function(value, original) {
		this.b(value);
	});
	testinstance.z.set(1);

	// test separate instances of instantiated class
	var testinstance2 = new test();
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
	testinstance.z.addListener(function(value, original) {
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
