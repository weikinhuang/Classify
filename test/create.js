QUnit.module("create");

QUnit.test("simple class creation", function() {
	QUnit.expect(9);
	var test = create({
		a : 1,
		b : function() {
			return this.a;
		},
		c : function() {
			return this.b();
		},
		toString : function() {
			return "a";
		},
		valueOf : function() {
			return 2;
		}
	});

	QUnit.equal(typeof test, "function", "defined class is an object");
	QUnit.equal(typeof new test(), "object", "instantiated class is an object");
	QUnit.equal(new test().a, 1, "member variable is as defined");
	QUnit.equal(new test().b(), 1, "call to member variable within context");
	QUnit.equal(new test().c(), 1, "call to member function within context");

	// valueOf is always called ahead of toString when it is defined
	QUnit.equal(new test() + "", "2", "implicit toString() called explicitly");
	QUnit.equal((new test()).toString(), "a", "explicit toString() called explicitly");
	QUnit.equal(+new test(), 2, "implicit valueOf() called explicitly");
	QUnit.equal((new test()).valueOf(), 2, "explicit valueOf() called explicitly");
});

QUnit.test("invocation and constructors", function() {
	QUnit.expect(18);
	// testing class creation without a constructor
	var test = create({
		a : 1,
		b : function() {
			return this.a;
		}
	});
	QUnit.equal(typeof new test(), "object", "instantiated class with no constructor is an object");
	QUnit.ok(new test() instanceof test, "instantiated class with no constructor is an an proper instance");
	QUnit.equal(new test().b(), 1, "call to member variable within context with no constructor");

	// testing class creation with a basic constructor
	test = create({
		a : 1,
		init : function() {
			this.a = 2;
		},
		b : function() {
			return this.a;
		}
	});
	// testing class creation with a basic constructor
	QUnit.equal(typeof new test(), "object", "instantiated class with basic constructor is an object");
	QUnit.ok(new test() instanceof test, "instantiated class with basic constructor is an an proper instance");
	QUnit.equal(new test().b(), 2, "call to member variable within context with basic constructor");

	// test creating a constructor with parameters
	test = create({
		a : 1,
		init : function(a) {
			this.a = a;
		},
		b : function() {
			return this.a;
		}
	});
	// testing class creation with a basic constructor
	QUnit.equal(typeof new test(3), "object", "instantiated class with simple constructor is an object");
	QUnit.ok(new test(3) instanceof test, "instantiated class with simple constructor is an an proper instance");
	QUnit.equal(new test(3).b(), 3, "call to member variable within context with simple constructor");

	// test creating a instances with invocation
	test = create({
		a : 1,
		init : function(a) {
			this.a = a;
		},
		b : function() {
			return this.a;
		}
	});
	// testing class creation with a basic constructor
	QUnit.equal(typeof test(3), "object", "instantiated class invocation is an object");
	QUnit.ok(test(3) instanceof test, "instantiated class with invocation is an an proper instance");
	QUnit.equal(test(3).b(), 3, "call to member variable within context with invocation");

	// test overriding invocation function to not generate a class instance
	test = create({
		a : 1,
		invoke : function() {
			return "x";
		},
		init : function(a) {
			this.a = a;
		}
	});
	QUnit.equal(test(), "x", "override invocation functionality to execute functionality");

	// calling apply on a class to generate an instance
	test = create({
		a : 1,
		init : function(a) {
			this.a = a;
		}
	});
	QUnit.ok(test.applicate([ 2 ]) instanceof test, "assuring creating a new instance of a class by passing an array of parameters is of type class");
	QUnit.equal(test.applicate([ 2 ]).a, 2, "creating a new instance of a class by passing an array of parameters");

	// using "this" in invoke to create a instance
	test = create({
		a : 1,
		invoke : function() {
			return new this();
		},
		init : function(a) {
			this.a = a;
		}
	});
	QUnit.ok(test() instanceof test, "using the 'this' keyword to instantiate a new instance");

	// overriding
	test = create({
		init : function(a) {
			this.a = a;
		}
	});
	var test_sub = create({
		init : function(a) {
			return new test(a);
		}
	});
	QUnit.ok(new test_sub() instanceof test, "overriding the 'new' keyword within a class constructor");
	QUnit.ok(test_sub.applicate([ "a" ]) instanceof test, "overriding the 'new' keyword within a class constructor called with applicate");
});

