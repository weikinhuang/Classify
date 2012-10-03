// mutator for adding aliased function properties to a class
addMutator("alias", {
	// the special identifier is "__alias_"
	onCreate : function(klass) {
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
