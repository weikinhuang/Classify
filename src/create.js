// regex for testing if property is static
var staticRegexp = /^__static_/,
// regex for testing if property is observable
observableRegexp = /^__observable_/,
// regex for keyword properties
keywordRegexp = /^__static_(?:superclass|subclass|implement|observables|Extend|prototype|subclass|applicate|addProperty|removeProperty|addStaticProperty|addObservableProperty|removeObservableProperty)$/,
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
	fn.observables = {};
	fn.prototype.constructor = base;
	fn.prototype.self = base;
	fn.__isclass_ = true;
	return fn;
})(),
// adds a property to an existing class taking into account parent
addProperty = function(klass, parent, name, property) {
	// we don't want to re-add the core javascript properties, it's redundant
	if (property === objectPrototype[name]) {
		return;
	}
	if (staticRegexp.test(name)) {
		// See if we are defining an static property, if we are, assign it to the class
		klass[name.replace(staticRegexp, "")] = isFunction(property) ? store(function() {
			// Force "this" to be a reference to the class itself to simulate "self"
			return property.apply(klass, arguments);
		}, property) : property;
	} else if (observableRegexp.test(name)) {
		name = name.replace(observableRegexp, "");
		klass.observables[name] = property;
		// we need to delete the observable property from all children as well as the current class
		each(klass.subclass, function(k) {
			// remove it only if it is equal to the parent class
			if (!hasOwn.call(k.observables, name)) {
				k.addObservableProperty(name, property);
			}
		});
	} else {
		var parent_prototype = parent.prototype[name], self_prototype = klass.prototype;
		// Else this is not a prefixed static property, so we're assigning it to the prototype
		self_prototype[name] = isFunction(property) && isFunction(parent_prototype) ? store(function() {
			var tmp = this.parent, ret;
			this.parent = parent_prototype;
			ret = property.apply(this, arguments);
			if (tmp === undefined) {
				delete this.parent;
			} else {
				this.parent = tmp;
			}
			return ret;
		}, property) : property;

		// Wrap all child implementation with the parent wrapper
		if (isFunction(property)) {
			each(klass.subclass, function(k) {
				// add only if it's not already wrapped
				if (isFunction(k.prototype[name]) && !k.prototype[name].__original_) {
					k.prototype[name] = store(function() {
						var tmp = this.parent, ret;
						this.parent = self_prototype;
						ret = property.apply(this, arguments);
						if (tmp === undefined) {
							delete this.parent;
						} else {
							this.parent = tmp;
						}
						return ret;
					}, k.prototype[name]);
				}
			});
		}
	}
},
// removes a property from the chain
removeProperty = function(klass, name) {
	// we don't want to remove the core javascript properties or special properties
	if ((klass[name] && klass[name] === objectPrototype[name]) || keywordRegexp.test(name)) {
		return;
	}
	// See if we are removing an static property, if we are just delete it
	if (staticRegexp.test(name)) {
		name = name.replace(staticRegexp, "");
		klass[name] = null;
		try {
			delete klass[name];
		} catch (e) {
		}
	} else if (observableRegexp.test(name)) {
		name = name.replace(observableRegexp, "");
		var tmp = klass.observables[name];
		// we need to delete the observable property from all children as well as the current class
		each(klass.subclass, function(k) {
			// remove it only if it is equal to the parent class
			if (k.observables[name] === tmp) {
				k.removeObservableProperty(name);
			}
		});
		klass.observables[name] = null;
		try {
			delete klass.observables[name];
		} catch (e) {
		}
	} else {
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
				k.prototype[name] = k.prototype[name].__original_;
			}
		});
		klass.prototype[name] = null;
		try {
			delete klass.prototype[name];
		} catch (e) {
		}
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
	args = arguments, arg_len = args.length;
	// Parse out the arguments to grab the parent and methods
	if (arg_len === 1) {
		methods = args[0];
	} else if (arg_len === 2) {
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
	// extending from an outside object and not passing in a constructor
	if (!parent.__isclass_ && !methods.init) {
		methods.init = parent;
	}
	// Constructor function
	var klass = function() {
		var prop;
		// We're not creating a instantiated object so we want to force a instantiation or call the invoke function
		// we need to test for !this when in "use strict" mode
		// we need to test for !this.init for quick check if this is a instance or a definition
		// we need to test for !(this instanceof klass) when the class is a property of a instance class (ie. namespace)
		if (!this || !this.init || !(this instanceof klass)) {
			return klass.invoke.apply(klass, arguments);
		}
		// initialize the observable properties if any
		for (prop in klass.observables) {
			if (hasOwn.call(klass.observables, prop)) {
				this[prop] = new Observer(this, prop, klass.observables[prop]);
			}
		}
		// just in case we want to do anything special like "new" keyword override (usually don't return anything)
		var tmp = this.init.apply(this, arguments);
		if (tmp !== undefined) {
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
	klass.invoke = methods.invoke || (parent.invoke && !parent.invoke.__original_ ? parent.invoke : null) || store(function() {
		return klass.applicate(arguments);
	}, true);
	// Remove the invoke method from the prototype chain
	delete methods.invoke;
	// Keep a list of the inheritance chain
	klass.superclass = parent;
	klass.subclass = [];
	klass.implement = (parent.implement || []).concat(implement);
	klass.observables = extend({}, parent.observables);
	// Give this class the ability to create sub classes
	klass.Extend = klass.prototype.Extend = function(p) {
		return create(klass, p);
	};

	// This method allows for the constructor to not be called when making a new subclass
	var SubClass = function() {
	};
	SubClass.prototype = parent.prototype;
	var subclass_prototype = SubClass.prototype;
	klass.prototype = new SubClass();
	// Add this class to the list of subclasses of the parent
	parent.subclass && parent.subclass.push(klass);
	// Create a magic method that can invoke any of the parent methods
	methods.invoke = function(name, args) {
		if (name in subclass_prototype && name !== "invoke" && isFunction(subclass_prototype[name])) {
			var tmp = this.invoke, ret;
			this.invoke = subclass_prototype.invoke;
			ret = subclass_prototype[name].apply(this, args || []);
			this.invoke = tmp;
			return ret;
		}
		throw new Error("Function \"" + name + "\" of parent class being invoked is undefined.");
	};
	// Bind the special add property function
	klass.addProperty = function(name, property, prefix) {
		// the prefix parameter is for internal use only
		prefix = prefix || "";
		if (property === undefined) {
			each(keys(name), function(n) {
				addProperty(klass, SubClass, prefix + n, name[n]);
			});
		} else {
			addProperty(klass, SubClass, prefix + name, property);
		}
		return klass;
	};
	// Bind the special remove property function
	klass.removeProperty = function(name) {
		removeProperty(klass, name);
		return klass;
	};
	// shortcut methods for adding and removing special properties
	klass.addStaticProperty = function(name, property) {
		return klass.addProperty(name, property, "__static_");
	};
	klass.removeStaticProperty = function(name, property) {
		return klass.removeProperty("__static_" + name);
	};
	klass.addObservableProperty = function(name, property) {
		return klass.addProperty(name, property, "__observable_");
	};
	klass.removeObservableProperty = function(name) {
		return klass.removeProperty("__observable_" + name);
	};
	// Now implement each of the implemented objects before extending
	if (implement.length !== 0) {
		each(implement, function(impl) {
			var props = impl.__isclass_ ? impl.prototype : impl;
			each(keys(props), function(name) {
				if (klass.prototype[name] === undefined && methods[name] === undefined) {
					klass.addProperty(name, props[name]);
				}
			});
		});
	}

	// Now extend each of those methods and allow for a parent accessor
	klass.addProperty(methods);
	klass.prototype.constructor = klass;
	klass.prototype.self = klass;
	klass.__isclass_ = true;
	return klass;
};
