/*!
 * Classify JavaScript Library v0.14.1
 * http://www.closedinterval.com/
 *
 * Copyright 2011-2014, Wei Kin Huang
 * Classify is freely distributable under the MIT license.
 *
 * Date: Thu Sep 11 2014 11:05:32
 */
(function(root, undefined) {
	"use strict";

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

/**
 * @module create
 */
// regex for keyword properties
var keywordRegexp = /^(?:\$\$\w+|bindings|extend|prototype|(?:add|remove)(?:Static|Aliased|Bound)Property)$/,
// Hook to use Object.defineProperty if needed
objectDefineProperty = function(obj, prop, descriptor) {
	obj[prop] = descriptor;
},
// create the base object that everything extends from
Base = (function() {
	var fn = function() {
	};
	/**
	 * True constructor method for this object, will be called when object is
	 * called with the "new" keyword
	 *
	 * @memberOf Classify.Class#
	 * @method init
	 * @return {Classify.Class}
	 */
	fn.prototype.init = noop;
	fn.prototype.constructor = fn;
	fn.$$isclass = true;
	return fn;
})(),
// wraps a function so that the "this.$$parent" is bound to the function
wrapParentProperty = function(parentPrototype, property) {
	return store(function() {
		/**
		 * Internal reference property for methods that override a parent
		 * method, allow for access to the parent version of the function.
		 *
		 * @memberOf Classify.Class#
		 * @method $$parent
		 * @return {Object}
		 */
		var tmp = this.$$parent, ret;
		this.$$parent = parentPrototype;
		ret = property.apply(this, arguments);
		if (tmp === undefined) {
			delete this.$$parent;
		} else {
			this.$$parent = tmp;
		}
		return ret;
	}, property);
},
// adds a property to an existing class taking into account parent
addProperty = function(klass, parent, name, property, mutators, isRecurse) {
	var shouldBreak = false, parentPrototype, selfPrototype, mutatatorMatches;
	// we don't want to re-add the core javascript properties, it's redundant
	if (property === objectPrototype[name]) {
		return;
	}

	// extract possible explicit mutators
	mutatatorMatches = mutatorNameTest.exec(name) || [];
	if (mutatatorMatches[1]) {
		// if we passed in `$$mutator$$ : { prop : 1, prop : 2 }`
		if (mutatatorMatches[1] && mutatatorMatches[0] === name && !isRecurse) {
			each(property, function nestedAddPropertyMutatorIterator(prop, key) {
				addProperty(klass, parent, mutatatorMatches[0] + key, prop, mutators, true);
			});
			return;
		}
		// convert explicit mutators to an array
		mutatatorMatches = mutatatorMatches[1].split(mutatorSeparator);
	}
	// replace name to provide for cascade
	name = name.replace(mutatorNameTest, "");
	// check to see if the property needs to be mutated
	each(mutators, function addPropertyMutatorIterator(mutator) {
		if (mutator.onPropAdd && (mutator.greedy || indexOf(mutatatorMatches, mutator.name) > -1)) {
			// use the return value of the mutator as the property to add
			property = mutator.onPropAdd.call(mutator, klass, parent, name, property, mutatatorMatches);
			// if mutator did not return anything, quit
			if (property === undefined) {
				shouldBreak = true;
				return false;
			}
		}
	});
	if (shouldBreak) {
		return;
	}

	// quick references
	parentPrototype = parent.prototype[name];
	selfPrototype = klass.prototype;
	// else this is not a prefixed static property, so we're assigning it to the
	// prototype
	objectDefineProperty(selfPrototype, name, (isFunction(property) && !property.$$isclass && isFunction(parentPrototype)) ? wrapParentProperty(parentPrototype, property) : property);

	// wrap all child implementation with the parent wrapper
	if (isFunction(property)) {
		each(klass.$$subclass, function addSubclassPropertyIterator(k) {
			// add only if it's not already wrapped
			if (isFunction(k.prototype[name]) && !k.prototype[name].$$original) {
				objectDefineProperty(k.prototype, name, wrapParentProperty(selfPrototype[name], k.prototype[name]));
			}
		});
	}
},
// removes a property from the chain
removeProperty = function(klass, name, mutators) {
	var shouldBreak = false, mutatatorMatches;

	// extract possible explicit mutators
	mutatatorMatches = mutatorNameTest.exec(name) || [];
	if (mutatatorMatches[1]) {
		// convert explicit mutators to an array
		mutatatorMatches = mutatatorMatches[1].split(mutatorSeparator);
	}
	// replace name to provide for cascade
	name = name.replace(mutatorNameTest, "");
	// check to see if the property needs to be mutated
	each(mutators, function mutatorIterator(mutator) {
		if (mutator.onPropRemove && (mutator.greedy || indexOf(mutatatorMatches, mutator.name) > -1)) {
			// if mutator did not return anything, quit
			if (mutator.onPropRemove.call(mutator, klass, name) === undefined) {
				shouldBreak = true;
				return false;
			}
		}
	});
	if (shouldBreak) {
		return;
	}

	// we need to delete the property from all children as well as
	// the current class when the prop is a function
	if (isFunction(klass.prototype[name])) {
		each(klass.$$subclass, function removeSubclassPropertyIterator(k) {
			// remove the parent function wrapper for child classes
			if (k.prototype[name] && isFunction(k.prototype[name]) && isFunction(k.prototype[name].$$original)) {
				objectDefineProperty(k.prototype, name, k.prototype[name].$$original);
			}
		});
	}
	klass.prototype[name] = null;
	try {
		delete klass.prototype[name];
	} catch (e) {
	}
},
// constructor body for all classes
initializeKlass = function(instance, klass, args) {
	var tmp, i, l, mutators;
	// We're not creating a instantiated object so we want to force a
	// instantiation or call the invoke function
	// we need to test for !this when in "use strict" mode
	// we need to test for !this.init for quick check if this is a instance
	// or a definition
	// we need to test for !(this instanceof klass) when the class is a
	// property of a instance class (ie. namespace)
	if (!instance || !instance.init || !(instance instanceof klass)) {
		return klass.invoke.apply(klass, args);
	}
	mutators = getMutators(klass);
	// loop through all the mutators for the onInit hook
	for (i = 0, l = mutators.length; i < l; i++) {
		if (!mutators[i].onInit) {
			continue;
		}
		// if the onInit hook returns anything, then it will override the
		// "new" keyword
		tmp = mutators[i].onInit.call(mutators[i], instance, klass, args);
		if (tmp !== undefined) {
			// however this method can only return objects and not scalar
			// values
			if (isScalar(tmp)) {
				throw new Error("Return values during onInit hook can only be objects.");
			}
			return tmp;
		}
	}
	// just in case we want to do anything special like "new" keyword
	// override (usually don't return anything)
	tmp = instance.init.apply(instance, args);
	if (tmp !== undefined) {
		// we can only return objects because the new keyword forces it to
		// be an object
		if (isScalar(tmp)) {
			throw new Error("Return values for the constructor can only be objects.");
		}
		return tmp;
	}
};

// Master inheritance based class system creation
/**
 * Creates a new Classify class
 *
 * @param {Classify.Class} [parent] Optional first parameter defines what object to
 *            inherit from
 * @param {Object[]} [implement] Optional second parameter defines where to
 *            implement traits from
 * @param {Classify.Mutator[]} [mutators] Optional third parameter defines
 *            mutations for this class
 * @param {Object} definition The description of the class to be created
 * @memberOf Classify
 * @method create
 * @return {Classify.Class}
 */
var create = function() {
	var parent = Base,
	// a hash of methods and properties to be inserted into the new class
	methods = {},
	// array of objects/classes that this class will implement the functions of,
	// but will not be an instance of
	implement = [],
	// array of mutators to be
	mutators = [],
	// quick reference to the arguments array and it's length
	args = argsToArray(arguments).slice(0, 4), argLength = args.length,
	// other variables
	klass, proto, tmp;
	// Parse out the arguments to grab the parent and methods
	// 1 argument: class definition
	// 2 argument: parent|implements|mutators, class definition
	// 3 argument: class definition, [implements, parent]|[implements,
	// mutators]|[parent, mutators], class definition
	// 4 argument: parent, implements, mutators, class definition
	if (argLength > 0) {
		// the definition is always the last argument
		methods = args.pop();
		while (--argLength > 0) {
			tmp = args.shift();
			if (!tmp.$$isclass && !isExtendable(tmp)) {
				if (tmp instanceof Mutator || isArray(tmp) && tmp[0] instanceof Mutator) {
					mutators = toArray(tmp);
				} else {
					implement = toArray(tmp);
				}
			} else {
				parent = tmp;
			}
		}
	}

	// extend so that modifications won't affect the passed in object
	methods = extend({}, methods);

	// extending from an outside object and not passing in a constructor
	if (!parent.$$isclass && !methods.init) {
		methods.init = parent;
	}

	/**
	 * Placeholder for class descriptors created with the create method
	 *
	 * @constructor
	 * @memberOf Classify
	 * @name Class
	 */
	klass = function() {
		return initializeKlass(this, klass, argsToArray(arguments));
	};

	// override klass.toString to return the body of the constructor method
	// rather than the generalized constructor body
	klass.toString = function() {
		return (methods.init || noop).toString();
	};

	// ability to create a new instance using an array of arguments, cannot be
	// overriden
	delete methods.$$apply;
	/**
	 * Create a new instance of the class using arguments passed in as an array
	 *
	 * @param {Array} args Array of arguments to construct the object with
	 * @memberOf Classify.Class
	 * @method $$apply
	 * @return {Classify.Class}
	 */
	klass.$$apply = function(a) {
		var TempClass = function() {
			return klass.apply(this, a);
		};
		TempClass.prototype = klass.prototype;
		return new TempClass();
	};
	/**
	 * Default invocation function when the defined class is called without the
	 * "new" keyword. The default behavior is to return a new instance of itself
	 *
	 * @memberOf Classify.Class
	 * @method invoke
	 * @return {Classify.Class}
	 */
	klass.invoke = methods.invoke || (parent.invoke && isFunction(parent.invoke) && !parent.invoke.$$original ? parent.invoke : null) || store(function() {
		return klass.$$apply(arguments);
	}, true);
	// Remove the invoke method from the prototype chain
	delete methods.invoke;
	// Keep a list of the inheritance chain
	/**
	 * Reference to the parent that this object extends from
	 *
	 * @memberOf Classify.Class
	 * @property $$superclass
	 * @type {Classify.Class}
	 */
	klass.$$superclass = parent;
	/**
	 * Array containing a reference to all the children that inherit from this
	 * object
	 *
	 * @memberOf Classify.Class
	 * @property $$subclass
	 * @type {Array}
	 */
	klass.$$subclass = [];
	/**
	 * Array containing all the objects and classes that this object implements
	 * methods and properties from
	 *
	 * @memberOf Classify.Class
	 * @property $$implement
	 * @type {Array}
	 */
	klass.$$implement = (isArray(parent.$$implement) ? parent.$$implement : []).concat(implement);
	/**
	 * Array containing all the mutators that were defined with this class,
	 * these mutators DO NOT get inherited
	 *
	 * @memberOf Classify.Class
	 * @property $$mutator
	 * @type {Array}
	 */
	klass.$$mutator = mutators;

	// call each of the _onPredefine mutators to modify this class
	each(getMutators(klass), function classMutatorIterator(mutator) {
		if (!mutator._onPredefine) {
			return;
		}
		mutator._onPredefine.call(mutator, klass);
	});

	// assign child prototype to be that of the parent's by default
	// (inheritance)
	proto = klass.prototype = objectCreate(parent.prototype);

	// Give this class the ability to create sub classes
	/**
	 * Creates a new class that is a child of the current class
	 *
	 * @param {Object[]} [implement] Optional second parameter defines where to
	 *            implement traits from
	 * @param {Classify.Mutator[]} [mutators] Optional third parameter defines
	 *            mutations for this class
	 * @param {Object} definition The description of the class to be created
	 * @see {@link Classify.create}
	 * @memberOf Classify.Class
	 * @method extend
	 * @return {Classify.Class}
	 */
	/**
	 * Creates a new class that is a child of the current class
	 *
	 * @param {Object[]} [implement] Optional second parameter defines where to
	 *            implement traits from
	 * @param {Classify.Mutator[]} [mutators] Optional third parameter defines
	 *            mutations for this class
	 * @param {Object} definition The description of the class to be created
	 * @see {@link Classify.create}
	 * @memberOf Classify.Class#
	 * @method extend
	 * @return {Classify.Class}
	 */
	klass.extend = proto.extend = function() {
		return create.apply(null, [ klass ].concat(argsToArray(arguments)));
	};

	// Add this class to the list of subclasses of the parent
	if (parent.$$subclass && isArray(parent.$$subclass)) {
		parent.$$subclass.push(klass);
	}
	// Create a magic method that can invoke any of the parent methods
	/**
	 * Magic method that can invoke any of the parent methods with a array of
	 * arguments
	 *
	 * @param {Object} name The name of the parent method to invoke
	 * @param {Array} args The arguments to pass through to invoke
	 * @memberOf Classify.Class#
	 * @method $$apply
	 * @return {Object}
	 */
	methods.$$apply = function(name, args) {
		if (name !== "$$apply" && name !== "$$call" && name in parent.prototype && isFunction(parent.prototype[name])) {
			var tmp = this.$$apply, ret;
			this.$$apply = parent.prototype.$$apply;
			ret = parent.prototype[name].apply(this, args || []);
			if (tmp === undefined) {
				delete this.$$apply;
			} else {
				this.$$apply = tmp;
			}
			return ret;
		}
		throw new Error("Function \"" + name + "\" of parent class being invoked is undefined.");
	};
	/**
	 * Magic method that can invoke any of the parent methods with any set of
	 * arguments
	 *
	 * @param {Object} name The name of the parent method to invoke
	 * @param {Object} arg... Actual arguments to call the method with
	 * @memberOf Classify.Class#
	 * @method $$call
	 * @return {Object}
	 */
	methods.$$call = function(name) {
		if (name !== "$$apply" && name !== "$$call" && name in parent.prototype && isFunction(parent.prototype[name])) {
			var tmp = this.$$call, args = argsToArray(arguments), ret;
			args.shift();
			this.$$call = parent.prototype.$$call;
			ret = parent.prototype[name].apply(this, args || []);
			if (tmp === undefined) {
				delete this.$$call;
			} else {
				this.$$call = tmp;
			}
			return ret;
		}
		throw new Error("Function \"" + name + "\" of parent class being invoked is undefined.");
	};
	/**
	 * Adds a new property to the object's prototype of base
	 *
	 * @param {string|Object} name The property name to add or if object is
	 *            passed in then it will iterate through it to add properties
	 * @param {Object} [property] The property to add to the class
	 * @param {string} [prefix=""] Prefix of the property name if any
	 * @memberOf Classify.Class
	 * @method addProperty
	 * @return {Classify.Class}
	 */
	klass.addProperty = function(name, property, prefix) {
		var mutators = getMutators(klass);
		// the prefix parameter is for internal use only
		prefix = prefix || "";
		if (property === undefined && typeof name !== "string") {
			each(keys(name), function addPropertyMutatorIterator(n) {
				addProperty(klass, parent, prefix + n, name[n], mutators);
			});
		} else {
			addProperty(klass, parent, prefix + name, property, mutators);
		}
		return klass;
	};
	/**
	 * Removes a property from the object's prototype or base
	 *
	 * @param {string} name The name of the property to remove
	 * @memberOf Classify.Class
	 * @method removeProperty
	 * @return {Classify.Class}
	 */
	klass.removeProperty = function(name) {
		removeProperty(klass, name, getMutators(klass));
		return klass;
	};

	// Now implement each of the implemented objects before extending
	if (implement.length !== 0) {
		each(implement, function(impl) {
			var props = impl.$$isclass ? impl.prototype : impl;
			each(keys(props), function implementIterator(name) {
				if (!hasOwn.call(proto, name) && !hasOwn.call(methods, name)) {
					// copy all the implemented properties to the methods
					// definition object
					methods[name] = props[name];
				}
			});
		});
	}

	// call each of the onCreate mutators to modify this class
	each(getMutators(klass), function createMutatorIterator(mutator) {
		if (mutator.onCreate) {
			mutator.onCreate.call(mutator, klass, parent);
		}
	});

	// Now extend each of those methods and allow for a parent accessor
	klass.addProperty(methods);
	/**
	 * Reference to the constructor function of this object
	 *
	 * @memberOf Classify.Class
	 * @property constructor
	 * @type {Classify.Class}
	 */
	proto.constructor = klass;
	/**
	 * Flag to determine if this object is created by Classify.create
	 *
	 * @memberOf Classify.Class
	 * @property $$isclass
	 * @private
	 * @type {boolean}
	 */
	klass.$$isclass = true;

	// call each of the onDefine mutators to modify this class
	each(getMutators(klass), function defineMutatorIterator(mutator) {
		if (mutator.onDefine) {
			mutator.onDefine.call(mutator, klass);
		}
	});

	return klass;
};

// export methods to the main object
extend(exportNames, {
	// direct access functions
	create : create
});

/**
 * @module mutator
 */
// regex to test for a mutator name to avoid a loop
var mutatorNameTest = /^\$\$(\w+)\$\$/,
// separator for multiple mutator usages
mutatorSeparator = "_",
// reference to existing mutators
namedGlobalMutators = {},
// list of all mutators in the order of definition
globalMutators = [],
/**
 * Internal "Mutator" class that handles hooks for class object manipulation
 *
 * @constructor
 * @memberOf Classify
 * @alias Mutator
 * @param {string} name The name of the mutator
 * @param {Object} props hash of properties to merge into the prototype
 */
Mutator = function(name, props) {
	if (!(this instanceof Mutator)) {
		return new Mutator(name, props);
	}

	/**
	 * The execution priority of this mutator
	 *
	 * @private
	 * @memberOf Classify.Mutator#
	 * @member priority
	 * @type {number}
	 */
	this.priority = 100;

	extend(this, props);

	/**
	 * The name of the mutator
	 *
	 * @private
	 * @memberOf Classify.Mutator#
	 * @member name
	 * @type {string}
	 */
	this.name = name;
	/**
	 * Flag determining if all property modifications should be run through
	 * this mutator
	 *
	 * @private
	 * @memberOf Classify.Mutator#
	 * @member greedy
	 * @type {boolean}
	 */
	this.greedy = props.greedy === true;
	/**
	 * The property matcher prefix of this mutator
	 *
	 * @private
	 * @memberOf Classify.Mutator#
	 * @member propPrefix
	 * @type {string}
	 */
	this.propPrefix = "$$" + name + "$$";
},
/**
 * Adds a global class mutator that modifies the defined classes at different
 * points with hooks
 *
 * @param {string} name The name of the mutator reference to add
 * @param {Object} mutator The mutator definition with optional hooks
 * @param {Function} [mutator._onPredefine] Internal hook to be called as soon
 *            as the constructor is defined
 * @param {Function} [mutator.onCreate] The hook to be called when a class is
 *            defined before any properties are added
 * @param {Function} [mutator.onDefine] The hook to be called when a class is
 *            defined after all properties are added
 * @param {Function} [mutator.onPropAdd] The hook to be called when a property
 *            with the $$name$$ prefix is added
 * @param {Function} [mutator.onPropRemove] The hook to be called when a
 *            property with the $$name$$ prefix is removed
 * @param {Function} [mutator.onInit] The hook to be called during each object's
 *            initialization
 * @param {boolean} [mutator.greedy] Attribute to declare that all properties
 *            being added and removed goes through this mutator
 * @param {number} [mutator.priority=100] Attribute to declare execution priority
 *            higher numbers gets run first
 * @throws Error
 * @memberOf Classify
 * @method addMutator
 */
addMutator = function(name, mutator) {
	if (namedGlobalMutators[name]) {
		throw new Error("Adding duplicate mutator \"" + name + "\".");
	}
	var mutatorInstance = new Mutator(name, mutator);
	namedGlobalMutators[name] = mutatorInstance;
	globalMutators.push(mutatorInstance);
},
/**
 * Removes a global class mutator that modifies the defined classes at different
 * points
 *
 * @param {string} name The name of the mutator to be removed
 * @throws Error
 * @memberOf Classify
 * @method removeMutator
 */
removeMutator = function(name) {
	var mutator = namedGlobalMutators[name];
	if (!mutator) {
		throw new Error("Removing unknown mutator.");
	}
	remove(globalMutators, mutator);
	namedGlobalMutators[name] = null;
	try {
		delete namedGlobalMutators[name];
	} catch (e) {
	}
},
// method to get all possible mutators
getMutators = function(klass) {
	var i, l, mutators = globalMutators.slice(0);
	arrayPush.apply(mutators, klass.$$mutator);
	// hook for namespaces!
	if (klass.getMutators) {
		arrayPush.apply(mutators, klass.getMutators() || []);
	}
	for (i = 0, l = mutators; i < l; i++) {
		if (!(mutators[i] instanceof Mutator)) {
			throw new Error("Mutator objects can only be instances of \"Mutator\", please use createMutator.");
		}
	}
	mutators.sort(function(a, b) {
		return a.priority === b.priority ? 0 : (a.priority > b.priority ? -1 : 1);
	});
	return mutators;
};

// export methods to the main object
extend(exportNames, {
	// direct access functions
	Mutator : Mutator,
	addMutator : addMutator,
	removeMutator : removeMutator
});

/**
 * @module mutator.static
 */
// mutator for adding static properties to a class
addMutator("static", {
	priority : 2000,
	// the special identifier is "$$static$$"
	onCreate : function(klass) {
		var mutatorPrefix = this.propPrefix;
		/**
		 * Adds a static property to the object's base
		 * @param {string} name The name of the property to add
		 * @param {Object} property The property to store into the object's base
		 * @memberOf Classify.Class
		 * @method addStaticProperty
		 * @return {Classify.Class}
		 */
		klass.addStaticProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
		/**
		 * Removes a static property from the object's base
		 * @param {string} name The name of the property to remove
		 * @memberOf Classify.Class
		 * @method removeStaticProperty
		 * @return {Classify.Class}
		 */
		klass.removeStaticProperty = function(name) {
			return klass.removeProperty(mutatorPrefix + name);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// we don't want to override the reserved properties of these classes
		if (keywordRegexp.test(name)) {
			return;
		}
		// See if we are defining an static property, if we are, assign it to the class
		objectDefineProperty(klass, name, (isFunction(property) && !property.$$isclass) ? store(function() {
			// Force "this" to be a reference to the class itself to simulate "self"
			return property.apply(klass, arguments);
		}, property) : property);
	},
	onPropRemove : function(klass, name) {
		// prevent removing reserved static properties created with "create"
		if (keywordRegexp.test(name)) {
			return;
		}
		// garbage collection
		klass[name] = null;
		// then try to remove the property
		try {
			delete klass[name];
		} catch (e) {
		}
	}
});

/**
 * @module mutator.nowrap
 */
// mutator for adding unwrapped function properties to a class
addMutator("nowrap", {
	priority : 1000,
	// the special identifier is "$$nowrap$$"
	onCreate : function(klass) {
		var mutatorPrefix = this.propPrefix;
		/**
		 * Adds a property to the object's prototype that is not wrapped in the parent method wrapper
		 * @param {string} name The name of the new property
		 * @param {string} property The name of the property to add
		 * @memberOf Classify.Class
		 * @method addUnwrappedProperty
		 * @return {Classify.Class}
		 */
		klass.addUnwrappedProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// unwrapped properties are simply added to the prototype
		objectDefineProperty(klass.prototype, name, property);
	}
});

/**
 * @module mutator.alias
 */
// mutator for adding aliased function properties to a class
addMutator("alias", {
	priority : 1000,
	// the special identifier is "$$alias$$"
	onCreate : function(klass) {
		var mutatorPrefix = this.propPrefix;
		// shortcut method for adding aliased properties
		/**
		 * Adds a aliased property to the object's prototype based on a existing prototype method
		 * @param {string} name The name of the alias for the new property
		 * @param {string} property The name of the property alias
		 * @memberOf Classify.Class
		 * @method addAliasedProperty
		 * @return {Classify.Class}
		 */
		klass.addAliasedProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// alias properties are simply function wrappers
		return function() {
			return this[property].apply(this, arguments);
		};
	}
});

/**
 * @module mutator.bind
 */
// mutator for adding bound properties to a class
addMutator("bind", {
	priority : 1000,
	// the special identifier is "$$bind$$"
	onCreate : function(klass, parent) {
		var mutatorPrefix = this.propPrefix;
		// re-assign the bindings so that it produces copies across child classes
		/**
		 * Array containing the list of all the bound properties that is wrapped during object initialization
		 * @memberOf Classify.Class
		 * @property bindings
		 * @type {Array}
		 */
		klass.bindings = (parent.bindings || []).slice(0);
		/**
		 * Adds a context bound property to the object's prototype
		 * @param {string} name The name of the property to add
		 * @param {Function} property The property to always bind the object's context with
		 * @memberOf Classify.Class
		 * @method addBoundProperty
		 * @return {Classify.Class}
		 */
		klass.addBoundProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
		/**
		 * Removes a context bound property from the object's base
		 * @param {string} name The name of the property to remove
		 * @memberOf Classify.Class
		 * @method removeBoundProperty
		 * @return {Classify.Class}
		 */
		klass.removeBoundProperty = function(name) {
			return klass.removeProperty(mutatorPrefix + name);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// add to the bindings array only if not already added and is not an definition of a class
		var i = indexOf(klass.bindings, name);
		if (i < 0 && isFunction(property) && !property.$$isclass) {
			// add the property name to the internal bindings array
			klass.bindings.push(name);
		}
		// add the property normally
		return property;
	},
	onPropRemove : function(klass, name) {
		// remove the bindings if it exists
		if (!remove(klass.bindings, name)) {
			return;
		}

		// we need to delete the bound property from all children as well as the current class
		each(klass.$$subclass, function bindPropRemoveIterator(k) {
			if (indexOf(k.bindings, name) > -1 && !hasOwn.call(k.prototype, name)) {
				k.removeBoundProperty(name);
			}
		});
		// remove the property normally
		removeProperty(klass, name);
	},
	onInit : function(instance, klass) {
		var bindings = klass.bindings || null;
		// if there are no bound properties, just continue
		if (bindings === null || bindings.length === 0) {
			return;
		}
		// wrap all prototypes that needs to be bound to the instance
		each(bindings, function bindingsIterator(prop) {
			var method = klass.prototype[prop];
			objectDefineProperty(instance, prop, function() {
				var tmp = instance.$$context, ret;
				/**
				 * Allow access to the calling context when using a bound method
				 *
				 * @memberOf Classify.Class#
				 * @property $$context
				 * @type {Object}
				 */
				instance.$$context = this;
				// then call the original method with the proper context
				ret = method.apply(instance, arguments);
				if (tmp === undefined) {
					delete instance.$$context;
				} else {
					instance.$$context = tmp;
				}
				return ret;
			});
		});
	}
});

/**
 * @module namespace
 */
// global container containing all the namespace references
var namespaces = {},
// name of the globally avaliable namespace
globalNamespace = "GLOBAL",
// early definition for namespacing function
getNamespace, destroyNamespace, testNamespace, getGlobalNamespace,
// create a function that create namespaces in an object
provide = function(namespace, base) {
	// Drill down the namespace array
	each(namespace, function provideIterator(ns) {
		if (!base[ns]) {
			base[ns] = {};
		}
		base = base[ns];
	});
	return base;
},
// ability to de-reference string into it's classes
dereference = function(ns, arg, ref) {
	// Allow parent classes to be passed in as a string for lookup
	if (typeof arg === "string") {
		ref = ns.get(arg);
		if (!ref) {
			throw new Error("Invalid parent class [" + arg + "] specified.");
		}
		return ref;
	}
	// if we have an object, then that's what we want, otherwise arrays
	// we need to loop through and convert them to the proper objects
	return !isArray(arg) ? arg : map(arg, function dereferenceIterator(prop) {
		return dereference(ns, prop);
	});
},
// properties to create a namespace from any object
namespaceProperties = {
	/**
	 * Creates a new class within this namespace
	 *
	 * @param {string} name The name of the created class within the namespace
	 * @param {string|Class} [parent] Optional second parameter defines what
	 *            object to inherit from, can be a string referencing a class
	 *            within any namespace
	 * @param {Object[]} [implement] Optional third parameter defines where to
	 *            implement traits from
	 * @param {Classify.Mutator[]} [mutators] Optional third parameter defines
	 *            mutations for this class
	 * @param {Object} definition The description of the class to be created
	 * @memberOf Classify.Namespace#
	 * @method create
	 * @return {Class}
	 */
	create : function() {
		// Get the arguments to be passed into the Class function
		var args = argsToArray(arguments),
		// keep a reference to the fullname
		fullname = args.shift(),
		// Get the namespace we are creating this class in
		namespace = fullname.split("."),
		// Get the actual name of this class to be created
		name = namespace.pop(),
		// quick reference to this namespace
		self = this,
		// Retrieve the namespaced container
		ref = provide(namespace, self),
		// the namespace mutator
		nsMutator = new Mutator("namespace", {
			_onPredefine : function(klass) {
				// Assign the magic properties of the class's name and namespace
				klass.$$name = name;
				klass.$$namespace = fullname;
				// give classes the ability to always store the namespace for
				// chaining
				klass.getNamespace = function() {
					return self;
				};
				klass.toString = function() {
					return "[object " + fullname + "]";
				};
				klass.getMutators = function() {
					return self.mutators;
				};
			}
		}), mappedArgs = map(args, function mappedArgsDereferenceIterator(v) {
			return dereference(self, v);
		}),
		// other vars
		foundMutatorArg = false, c, tmp;

		// look for the mutators argument
		mappedArgs = map(mappedArgs, function mappedArgsIterator(v) {
			// we found some mutators!
			if (!v.$$isclass && !isExtendable(v) && (v instanceof Mutator || (isArray(v) && v[0] instanceof Mutator))) {
				foundMutatorArg = true;
				v = toArray(v);
				v.unshift(nsMutator);
			}
			return v;
		});
		if (foundMutatorArg === false) {
			tmp = mappedArgs.pop();
			arrayPush.call(mappedArgs, nsMutator, tmp);
		}

		// fix the arguments & create the class
		c = create.apply(null, mappedArgs);
		// fix the issue with the extends function referencing string classes
		c.extend = c.prototype.extend = function() {
			return create.apply(null, [ c ].concat(map(arguments, function extendIterator(v) {
				return dereference(self, v);
			})));
		};
		// Assign the classes to the namespaced references
		ref[name] = c;
		self.$$nsref[fullname] = c;
		// Return the new class
		return c;
	},
	/**
	 * Removes a defined class from this namespace and it's children classes
	 *
	 * @param {string} classname Name of class to remove from this namespace
	 * @memberOf Classify.Namespace#
	 * @method destroy
	 * @return {Namespace}
	 */
	destroy : function(classname) {
		// initializing the placeholder
		var c,
		// Get the namespace we are creating this class in
		namespace = classname.split("."),
		// Get the actual name of this class to be created
		name = namespace.pop(),
		// create a quick reference to this
		self = this, ref = this,
		// Create a reference to the master classes array
		deref = this.$$nsref;

		// remove it from this namespace
		each(namespace, function destroyIterator(ns) {
			// if it doesn't go that far, then forget deleting it
			if (!ref[ns]) {
				ref = null;
				return false;
			}
			ref = ref[ns];
		});
		// delete the reference only if we can find it
		if (!ref) {
			return this;
		}
		// create a quick reference
		c = ref[name];
		// if there is nothing in this top level namespace, stop
		if (!c) {
			return this;
		}
		// recursively remove all inherited classes
		each(c.$$subclass, function destroyInheritedIterator(v) {
			self.destroy(v.$$namespace);
		});
		// we also need to delete the reference to this object from the parent!
		if (c.$$superclass.$$subclass) {
			c.$$superclass.$$subclass = c.$$superclass.$$subclass.slice(0);
			remove(c.$$superclass.$$subclass, c);
		}
		// now we remove all non inherited classes, but fall under this
		// namespace
		each(deref, function destroyClassIterator(v, k) {
			if (k !== classname && k.indexOf(classname) === 0) {
				self.destroy(v.$$namespace);
			}
		});
		// let's remove it from this object!
		delete ref[name];
		// let's remove the textual reference to this class as well
		delete deref[classname];
		// return this for chaining
		return this;
	},
	/**
	 * Checks if a class exists within this namespace
	 *
	 * @param {string} classname Name of class to check if it has already been
	 *            defined
	 * @memberOf Classify.Namespace#
	 * @method exists
	 * @return {boolean}
	 */
	exists : function(classname) {
		return !!this.$$nsref[classname];
	},
	/**
	 * Attempt to retrieve a class within this namespace or the global one
	 *
	 * @param {string} name The name of the class to retrieve
	 * @memberOf Classify.Namespace#
	 * @method get
	 * @return {Class}
	 */
	get : function(name) {
		var tmp;
		// already defined, return it
		if (this.$$nsref[name]) {
			return this.$$nsref[name];
		}
		// use the autoloader if defined
		tmp = this.load(name);
		// return if loaded
		if (tmp !== null) {
			return tmp;
		}
		// reach into the global namespace
		if (this.$$nsname !== globalNamespace) {
			return getGlobalNamespace().get(name);
		}
		// no class found
		return null;
	},
	/**
	 * Loader function to retrieve a {Classify.Class}
	 *
	 * @param {string} name The name of the class to load
	 * @memberOf Classify.Namespace#
	 * @method load
	 * @deprecated
	 * @returns {Classify.Class}
	 */
	load : function(name) {
		return this.$$nsref[name] || null;
	},
	/**
	 * Sets the internal autoloader by overriding the Namespace.prototype.load
	 * method
	 *
	 * @param {Function} callback The function to call when a class that doesn't
	 *            exist needs to be loaded
	 * @memberOf Classify.Namespace#
	 * @method setAutoloader
	 * @return {Namespace}
	 */
	setAutoloader : function(callback) {
		// make sure the callback is a function
		if (!isFunction(callback)) {
			throw new Error("Namespace.setAutoloader only takes instances of Function");
		}
		this.load = callback;
		return this;
	},
	/**
	 * Gets the name of this namespace
	 *
	 * @memberOf Classify.Namespace#
	 * @method getName
	 * @return {string}
	 */
	getName : function() {
		return this.$$nsname;
	},
	/**
	 * Adds a namespace level class mutator that modifies the defined classes at
	 * different points with hooks
	 *
	 * @param {string} name The name of the mutator reference to add
	 * @param {Object} mutator The mutator definition with optional hooks
	 * @param {Function} [mutator._onPredefine] Internal hook to be called as
	 *            soon as the constructor is defined
	 * @param {Function} [mutator.onCreate] The hook to be called when a class
	 *            is defined before any properties are added
	 * @param {Function} [mutator.onDefine] The hook to be called when a class
	 *            is defined after all properties are added
	 * @param {Function} [mutator.onPropAdd] The hook to be called when a
	 *            property with the $$name$$ prefix is added
	 * @param {Function} [mutator.onPropRemove] The hook to be called when a
	 *            property with the $$name$$ prefix is removed
	 * @param {Function} [mutator.onInit] The hook to be called during each
	 *            object's initialization
	 * @throws Error
	 * @memberOf Classify.Namespace#
	 * @method addMutator
	 */
	addMutator : function(name, mutator) {
		if (this.namedMutators[name] || namedGlobalMutators[name]) {
			throw new Error("Adding duplicate mutator \"" + name + "\" in namespace " + this.$$nsname + ".");
		}
		var mutatorInstance = new Mutator(name, mutator);
		this.namedMutators[name] = mutatorInstance;
		this.mutators.push(mutatorInstance);
	},
	/**
	 * Removes a namespace level class mutator that modifies the defined classes
	 * at different points
	 *
	 * @param {string} name The name of the mutator to be removed
	 * @throws Error
	 * @memberOf Classify.Namespace#
	 * @method removeMutator
	 */
	removeMutator : function(name) {
		var mutator = this.namedMutators[name];
		if (!mutator) {
			throw new Error("Removing unknown mutator from namespace " + this.$$nsname + ".");
		}
		remove(this.mutators, mutator);
		this.namedMutators[name] = null;
		try {
			delete this.namedMutators[name];
		} catch (e) {
		}
	}
};

/**
 * Namespacing class to create and handle namespaces
 *
 * @constructor
 * @memberOf Classify
 * @alias Namespace
 * @augments {Classify.Class}
 * @param {string} name The name of the namespace to construct with
 */
var Namespace = create(extend({}, namespaceProperties, {
	/**
	 * Flag to determine if this object is functionally a namespace
	 *
	 * @memberOf Classify.Namespace#
	 * @property $$isnamespace
	 * @private
	 * @type {boolean}
	 */
	$$isnamespace : true,
	/**
	 * The name of the namespace
	 *
	 * @private
	 * @memberOf Classify.Namespace#
	 * @property $$nsname
	 * @type {string}
	 */
	$$nsname : null,
	/**
	 * Hashtable containing references to all the classes created within this
	 * namespace
	 *
	 * @private
	 * @memberOf Classify.Namespace#
	 * @property $$nsref
	 * @type {Object}
	 */
	$$nsref : null,
	/**
	 * Hashtable containing references to all the defined mutators
	 *
	 * @private
	 * @memberOf Classify.Namespace#
	 * @property namedMutators
	 * @type {Object}
	 */
	namedMutators : null,
	/**
	 * Array of all mutators in the namespace
	 *
	 * @private
	 * @memberOf Classify.Namespace#
	 * @property mutators
	 * @type {Array}
	 */
	mutators : null,
	/**
	 * Namespace container that hold a tree of classes
	 *
	 * @constructs
	 * @extends {Class}
	 * @param {string} name The name of the namespace to construct with
	 * @name Namespace
	 */
	init : function(name) {
		this.$$nsname = name;
		this.$$nsref = {};
		this.namedMutators = {};
		this.mutators = [];
	},
	/**
	 * Gets the translated toString name of this object "[namespace Name]"
	 *
	 * @memberOf Classify.Namespace#
	 * @method toString
	 * @return {string}
	 */
	toString : function() {
		return "[namespace " + this.$$nsname + "]";
	}
}));

/**
 * Transforms a object to a {Classify.Namespace} capable object
 *
 * @param {string} name The name of the namespace to construct with
 * @param {Object} obj The target object to extend with Namespace abilities
 * @param {boolean} [internalize=false] Set the namespace into the internal
 *            named cache
 * @memberOf Classify.Namespace
 * @method from
 * @return {Object}
 */
Namespace.from = function(name, obj, internalize) {
	if (!obj) {
		throw new Error("Attempting to create a namespace with invalid value.");
	}
	if (obj.$$isnamespace) {
		throw new Error("Attempting to create a namespace from an existing namespace.");
	}
	var namespaceProps = {},
		namespace;
	each(namespaceProperties, function namespaceFromIterator(prop, key) {
		namespaceProps[key] = function() {
			return prop.apply(obj, arguments);
		};
	});
	namespace = extend(obj, namespaceProps, {
		$$isnamespace : true,
		$$nsname : name,
		$$nsref : {},
		namedMutators : {},
		mutators : []
	});
	if (internalize) {
		if (name === globalNamespace) {
			throw new Error("Attempting to set the internal global namespace.");
		}
		namespaces[name] = namespace;
	}
	return namespace;
};

/**
 * Retrieves a namespace and creates if it it doesn't already exist
 *
 * @param {string} namespace Dot separated namespace string
 * @memberOf Classify
 * @method getNamespace
 * @return {Namespace}
 */
getNamespace = function(namespace) {
	// if passed in object is already a namespace, just return it
	if (namespace && namespace.$$isnamespace) {
		return namespace;
	}
	// if we passed in nothing then we want the global namespace
	namespace = namespace || globalNamespace;
	// if the namespace doesn't exist, just create it
	if (!namespaces[namespace]) {
		namespaces[namespace] = new Namespace(namespace);
	}
	return namespaces[namespace];
};

/**
 * Destroy an existing namespace
 *
 * @param {string} namespace Dot separated namespace string
 * @memberOf Classify
 * @method destroyNamespace
 */
destroyNamespace = function(namespace) {
	// if namespace passed in, get the name out of it
	if (namespace && namespace.$$isnamespace) {
		namespace = namespace.$$nsname;
	}
	// can't destroy the global namespace
	if (namespace === globalNamespace) {
		return;
	}
	// TODO: more advanced cleanup
	delete namespaces[namespace];
};

/**
 * Retrieves the first namespace that matches the namespace chain
 * "Ns1.ns2.ns3.ns4"
 *
 * @param {string} namespace Dot separated namespace string
 * @memberOf Classify
 * @method testNamespace
 * @return {Namespace}
 */
testNamespace = function(namespace) {
	var ns = namespace.split("."), l = ns.length, tmp;
	while ((tmp = ns.slice(0, l--).join(".")) !== "") {
		if (namespaces[tmp]) {
			return namespaces[tmp];
		}
	}
	return null;
};

/**
 * Retieves the globally named namespace
 *
 * @memberOf Classify
 * @method getGlobalNamespace
 * @return {Namespace}
 */
getGlobalNamespace = function() {
	return getNamespace(globalNamespace);
};

// export methods to the main object
extend(exportNames, {
	// direct access functions
	Namespace : Namespace,
	getNamespace : getNamespace,
	destroyNamespace : destroyNamespace,
	testNamespace : testNamespace,
	getGlobalNamespace : getGlobalNamespace,

	/**
	 * The globally named namespace
	 *
	 * @memberOf Classify
	 * @property global
	 * @type {Namespace}
	 */
	global : getGlobalNamespace(),

	// utility function to provide functionality to allow for name provisioning
	provide : function(namespace, base) {
		return provide(namespace.split("."), base || root || {});
	}
});

/**
 * @module export
 */
// quick reference to the seperator string
var namespaceSeparator = "/",
/**
 * The wrapped reference to the Classify object.
 *
 * @constructor
 * @augments {Classify.Class}
 * @name Classify
 * @see {@link Classify.create}
 */
Classify = create({
	invoke : function() {
		var args = argsToArray(arguments), length = args.length, ns, tmp;
		// no arguments will return the global namespace
		if (length === 0) {
			return getNamespace();
		}
		// if the first parameter is a string
		if (typeof args[0] === "string") {
			// and there is only 1 arguments
			if (length === 1) {
				tmp = args[0].split(namespaceSeparator);
				ns = getNamespace(tmp[0]);
				// and it was separated with "/" then get the class
				if (tmp[1]) {
					return ns.get(tmp[1]);
				}
				// otherwise we just want the namespace
				return ns;
			}
			// if we passed in 2 arguments of strings then we want a class within a namespace
			if (length === 2 && typeof args[1] === "string") {
				return getNamespace(args[0]).get(args[1]);
			}
			// otherwise we will assume the first parameter is the namespace
			tmp = args.shift().split(namespaceSeparator);
			ns = getNamespace(tmp[0]);
			// if the first parameter was a string, and separated with "/" then that is the class name
			if (tmp[1]) {
				args.unshift(tmp[1]);
			}
			// now create a new class within the context of the selected namespace
			return ns.create.apply(ns, args);
		}
		// otherwise they are just class creation parameters
		return create.apply(null, args);
	},
	/**
	 * The Main interface function that returns namespaces and creates objects
	 *
	 * @constructs
	 * @name Classify
	 * @return {Classify.Class}
	 */
	init : function() {
		var args = argsToArray(arguments), params, tmp;
		if (args.length < 1) {
			throw new Error("Classify object cannot be instantiated!");
		}
		params = isArray(args[args.length - 1]) ? args.pop() : [];
		tmp = Classify.invoke.apply(null, args);
		// if we found a class, instantiate it
		if (tmp.$$isclass) {
			return tmp.$$apply(params);
		}
		// otherwise, just return it
		return tmp;
	}
});

// store clean references to these methods
extend(Classify, exportNames, {
	/**
	 * The version number of this file
	 * @final
	 * @memberOf Classify
	 * @type {string}
	 * @property version
	 */
	version : "0.14.1"
});

/*global define */
if (typeof define === "function" && define.amd) {
	// Export Classify as an AMD module only if there is a AMD module loader,
	// use lowercase classify, because AMD modules are usually loaded with filenames
	// and Classify would usually be loaded with lowercase classify.js
	define("classify", [], function() {
		return Classify;
	});
}
if (typeof module !== "undefined" && module.exports) {
	// Export the Classify object for **CommonJS**, with backwards-compatibility for the
	// old "require()" API. If we're not in CommonJS, add "Classify" to the global object.
	module.exports = Classify;
	/**
	 * Circular reference to itself
	 * @property Classify
	 * @memberOf Classify
	 * @type {Function}
	 */
	Classify.Classify = Classify;
} else {
	// store previous value of root.Classify
	var rootValue = root.Classify;

	// otherwise attempt to make a global reference
	root.Classify = Classify;

	/**
	 * Run Classify.js in "noConflict" mode, returning the "Classify" variable to its
	 * previous value. Returns a reference to the Classify object.
	 * @method noConflict
	 * @memberOf Classify
	 * @return {Classify}
	 * @example
	 *     (function(Classify) {
	 *         // here you can use the Classify object and remove the global reference to it
	 *         // this function is only available on browser environments
	 *     })(Classify.noConflict());
	 */
	Classify.noConflict = function() {
		if (rootValue === undefined) {
			delete root.Classify;
		} else {
			root.Classify = rootValue;
		}
		return Classify;
	};
}

	// Establish the root object, "window" in the browser, or "global" on the server.
})(this);
