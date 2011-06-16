module("core");

test("basic requirements", function() {
	var test, empty;
	// test basic properties of the base Object
	ok(Object.prototype, "Object prototype exists");
	ok(Object.prototype.toString, "Object prototype toString exists");

	// test basic internal functions

	// test detection of a function
	ok(!isFunction(), "undefined not a function");
	ok(!isFunction(null), "null not a function");
	ok(!isFunction("string"), "string not a function");
	ok(!isFunction({}), "object not a function");
	ok(!isFunction([]), "array not a function");
	ok(!isFunction(new function() {
	}), "class is not a function");
	ok(isFunction(function() {
	}), "function is a function");

	// test detection of a array
	ok(!isArray(), "undefined is not an array");
	ok(!isArray(null), "null is not an array");
	ok(!isArray({
		length : 1
	}), "object with length property is not an array");
	ok(!isArray({
		length : 1,
		push : Array.prototype.push,
		pop : Array.prototype.pop,
		slice : Array.prototype.slice,
		concat : Array.prototype.concat,
		shift : Array.prototype.shift,
		unshift : Array.prototype.unshift
	}), "object with array-like properties is not an array");
	ok(isArray(new Array()), "classical empty array is an array");
	ok(isArray(new Array(1, 2, 3)), "classical non empty array is an array");
	ok(isArray([]), "empty array is an array");
	ok(isArray([ 1, 2, 3 ]), "non empty array is an array");

	// test object keys retrieval
	test = {};
	// test empty
	same(keys(test), [], "keys for a empty object is empty");
	// test single object prototype
	test.toString = function() {
		return "";
	};
	same(keys(test).sort(), [ "toString" ], "toString (a object prototype) is enumerable");
	// test multiple object prototype
	test.valueOf = function() {
		return 0;
	};
	same(keys(test).sort(), [ "toString", "valueOf" ], "toString,valueOf (a object prototype) is enumerable");
	// test other object properties
	test.property = "property";
	same(keys(test).sort(), [ "property", "toString", "valueOf" ], "own property is enumerable");
	test = {
		property : false
	};
	same(keys(test).sort(), [ "property" ], "own property or empty object is enumerable");
	test.undef = empty;
	same(keys(test).sort(), [ "property", "undef" ], "undefined property value is enumerable");
	test.nil = null;
	same(keys(test).sort(), [ "nil", "property", "undef" ], "null property value is enumerable");

	// test force array functionality
	same(toArray(1), [ 1 ], "convert an object to an array");
	test = [ 1, 2, 3 ];
	equals(toArray(test), test, "existing object is already an array");

	// test converting arguments into an array
	(function() {
		same(argsToArray(arguments), [ 1, 2, 3 ], "converted arguments array");
	})(1, 2, 3);

	// test storing a original function into a new function
	var fn = function() {
		return 0;
	}, fn_base = function() {
		return 1;
	};
	equals(store(fn, fn_base), fn, "store returned the original function reference");
	equals(fn.__original_, fn_base, "original function reference stored correctly");

	// iteration functionality
	test = [ 1 ];
	equals(each(test, function(v, i, o) {
		same(this, 1, "iteration context passed correctly");
		equals(v, 1, "iteration value passed correctly");
		equals(i, 0, "iteration index passed correctly");
		equals(o, test, "iteration of complete object passed correctly");
	}), test, "each iteration return passed in object");
	// iterating through objects
	test = {
		a : 1
	};
	equals(each(test, function(v, i, o) {
		same(this, 1, "iteration context of object passed correctly");
		equals(v, 1, "iteration value of object passed correctly");
		equals(i, "a", "iteration index of object passed correctly");
		equals(o, test, "iteration of complete object of object passed correctly");
	}), test, "each iteration return passed in object");

	each(test, function(v, i, o) {
		equals(this, test, "iteration context passed correctly when specified");
	}, test);

	// mapping functionality
	same(map([ 1, 2, 3, 4, 5 ], function(v, i) {
		return v * i;
	}), [ 0, 2, 6, 12, 20 ], "mapping original array into new array");
	// mapping an object
	same(map({
		a : 0,
		b : 1,
		c : 2
	}, function(v, i) {
		return v + i;
	}), [ "0a", "1b", "2c" ], "mapping original array into new array");

	// filter single object functionality
	same(filter([ 1, 2, 3, 4 ], 1), [ 2, 3, 4 ], "filter a single item out of an array");
	same(filter([ 1, 2, 1, 3, 1, 4 ], 1), [ 2, 3, 4 ], "filter multiple instances of an item out of an array");
	test = {};
	same(filter([ 1, 2, test, 4 ], test), [ 1, 2, 4 ], "filter an object reference out of an array");
});