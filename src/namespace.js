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
