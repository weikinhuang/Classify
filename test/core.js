/* global isScalar */
/* global isFunction */
/* global isArray */
/* global isExtendable */
/* global keys */
/* global toArray */
/* global argsToArray */
/* global indexOf */
/* global store */
/* global each */
/* global map */
/* global filter */
/* global remove */
QUnit.module("core");

QUnit.test("basic requirements", function() {
	QUnit.expect(71);
	var test, empty;
	// test basic properties of the base Object
	QUnit.ok(Object.prototype, "Object prototype exists");
	QUnit.ok(Object.prototype.toString, "Object prototype toString exists");
	QUnit.ok(Object.prototype.hasOwnProperty, "Object prototype hasOwnProperty exists");

	// test basic internal functions
	var fn = function(){};

	// test detection of scalar value
	QUnit.ok(isScalar(), "undefined is scalar");
	QUnit.ok(isScalar(null), "null is scalar");
	QUnit.ok(isScalar(false), "boolean is scalar");
	QUnit.ok(isScalar(0), "number is scalar");
	QUnit.ok(isScalar("string"), "string is scalar");
	QUnit.ok(!isScalar([]), "array is not scalar");
	QUnit.ok(!isScalar({}), "object is not scalar");
	QUnit.ok(!isScalar(fn), "function is not scalar");

	// test detection of a function
	QUnit.ok(!isFunction(), "undefined not a function");
	QUnit.ok(!isFunction(null), "null not a function");
	QUnit.ok(!isFunction("string"), "string not a function");
	QUnit.ok(!isFunction({}), "object not a function");
	QUnit.ok(!isFunction([]), "array not a function");
	QUnit.ok(!isFunction(/hi/), "regex not a function");
	QUnit.ok(!isFunction(new fn()), "class is not a function");
	QUnit.ok(isFunction(fn), "function is a function");

	// test detection of a array
	QUnit.ok(!isArray(), "undefined is not an array");
	QUnit.ok(!isArray(null), "null is not an array");
	QUnit.ok(!isArray({
		length : 1
	}), "object with length property is not an array");
	QUnit.ok(!isArray({
		length : 1,
		push : Array.prototype.push,
		pop : Array.prototype.pop,
		slice : Array.prototype.slice,
		concat : Array.prototype.concat,
		shift : Array.prototype.shift,
		unshift : Array.prototype.unshift
	}), "object with array-like properties is not an array");
	QUnit.ok(isArray([]), "empty array is an array");
	QUnit.ok(isArray([ 1, 2, 3 ]), "non empty array is an array");

	// test if objects are extendable
	QUnit.ok(isExtendable(Object), "Object object is an extendable object");
	QUnit.ok(isExtendable(Boolean), "Boolean object is an extendable object");
	QUnit.ok(isExtendable(String), "String object is an extendable object");
	QUnit.ok(isExtendable(Number), "Number object is an extendable object");
	QUnit.ok(isExtendable(Array), "Array object is an extendable object");
	QUnit.ok(isExtendable(Date), "Date object is an extendable object");
	QUnit.ok(isExtendable(RegExp), "RegExp object is an extendable object");
	QUnit.ok(isExtendable(Function), "Function object is not extendable object");
	QUnit.ok(!isExtendable(Math), "Math object is not an extendable object");
	QUnit.ok(!isExtendable({}), "Object instance is not an extendable object");
	QUnit.ok(!isExtendable([]), "Array instance is not an extendable object");
	QUnit.ok(!isExtendable(new fn()), "new instance of object is not an extendable object");
	(function() {
		QUnit.ok(!isExtendable(arguments), "Arguments instance is not an extendable object");
	})();

	// test object keys retrieval
	test = {};
	// test empty
	QUnit.deepEqual(keys(test), [], "keys for a empty object is empty");
	// test single object prototype
	test = {
		toString : function() {
			return "";
		}
	};
	QUnit.deepEqual(keys(test).sort(), [ "toString" ], "toString (a object prototype) is enumerable");
	// test multiple object prototype
	test = {
		toString : function() {
			return "";
		},
		valueOf : function() {
			return 0;
		}
	};
	QUnit.deepEqual(keys(test).sort(), [ "toString", "valueOf" ], "toString,valueOf (a object prototype) is enumerable");
	// test other object properties
	test.property = "property";
	QUnit.deepEqual(keys(test).sort(), [ "property", "toString", "valueOf" ], "own property is enumerable");
	test = {
		property : false
	};
	QUnit.deepEqual(keys(test).sort(), [ "property" ], "own property or empty object is enumerable");
	test.undef = empty;
	QUnit.deepEqual(keys(test).sort(), [ "property", "undef" ], "undefined property value is enumerable");
	test.nil = null;
	QUnit.deepEqual(keys(test).sort(), [ "nil", "property", "undef" ], "null property value is enumerable");

	// test force array functionality
	QUnit.deepEqual(toArray(1), [ 1 ], "convert an object to an array");
	test = [ 1, 2, 3 ];
	QUnit.equal(toArray(test), test, "existing object is already an array");

	// test converting arguments into an array
	(function() {
		QUnit.deepEqual(argsToArray(arguments), [ 1, 2, 3 ], "converted arguments array");
	})(1, 2, 3);

	// test indexOf
	QUnit.equal(indexOf([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], 11), -1, "Missing array element returns -1.");
	QUnit.equal(indexOf([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], 5), 4, "Found array element at proper index.");

	// test storing a original function into a new function
	var fn_zero = function() {
		return 0;
	}, fn_base = function() {
		return 1;
	};
	QUnit.equal(store(fn_zero, fn_base), fn_zero, "store returned the original function reference");
	QUnit.equal(fn_zero.$$original, fn_base, "original function reference stored correctly");

	// iteration functionality
	test = [ 1 ];
	QUnit.equal(each(test, function(v, i, o) {
		QUnit.equal(Object.prototype.valueOf.call(this), 1, "iteration context passed correctly");
		QUnit.equal(v, 1, "iteration value passed correctly");
		QUnit.equal(i, 0, "iteration index passed correctly");
		QUnit.equal(o, test, "iteration of complete object passed correctly");
	}), test, "each iteration return passed in object");
	// iterating through objects
	test = {
		a : 1
	};
	QUnit.equal(each(test, function(v, i, o) {
		QUnit.equal(Object.prototype.valueOf.call(this), 1, "iteration context of object passed correctly");
		QUnit.equal(v, 1, "iteration value of object passed correctly");
		QUnit.equal(i, "a", "iteration index of object passed correctly");
		QUnit.equal(o, test, "iteration of complete object of object passed correctly");
	}), test, "each iteration return passed in object");

	each(test, function(v, i, o) {
		QUnit.equal(this, test, "iteration context passed correctly when specified");
	}, test);

	// test that returning false stops the iteration
	var iteration_index = 0;
	each([ 1, 2, 3 ], function(v, i, o) {
		QUnit.equal(iteration_index++, 0, "each iterator stops when false is returned from callback for arrays.");
		return false;
	});
	iteration_index = 0;
	each({
		a : 1,
		b : 2,
		c : 3
	}, function(v, i, o) {
		QUnit.equal(iteration_index++, 0, "each iterator stops when false is returned from callback for objects.");
		return false;
	});

	// test that null is not iterated through
	each(null, function(v, i, o) {
		throw new Error("Null object iterated through in each function");
	});

	// mapping functionality
	QUnit.deepEqual(map([ 1, 2, 3, 4, 5 ], function(v, i) {
		return v * i;
	}), [ 0, 2, 6, 12, 20 ], "mapping original array into new array");
	// mapping an object
	QUnit.deepEqual(map({
		a : 0,
		b : 1,
		c : 2
	}, function(v, i) {
		return v + i;
	}), [ "0a", "1b", "2c" ], "mapping original array into new array");

	var temp_array = [1, 2, 3, 4, 3];
	QUnit.ok(remove(temp_array, 3), "remove returns true when element is removed");
	QUnit.deepEqual(temp_array, [1, 2, 4, 3], "remove a single item out of an array by reference");
	QUnit.ok(!remove(temp_array, 5), "remove returns false when element is missing");
	QUnit.deepEqual(temp_array, [1, 2, 4, 3], "remove missing item out of an array by reference, unchanged");
});
