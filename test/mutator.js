/* global create */
/* global Mutator */
/* global addMutator */
/* global removeMutator */
QUnit.module("mutator");

QUnit.test("adding and removing global mutators", function() {
	QUnit.expect(2);

	addMutator("test", {});

	// adding duplicate mutators will throw an error
	QUnit.raises(function() {
		addMutator("test", {});
	}, Error, "Attempts to add an existing mutator throws a error.");

	removeMutator("test");
	QUnit.raises(function() {
		removeMutator("test");
	}, Error, "Attempts to remove an non existing mutator throws a error.");
});

QUnit.test("adding and removing global mutators to the internal on predefine hook", function() {
	QUnit.expect(4);

	addMutator("test", {
		_onPredefine : function(klass) {
			klass.a = 1;
			QUnit.ok(true, "onPredefine in mutator was called when the class is created");
			QUnit.ok(!Object.prototype.hasOwnProperty.call(klass.prototype, "init"), "onPredefine in mutator was called before constructor 'init' have been added");
		}
	});

	var test = create({
		xyz : function() {
		}
	});
	QUnit.equal(test.a, 1, "onPredefine mutator modified the class during creation");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test2 = create({});
	QUnit.ok(!test2.hasOwnProperty("a"), "removed onPredefine mutator is no longer called during creation");
});

QUnit.test("adding and removing global mutators to the on create hook", function() {
	QUnit.expect(4);

	addMutator("test", {
		onCreate : function(klass, parent) {
			klass.a = 1;
			QUnit.ok(true, "onCreate in mutator was called when the class is created");
			QUnit.ok(!Object.prototype.hasOwnProperty.call(klass.prototype, "xyz"), "onCreate in mutator was called before properties have been added");
		}
	});

	var test = create({
		xyz : function() {
		}
	});
	QUnit.equal(test.a, 1, "onCreate mutator modified the class during creation");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test2 = create({});
	QUnit.ok(!test2.hasOwnProperty("a"), "removed onCreate mutator is no longer called during creation");
});

QUnit.test("adding and removing global mutators to the on define hook", function() {
	QUnit.expect(4);

	addMutator("test", {
		onDefine : function(klass) {
			klass.a = 1;
			QUnit.ok(true, "onDefine in mutator was called when the class is created");
			QUnit.ok(Object.prototype.hasOwnProperty.call(klass.prototype, "xyz"), "onDefine in mutator was called after properties have been added");
		}
	});

	var test = create({
		xyz : function() {
		}
	});
	QUnit.equal(test.a, 1, "onDefine mutator modified the class during creation");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test2 = create({});
	QUnit.ok(!test2.hasOwnProperty("a"), "removed onDefine mutator is no longer called during creation");
});

