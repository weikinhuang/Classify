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
// test if a value is scalar in nature
isScalar = function(o) {
	return o === null || scalarRegExp.test(typeof o);
},
// test if object is a function
isFunction = function(o) {
	return toString.call(o) === "[object Function]";
},
// test if object is extendable
isExtendable = function(o) {
	return o && o.prototype && isFunction(o);
},
// quick test for isArray
isArray = Array.isArray || function(o) {
//#JSCOVERAGE_IF !Array.isArray
	return toString.call(o) === "[object Array]";
//#JSCOVERAGE_ENDIF
},
// regex for native function testing
nativeFunctionRegExp = /^\s*function\s+.+?\(.*?\)\s*\{\s*\[native code\]\s*\}\s*$/,
// ability to check if a function is native
isNativeFunction = function(o) {
	return isFunction(o) && nativeFunctionRegExp.test(o.toString());
},
// quickly be able to get all the keys of an object
keys = function(o) {
	var k = [], i;
	for (i in o) {
		k[k.length] = i;
	}
//#JSCOVERAGE_IF
	if (isEnumerationBuggy) {
		// only add buggy enumerated values if it's not the Object.prototype's
		for (i = 0; i < enumerationLength; ++i) {
			if (hasOwn.call(o, enumeratedKeys[i])) {
				k[k.length] = enumeratedKeys[i];
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
// test if an item is in a array
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
	fn.__original_ = base;
	return fn;
},
// simple iteration function
each = function(o, iterator, context) {
	// we must account for null, otherwise it will throw the error "Unable to get value of the property 'length': object is null or undefined"
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
// simple mapping function
map = function(o, iterator) {
	var temp = [];
	each(o, function mapIterator(v, i) {
		temp[temp.length] = iterator(v, i, o);
	});
	return temp;
},
// simple filter function
filter = function(arr, item) {
	var out = [];
	each(arr, function filterIterator(v) {
		if (v !== item) {
			out[out.length] = v;
		}
	});
	return out;
},
// simple extension function that takes into account the enumerated keys
extend = function() {
	var args = argsToArray(arguments), base = args.shift();
	each(args, function extendArgIterator(extens) {
		each(keys(extens), function extendKeyIterator(k) {
			base[k] = extens[k];
		});
	});
	return base;
};
