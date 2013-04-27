/**
 * @module namespace
 */
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
	return !isArray(arg) ? arg : map(arg, function(prop) {
		return dereference(ns, prop);
	});
};

// Namespacing class to create and handle namespaces
var Namespace = create({
	/**
	 * The name of the namespace
	 * @private
	 * @for Classify.Namespace
	 * @property name
	 * @type {String}
	 */
	name : null,
	/**
	 * Hashtable containing references to all the classes created within this namespace
	 * @private
	 * @for Classify.Namespace
	 * @property ref
	 * @type {Object}
	 */
	ref : null,
	/**
	 * Namespace container that hold a tree of classes
	 *
	 * @constructor
	 * @for Classify.Namespace
	 * @extends {Class}
	 * @param {String} name The name of the namespace to construct with
	 * @method Namespace
	 */
	init : function(name) {
		this.name = name;
		this.ref = {};
	},
	/**
	 * Creates a new class within this namespace
	 *
	 * @param {String} name The name of the created class within the namespace
	 * @param {String|Class} [parent] Optional second parameter defines what object to inherit from, can be a string referencing a class within any namespace
	 * @param {Object[]} [implement] Optional third parameter defines where to implement traits from
	 * @param {Object} definition The description of the class to be created
	 * @for Classify.Namespace
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

		// fix the arguments & create the class
		c = create.apply(null, map(args, function(v) {
			return dereference(self, v);
		}));
		// Assign the magic properties of the class's name and namespace
		c._name_ = name;
		c._namespace_ = fullname;
		// fix the issue with the extends function referencing string classes
		c.extend = c.prototype.extend = function() {
			return create.apply(null, [ c ].concat(map(arguments, function(v) {
				return dereference(self, v);
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
		self.ref[fullname] = c;
		// Return the new class
		return c;
	},
	/**
	 * Removes a defined class from this namespace and it's children classes
	 *
	 * @param {String} classname Name of class to remove from this namespace
	 * @for Classify.Namespace
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
	/**
	 * Checks if a class exists within this namespace
	 *
	 * @param {String} classname Name of class to check if it has already been defined
	 * @for Classify.Namespace
	 * @method exists
	 * @return {Boolean}
	 */
	exists : function(classname) {
		return !!this.ref[classname];
	},
	/**
	 * Attempt to retrieve a class within this namespace or the global one
	 *
	 * @param {String} name The name of the class to retrieve
	 * @for Classify.Namespace
	 * @method get
	 * @return {Class}
	 */
	get : function(name) {
		var tmp;
		// already defined, return it
		if (this.ref[name]) {
			return this.ref[name];
		}
		// use the autoloader if defined
		tmp = this.load(name);
		// return if loaded
		if (tmp !== null) {
			return tmp;
		}
		// reach into the global namespace
		if (this.name !== global_namespace) {
			return getGlobalNamespace().get(name);
		}
		// no class found
		return null;
	},
	load : function(name) {
		return this.ref[name] || null;
	},
	/**
	 * Sets the internal autoloader by overriding the Namespace.prototype.load method
	 *
	 * @param {Function} callback The function to call when a class that doesn't exist needs to be loaded
	 * @for Classify.Namespace
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
	 * @for Classify.Namespace
	 * @method getName
	 * @return {String}
	 */
	getName : function() {
		return this.name;
	},
	/**
	 * Gets the translated toString name of this object "[namespace Name]"
	 *
	 * @for Classify.Namespace
	 * @method toString
	 * @return {String}
	 */
	toString : function() {
		return "[namespace " + this.name + "]";
	}
});

/**
 * Retrieves a namespace and creates if it it doesn't already exist
 * @param {String} namespace Dot separated namespace string
 * @static
 * @for Classify
 * @method getNamespace
 * @return {Namespace}
 */
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

/**
 * Destroy an existing namespace
 * @param {String} namespace Dot separated namespace string
 * @static
 * @for Classify
 * @method destroyNamespace
 */
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

/**
 * Retrieves the first namespace that matches the namespace chain "Ns1.ns2.ns3.ns4"
 * @param {String} namespace Dot separated namespace string
 * @static
 * @for Classify
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
 * @static
 * @for Classify
 * @method getGlobalNamespace
 * @return {Namespace}
 */
getGlobalNamespace = function() {
	return getNamespace(global_namespace);
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
	 * @static
	 * @for Classify
	 * @property global
	 * @type {Namespace}
	 */
	global : getGlobalNamespace(),

	// utility function to provide functionality to allow for name provisioning
	provide : function(namespace, base) {
		return provide(namespace.split("."), base || root || {});
	}
});
