// Master inheritance based class system creation
var Create = (function() {
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
	addProperty = function(k, parent, name, property) {
		if (property === objectPrototype[name]) {
			return;
		}
		if (staticRegexp.test(name)) {
			// See if we are defining an static property, if we are, assign it to the class
			k[name.replace(staticRegexp, "")] = isFunction(property) ? store(function() {
				// Force "this" to be a reference to the class itself to simulate "self"
				return property.apply(k, arguments);
			}, property) : property;
		} else {
			var parent_prototype = parent.prototype[name];
			// Else this is not a prefixed static property, so we're assigning it to the prototype
			k.prototype[name] = isFunction(property) && isFunction(parent_prototype) ? store(function() {
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
	// return the function that creates a class
	return function() {
		var parent = base, methods = {}, args = arguments, arg_len = args.length, implement = [];
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
		var k = function() {
			// We're not creating a instantiated object so we want to force a instantiation or call the invoke function
			if (!this._construct_) {
				return k._invoke_.apply(k, arguments);
			}
			this._construct_.apply(this, arguments);
		};
		// Use the defined invoke method if possible, otherwise use the default one
		k._invoke_ = methods._invoke_ || function() {
			var a = arguments, c = function() {
				return k.apply(this, a);
			};
			c.prototype = k.prototype;
			return new c();
		};
		// Remove the invoke method from the prototype chain
		delete methods._invoke_;
		// Keep a list of the inheritance chain
		k.superclass = parent;
		k.subclass = [];
		k.implement = parent.implement.concat(implement);
		// Give this class the ability to create sub classes
		k.Extend = k.prototype.Extend = function(p) {
			return Class(k, p);
		};

		// This method allows for the constructor to not be called when making a new subclass
		var subclass = function() {
		};
		subclass.prototype = parent.prototype;
		var subclass_prototype = subclass.prototype;
		k.prototype = new subclass();
		// Add this class to the list of subclasses of the parent
		parent.subclass.push(k);
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
		k.addProperty = function(name, property) {
			if (property === undefined) {
				each(keys(methods), function(n) {
					addProperty(k, subclass, n, methods[n]);
				});
			} else {
				addProperty(k, subclass, name, property);
			}
			return k;
		};
		// Now implement each of the implemented objects before extending
		if (implement.length !== 0) {
			each(implement, function(impl) {
				var props = impl.__isclass_ ? impl.prototype : impl;
				each(keys(props), function(name) {
					if (k.prototype[name] === undefined && methods[name] === undefined) {
						k.addProperty(name, props[name]);
					}
				});
			});
		}

		// Now extend each of those methods and allow for a parent accessor
		k.addProperty(methods);
		k.prototype.constructor = k;
		k.prototype._self_ = k;
		k.__isclass_ = true;
		return k;
	};
})();