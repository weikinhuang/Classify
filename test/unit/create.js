module("create");

test("simple class creation", function() {
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

	equal(typeof test, "function", "defined class is an object");
	equal(typeof new test(), "object", "instantiated class is an object");
	equal(new test().a, 1, "member variable is as defined");
	equal(new test().b(), 1, "call to member variable within context");
	equal(new test().c(), 1, "call to member function within context");

	// valueOf is always called ahead of toString when it is defined
	equal(new test() + "", "2", "implicit toString() called explicitly");
	equal((new test()).toString(), "a", "explicit toString() called explicitly");
	equal(+new test(), 2, "implicit valueOf() called explicitly");
	equal((new test()).valueOf(), 2, "explicit valueOf() called explicitly");
});

test("invocation and constructors", function() {
	// testing class creation without a constructor
	var test = create({
		a : 1,
		b : function() {
			return this.a;
		}
	});
	equal(typeof new test(), "object", "instantiated class with no constructor is an object");
	ok(new test() instanceof test, "instantiated class with no constructor is an an proper instance");
	equal(new test().b(), 1, "call to member variable within context with no constructor");

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
	equal(typeof new test(), "object", "instantiated class with basic constructor is an object");
	ok(new test() instanceof test, "instantiated class with basic constructor is an an proper instance");
	equal(new test().b(), 2, "call to member variable within context with basic constructor");

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
	equal(typeof new test(3), "object", "instantiated class with simple constructor is an object");
	ok(new test(3) instanceof test, "instantiated class with simple constructor is an an proper instance");
	equal(new test(3).b(), 3, "call to member variable within context with simple constructor");

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
	equal(typeof test(3), "object", "instantiated class invocation is an object");
	ok(test(3) instanceof test, "instantiated class with invocation is an an proper instance");
	equal(test(3).b(), 3, "call to member variable within context with invocation");

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
	equal(test(), "x", "override invocation functionality to execute functionality");

	// calling apply on a class to generate an instance
	test = create({
		a : 1,
		init : function(a) {
			this.a = a;
		}
	});
	ok(test.applicate([ 2 ]) instanceof test, "assuring creating a new instance of a class by passing an array of parameters is of type class");
	equal(test.applicate([ 2 ]).a, 2, "creating a new instance of a class by passing an array of parameters");

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
	ok(test() instanceof test, "using the 'this' keyword to instantiate a new instance");

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
	ok(new test_sub() instanceof test, "overriding the 'new' keyword within a class constructor");
});

test("known properties", function() {
	// testing class for known properties in every defined class
	var test = create({});

	equal(test.__isclass_, true, "flag indicating this object was created using the create method");
	equal((new test()).constructor, test, "assert that we have a internal reference to the constructor via 'constructor'");
	equal((new test()).self, test, "assert that we have a internal reference to the constructor via 'self'");
	equal(typeof test.superclass, "function", "assert that there is an internal reference to the parent class");
	equal(test.superclass, base, "assert that the reference to the superclass is the parent");
	equal(typeof test.subclass, "object", "assert that an array is created holding child classes");
	equal(test.subclass.length, 0, "assert that there are no child classes extending this object");
	ok(new test() instanceof test, "assert that a new object of this class is an instance of it's constructor");
	ok(new test() instanceof base, "assert that a new object of this class is an instance of it's parent");
});

test("static properties", function() {
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

	equal(test.a, 2, "Reading static property of an class");
	equal((new test()).a, 1, "Reading non static property of an class");
	equal(test.b(), 2, "Invoking static function of a class");
	equal((new test()).b(), 1, "Invoking dynamic function of a class");
	equal((new test()).c(), 2, "Reading static property by name within a class");
	equal((new test()).d(), test, "Reading static definition within a class");
	equal((new test()).e(), 2, "Reading static property by using self within a class");
});

test("adding new properties", function() {
	// testing class for known properties in every defined class
	var test = create({});

	// adding properties to the prototype
	test.prototype.b = function() {
		return 1;
	};
	equal((new test()).b(), 1, "invoking a method added using prototype method");
	test.addProperty("c", function() {
		return 1;
	});
	equal((new test()).c(), 1, "invoking a method added using addProperty method");

	// adding properties to the object
	test.b = function() {
		return 1;
	};
	equal(test.b(), 1, "invoking a method added using classical method");
	test.addStaticProperty("c", function() {
		return 1;
	});
	equal(test.c(), 1, "invoking a method added using addStaticProperty method");

	// test that references is proper
	test.addStaticProperty("d", function() {
		equal(this, test, "assuring the 'this' reference of a method added using addStaticProperty method is the constructor");
		return 1;
	});
	test.c();

	// test adding multiple properties
	test.addProperty({
		e : function() {
			return 1;
		}
	});
	equal((new test()).e(), 1, "adding multiple properties to the class with add property");
	test.addStaticProperty({
		f : function() {
			return 2;
		}
	});
	equal(test.f(), 2, "adding multiple static properties to the class with addStaticProperty");
});

