// global container containing all the namespace references
var namespaces = {},
// crete a function that create namespaces in an object
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
	return !isArray(arg) ? arg : map(arg, function(prop) {
		return dereference(base, prop);
	});
};

// Namespacing class to create and handle namespaces
var Namespace = Create({
	_construct_ : function(name) {
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
		// Create a reference to the master classes array
		ref = provide(namespace, this),
		// Quick referece to this.ref
		deref = this.ref,

		// fix the arguments & Create the class
		c = Create.apply(null, map(args, function(v) {
			return dereference(deref, v);
		}));
		// Assign the magic properties of the class's name and namespace
		c._name_ = name;
		c._namespace_ = fullname;
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
		var c, parts = classname.split("."), name = parts.pop(), base = this, parent_reference = null;
		// remove it from this namespace
		each(namespace, function(ns) {
			// if it doesn't go that far, then forget deleting it
			if (!base[ns]) {
				base = null;
				return false;
			}
			base = base[ns];
		});
		// delete the reference if we can find it
		if (base) {
			// TODO: we also need to delete the reference to this object from the parent!
			parent_reference = base[name].superclass.subclass;
			// let's remove it from this object!
			delete base[name];
		}
		// remove it from the named reference array, and all children associated with it,
		// we're assuming all namespaced items are extensions of this base
		for (c in this.ref) {
			if (c.indexOf(classname) === 0) {
				delete this.ref[c];
			}
		}
		return this;
	},
	exists : function(classname) {
		return !!this.ref[classname];
	},
	get : function(name) {
		// TODO: be able to override this function to provide better autoloading and such
		return this.ref[name] || null;
	},
	getName : function() {
		return this.name;
	}
});

// get a namespace
var getNamespace = function(namespace) {
	if (!namespaces[namespace]) {
		namespaces[namespace] = new Namespace(namespace);
	}
	return namespaces[namespace];
};

// remove a namespace
var destroyNamespace = function(namespace) {
	delete namespaces[namespace];
};