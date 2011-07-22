// global container containing all the namespace references
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
		// TODO: be able to override this function to provide autoloading and such
		callback && callback(this.ref[name] || null);
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