test("extending classes using inheritance", function() {
	// testing class for known properties in every defined class
	var test = create({
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
	ok((new test()) instanceof test, "assert that instantiated classes are instances of itself");
	ok((new subclass()) instanceof test, "assert that inherited classes are instances of it's parent");
	ok((new subsubclass()) instanceof test, "assert that inherited classes are instances of it's parent (multi level)");
	ok((new subsubclass()) instanceof subclass, "assert that inherited classes are instances of it's parent (single level)");

	// test prototype inheritance functionality
	equal((new subclass()).a(), 1, "inherited function in child class is executed");
	equal((new subclass()).c(), 3, "new function in child class is executed");
	equal((new subsubclass()).c(), 4, "overriden function in child class is executed");

	// test 'this' reference integrity
	equal((new subclass()).e(), subclass, "reference to this within inherited function is to itself");

	// test calling parent functions
	equal((new subclass()).d(), 4, "parent method in overriden method is executed");
	equal((new subclass_a()).b(), 6, "parent method in overriden method is executed with additional logic");
	equal((new subsubclass()).d(), 4, "parent method in overriden method is executed (multi level)");
	equal((new subsubclass()).e(), subsubclass, "parent method's 'this' is still referencing proper object");

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
	equal(y.a, 1, "Reusing a property from an inherited function");
	equal(y.b, 3, "Overriding a existing property from a parent class");
	equal(z.e(), x.c, "Using a object as a property causes property to be a pointer");

	// testing parent calling functions in newly added methods
	subsubclass.addProperty("f", function() {
		// function with parent version
		equal(typeof this.parent, "function", "method with override has a parent method");
		equal(this.parent(), this.constructor, "parent method context is current class' context");
	});
	subsubclass.addProperty("g", function() {
		// function without parent version
		equal(typeof this.parent, "undefined", "method with no override has no parent method");
	});
	(new subsubclass()).f();
	(new subsubclass()).g();

	// testing using the parent invoke method
	var double, triple, single = create({
		invoke : function() {
			equal(this, double, "parent invoke method called from child context");
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
			equal(this, triple, "child invoke method called from child context");
		}
	});
	triple();
});

test("implementing methods in classes from other objects", function() {
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
	equal(test.prototype.a, inf.a, "method implemented through a plain object into prototype of class");
	var x = new test();
	equal(x.a(), x, "implemented reference to 'this' is the calling object");
	ok(typeof test.implement, "implemented objects reference is an array");
	equal(test.implement.length, 1, "implemented objects reference is stored");
	equal(test.implement[0], inf, "implemented objects reference is stored");

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
	equal(test_i.prototype.c, inf_class.prototype.c, "method implemented through a class object into prototype of class");
	equal((new test_i()).f(), 1, "method implemented through a class object can be called from main class");
	equal((new test_i()).c().constructor, test_i, "method implemented through a class object's 'this' reference is the calling object");
	equal(test_i.implement[0], inf_class, "implemented class' reference is stored");

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
	equal(test_is.prototype.d, inf_subclass.prototype.d, "method implemented through a subclass object into prototype of class");
	equal((new test_is()).f(), 1, "method implemented through a subclass object can be called from main class");
	equal((new test_is()).c().constructor, test_is, "method implemented through a subclass object's 'this' reference is the calling object");
	equal(test_is.implement[0], inf_subclass, "implemented subclass' reference is stored");

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
	equal(test_ei.prototype.d, inf_subclass.prototype.d, "method implemented through a subclass & extension object into prototype of class");
	equal(test_ei.prototype.e, extens.prototype.e, "method implemented through extension takes priority over implemented class");
	equal((new test_ei()).e(), 3, "method implemented through a extended object can be called from main class");
	equal((new test_ei()).d(), 1, "method implemented through a subclass object can be called from main class and is able to call the parent function of the implemented class");
	equal((new test_ei()).g().constructor, test_ei, "method implemented through a subclass object's 'this' reference is the calling object");
	equal(test_ei.superclass, extens, "implemented subclass' reference is stored");
	equal(test_ei.implement[0], inf_subclass, "implemented subclass' reference is stored");
});