QUnit.test("known properties", function() {
	QUnit.expect(9);
	// testing class for known properties in every defined class
	var test = create({});

	QUnit.equal(test.__isclass_, true, "flag indicating this object was created using the create method");
	QUnit.equal((new test()).constructor, test, "assert that we have a internal reference to the constructor via 'constructor'");
	QUnit.equal((new test()).self, test, "assert that we have a internal reference to the constructor via 'self'");
	QUnit.equal(typeof test.superclass, "function", "assert that there is an internal reference to the parent class");
	QUnit.equal(test.superclass, base, "assert that the reference to the superclass is the parent");
	QUnit.equal(typeof test.subclass, "object", "assert that an array is created holding child classes");
	QUnit.equal(test.subclass.length, 0, "assert that there are no child classes extending this object");
	QUnit.ok(new test() instanceof test, "assert that a new object of this class is an instance of it's constructor");
	QUnit.ok(new test() instanceof base, "assert that a new object of this class is an instance of it's parent");
});

QUnit.test("extending classes using inheritance", function() {
	QUnit.expect(26);
	// testing class for known properties in every defined class
	var test = create({
		z : 1,
		a : function() {
			return 1;
		},
		b : function() {
			return 2;
		},
		d : function() {
			return 4;
		},
		e : function() {
			return this.constructor;
		}
	});
	var subclass = create(test, {
		z : 2,
		c : function() {
			return 3;
		},
		d : function() {
			return this.parent();
		},
		f : function() {
			return this.constructor;
		}
	});
	var subclass_a = create(test, {
		b : function() {
			// invoking the parent version of this function
			return this.parent() + 4;
		}
	});
	var subsubclass = create(subclass, {
		c : function() {
			return 4;
		},
		d : function() {
			return this.parent();
		},
		e : function() {
			return this.parent();
		}
	});

	// test instance inheritance functionality
	QUnit.ok((new test()) instanceof test, "assert that instantiated classes are instances of itself");
	QUnit.ok((new subclass()) instanceof test, "assert that inherited classes are instances of it's parent");
	QUnit.ok((new subsubclass()) instanceof test, "assert that inherited classes are instances of it's parent (multi level)");
	QUnit.ok((new subsubclass()) instanceof subclass, "assert that inherited classes are instances of it's parent (single level)");

	// test prototype inheritance functionality
	QUnit.equal((new subclass()).a(), 1, "inherited function in child class is executed");
	QUnit.equal((new subclass()).c(), 3, "new function in child class is executed");
	QUnit.equal((new subsubclass()).c(), 4, "overriden function in child class is executed");

	// test 'this' reference integrity
	QUnit.equal((new subclass()).e(), subclass, "reference to this within inherited function is to itself");

	// test calling parent functions
	QUnit.equal((new subclass()).d(), 4, "parent method in overriden method is executed");
	QUnit.equal((new subclass_a()).b(), 6, "parent method in overriden method is executed with additional logic");
	QUnit.equal((new subsubclass()).d(), 4, "parent method in overriden method is executed (multi level)");
	QUnit.equal((new subsubclass()).e(), subsubclass, "parent method's 'this' is still referencing proper object");

	// calling apply on a class to generate an instance
	QUnit.ok(subclass.applicate([ 2 ]) instanceof test, "assuring creating a new instance of a class by passing an array of parameters is of type parent class");
	QUnit.ok(subclass.applicate([ 2 ]) instanceof subclass, "assuring creating a new instance of a class by passing an array of parameters is of type class");
	QUnit.equal(subclass.applicate([ 2 ]).z, 2, "creating a new instance of a class by passing an array of parameters");

	// calling invoke on a class to generate an instance
	QUnit.ok(subclass(2) instanceof test, "assuring creating a new instance of a class using invocation is of type parent class");
	QUnit.ok(subclass(2) instanceof subclass, "assuring creating a new instance of a class using invocation is of type class");

	// testing inherited properties
	var test_a = create({
		a : 1,
		b : 2,
		c : []
	});
	var subclass_a = create(test_a, {
		b : 3,
		d : {}
	});
	var subsubclass_a = create(subclass_a, {
		e : function() {
			this.c.push(1);
			return this.c;
		}
	});
	var x = new test_a(), y = new subclass_a(), z = new subsubclass_a();
	QUnit.equal(y.a, 1, "Reusing a property from an inherited function");
	QUnit.equal(y.b, 3, "Overriding a existing property from a parent class");
	QUnit.equal(z.e(), x.c, "Using a object as a property causes property to be a pointer");

	// testing parent calling functions in newly added methods
	subsubclass.addProperty("f", function() {
		// function with parent version
		QUnit.equal(typeof this.parent, "function", "method with override has a parent method");
		QUnit.equal(this.parent(), this.constructor, "parent method context is current class' context");
	});
	subsubclass.addProperty("g", function() {
		// function without parent version
		QUnit.equal(typeof this.parent, "undefined", "method with no override has no parent method");
	});
	(new subsubclass()).f();
	(new subsubclass()).g();

	// extending objects using the extend function
	var subsubclass_b = subsubclass_a.extend({
		f : 1
	});
	QUnit.ok(new subsubclass_b() instanceof subsubclass_a, "Class created with class.extend inherts from parent class.");

	// testing using the parent invoke method
	var double, triple, single = create({
		invoke : function() {
			QUnit.equal(this, double, "parent invoke method called from child context");
			if (!this.instance) {
				this.instance = this.applicate(arguments);
			}
			return this.instance;
		},
		init : function() {
			if (this.constructor.instance) {
				return this.constructor.instance;
			}
		}
	});
	double = create(single, {});
	double();
	triple = create(single, {
		invoke : function() {
			QUnit.equal(this, triple, "child invoke method called from child context");
		}
	});
	triple();
});

