/* global Observer */
/* global create */
/* global isArray */
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

	QUnit.raises(function(){
		var observer2 = new Observer(null, "z", val);
		testinstance.z = observer2;
	}, Error, "Observer null context throws error on instantiation.");
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
	QUnit.expect(10);
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

	var first_listener = function(value) {
		QUnit.ok(true, "First bound event listener called.");
		QUnit.equal(value, newvalue, "Set value passed to event listener as first parameter.");
		QUnit.ok(this === testinstance, "Context of base object passed to event listener.");
	};
	var second_listener = function(value) {
		QUnit.ok(true, "Second bound event listener called.");
	};
	var third_listener = function(value) {
		QUnit.ok(true, "Third bound event listener bound with 'on' called.");
	};

	// add event listeners
	QUnit.ok(observer.addListener(first_listener) === testinstance, "The return value of addListener is a chain of internal instance.");

	// add event listeners
	observer.addListener(second_listener);

	// add event listeners with "on" alias
	observer.on(third_listener);

	// trigger the event listeners
	observer.set(newvalue);

	// create observer with writable flag true
	var observer2 = new Observer(testinstance, "y", val);

	// add event listeners
	observer2.addListener(function(value) {
		throw new Error("Unmodified value should not call this listener");
	});

	// attempt to trigger the event listeners
	observer2.set(val);

	// get the list of event listeners
	var listeners = observer.listeners();
	QUnit.ok(isArray(listeners), "observers listeners method returned an array of bound listeners.");
	QUnit.equal(listeners.length, 3, "observers listeners method returned an array or proper number of events.");
	QUnit.equal(listeners[0], first_listener, "observers listeners method returned an array of bound listeners unmodified.");

	// attempting to add non function listener throws error
	QUnit.raises(function(){
		observer2.addListener({});
	}, Error, "Attempt to bind non function listener throws error.");
});

QUnit.test("observer with event listeners bound with 'once'", function() {
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
	var called = false;
	// create observer with writable flag true
	var observer = new Observer(testinstance, "z", val);

	var first_listener = function(value) {
		QUnit.ok(true, "First bound event listener called.");
		QUnit.equal(value, newvalue, "Set value passed to event listener as first parameter.");
		QUnit.ok(this === testinstance, "Context of base object passed to event listener.");
		QUnit.ok(!called, "Events bound with once only gets called once");
		called = false;
	};

	// add event listeners
	QUnit.ok(observer.once(first_listener) === testinstance, "The return value of addListener is a chain of internal instance.");

	// trigger the event listeners
	observer.set(newvalue);
	observer.set(newvalue);

	// get the list of event listeners
	var listeners = observer.listeners();
	QUnit.ok(isArray(listeners), "observers listeners method returned an array of bound listeners.");
	QUnit.equal(listeners.length, 0, "observers listeners method returned an array or proper number of events.");

	QUnit.raises(function(){
		observer.once({});
	}, Error, "Attempt to bind non function listener throws error.");
});

QUnit.test("directly calling emit function from observer", function() {
	QUnit.expect(4);
	var test = create({});
	var testinstance = new test();

	var val = 10;
	var observer = new Observer(testinstance, "z", val);

	observer.addListener(function(value, a) {
		QUnit.equal(arguments.length, 2, "observers listeners method gets passed correct number of arguments when called with emit.");
		QUnit.equal(value, val, "observers listeners method first argument is always the current value.");
		QUnit.equal(a, 1, "observers listeners method arguments from emit gets passed as additional arguments.");
	});

	// call emit function directly
	QUnit.ok(observer.emit(1) === testinstance, "The return value of emit is a chain of internal instance.");
});

QUnit.test("removing bound event listeners from observer", function() {
	QUnit.expect(11);
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

	var first_listener = function(value) {
		throw new Error("First event listener called.");
	};
	var second_listener = function(value) {
		QUnit.ok(true, "Second bound event listener called.");
	};
	var third_listener = function(value) {
		QUnit.ok(true, "Third bound event listener called.");
	};
	// add event listener
	observer.addListener(first_listener);

	// add event listener
	observer.addListener(second_listener);

	// remove event listener
	QUnit.ok(observer.removeListener(first_listener) === testinstance, "The return value of removeListener is a chain of internal instance.");

	// trigger the event listeners
	observer.set(newvalue);

	// remove event listener bound with once
	observer.once(third_listener);
	// get the list of event listeners
	QUnit.equal(observer.listeners().length, 2, "observers listeners method returned an array or proper number of events after bound with once.");
	observer.removeListener(third_listener);

	// get the list of event listeners
	var listeners = observer.listeners();
	QUnit.ok(isArray(listeners), "observers listeners method returned an array of bound listeners.");
	QUnit.equal(listeners.length, 1, "observers listeners method returned an array or proper number of events.");
	QUnit.equal(listeners[0], second_listener, "observers listeners method returned an array of bound listeners unmodified.");

	// attempting to remove non function listener throws error
	QUnit.raises(function(){
		observer.removeListener({});
	}, Error, "Attempt to remove non function listener throws error.");

	// add event listener
	observer.addListener(function(value) {
		throw new Error("Third event listener called.");
	});

	// attempt to remove non bound listener
	observer.removeListener(function() {
	});
	QUnit.equal(observer.listeners().length, 2, "Attempting to remove non bound listener does nothing.");

	// testing removing all event listeners
	QUnit.ok(observer.removeAllListeners() === testinstance, "The return value of removeAllListeners is a chain of internal instance.");

	// trigger the event listeners
	observer.set(val);

	// get the list of event listeners
	var listeners1 = observer.listeners();
	QUnit.ok(isArray(listeners1), "observers listeners method returned an array of bound listeners.");
	QUnit.equal(listeners1.length, 0, "observers listeners method returned an array or proper number of events after removal of all listeners.");
});

QUnit.test("observer with bound setter event listeners and the delay flag set to true", function() {
	QUnit.expect(3);
	QUnit.stop();
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
		delay : 1
	});

	// flag to make sure we only fire events once
	var fired = 0;

	// add event listeners
	observer.addListener(function(value) {
		fired++;
		QUnit.start();
		QUnit.equal(value, newvalue * 100, "Final set value passed to delayed event listener as first parameter.");
		QUnit.ok(this === testinstance, "Context of base object passed to delayed event listener.");
		QUnit.equal(fired, 1, "Event listener only executed once.");
	});

	// trigger the event listeners
	observer.set(newvalue);
	observer.set(newvalue * 10);
	observer.set(newvalue * 100);
});
