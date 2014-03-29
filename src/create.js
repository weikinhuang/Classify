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