QUnit.test("Calling parent methods with the invoke magic method", function() {
	QUnit.expect(3);
	// testing class for known properties in every defined class
	var test = create({
		z : 1,
		a : function() {
			return 1;
		},
		b : function() {
			return 2;
		},
		d : function() {
			return 4;
		}
	});
	var subclass = create(test, {
		b : function() {
			return 5;
		},
		c : function() {
			return 3;
		},
		d : function() {
			return this.invoke("b");
		}
	});

	QUnit.equal((new subclass()).d(), 2, "Calling invoke from within class invokes parent method.");
	QUnit.equal((new subclass()).invoke("b"), 2, "Calling invoke from outside class invokes parent method.");

	try {
		(new subclass()).invoke("z");
	} catch (e) {
		QUnit.ok(e instanceof Error, "Attempts to invoke parent property that is not a function throws a error.");
	}
});

QUnit.test("adding new properties", function() {
	QUnit.expect(7);
	// testing class for known properties in every defined class
	var test = create({});

	// adding properties to the prototype
	test.prototype.b = function() {
		return 1;
	};
	QUnit.equal((new test()).b(), 1, "invoking a method added using prototype method");
	test.addProperty("c", function() {
		return 1;
	});
	QUnit.equal((new test()).c(), 1, "invoking a method added using addProperty method");

	var proto = Object.prototype.toString;
	test.addProperty("toString", function() {
		return "nothing";
	});
	test.addProperty("toString", proto);
	QUnit.ok(test.prototype.toString !== Object.prototype.toString, "adding object properties do nothing");

	// adding properties to the object
	test.b = function() {
		return 1;
	};
	QUnit.equal(test.b(), 1, "invoking a method added using classical method");

	// test adding multiple properties
	test.addProperty({
		e : function() {
			return 1;
		}
	});
	QUnit.equal((new test()).e(), 1, "adding multiple properties to the class with add property");

	// test adding properties to parent classes
	var subclass = create(test, {
		g : function() {
			return 3;
		},
		h : function() {
			return this.parent();
		}
	});

	test.addProperty("i", function() {
		return 4;
	});
	QUnit.equal((new subclass()).i(), 4, "invoking a method added using addProperty to parent prototype after definition.");

	test.addProperty("h", function() {
		return 5;
	});
	QUnit.equal((new subclass()).h(), 5, "invoking a method added using addProperty to parent prototype after definition with existing child method.");
});

