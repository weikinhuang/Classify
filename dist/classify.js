/*!
 * Classify JavaScript Library v0.9.7
 * http://www.closedinterval.com/
 *
 * Copyright 2011-2012, Wei Kin Huang
 * Classify is freely distributable under the MIT license.
 *
 * Date: Sun, 20 May 2012 16:36:12 GMT
 */
(function( root, undefined ) {
	"use strict";
// shortcut for minification compaction
var prototype = "prototype",
// For IE, check if looping through objects works with toString & valueOf
isEnumerationBuggy = !({
	toString : 1
}).propertyIsEnumerable("toString"),
// gets the enumerated keys if necessary (bug in older ie < 9)
enumeratedKeys = isEnumerationBuggy ? "hasOwnProperty,valueOf,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,constructor".split(",") : [],
// quick reference to the enumerated items length
enumerationLength = enumeratedKeys.length,
// quick reference to object prototype
objectPrototype = Object.prototype,
// quick reference to the toString prototype
toString = objectPrototype.toString,
// quick reference to the toString prototype
hasOwn = objectPrototype.hasOwnProperty,
// test if object is a function
isFunction = function(o) {
	return typeof o === "function";
},
// test if object is extendable
isExtendable = function(o) {
	return o && o.prototype && toString.call(o) === "[object Function]";
},
// quick test for isArray
isArray = Array.isArray || function(o) {
	return toString.call(o) === "[object Array]";
},
// quickly be able to get all the keys of an object
keys = function(o) {
	var k = [], i;
	for (i in o) {
		k.push(i);
	}
	if (isEnumerationBuggy) {
		// only add buggy enumerated values if it's not the Object.prototype's
		for (i = 0; i < enumerationLength; i++) {
			if (o.hasOwnProperty(enumeratedKeys[i])) {
				k.push(enumeratedKeys[i]);
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
	return array.indexOf(item);
} : function(array, item) {
	var i = 0, length = array.length;
	for (; i < length; i++) {
		if (array[i] === item) {
			return i;
		}
	}
	return -1;
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
},
// simple extension function that takes into account the enumerated keys
extend = function() {
	var args = argsToArray(arguments), base = args.shift();
	each(args, function(extens) {
		each(keys(extens), function(k) {
			base[k] = extens[k];
		});
	});
	return base;
};
// regex for keyword properties
var keywordRegexp = /^(?:superclass|subclass|implement|observable|bindings|extend|prototype|applicate|(?:add|remove)(?:Static|Observable|Aliased|Bound)Property)$/,
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
	// we don't want to re-add the core javascript properties, it's redundant
	if (property === objectPrototype[name]) {
		return;
	}

	var foundMutator = false;
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

	var parent_prototype = parent.prototype[name], self_prototype = klass.prototype;
	// Else this is not a prefixed static property, so we're assigning it to the prototype
	self_prototype[name] = (isFunction(property) && !property.__isclass_ && isFunction(parent_prototype)) ? wrapParentProperty(parent_prototype, property) : property;

	// Wrap all child implementation with the parent wrapper
	if (isFunction(property)) {
		each(klass.subclass, function(k) {
			// add only if it's not already wrapped
			if (isFunction(k.prototype[name]) && !k.prototype[name].__original_) {
				k.prototype[name] = wrapParentProperty(self_prototype[name], k.prototype[name]);
			}
		});
	}
},
// removes a property from the chain
removeProperty = function(klass, name) {
	var foundMutator = false;
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
		var tmp, i, l;
		// We're not creating a instantiated object so we want to force a instantiation or call the invoke function
		// we need to test for !this when in "use strict" mode
		// we need to test for !this.init for quick check if this is a instance or a definition
		// we need to test for !(this instanceof klass) when the class is a property of a instance class (ie. namespace)
		if (!this || !this.init || !(this instanceof klass)) {
			return klass.invoke.apply(klass, arguments);
		}
		for (i = 0, l = initMutator.length; i < l; i++) {
			initMutator[i].onInit.call(initMutator[i], this, klass);
		}
		// just in case we want to do anything special like "new" keyword override (usually don't return anything)
		tmp = this.init.apply(this, arguments);
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
	// Give this class the ability to create sub classes
	klass.extend = klass.prototype.extend = function() {
		return create.apply(null, [ klass ].concat(argsToArray(arguments)));
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

	// call each of the onCreate mutators to modify this class
	each(createMutator, function(mutator) {
		mutator.onCreate.call(mutator, klass, parent);
	});

	// Now extend each of those methods and allow for a parent accessor
	klass.addProperty(methods);
	klass.prototype.constructor = klass;
	klass.prototype.self = klass;
	klass.__isclass_ = true;
	return klass;
};
// mutator for adding static properties to a class
addMutator("static", {
	// the special identifier is "__static_"
	onCreate : function(klass, parent) {
		var mutatorPrefix = this.propPrefix;
		// shortcut method for adding static properties
		klass.addStaticProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
		// shortcut method for removing static properties
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
		klass[name] = (isFunction(property) && !property.__isclass_) ? store(function() {
			// Force "this" to be a reference to the class itself to simulate "self"
			return property.apply(klass, arguments);
		}, property) : property;
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
// mutator for adding unwrapped function properties to a class
addMutator("nowrap", {
	// the special identifier is "__nowrap_"
	onCreate : function(klass, parent) {
		var mutatorPrefix = this.propPrefix;
		// shortcut method for adding unwrapped properties
		klass.addUnwrappedProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// unwrapped properties are simply added to the prototype
		klass.prototype[name] = property;
	}
});
// mutator for adding aliased function properties to a class
addMutator("alias", {
	// the special identifier is "__alias_"
	onCreate : function(klass, parent) {
		var mutatorPrefix = this.propPrefix;
		// shortcut method for adding aliased properties
		klass.addAliasedProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// alias properties are simply function wrappers
		addProperty(klass, parent, name, function() {
			return this[property].apply(this, arguments);
		});
	}
});
// mutator for adding bound properties to a class
addMutator("bind", {
	// the special identifier is "__bind_"
	onCreate : function(klass, parent) {
		var mutator = this;
		// re-assign the bindings so that it produces copies across child classes
		klass.bindings = (parent.bindings || []).slice(0);
		// shortcut method for adding observable properties
		klass.addBoundProperty = function(name, property) {
			return klass.addProperty(name, property, mutator.propPrefix);
		};
		// shortcut method for removing observable properties
		klass.removeBoundProperty = function(name) {
			return klass.removeProperty(mutator.propPrefix + name);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// add to the bindings array only if not already added and is not an definition of a class
		var i = indexOf(klass.bindings, name);
		if (i < 0 && isFunction(property) && !property.__isclass_) {
			// add the property name to the internal bindings array
			klass.bindings.push(name);
		}
		// add the property normally
		addProperty(klass, parent, name, property);
	},
	onPropRemove : function(klass, name) {
		// remove the bindings if it exists
		var i = indexOf(klass.bindings, name);
		if (i < 0) {
			return;
		}
		klass.bindings.splice(i, 1);

		// we need to delete the bound property from all children as well as the current class
		each(klass.subclass, function(k) {
			if (indexOf(k.bindings, name) > -1 && !k.prototype.hasOwnProperty(name)) {
				k.removeBoundProperty(name);
			}
		});
		// remove the property normally
		removeProperty(klass, name);
	},
	onInit : function(instance, klass) {
		var bindings = klass.bindings || null;
		// if there are no observable properties, just continue
		if (bindings === null || bindings.length === 0) {
			return;
		}
		// wrap all prototypes that needs to be bound to the instance
		each(bindings, function(prop) {
			instance[prop] = function() {
				return klass.prototype[prop].apply(instance, arguments);
			};
		});
	}
});
// Observer class that handles an abstraction layer to class properties (getter and setter methods)
var Observer = create({
	init : function(context, name, value) {
		// an Observer can only be instantiated with an instance of an object
		if (!context) {
			throw new Error("Cannot create Observer without class context.");
		}
		// set internal context
		this.context = context;
		// the name of the property
		this.name = name;
		// array of event listeners to watch for the set call
		this.events = [];
		// flag to check that this observer is writable
		this.writable = true;
		// flag to check if we need to debounce the event listener
		this.delay = 0;
		// flag to the debounce timer
		this._debounce = null;
		// if an object is passed in as value, the break it up into it's parts
		if (value !== null && typeof value === "object") {
			this.getter = isFunction(value.get) ? value.get : null;
			this.setter = isFunction(value.set) ? value.set : null;
			this.value = value.value;
			this.writable = typeof value.writable === "boolean" ? value.writable : true;
			this.delay = typeof value.delay === "number" ? value.delay : 0;
		} else {
			// otherwise only the value is passed in
			this.value = value;
		}
	},
	get : function() {
		// getter method is called for return value if specified
		return this.getter ? this.getter.call(this.context, this.value) : this.value;
	},
	set : function(value) {
		var original = this.value;
		// if this is not writable then we can't do anything
		if (!this.writable) {
			return this.context;
		}
		// setter method is called for return value to set if specified
		this.value = this.setter ? this.setter.call(this.context, value, original) : value;
		// only fire event listeners if the value has changed
		if (this.value !== original) {
			// emit the change event
			this.emit();
		}
		return this.context;
	},
	emit : function() {
		var self = this;
		if (this.delay > 0) {
			if (this._debounce !== null) {
				root.clearTimeout(this._debounce);
			}
			this._debounce = root.setTimeout(function() {
				this._debounce = null;
				self.triggerEmit();
			}, this.delay);
		} else {
			this.triggerEmit();
		}
		return this.context;
	},
	triggerEmit : function() {
		var i = 0, l = this.events.length;
		// fire off all event listeners in the order they were added
		for (; i < l; i++) {
			this.events[i].call(this.context, this.value);
		}
	},
	addListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error("Observer.addListener only takes instances of Function");
		}
		// add the event to the queue
		this.events.push(listener);
		return this.context;
	},
	removeListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error("Observer.removeListener only takes instances of Function");
		}
		// remove the event listener if it exists
		var i = indexOf(this.events, listener);
		if (i < 0) {
			return this.context;
		}
		this.events.splice(i, 1);
		return this.context;
	},
	removeAllListeners : function() {
		// garbage cleanup
		this.events = null;
		// reset the internal events array
		this.events = [];
		return this.context;
	},
	listeners : function() {
		// gets the list of all the listeners
		return this.events;
	},
	toValue : function() {
		// gets the scalar value of the internal property
		return this.value && this.value.toValue ? this.value.toValue() : this.value;
	},
	toString : function() {
		// overriden toString function to say this is an instance of an observer
		return "[observer " + this.name + "]";
	}
});
// mutator for adding observable properties to a class
addMutator("observable", {
	// the special identifier is "__observable_"
	onCreate : function(klass, parent) {
		var mutator = this;
		// re-assign the observable so that it produces copies across child classes
		klass.observable = extend({}, parent.observable || {});
		// shortcut method for adding observable properties
		klass.addObservableProperty = function(name, property) {
			return klass.addProperty(name, property, mutator.propPrefix);
		};
		// shortcut method for removing observable properties
		klass.removeObservableProperty = function(name) {
			return klass.removeProperty(mutator.propPrefix + name);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// add the observable to the internal observable array
		klass.observable[name] = property;
		// we need to add the observable property from all children as well as the current class
		each(klass.subclass, function(k) {
			// add it only if it is not redefined in the child classes
			if (!hasOwn.call(k.observable, name)) {
				k.addObservableProperty(name, property);
			}
		});
	},
	onPropRemove : function(klass, name) {
		// keep a reference to the current observable property
		var tmp = klass.observable[name];
		// we need to delete the observable property from all children as well as the current class
		each(klass.subclass, function(k) {
			// remove it only if it is equal to the parent class
			if (k.observable[name] === tmp) {
				k.removeObservableProperty(name);
			}
		});
		// garbage collection
		klass.observable[name] = null;
		// then try to remove the property
		try {
			delete klass.observable[name];
		} catch (e) {
		}
	},
	onInit : function(instance, klass) {
		var prop, observables = klass.observable || null;
		// if there are no observable properties, just continue
		if (observables === null) {
			return;
		}
		// initialize the observable properties if any
		for (prop in observables) {
			if (hasOwn.call(observables, prop)) {
				instance[prop] = new Observer(instance, prop, observables[prop]);
			}
		}
	}
});
// global container containing all the namespace references
var namespaces = {},
// name of the globally avaliable namespace
global_namespace = "GLOBAL",
// early definition for namespacing function
getNamespace, destroyNamespace, testNamespace, getGlobalNamespace,
// create a function that create namespaces in an object
provide = function(namespace, base) {
	// Drill down the namespace array
	each(namespace, function(ns) {
		if (!base[ns]) {
			base[ns] = {};
		}
		base = base[ns];
	});
	return base;
},
// ability to de-reference string into it's classes
dereference = function(base, arg, ref) {
	// Allow parent classes to be passed in as a string for lookup
	if (typeof arg === "string") {
		ref = base[arg] || getGlobalNamespace().get(arg) || null;
		if (!ref) {
			throw new Error("Invalid parent class [" + arg + "] specified.");
		}
		return ref;
	}
	// if we have an object, then that's what we want, otherwise arrays
	// we need to loop through and convert them to the proper objects
	return !isArray(arg) ? arg : map(arg, function(prop) {
		return dereference(base, prop);
	});
};

// Namespacing class to create and handle namespaces
var Namespace = create({
	init : function(name) {
		this.ref = {};
		this.name = name;
	},
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
		// Create a reference to the master classes array
		deref = self.ref,

		// fix the arguments & create the class
		c = create.apply(null, map(args, function(v) {
			return dereference(deref, v);
		}));
		// Assign the magic properties of the class's name and namespace
		c._name_ = name;
		c._namespace_ = fullname;
		// fix the issue with the extends function referencing string classes
		c.extend = c.prototype.extend = function() {
			return create.apply(null, [ c ].concat(map(arguments, function(v) {
				return dereference(deref, v);
			})));
		};
		// give classes the ability to always store the namespace for chaining
		c.getNamespace = function() {
			return self;
		};
		c.toString = function() {
			return "[object " + fullname + "]";
		};
		// Assign the classes to the namespaced references
		ref[name] = c;
		deref[fullname] = c;
		// Return the new class
		return c;
	},
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
		deref = this.ref;

		// remove it from this namespace
		each(namespace, function(ns) {
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
		each(c.subclass, function(v) {
			self.destroy(v._namespace_);
		});
		// we also need to delete the reference to this object from the parent!
		if (c.superclass.subclass) {
			c.superclass.subclass = filter(c.superclass.subclass, c);
		}
		// now we remove all non inherited classes, but fall under this namespace
		each(deref, function(v, k) {
			if (k !== classname && k.indexOf(classname) === 0) {
				self.destroy(v._namespace_);
			}
		});
		// let's remove it from this object!
		delete ref[name];
		// let's remove the textual reference to this class as well
		delete deref[classname];
		// return this for chaining
		return this;
	},
	exists : function(classname) {
		return !!this.ref[classname];
	},
	get : function(name, callback) {
		// ability to load a class async if a callback is passed in
		if (isFunction(callback)) {
			if (this.ref[name]) {
				callback(this.ref[name]);
			} else {
				this.load(name, callback);
			}
			return this;
		}
		// otherwise just return the class if it is already avaliable or reach into the global namespace
		return this.ref[name] || (this.name !== global_namespace && getGlobalNamespace().get(name)) || null;
	},
	load : function(name, callback) {
		callback && callback(this.ref[name] || null);
		return this;
	},
	setAutoloader : function(callback) {
		// make sure the callback is a function
		if (!isFunction(callback)) {
			throw new Error("Namespace.setAutoloader only takes instances of Function");
		}
		this.load = callback;
		return this;
	},
	getName : function() {
		return this.name;
	},
	toString : function() {
		return "[namespace " + this.name + "]";
	}
});

// get a namespace
getNamespace = function(namespace) {
	// if passed in object is already a namespace, just return it
	if (namespace instanceof Namespace) {
		return namespace;
	}
	// if we passed in nothing then we want the global namespace
	namespace = namespace || global_namespace;
	// if the namespace doesn't exist, just create it
	if (!namespaces[namespace]) {
		namespaces[namespace] = new Namespace(namespace);
	}
	return namespaces[namespace];
};

// remove a namespace
destroyNamespace = function(namespace) {
	// if namespace passed in, get the name out of it
	if (namespace instanceof Namespace) {
		namespace = namespace.name;
	}
	// can't destroy the global namespace
	if (namespace === global_namespace) {
		return;
	}
	// TODO: more advanced cleanup
	delete namespaces[namespace];
};

// gets the first valid existing namespace
testNamespace = function(namespace) {
	var ns = namespace.split("."), l = ns.length, tmp;
	while ((tmp = ns.slice(0, l--).join(".")) !== "") {
		if (namespaces[tmp]) {
			return namespaces[tmp];
		}
	}
	return null;
};

// get the globally available namespace
getGlobalNamespace = function() {
	return getNamespace(global_namespace);
};// quick reference to the seperator string
var namespace_separator = "/",
// Create a wrapped reference to the Classify object.
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
				tmp = args[0].split(namespace_separator);
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
			tmp = args.shift().split(namespace_separator);
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
	init : function() {
		var args = argsToArray(arguments), params, tmp;
		if (args.length < 1) {
			throw new Error("Classify object cannot be instantiated!");
		}
		params = isArray(args[args.length - 1]) ? args.pop() : [];
		tmp = Classify.invoke.apply(null, args);
		// if we found a class, instantiate it
		if (tmp.__isclass_) {
			return tmp.applicate(params);
		}
		// otherwise, just return it
		return tmp;
	}
});

// store clean references to these methods
extend(Classify, {
	// object version number
	version : "0.9.7",

	// direct access functions
	create : create,
	Namespace : Namespace,
	getNamespace : getNamespace,
	destroyNamespace : destroyNamespace,
	testNamespace : testNamespace,
	getGlobalNamespace : getGlobalNamespace,
	Observer : Observer,
	addMutator : addMutator,
	removeMutator : removeMutator,

	// utility function to provide functionality to quickly add properties to objects
	extend : extend,
	// utility function to provide functionality to allow for name provisioning
	provide : function(namespace, base) {
		return provide(namespace.split("."), base || root || {});
	}
});

// Export the Classify object for **CommonJS**, with backwards-compatibility for the
// old "require()" API. If we're not in CommonJS, add "Classify" to the global object.
if (typeof root.module !== "undefined" && root.module.exports) {
	root.module.exports = Classify;
	// create a circular reference
	Classify.Classify = Classify;
} else if (typeof root.define === "function" && root.define.amd) {
	// Export Classify as an AMD module only if there is a AMD module loader,
	// use lowercase classify, because AMD modules are usually loaded with filenames
	// and Classify would usually be loaded with lowercase classify.js
	root.define("classify", function() {
		return Classify;
	});
} else {
	// store previous value of root.Classify
	var root_value = root.Classify;

	// otherwise attempt to make a global reference
	root.Classify = Classify;

	// Run Classify.js in "noConflict" mode, returning the "Classify" variable to its
	// previous value. Returns a reference to the Classify object.
	Classify.noConflict = function() {
		if (root_value === undefined) {
			delete root.Classify;
		} else {
			root.Classify = root_value;
		}
		return Classify;
	};
}
// Establish the root object, "window" in the browser, or "global" on the server.
})(this);
