// regex for keyword properties
var keywordRegexp = /^(?:superclass|subclass|implement|observable|bindings|extend|prototype|applicate|(?:add|remove)(?:Static|Observable|Aliased|Bound)Property)$/,
// regex to test for a mutator name to avoid a loop
mutatorNameTest = /^__/,
// reference to existing mutators
mutators = {},
// array of mutators that will get called when a class is created
createMutator = [],
// array of mutators that will get called when a property is added to the class
propAddMutator = [],
// array of mutators that will get called when a property is removed from the class
propRemoveMutator = [],
// array of mutators that will get called when a class is instantiated
initMutator = [],
// quick reference to the mutator arrays
refMutator = [ createMutator, propAddMutator, propRemoveMutator, initMutator ],
// Array of mutator methods that correspond to the mutator quick reference
refMutatorOrder = [ "onCreate", "onPropAdd", "onPropRemove", "onInit" ],
// Use native object.create whenever possible
objectCreate = isNativeFunction(Object.create) ? Object.create : function(proto, props) {
//#JSCOVERAGE_IF !Object.create
	// This method allows for the constructor to not be called when making a new subclass
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
base = (function() {
	var fn = function() {
	};
	// Make sure we always have a constructor
	fn.prototype.init = function() {
	};
	fn.superclass = null;
	fn.subclass = [];
	fn.implement = [];
	fn.prototype.constructor = base;
	fn.prototype.self = base;
	fn.__isclass_ = true;
	return fn;
})(),
// wraps a function so that the "this.parent" is bound to the function
wrapParentProperty = function(parentPrototype, property) {
	return store(function() {
		var tmp = this.parent, ret;
		this.parent = parentPrototype;
		ret = property.apply(this, arguments);
		if (tmp === undefined) {
			delete this.parent;
		} else {
			this.parent = tmp;
		}
		return ret;
	}, property);
},
// function to add external mutators to modify the class with certain hooks
addMutator = function(name, mutator) {
	if (mutators[name]) {
		throw new Error("Adding duplicate mutator \"" + name + "\".");
	}
	mutators[name] = mutator;
	mutator.name = name;
	mutator.propTest = new RegExp("^__" + name + "_");
	mutator.propPrefix = "__" + name + "_";
	each(refMutatorOrder, function(v, i) {
		if (mutator[v]) {
			refMutator[i].push(mutator);
		}
	});
},
// function to remove external mutators
removeMutator = function(name) {
	var mutator = mutators[name];
	if (!mutator) {
		throw new Error("Removing unknown mutator.");
	}
	each(refMutatorOrder, function(v, i) {
		if (mutator[v]) {
			// remove the event listener if it exists
			var idx = indexOf(refMutator[i], mutator);
			if (idx > -1) {
				refMutator[i].splice(idx, 1);
			}
		}
	});
	mutators[name] = null;
	try {
		delete mutators[name];
	} catch (e) {
	}
},
// adds a property to an existing class taking into account parent
addProperty = function(klass, parent, name, property) {
	var foundMutator, parent_prototype, self_prototype;
	// we don't want to re-add the core javascript properties, it's redundant
	if (property === objectPrototype[name]) {
		return;
	}

	// check to see if the property needs to be mutated
	if (mutatorNameTest.test(name)) {
		foundMutator = false;
		each(propAddMutator, function(mutator) {
			if (mutator.propTest.test(name)) {
				if (name === mutator.propPrefix) {
					each(property, function(prop, key) {
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
	// else this is not a prefixed static property, so we're assigning it to the prototype
	objectDefineProperty(self_prototype, name, (isFunction(property) && !property.__isclass_ && isFunction(parent_prototype)) ? wrapParentProperty(parent_prototype, property) : property);

	// wrap all child implementation with the parent wrapper
	if (isFunction(property)) {
		each(klass.subclass, function(k) {
			// add only if it's not already wrapped
			if (isFunction(k.prototype[name]) && !k.prototype[name].__original_) {
				objectDefineProperty(k.prototype, name, wrapParentProperty(self_prototype[name], k.prototype[name]));
			}
		});
	}
},
// removes a property from the chain
removeProperty = function(klass, name) {
	var foundMutator = false;
	if (mutatorNameTest.test(name)) {
		each(propRemoveMutator, function(mutator) {
			if (mutator.propTest.test(name)) {
				mutator.onPropRemove.call(mutator, klass, name.replace(mutator.propTest, ""));
				foundMutator = true;
				return false;
			}
		});
		if (foundMutator) {
			return;
		}
	}

	// if we are not removing a function from the prototype chain, then just delete it
	if (!isFunction(klass.prototype[name])) {
		klass.prototype[name] = null;
		try {
			delete klass.prototype[name];
		} catch (e) {
		}
		return;
	}
	// we need to delete the observable property from all children as well as the current class
	each(klass.subclass, function(k) {
		// remove the parent function wrapper for child classes
		if (k.prototype[name] && isFunction(k.prototype[name]) && isFunction(k.prototype[name].__original_)) {
			objectDefineProperty(k.prototype, name, k.prototype[name].__original_);
		}
	});
	klass.prototype[name] = null;
	try {
		delete klass.prototype[name];
	} catch (e) {
	}
};

// Master inheritance based class system creation
var create = function() {
	var parent = base,
	// a hash of methods and properties to be inserted into the new class
	methods = {},
	// array of objects/classes that this class will implement the functions of, but will not be an instance of
	implement = [],
	// quick reference to the arguments array and it's length
	args = arguments, argLength = args.length,
	// other variables
	klass, proto;
	// Parse out the arguments to grab the parent and methods
	if (argLength === 1) {
		methods = args[0];
	} else if (argLength === 2) {
		if (!args[0].__isclass_ && !isExtendable(args[0])) {
			implement = toArray(args[0]);
		} else {
			parent = args[0];
		}
		methods = args[1];
	} else {
		parent = args[0];
		implement = toArray(args[1]);
		methods = args[2];
	}

	// extend so that modifications won't affect the passed in object
	methods = extend({}, methods);

	// extending from an outside object and not passing in a constructor
	if (!parent.__isclass_ && !methods.init) {
		methods.init = parent;
	}
	// Constructor function
	klass = function() {
		var tmp, i, l;
		// We're not creating a instantiated object so we want to force a instantiation or call the invoke function
		// we need to test for !this when in "use strict" mode
		// we need to test for !this.init for quick check if this is a instance or a definition
		// we need to test for !(this instanceof klass) when the class is a property of a instance class (ie. namespace)
		if (!this || !this.init || !(this instanceof klass)) {
			return klass.invoke.apply(klass, arguments);
		}
		// loop through all the mutators for the onInit hook
		for (i = 0, l = initMutator.length; i < l; i++) {
			// if the onInit hook returns anything, then it will override the "new" keyword
			tmp = initMutator[i].onInit.call(initMutator[i], this, klass);
			if (tmp !== undefined) {
				// however this method can only return objects and not scalar values
				if (isScalar(tmp)) {
					throw new Error("Return values during onInit hook can only be objects.");
				}
				return tmp;
			}
		}
		// just in case we want to do anything special like "new" keyword override (usually don't return anything)
		tmp = this.init.apply(this, arguments);
		if (tmp !== undefined) {
			// we can only return objects because the new keyword forces it to be an object
			if (isScalar(tmp)) {
				throw new Error("Return values for the constructor can only be objects.");
			}
			return tmp;
		}
	};
	// ability to create a new instance using an array of arguments, cannot be overriden
	delete methods.applicate;
	klass.applicate = function(a) {
		var TempClass = function() {
			return klass.apply(this, a);
		};
		TempClass.prototype = klass.prototype;
		return new TempClass();
	};
	// Use the defined invoke method if possible, otherwise use the default one
	klass.invoke = methods.invoke || (parent.invoke && isFunction(parent.invoke) && !parent.invoke.__original_ ? parent.invoke : null) || store(function() {
		return klass.applicate(arguments);
	}, true);
	// Remove the invoke method from the prototype chain
	delete methods.invoke;
	// Keep a list of the inheritance chain
	klass.superclass = parent;
	klass.subclass = [];
	klass.implement = (isArray(parent.implement) ? parent.implement : []).concat(implement);

	// assign child prototype to be that of the parent's by default (inheritance)
	proto = klass.prototype = objectCreate(parent.prototype);

	// Give this class the ability to create sub classes
	klass.extend = proto.extend = function() {
		return create.apply(null, [ klass ].concat(argsToArray(arguments)));
	};

	// Add this class to the list of subclasses of the parent
	if (parent.subclass && isArray(parent.subclass)) {
		parent.subclass.push(klass);
	}
	// Create a magic method that can invoke any of the parent methods
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
	// Bind the special add property function
	klass.addProperty = function(name, property, prefix) {
		// the prefix parameter is for internal use only
		prefix = prefix || "";
		if (property === undefined && typeof name !== "string") {
			each(keys(name), function(n) {
				addProperty(klass, parent, prefix + n, name[n]);
			});
		} else {
			addProperty(klass, parent, prefix + name, property);
		}
		return klass;
	};
	// Bind the special remove property function
	klass.removeProperty = function(name) {
		removeProperty(klass, name);
		return klass;
	};

	// Now implement each of the implemented objects before extending
	if (implement.length !== 0) {
		each(implement, function(impl) {
			var props = impl.__isclass_ ? impl.prototype : impl;
			each(keys(props), function(name) {
				if (!hasOwn.call(proto, name) && !hasOwn.call(methods, name)) {
					// copy all the implemented properties to the methods definition object
					methods[name] = props[name];
				}
			});
		});
	}

	// call each of the onCreate mutators to modify this class
	each(createMutator, function(mutator) {
		mutator.onCreate.call(mutator, klass, parent);
	});

	// Now extend each of those methods and allow for a parent accessor
	klass.addProperty(methods);
	proto.constructor = klass;
	proto.self = klass;
	klass.__isclass_ = true;
	return klass;
};