QUnit.test("removing existing properties", function() {
	QUnit.expect(5);
	// testing class for known properties in every defined class
	var test = create({
		x : 1,
		a : function() {
			return 1;
		}
	});

	// remove a prototype value
	test.removeProperty("x");
	QUnit.equal((new test()).x, undefined, "instance property removed from class prototype.");

	// remove a prototype function
	test.removeProperty("a");
	QUnit.equal((new test()).a, undefined, "instance function removed from class prototype.");

	var test2 = create({
		x : 1,
		a : function() {
			return 1;
		},
		b : function() {
			return 2;
		}
	});

	// test removing properties to parent classes
	var subclass = create(test2, {
		x : 2,
		b : function() {
			QUnit.equal(this.parent, undefined, "parent reference removed when parent function is removed");
		},
		c : function() {
			return 3;
		}
	});
	// remove overriden property in parent
	test2.removeProperty("x");
	QUnit.equal((new subclass()).x, 2, "Removing parent property doesn't remove child property if defined in child.");

	test2.removeProperty("a");
	QUnit.equal((new subclass()).a, undefined, "Removing parent function removes it from child prototype chain.");

	test2.removeProperty("b");
	// trigger test for removing parent function overriden in child
	(new subclass()).b();
});

QUnit.test("extending core Javascript objects using inheritance", function() {
	QUnit.expect(4);
	// extending the Number object
	var test_number = create(Number, {
		init : function() {
			this.value = Number.prototype.constructor.apply(this, arguments);
		},
		custom : function() {
			return "I am " + this.toFixed(6) + ".";
		},
		round : function() {
			return Math.round(this.valueOf());
		},
		valueOf : function() {
			return Number(this.value).valueOf();
		},
		toString : function() {
			return Number(this.value).toString();
		}
	});

	// this test fails in Internet explorer because of using prototypes
	// of the scalar objects are prohibited in extended objects
	try {
		// var test_n = new test_number("15.6");
		// QUnit.equal(test_n.valueOf(), 15.6, "Overriden valueOf function called for Number");
		// QUnit.equal(test_n.toString(), "15.6", "Overriden toString function called for Number");
		// QUnit.equal(test_n.toPrecision(4), "15.60", "Native function called for Number");
		// QUnit.equal(test_n.round(), 16, "Custom prototype function (round) called for Number.");
		// QUnit.equal(test_n.custom(), "I am 15.600000.", "Custom prototype function using native function called for Number.");
		// QUnit.ok(test_n instanceof test_number, "Extended Number object is an instance of itself.");
		// QUnit.ok(test_n instanceof Number, "Extended Number object is an instance of Number.");
	} catch (e) {
		// IE throws this type of error
		if (!(e instanceof TypeError)) {
			throw e;
		}
	}

	// extending the Error object
	var test_error = create(Error, {
		init : function(message, code) {
			this.message = message;
			this.code = code;
		},
		custom : function() {
			return "I'm an error!";
		},
		toString : function() {
			return this.message;
		},
		valueOf : function() {
			return this.code;
		}
	});

	// throwing custom errors
	try {
		throw new test_error("test", 3);
	} catch (e) {
		QUnit.equal(e.valueOf(), 3, "Overriden valueOf function called");
		QUnit.equal(e.custom(), "I'm an error!", "Custom prototype function called.");
		QUnit.ok(e instanceof test_error, "Extended error object is an instance of itself.");
		QUnit.ok(e instanceof Error, "Extended error object is an instance of Error.");
	}
});

