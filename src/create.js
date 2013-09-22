/**
 * @module create
 */
// regex for keyword properties
var keywordRegexp = /^(?:superclass|subclass|implement|bindings|extend|prototype|applicate|(?:add|remove)(?:Static|Aliased|Bound)Property)$/,
// regex to test for a mutator name to avoid a loop
mutatorNameTest = /^__/,
// reference to existing mutators
namedGlobalMutators = {},
// list of all mutators in the order of definition
globalMutators = [],
// Use native object.create whenever possible
objectCreate = isNativeFunction(Object.create) ? Object.create : function(proto) {
//#JSCOVERAGE_IF !Object.create
	// This method allows for the constructor to not be called when making a new
	// subclass
	var SubClass = function() {
	};
	SubClass.prototype = proto;
	return new SubClass();
//#JSCOVERAGE_ENDIF
},
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
	 * @for Classify.Class
	 * @method init
	 * @return {Class}
	 */
	fn.prototype.init = function() {
	};
	fn.prototype.constructor = fn;
	fn.$$isclass = true;
	return fn;
})(),
/**
 * Internal "Mutator" class that handles hooks for class object manipulation
 *
 * @constructor
 * @for Classify.Mutator
 * @param {String} name The name of the mutator
 * @param {Object} props hash of properties to merge into the prototype
 * @method Mutator
 */
