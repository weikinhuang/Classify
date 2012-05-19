// mutator for adding static properties to a class
addMutator({
	// the special identifier is "__static_"
	name : "static",
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
addMutator({
	// the special identifier is "__nowrap_"
	name : "nowrap",
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
addMutator({
	// the special identifier is "__alias_"
	name : "alias",
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
