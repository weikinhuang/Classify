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