Mutator = function(name, props) {
	if (!(this instanceof Mutator)) {
		return new Mutator(name, props);
	}
	extend(this, props);
	this.name = name;
	this.propTest = new RegExp("^__" + name + "_");
	this.propPrefix = "__" + name + "_";
},
// wraps a function so that the "this.$$parent" is bound to the function
wrapParentProperty = function(parentPrototype, property) {
	return store(function() {
		/**
		 * Internal reference property for methods that override a parent
		 * method, allow for access to the parent version of the function.
		 *
		 * @for Classify.Class
		 * @method parent
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
/**
 * Adds a global class mutator that modifies the defined classes at different
 * points with hooks
 *
 * @param {String} name The name of the mutator reference to add
 * @param {Object} mutator The mutator definition with optional hooks
 * @param {Function} [mutator._onPredefine] Internal hook to be called as soon as
 *            the constructor is defined
 * @param {Function} [mutator.onCreate] The hook to be called when a class is
 *            defined before any properties are added
 * @param {Function} [mutator.onDefine] The hook to be called when a class is
 *            defined after all properties are added
 * @param {Function} [mutator.onPropAdd] The hook to be called when a property
 *            with the __name_ prefix is added
 * @param {Function} [mutator.onPropRemove] The hook to be called when a
 *            property with the __name_ prefix is removed
 * @param {Function} [mutator.onInit] The hook to be called during each object's
 *            initialization
 * @throws Error
 * @static
 * @for Classify
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
 * @param {String} name The name of the mutator to be removed
 * @throws Error
 * @static
 * @for Classify
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
	return mutators;
},
// adds a property to an existing class taking into account parent
addProperty = function(klass, parent, name, property, mutators) {
	var foundMutator, parent_prototype, self_prototype;
	// we don't want to re-add the core javascript properties, it's redundant
	if (property === objectPrototype[name]) {
		return;
	}

	// check to see if the property needs to be mutated
	if (mutatorNameTest.test(name)) {
		foundMutator = false;
		each(mutators, function mutatorIterator(mutator) {
			if (mutator.onPropAdd && mutator.propTest.test(name)) {
				if (name === mutator.propPrefix) {
					each(property, function addPropertyMutatorIterator(prop, key) {
						mutator.onPropAdd.call(mutator, klass, parent, key, prop);
					});
				} else {
					mutator.onPropAdd.call(mutator, klass, parent, name.replace(mutator.propTest, ""), property);
				}
				foundMutator = true;
				return false;
			}
		});
		if (foundMutator) {
			return;
		}
	}

	// quick references
	parent_prototype = parent.prototype[name];
	self_prototype = klass.prototype;
	// else this is not a prefixed static property, so we're assigning it to the
	// prototype
	objectDefineProperty(self_prototype, name, (isFunction(property) && !property.$$isclass && isFunction(parent_prototype)) ? wrapParentProperty(parent_prototype, property) : property);

	// wrap all child implementation with the parent wrapper
	if (isFunction(property)) {
		each(klass.$$subclass, function addSubclassPropertyIterator(k) {
			// add only if it's not already wrapped
			if (isFunction(k.prototype[name]) && !k.prototype[name].$$original) {
				objectDefineProperty(k.prototype, name, wrapParentProperty(self_prototype[name], k.prototype[name]));
			}
		});
	}
},
// removes a property from the chain
removeProperty = function(klass, name, mutators) {
	var foundMutator = false;
	if (mutatorNameTest.test(name)) {
		each(mutators, function removePropertyMutatorIterator(mutator) {
			if (mutator.onPropRemove && mutator.propTest.test(name)) {
				mutator.onPropRemove.call(mutator, klass, name.replace(mutator.propTest, ""));
				foundMutator = true;
				return false;
			}
		});
		if (foundMutator) {
			return;
		}
	}

	// if we are not removing a function from the prototype chain, then just
	// delete it
	if (!isFunction(klass.prototype[name])) {
		klass.prototype[name] = null;
		try {
			delete klass.prototype[name];
		} catch (e) {
		}
		return;
	}
	// we need to delete the property from all children as well as
	// the current class
	each(klass.$$subclass, function removeSubclassPropertyIterator(k) {
		// remove the parent function wrapper for child classes
		if (k.prototype[name] && isFunction(k.prototype[name]) && isFunction(k.prototype[name].$$original)) {
			objectDefineProperty(k.prototype, name, k.prototype[name].$$original);
		}
	});
	klass.prototype[name] = null;
	try {
		delete klass.prototype[name];
	} catch (e) {
	}
};

// Master inheritance based class system creation
/**
 * Creates a new Classify class
 *
 * @param {Class} [parent] Optional first parameter defines what object to
 *            inherit from
 * @param {Object[]} [implement] Optional second parameter defines where to
 *            implement traits from
 * @param {Classify.Mutator[]} [mutators] Optional third parameter defines
 *            mutations for this class
 * @param {Object} definition The description of the class to be created
 * @static
 * @for Classify
 * @method create
 * @return {Class}
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
	 * @for Classify
	 * @type Object
	 */
	klass = function() {
		var tmp, i, l, mutators, args;
		// We're not creating a instantiated object so we want to force a
		// instantiation or call the invoke function
		// we need to test for !this when in "use strict" mode
		// we need to test for !this.init for quick check if this is a instance
		// or a definition
		// we need to test for !(this instanceof klass) when the class is a
		// property of a instance class (ie. namespace)
		if (!this || !this.init || !(this instanceof klass)) {
			return klass.invoke.apply(klass, arguments);
		}
		mutators = getMutators(klass);
		args = argsToArray(arguments);
		// loop through all the mutators for the onInit hook
		for (i = 0, l = mutators.length; i < l; i++) {
			if (!mutators[i].onInit) {
				continue;
			}
			// if the onInit hook returns anything, then it will override the
			// "new" keyword
			tmp = mutators[i].onInit.call(mutators[i], this, klass, args);
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
		tmp = this.init.apply(this, args);
		if (tmp !== undefined) {
			// we can only return objects because the new keyword forces it to
			// be an object
			if (isScalar(tmp)) {
				throw new Error("Return values for the constructor can only be objects.");
			}
			return tmp;
		}
	};

	// ability to create a new instance using an array of arguments, cannot be
	// overriden
	delete methods.$$apply;
	/**
	 * Create a new instance of the class using arguments passed in as an array
	 *
	 * @param {Array} args Array of arguments to construct the object with
	 * @static
	 * @for Classify.Class
	 * @method applicate
	 * @return {Class}
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
	 * @static
	 * @for Classify.Class
	 * @method invoke
	 * @return {Class}
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
	 * @static
	 * @for Classify.Class
	 * @property superclass
	 * @type {Class}
	 */
	klass.$$superclass = parent;
	/**
	 * Array containing a reference to all the children that inherit from this
	 * object
	 *
	 * @static
	 * @for Classify.Class
	 * @property subclass
	 * @type {Array}
	 */
	klass.$$subclass = [];
	/**
	 * Array containing all the objects and classes that this object implements
	 * methods and properties from
	 *
	 * @static
	 * @for Classify.Class
	 * @property implement
	 * @type {Array}
	 */
	klass.$$implement = (isArray(parent.$$implement) ? parent.$$implement : []).concat(implement);
	/**
	 * Array containing all the mutators that were defined with this class,
	 * these mutators DO NOT get inherited
	 *
	 * @static
	 * @for Classify.Class
	 * @property mutators
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
	 * @param {Object[]} [implement] Optional parameter defines where to
	 *            implement traits from
	 * @param {Object} definition The description of the class to be created
	 * @static
	 * @for Classify.Class
	 * @method extend
	 * @return {Class}
	 */
	/**
	 * Creates a new class that is a child of the current class
	 *
	 * @param {Object[]} [implement] Optional parameter defines where to
	 *            implement traits from
	 * @param {Object} definition The description of the class to be created
	 * @for Classify.Class
	 * @method extend
	 * @return {Class}
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
	 * Magic method that can invoke any of the parent methods
	 *
	 * @param {Object} name The name of the parent method to invoke
	 * @param {Array} args The arguments to pass through to invoke
	 * @for Classify.Class
	 * @method invoke
	 * @return {Object}
	 */
	methods.invoke = function(name, args) {
		if (name in parent.prototype && name !== "invoke" && isFunction(parent.prototype[name])) {
			var tmp = this.invoke, ret;
			this.invoke = parent.prototype.invoke;
			ret = parent.prototype[name].apply(this, args || []);
			this.invoke = tmp;
			return ret;
		}
		throw new Error("Function \"" + name + "\" of parent class being invoked is undefined.");
	};
	/**
	 * Adds a new property to the object's prototype of base
	 *
	 * @param {String|Object} name The property name to add or if object is
	 *            passed in then it will iterate through it to add properties
	 * @param {Object} [property] The property to add to the class
	 * @param {String} [prefix=""] Prefix of the property name if any
	 * @static
	 * @for Classify.Class
	 * @method addProperty
	 * @return {Class}
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
	 * @param {String} name The name of the property to remove
	 * @static
	 * @for Classify.Class
	 * @method removeProperty
	 * @return {Class}
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
		if (!mutator.onCreate) {
			return;
		}
		mutator.onCreate.call(mutator, klass, parent);
	});

	// Now extend each of those methods and allow for a parent accessor
	klass.addProperty(methods);
	/**
	 * Reference to the constructor function of this object
	 *
	 * @for Classify.Class
	 * @property constructor
	 * @type {Class}
	 */
	proto.constructor = klass;
	/**
	 * Flag to determine if this object is created by Classify.create
	 *
	 * @static
	 * @for Classify.Class
	 * @property $$isclass
	 * @private
	 * @type {Boolean}
	 */
	klass.$$isclass = true;

	// call each of the onDefine mutators to modify this class
	each(getMutators(klass), function defineMutatorIterator(mutator) {
		if (!mutator.onDefine) {
			return;
		}
		mutator.onDefine.call(mutator, klass);
	});

	return klass;
};

// export methods to the main object
extend(exportNames, {
	// direct access functions
	create : create,
	Mutator : Mutator,
	addMutator : addMutator,
	removeMutator : removeMutator
});
