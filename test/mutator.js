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
		$$test$$a : 1
	});
	QUnit.equal((new test()).a, 2, "onPropAdd mutator modified a value during property addition");

	var test2 = create({
		$$test$$ : {
			b : 2
		}
	});
	QUnit.equal((new test2()).b, 4, "onPropAdd mutator modified a value during property addition when defined in object");

	test2.addProperty("$$test$$c", 3);
	QUnit.equal((new test2()).c, 6, "onPropAdd mutator modified a value during property addition after class definition");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test3 = create({
		$$test$$a : 4
	});
	QUnit.equal((new test3()).$$test$$a, 4, "removed onPropAdd mutator is no longer called during creation");
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
		$$test$$a : 1
	});

	test.removeProperty("$$test$$a");
	QUnit.equal(test.m, 1, "onPropRemove mutator modified a value during property removal");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test3 = create({
		$$test$$a : 4
	});
	test.removeProperty("$$test$$a");
	QUnit.ok(!test3.hasOwnProperty("m"), "removed onPropRemove mutator is no longer called during property removal");
});

QUnit.test("adding and removing global mutators to the on initialize hook", function() {
	QUnit.expect(12);

	addMutator("test", {
		onInit : function(instance, klass, args) {
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

	// test mutator access to instance constructor arguments
	addMutator("test", {
		onInit : function(instance, klass, args) {
			QUnit.deepEqual(args, ["a", "b"], "onInit in mutator is passed the instance constructor arguments");
		}
	});
	var test6 = create({});
	(new test6("a", "b"));
	removeMutator("test");

	// test mutator modification of instance constructor arguments
	addMutator("test", {
		onInit : function(instance, klass, args) {
			args[0] = "x";
		}
	});
	var test7 = create({
		init : function(a, b) {
			QUnit.equal(a, "x", "a parameter can modified by a mutator onInit");
			QUnit.equal(b, "b", "a parameter unmodified by a mutator onInit is left unchanged");
		}
	});
	(new test7("a", "b"));
	removeMutator("test");
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
		$$test$$a : 1
	});
	QUnit.equal((new test()).a, 2, "onPropAdd mutator modified a value during property addition");

	var test2 = create([ mutator ], {
		$$test$$ : {
			b : 2
		}
	});
	QUnit.equal((new test2()).b, 4, "onPropAdd mutator modified a value during property addition when defined in object");

	test2.addProperty("$$test$$c", 3);
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
		$$test$$a : 1
	});

	test.removeProperty("$$test$$a");
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

QUnit.test("defining properties with spanning multiple mutators", function() {
	QUnit.expect(12);

	addMutator("test", {
		onPropAdd : function(klass, parent, name, property) {
			QUnit.ok(true, "test.onPropAdd in mutator is called when a property is added");
			return property * 2;
		}
	});

	addMutator("test2", {
		onPropAdd : function(klass, parent, name, property) {
			QUnit.ok(true, "test2.onPropAdd in mutator is called when a property is added");
			return property * 3;
		}
	});

	var test = create({
		$$test_test2$$a : 1
	});
	QUnit.equal((new test()).a, 6, "onPropAdd mutators modified a value during property addition");

	var test2 = create({
		$$test_test2$$ : {
			b : 2
		}
	});
	QUnit.equal((new test2()).b, 12, "onPropAdd mutators modified a value during property addition when defined in object");

	test2.addProperty("$$test_test2$$c", 3);
	QUnit.equal((new test2()).c, 18, "onPropAdd mutators modified a value during property addition after class definition");

	removeMutator("test");

	// after removal, hooks are no longer called
	var test3 = create({
		$$test_test2$$a : 4
	});
	QUnit.equal((new test3()).a, 12, "removed onPropAdd mutator is no longer called during creation");

	removeMutator("test2");
	// after removal, hooks are no longer called
	var test4 = create({
		$$test_test2$$a : 4
	});
	QUnit.equal((new test4()).$$test_test2$$a, 4, "removed onPropAdd mutators are no longer called during creation");
});

QUnit.test("empty returns from onPropAdd mutator stops the property from being added", function() {
	QUnit.expect(2);

	addMutator("test", {
		onPropAdd : function(klass, parent, name, property) {
			QUnit.ok(true, "test.onPropAdd in mutator is called when a property is added");
			return;
		}
	});

	addMutator("test2", {
		onPropAdd : function(klass, parent, name, property) {
			QUnit.ok(false, "this should not be called");
			return property * 3;
		}
	});

	var test = create({
		$$test_test2$$a : true
	});
	QUnit.ok(!(new test()).a, "onPropAdd did not add property");

	removeMutator("test");
	removeMutator("test2");
});
