/*!
 * Classify JavaScript Library v0.3.5
 * http://www.closedinterval.com/
 *
 * Copyright 2011, Wei Kin Huang
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Fri Jul 22 19:26:57 EDT 2011
 */
(function( root, undefined ) {
	"use strict";
// shortcut for minification compaction
var prototype = "prototype",
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
objectPrototype = Object[prototype],
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
		// only add buggy enumerated values if it's not the Object[prototype]'s
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
	return Array[prototype].slice.call(o, 0);
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
};// regex for testing if property is static
var staticRegexp = /^__static_/,
// create the base object that everything extends from
base = (function() {
	var fn = function() {
	};
	// Make sure we always have a constructor
	fn[prototype].init = function() {
	};
	fn.superclass = null;
	fn.subclass = [];
	fn.implement = [];
	fn[prototype].constructor = base;
	fn[prototype].self = base;
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
	} else {
		var parent_prototype = parent[prototype][name];
		// Else this is not a prefixed static property, so we're assigning it to the prototype
		klass[prototype][name] = isFunction(property) && isFunction(parent_prototype) ? store(function() {
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
		if (!args[0].__isclass_) {
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
	// Constructor function
	var klass = function() {
		// We're not creating a instantiated object so we want to force a instantiation or call the invoke function
		// we need to test for !this when in "use strict" mode
		if (!this || !this.init) {
			return klass.invoke.apply(klass, arguments);
		}
		// just in case we want to do anything special! (usually don't return anything)
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
		TempClass[prototype] = klass[prototype];
		return new TempClass();
	};
	// Use the defined invoke method if possible, otherwise use the default one
	klass.invoke = methods.invoke || function() {
		return klass.applicate(arguments);
	};
	// Remove the invoke method from the prototype chain
	delete methods.invoke;
	// Keep a list of the inheritance chain
	klass.superclass = parent;
	klass.subclass = [];
	klass.implement = parent.implement.concat(implement);
	// Give this class the ability to create sub classes
	klass.Extend = klass[prototype].Extend = function(p) {
		return create(klass, p);
	};

	// This method allows for the constructor to not be called when making a new subclass
	var SubClass = function() {
	};
	SubClass[prototype] = parent[prototype];
	var subclass_prototype = SubClass[prototype];
	klass[prototype] = new SubClass();
	// Add this class to the list of subclasses of the parent
	parent.subclass.push(klass);
	// Create a magic method that can invoke any of the parent methods
	methods.invoke = function(name, args) {
		if (name in subclass_prototype && name !== "invoke" && isFunction(subclass_prototype[name])) {
			var tmp = this.invoke, ret;
			this.invoke = subclass_prototype.invoke;
			ret = subclass_prototype[name].apply(this, args || []);
			this.invoke = tmp;
			return ret;
		}
		throw "Function \"" + name + "\" of parent class being invoked is undefined.";
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
	klass.addStaticProperty = function(name, property) {
		return klass.addProperty(name, property, "__static_");
	};
	// Now implement each of the implemented objects before extending
	if (implement.length !== 0) {
		each(implement, function(impl) {
			var props = impl.__isclass_ ? impl[prototype] : impl;
			each(keys(props), function(name) {
				if (klass[prototype][name] === undefined && methods[name] === undefined) {
					klass.addProperty(name, props[name]);
				}
			});
		});
	}

	// Now extend each of those methods and allow for a parent accessor
	klass.addProperty(methods);
	klass[prototype].constructor = klass;
	klass[prototype].self = klass;
	klass.__isclass_ = true;
	return klass;
};// global container containing all the namespace references
var namespaces = {},
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
dereference = function(base, arg) {
	// Allow parent classes to be passed in as a string for lookup
	if (typeof arg === "string") {
		if (!base[arg]) {
			throw "Invalid parent class specified.";
		}
		return base[arg];
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
				return this;
			}
			ref = ref[ns];
		});
		// delete the reference only if we can find it
		if (!ref) {
			return this;
		}
		// create a quick reference
		c = ref[name];
		// recursively remove all inherited classes
		each(c.subclass, function(v) {
			self.destroy(v._namespace_);
		});
		// TODO: we also need to delete the reference to this object from the parent!
		c.superclass.subclass = filter(c.superclass.subclass, c);
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
		// otherwise just return the class if it is already avaliable
		return this.ref[name] || null;
	},
	load : function(name, callback) {
		callback && callback(this.ref[name] || null);
	},
	setAutoloader : function(callback) {
		// make sure the callback is a function
		if (!isFunction(callback)) {
			return this;
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
var getNamespace = function(namespace) {
	// if passed in object is already a namespace, just return it
	if (namespace instanceof Namespace) {
		return namespace;
	}
	// if the namespace doesn't exist, just create it
	if (!namespaces[namespace]) {
		namespaces[namespace] = new Namespace(namespace);
	}
	return namespaces[namespace];
};

// remove a namespace
var destroyNamespace = function(namespace) {
	// TODO: more advanced cleanup
	delete namespaces[namespace];
};

// gets the first valid existing namespace
var testNamespace = function(namespace) {
	var ns = namespace.split("."), l = ns.length, tmp;
	while ((tmp = ns.slice(0, l--).join(".")) !== "") {
		if (namespaces[tmp]) {
			return namespaces[tmp];
		}
	}
	return null;
};// Create a wrapped reference to the Classify object.
var Classify = create({
	invoke : function() {
		var args = argsToArray(arguments), ns, length = args.length;
		// if the first parameter is a string
		if (typeof args[0] === "string") {
			// and there is only 1 arguments, then we just want the namespace
			if (length === 1) {
				return getNamespace(args[0]);
			}
			// if we passed in 2 arguments of strings then we want a class within a namespace
			if (length === 2 && typeof args[1] === "string") {
				return getNamespace(args[0]).ref[args[1]];
			}
			// otherwise we will assume the first parameter is the namespace and the others are creation parameters
			ns = getNamespace(args.shift());
			return ns.create.apply(ns, args);
		}
		return create.apply(null, args);
	},
	init : function() {
		var args = argsToArray(arguments), params = args.pop(), tmp;
		if (args.length < 1) {
			throw "Classify object cannot be instantiated!";
		}
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
Classify.create = create;
Classify.getNamespace = getNamespace;
Classify.destroyNamespace = destroyNamespace;
Classify.testNamespace = testNamespace;

// Export the Classify object for **CommonJS**, with backwards-compatibility for the
// old "require()" API. If we're not in CommonJS, add "Classify" to the global object.
if (typeof module !== "undefined" && module.exports) {
	module.exports = Classify;
	// create a circular reference
	Classify.Classify = Classify;
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
