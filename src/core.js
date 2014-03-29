// shortcut for minification compaction
var exportNames = {},
// For IE, check if looping through objects works with toString & valueOf
isEnumerationBuggy = !({
	toString : null
}).propertyIsEnumerable("toString"),
// gets the enumerated keys if necessary (bug in older ie < 9)
enumeratedKeys = isEnumerationBuggy ? "hasOwnProperty,valueOf,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,constructor".split(",") : [],
// quick reference to the enumerated items length
enumerationLength = enumeratedKeys.length,
// quick reference to object prototype
objectPrototype = Object.prototype,
// quick reference to the toString prototype
toString = objectPrototype.toString,
// quick reference to the hasOwnProperty prototype
hasOwn = objectPrototype.hasOwnProperty,
// quick reference to the Array push prototype
arrayPush = Array.prototype.push,
// regex to test for scalar value
scalarRegExp = /^(?:boolean|number|string|undefined)$/,
/**
 * create a noop function
 * @constructor
 */
noop = function() {
},
/**
 * Utility function to test if a value is scalar in nature
 * @param {Object} o The object to test
 * @memberOf Classify
 * @method isScalar
 * @return {boolean}
 */
isScalar = function(o) {
	return o === null || scalarRegExp.test(typeof o);
},
/**
 * Utility function to test if object is a function
 * @param {Object} o The object to test
 * @memberOf Classify
 * @method isFunction
 * @return {boolean}
 */
isFunction = function(o) {
	return toString.call(o) === "[object Function]";
},
/**
 * Utility function to test if object is extendable
 * @param {Object} o The object to test
 * @memberOf Classify
 * @method isExtendable
 * @return {boolean}
 */
isExtendable = function(o) {
	return o && o.prototype && isFunction(o);
},
/**
 * Utility function to test if object is an Array instance
 * polyfill for Array.isArray
 * @param {Object} o The object to test
 * @memberOf Classify
 * @method isArray
 * @return {boolean}
 */
isArray = Array.isArray || function(o) {
//#JSCOVERAGE_IF !Array.isArray
	return toString.call(o) === "[object Array]";
//#JSCOVERAGE_ENDIF
},
// regex for native function testing
nativeFunctionRegExp = new RegExp("^" + String(toString).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/toString|for [^\]]+/g, ".+?") + "$"),
/**
 * Utility function to test if a function is native
 * @param {Object} o The object to test
 * @memberOf Classify
 * @method isNative
 * @return {boolean}
 */
isNative = function(o) {
	return isFunction(o) && nativeFunctionRegExp.test(o.toString());
},
/**
 * Utility function to extract all enumerable keys
 * quickly be able to get all the keys of an object, we don't use
 * Object.keys because we also want to extract from the parent prototypes
 * @param {Object} o The object to iterate over
 * @memberOf Classify
 * @method keys
 * @return {Array}
 */
keys = isEnumerationBuggy ? function(o) {
//#JSCOVERAGE_IF isEnumerationBuggy
	var k = [], i;
	for (i in o) {
		k[k.length] = i;
	}
	if (isEnumerationBuggy) {
		// only add buggy enumerated values if it's not the Object.prototype's
		for (i = 0; i < enumerationLength; ++i) {
			if (hasOwn.call(o, enumeratedKeys[i])) {
				k[k.length] = enumeratedKeys[i];
			}
		}
	}
	return k;
//#JSCOVERAGE_ENDIF
} : function(o) {
//#JSCOVERAGE_IF !isEnumerationBuggy
	var k = [], i;
	for (i in o) {
		k[k.length] = i;
	}
	return k;
//#JSCOVERAGE_ENDIF
},
// force an object to be an array
toArray = function(o) {
	return isArray(o) ? o : [ o ];
},
/**
 * Convert the `arguments` object into a Array instance
 * @param {Arguments} o The arguments object
 * @memberOf Classify
 * @method argsToArray
 * @return {Array}
 */
