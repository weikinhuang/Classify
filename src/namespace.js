// global container containing all the namespace references
var namespaces = {},
// crete a function that create namespaces in an object
provide = function(namespace, base) {
	// Drill down the namespace array
	Each(namespace, function(ns) {
		if (!base[ns]) {
			base[ns] = {};
		}
		base = base[ns];
	});
	return base;
};

// Namespacing class to create and handle namespaces
var Namespace = Create({
	ref : null,
	name : "",
	_construct_ : function(name) {
		this.ref = {};
		this.name = name;
	},
	create : function() {

	},
	destroy : function(classname) {
		var c, parts = classname.split("."), name = parts.pop(), base = this, parent_reference = null;
		// remove it from this namespace
		Each(namespace, function(ns) {
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

// make this avaliable globally
Classify.getNamespace = getNamespace;