QUnit.test("adding and removing global mutators to the on property add hook", function() {
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

QUnit.test("adding and removing global mutators to the on property remove hook", function() {
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

QUnit.test("adding and removing global mutators to the on initialize hook", function() {
	QUnit.expect(9);

	addMutator("test", {
		onInit : function(instance, klass) {
			if (klass.count === undefined) {
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

	// test returning objects
	var retval = {};
	addMutator("test2", {
		onInit : function(instance, klass) {
			// override all class creation with a return value
			return retval;
		}
	});

	var test3 = create({});
	QUnit.strictEqual(new test3(), retval, "onInit mutator override new keyword during instantiation");

	removeMutator("test2");

	// test returning functions
	var retval2 = function() {
	};
	addMutator("test3", {
		onInit : function(instance, klass) {
			// override all class creation with a return value
			return retval2;
		}
	});

	var test4 = create({});
	QUnit.strictEqual(new test4(), retval2, "onInit mutator override new keyword during instantiation");

	removeMutator("test3");

	// test returning scalar value
	addMutator("test4", {
		onInit : function(instance, klass) {
			// override all class creation with a return value
			return 1;
		}
	});

	var test5 = create({});
	QUnit.raises(function() {
		new test5();
	}, Error, "onInit mutator override new keyword during instantiation with scalar value throws a error.");

	removeMutator("test4");
});

QUnit.test("adding class level mutators to the internal on predefine hook", function() {
	QUnit.expect(3);

	var mutator = Mutator("test", {
		_onPredefine : function(klass, parent) {
			klass.a = 1;
			QUnit.ok(true, "onPredefine in mutator was called when the class is created");
			QUnit.ok(!Object.prototype.hasOwnProperty.call(klass.prototype, "init"), "onPredefine in mutator was called before constructor 'init' have been added");
		}
	});

	var test = create([ mutator ], {
		xyz : function() {
		}
	});
	QUnit.equal(test.a, 1, "onPredefine mutator modified the class during creation");
});

QUnit.test("adding class level mutators to the on create hook", function() {
	QUnit.expect(3);

	var mutator = Mutator("test", {
		onCreate : function(klass, parent) {
			klass.a = 1;
			QUnit.ok(true, "onCreate in mutator was called when the class is created");
			QUnit.ok(!Object.prototype.hasOwnProperty.call(klass.prototype, "xyz"), "onCreate in mutator was called before properties have been added");
		}
	});

	var test = create([ mutator ], {
		xyz : function() {
		}
	});
	QUnit.equal(test.a, 1, "onCreate mutator modified the class during creation");
});

QUnit.test("adding class level mutators to the on define hook", function() {
	QUnit.expect(3);

	var mutator = Mutator("test", {
		onDefine : function(klass) {
			klass.a = 1;
			QUnit.ok(true, "onDefine in mutator was called when the class is created");
			QUnit.ok(Object.prototype.hasOwnProperty.call(klass.prototype, "xyz"), "onDefine in mutator was called after properties have been added");
		}
	});

	var test = create([ mutator ], {
		xyz : function() {
		}
	});
	QUnit.equal(test.a, 1, "onDefine mutator modified the class during creation");
});

QUnit.test("adding class level mutators to the on property add hook", function() {
	QUnit.expect(6);

	var mutator = Mutator("test", {
		onPropAdd : function(klass, parent, name, property) {
			klass.prototype[name] = property * 2;
			QUnit.ok(true, "onPropAdd in mutator is called when a property is added");
		}
	});

	var test = create([ mutator ], {
		__test_a : 1
	});
	QUnit.equal((new test()).a, 2, "onPropAdd mutator modified a value during property addition");

	var test2 = create([ mutator ], {
		__test_ : {
			b : 2
		}
	});
	QUnit.equal((new test2()).b, 4, "onPropAdd mutator modified a value during property addition when defined in object");

	test2.addProperty("__test_c", 3);
	QUnit.equal((new test2()).c, 6, "onPropAdd mutator modified a value during property addition after class definition");
});

QUnit.test("adding class level mutators to the on property remove hook", function() {
	QUnit.expect(2);

	var mutator = Mutator("test", {
		onPropRemove : function(klass, name) {
			klass.m = klass.m ? klass.m++ : 1;
			try {
				delete klass.prototype[name];
			} catch (e) {
			}
			QUnit.ok(true, "onPropRemove in mutator is called when a property is removed");
		}
	});

	var test = create([ mutator ], {
		__test_a : 1
	});

	test.removeProperty("__test_a");
	QUnit.equal(test.m, 1, "onPropRemove mutator modified a value during property removal");
});

QUnit.test("adding class level mutators to the on initialize hook", function() {
	QUnit.expect(8);

	var mutator = Mutator("test", {
		onInit : function(instance, klass) {
			if (klass.count === undefined) {
				klass.count = 0;
			}
			instance.a = 1;
			klass.count++;
			QUnit.ok(true, "onInit in mutator is called when a property is initialized");
		}
	});

	var test = create([ mutator ], {});
	(new test());
	(new test());
	QUnit.equal(test.count, 2, "onInit mutator called during each class initialization");
	QUnit.equal((new test()).a, 1, "onInit mutator called during class initialization and modified instance value");

	// test returning objects
	var retval = {};
	var mutator2 = Mutator("test2", {
		onInit : function(instance, klass) {
			// override all class creation with a return value
			return retval;
		}
	});

	var test3 = create([ mutator2 ], {});
	QUnit.strictEqual(new test3(), retval, "onInit mutator override new keyword during instantiation");

	// test returning functions
	var retval2 = function() {
	};
	var mutator3 = Mutator("test3", {
		onInit : function(instance, klass) {
			// override all class creation with a return value
			return retval2;
		}
	});

	var test4 = create([ mutator3 ], {});
	QUnit.strictEqual(new test4(), retval2, "onInit mutator override new keyword during instantiation");

	// test returning scalar value
	var mutator4 = Mutator("test4", {
		onInit : function(instance, klass) {
			// override all class creation with a return value
			return 1;
		}
	});

	var test5 = create([ mutator4 ], {});
	QUnit.raises(function() {
		new test5();
	}, Error, "onInit mutator override new keyword during instantiation with scalar value throws a error.");
});

QUnit.test("adding multiple class level mutators", function() {
	QUnit.expect(7);

	var mutator = Mutator("test", {
		onInit : function(instance, klass) {
			if (klass.count === undefined) {
				klass.count = 0;
			}
			instance.a = 1;
			klass.count++;
			QUnit.ok(true, "onInit in mutator is called when a property is initialized");
		}
	});

	// test returning objects
	var mutator2 = Mutator("test2", {
		onInit : function(instance, klass) {
			instance.b = 1;
		}
	});

	var test = create([ mutator, mutator2 ], {});
	(new test());
	(new test());
	QUnit.equal(test.count, 2, "onInit mutator called during each class initialization");
	QUnit.equal((new test()).a, 1, "onInit mutator called during class initialization and modified instance value");
	QUnit.equal((new test()).b, 1, "secondary onInit mutator called during class initialization and modified instance value");
});