QUnit.test("extending Javascript objects not bult using Classify using inheritance", function() {
	QUnit.expect(6);
	var test = function(value) {
		this.value = value;
	};
	test.prototype.custom = function() {
		return "lorem ipsum";
	};
	test.prototype.override = function() {
		return "lorem ipsum";
	};

	// extending the Number object
	var test_obj = create(test, {
		shuffle : function() {
			return "ipsum lorem";
		},
		override : function() {
			return "t" + this.parent();
		}
	});

	var instance = new test_obj("test");

	QUnit.ok(instance instanceof test_obj, "Extended external object is an instance of itself.");
	QUnit.ok(instance instanceof test, "Extended external object is an instance of external class.");
	QUnit.equal(instance.value, "test", "External object's constructor function called.");
	QUnit.equal(instance.custom(), "lorem ipsum", "External object's prototype function called.");
	QUnit.equal(instance.shuffle(), "ipsum lorem", "Internal object's prototype function called.");
	QUnit.equal(instance.override(), "tlorem ipsum", "External object's function called through the \"parent\" special function.");
});

QUnit.test("implementing methods in classes from other objects", function() {
	QUnit.expect(20);
	var inf = {
		a : function() {
			return this;
		},
		b : function() {
			return 1;
		}
	};
	var test = create([ inf ], {
		c : function() {
			return 2;
		}
	});

	// implementing plain objects
	QUnit.equal(test.prototype.a, inf.a, "method implemented through a plain object into prototype of class");
	var x = new test();
	QUnit.equal(x.a(), x, "implemented reference to 'this' is the calling object");
	QUnit.ok(typeof test.implement, "implemented objects reference is an array");
	QUnit.equal(test.implement.length, 1, "implemented objects reference is stored");
	QUnit.equal(test.implement[0], inf, "implemented objects reference is stored");

	// implementing class objects
	var inf_class = create({
		c : function() {
			return this;
		},
		d : function() {
			return 1;
		},
		e : function() {
			return 2;
		}
	});
	var test_i = create([ inf_class ], {
		f : function() {
			return this.d();
		}
	});
	QUnit.equal(test_i.prototype.c, inf_class.prototype.c, "method implemented through a class object into prototype of class");
	QUnit.equal((new test_i()).f(), 1, "method implemented through a class object can be called from main class");
	QUnit.equal((new test_i()).c().constructor, test_i, "method implemented through a class object's 'this' reference is the calling object");
	QUnit.equal(test_i.implement[0], inf_class, "implemented class' reference is stored");

	// implementing subclasses
	var inf_subclass = create(inf_class, {
		d : function() {
			return this.parent();
		},
		e : function() {
			return this.parent();
		},
		g : function() {
			return this;
		}
	});
	var test_is = create([ inf_subclass ], {
		f : function() {
			return this.d();
		}
	});
	QUnit.equal(test_is.prototype.d, inf_subclass.prototype.d, "method implemented through a subclass object into prototype of class");
	QUnit.equal((new test_is()).f(), 1, "method implemented through a subclass object can be called from main class");
	QUnit.equal((new test_is()).c().constructor, test_is, "method implemented through a subclass object's 'this' reference is the calling object");
	QUnit.equal(test_is.implement[0], inf_subclass, "implemented subclass' reference is stored");

	// implementing objects and inheriting subclass
	var extens = create({
		e : function() {
			return 3;
		}
	});
	var test_ei = create(extens, [ inf_subclass ], {
		c : function() {
			return 2;
		}
	});
	QUnit.equal(test_ei.prototype.d, inf_subclass.prototype.d, "method implemented through a subclass & extension object into prototype of class");
	QUnit.equal(test_ei.prototype.e, extens.prototype.e, "method implemented through extension takes priority over implemented class");
	QUnit.equal((new test_ei()).e(), 3, "method implemented through a extended object can be called from main class");
	QUnit.equal((new test_ei()).d(), 1, "method implemented through a subclass object can be called from main class and is able to call the parent function of the implemented class");
	QUnit.equal((new test_ei()).g().constructor, test_ei, "method implemented through a subclass object's 'this' reference is the calling object");
	QUnit.equal(test_ei.superclass, extens, "implemented subclass' reference is stored");
	QUnit.equal(test_ei.implement[0], inf_subclass, "implemented subclass' reference is stored");
});