argsToArray = function(o) {
	return Array.prototype.slice.call(o, 0);
},
/**
 * Utility function to search for a item's index in an array
 * polyfill for Array.prototype.indexOf
 * @param {Array} array The array to search
 * @param {Object} item The searched item
 * @memberOf Classify
 * @method indexOf
 * @return {number} Returns -1 if not found
 */
indexOf = Array.prototype.indexOf ? function(array, item) {
//#JSCOVERAGE_IF Array.prototype.indexOf
	return array.indexOf(item);
//#JSCOVERAGE_ENDIF
} : function(array, item) {
//#JSCOVERAGE_IF !Array.prototype.indexOf
	var i = 0, length = array.length;
	for (; i < length; ++i) {
		if (array[i] === item) {
			return i;
		}
	}
	return -1;
//#JSCOVERAGE_ENDIF
},
// ability to store the original definition into the new function definition
store = function(fn, base) {
	fn.$$original = base;
	return fn;
},
/**
 * Utility function to provide object/array iteration
 * @param {Object} o The object to iterate
 * @param {Function} iterator Iteration function returns false to exit
 * @memberOf Classify
 * @method each
 * @return {Object}
 */
each = function(o, iterator, context) {
	// we must account for null, otherwise it will throw the error "Unable to
	// get value of the property "length": object is null or undefined"
	if (!o) {
		return o;
	}
	var n, i = 0, l = o.length, k;
	// objects and functions iterate through the keys
	if (l === undefined || isFunction(o)) {
		k = keys(o);
		l = k.length;
		for (n = o[k[0]]; i < l; n = o[k[++i]]) {
			if (iterator.call(context || n, n, k[i], o) === false) {
				break;
			}
		}
	} else {
		// loops are iterated with the for i statement
		for (n = o[0]; i < l; n = o[++i]) {
			if (iterator.call(context || n, n, i, o) === false) {
				break;
			}
		}
	}
	return o;
},
/**
 * Utility function to provide object mapping to an array
 * @param {Object} o The object to iterate
 * @param {Function} iterator Iteration function returns mapped value
 * @memberOf Classify
 * @method map
 * @return {Array}
 */
map = function(o, iterator) {
	var temp = [];
	each(o, function mapIterator(v, i) {
		temp[temp.length] = iterator(v, i, o);
	});
	return temp;
},
/**
 * Utility function to provide functionality to quickly add properties to objects
 * simple extension function that takes into account the enumerated keys
 * @param {Object} base The base object to copy properties into
 * @param {...Object[]} o Set of objects to copy properties from
 * @memberOf Classify
 * @method extend
 * @return {Object}
 */
extend = function() {
	var args = argsToArray(arguments), base = args.shift();
	each(args, function extendArgIterator(extens) {
		each(keys(extens), function extendKeyIterator(k) {
			base[k] = extens[k];
		});
	});
	return base;
},
/**
 * Utility function to removes the first instance of item from an array
 * @param {Array} arr The array to search
 * @param {Object} item The item to remove
 * @memberOf Classify
 * @method remove
 * @return {boolean} TRUE if item removed
 */
remove = function(arr, item) {
	var idx = indexOf(arr, item);
	if (idx > -1) {
		arr.splice(idx, 1);
		return true;
	}
	return false;
},
// Use native object.create whenever possible
objectCreate = isNative(Object.create) ? Object.create : function(proto) {
//#JSCOVERAGE_IF !Object.create
	// This method allows for the constructor to not be called when making a new
	// subclass
	noop.prototype = proto;
	var tmp = new noop();
	noop.prototype = null;
	return tmp;
//#JSCOVERAGE_ENDIF
};

//export methods to the main object
extend(exportNames, {
	// direct access functions
	isScalar : isScalar,
	isFunction : isFunction,
	isExtendable : isExtendable,
	isArray : isArray,
	isNative : isNative,
	keys : keys,
	argsToArray : argsToArray,
	indexOf : indexOf,
	each : each,
	map : map,
	remove : remove,
	extend : extend
});
