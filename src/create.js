// regex for testing if property is static
var staticRegexp = /^__static_/,
// create the base object that everything extends from
base = (function() {
	var fn = function() {
	};
	// Make sure we always have a constructor
	fn.prototype._construct_ = function() {
	};
	fn.superclass = null;
	fn.subclass = [];
	fn.implement = [];
	fn.prototype.constructor = base;
	fn.prototype._self_ = base;
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
		var parent_prototype = parent.prototype[name];
		// Else this is not a prefixed static property, so we're assigning it to the prototype
		klass.prototype[name] = isFunction(property) && isFunction(parent_prototype) ? store(function() {
			var tmp = this._parent_, ret;
			this._parent_ = parent_prototype;
			ret = property.apply(this, arguments);
			if (tmp === undefined) {
				delete this._parent_;
			} else {
				this._parent_ = tmp;
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
		if (!this || !this._construct_) {
			return klass._invoke_.apply(klass, arguments);
		}
		// just in case we want to do anything special! (usually don't return anything)
		var tmp = this._construct_.apply(this, arguments);
		if (tmp !== undefined) {
			return tmp;
		}
	};
	// ability to create a new instance using an array of arguments, cannot be overriden
	delete methods._apply_;
	klass._apply_ = function(a) {
		var TempClass = function() {
			return klass.apply(this, a);
		};
		TempClass.prototype = klass.prototype;
		return new TempClass();
	};
	// Use the defined invoke method if possible, otherwise use the default one
	klass._invoke_ = methods._invoke_ || function() {
		return klass._apply_(arguments);
	};
	// Remove the invoke method from the prototype chain
	delete methods._invoke_;
	// Keep a list of the inheritance chain
	klass.superclass = parent;
	klass.subclass = [];
	klass.implement = parent.implement.concat(implement);
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
	parent.subclass.push(klass);
	// Create a magic method that can invoke any of the parent methods
	methods._invoke_ = function(name, args) {
		if (name in subclass_prototype && name !== "_invoke_" && isFunction(subclass_prototype[name])) {
			var tmp = this._invoke_, ret;
			this._invoke_ = subclass_prototype._invoke_;
			ret = subclass_prototype[name].apply(this, args || []);
			this._invoke_ = tmp;
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
	klass.prototype._self_ = klass;
	klass.__isclass_ = true;
	return klass;
};