// shortcut for minification compaction
var prototype = "prototype", string = "string",
// For IE, check if looping through objects works with toString & valueOf
IS_ENUMERATION_BUGGY = (function() {
	var p;
	for (p in {
		toString : 1
	}) {
		if (p === "toString") {
			return false;
		}
	}
	return true;
})(),
// gets the enumerated keys if necessary (bug in older ie < 9)
ENUMERATED_KEYS = IS_ENUMERATION_BUGGY ? "hasOwnProperty,valueOf,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,constructor".split(",") : [],
// quick reference to the enumerated items length
ENUMERATION_LENGTH = ENUMERATED_KEYS.length,
// quick reference to object prototype
objectPrototype = Object.prototype,
// quick reference to the toString prototype
toString = objectPrototype.toString,
// test if object is a function
isFunction = function(o) {
	return typeof o === "function";
},
// quick test for isArray
isArray = function(o) {
	return toString.call(o) === "[object Array]";
},
// quickly be able to get all the keys of an object
keys = function(o) {
	var k = [], i;
	for (i in o) {
		k.push(i);
	}
	if (IS_ENUMERATION_BUGGY) {
		// only add buggy enumerated values if it's not the Object.prototype's
		for (i = 0; i < ENUMERATION_LENGTH; i++) {
			if (o.hasOwnProperty(ENUMERATED_KEYS[i])) {
				k.push(ENUMERATED_KEYS[i]);
			}
		}
	}
	return k;
},
// force an object to be an array
toArray = function(o) {
	return isArray(o) ? o : [ o ];
},
// create ability to convert the arguments object to an array
argsToArray = function(o) {
	return Array.prototype.slice.call(o, 0);
},
// ability to store the original definition into the new function definition
store = function(fn, base) {
	fn.__original_ = base;
	return fn;
},
// simple iteration function
each = function(o, iterator, context) {
	// we must account for null, otherwise it will throw the error "Unable to get value of the property 'length': object is null or undefined"
	if (!o) {
		return o;
	}
	var n, i = 0, l = o.length;
	// objects and functions are iterated with the for in statement
	if (l === undefined || isFunction(o)) {
		for (n in o) {
			if (iterator.call(context || o[n], o[n], n, o) === false) {
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
// simple mapping function
map = function(o, iterator) {
	var temp = [];
	each(o, function(v, i) {
		temp[temp.length] = iterator(v, i, o);
	});
	return temp;
},
// simple filter function
filter = function(arr, item) {
	var out = [];
	each(arr, function(v) {
		if (v !== item) {
			out[out.length] = v;
		}
	});
	return out;
};