QUnit.test("adding and removing mutators", function() {
	QUnit.expect(2);

	addMutator("test", {});

	// adding duplicate mutators will throw an error
	try {
		addMutator("test", {});
	} catch (e) {
		QUnit.ok(e instanceof Error, "Attempts to add an existing mutator throws a error.");
	}

	removeMutator("test");
	try {
		removeMutator("test");
	} catch (e) {
		QUnit.ok(e instanceof Error, "Attempts to remove an non existing mutator throws a error.");
	}
});

QUnit.test("adding and removing mutators to the on create hook", function() {
	QUnit.expect(3);

	addMutator("test", {
		onCreate : function(klass, parent) {
			klass.a = 1;
			QUnit.ok(true, "onCreate in mutator was called when the class is created");
		}
	});

	var test = create({});
	QUnit.equal(test.a, 1, "onCreate mutator modified the class during creation");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test2 = create({});
	QUnit.ok(!test2.hasOwnProperty("a"), "removed onCreate mutator is no longer called during creation");
});

QUnit.test("adding and removing mutators to the on property add hook", function() {
	QUnit.expect(7);

	addMutator("test", {
		onPropAdd : function(klass, parent, name, property) {
			klass.prototype[name] = property * 2;
			QUnit.ok(true, "onPropAdd in mutator is called when a property is added");
		}
	});

	var test = create({
		__test_a : 1
	});
	QUnit.equal((new test()).a, 2, "onPropAdd mutator modified a value during property addition");

	var test2 = create({
		__test_ : {
			b : 2
		}
	});
	QUnit.equal((new test2()).b, 4, "onPropAdd mutator modified a value during property addition when defined in object");

	test2.addProperty("__test_c", 3);
	QUnit.equal((new test2()).c, 6, "onPropAdd mutator modified a value during property addition after class definition");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test3 = create({
		__test_a : 4
	});
	QUnit.equal((new test3()).__test_a, 4, "removed onPropAdd mutator is no longer called during creation");
});

QUnit.test("adding and removing mutators to the on property remove hook", function() {
	QUnit.expect(3);

	addMutator("test", {
		onPropRemove : function(klass, name) {
			klass.m = klass.m ? klass.m++ : 1;
			try {
				delete klass.prototype[name];
			} catch (e) {
			}
			QUnit.ok(true, "onPropRemove in mutator is called when a property is removed");
		}
	});

	var test = create({
		__test_a : 1
	});

	test.removeProperty("__test_a");
	QUnit.equal(test.m, 1, "onPropRemove mutator modified a value during property removal");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test3 = create({
		__test_a : 4
	});
	test.removeProperty("__test_a");
	QUnit.ok(!test3.hasOwnProperty("m"), "removed onPropRemove mutator is no longer called during property removal");
});

QUnit.test("adding and removing mutators to the on initialize hook", function() {
	QUnit.expect(6);

	addMutator("test", {
		onInit : function(instance, klass) {
			if(klass.count == null) {
				klass.count = 0;
			}
			instance.a = 1;
			klass.count++;
			QUnit.ok(true, "onInit in mutator is called when a property is initialized");
		}
	});

	var test = create({});
	(new test());
	(new test());
	QUnit.equal(test.count, 2, "onInit mutator called during each class initialization");
	QUnit.equal((new test()).a, 1, "onInit mutator called during class initialization and modified instance value");


	removeMutator("test");

	// after removal, hooks are no longer called
	var test2 = create({});
	(new test2());
	QUnit.ok(!test2.hasOwnProperty("count"), "removed onInit mutator is no longer called during instantiation");
});
