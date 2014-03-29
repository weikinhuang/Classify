/**
 * @module mutator.nowrap
 */
// mutator for adding unwrapped function properties to a class
addMutator("nowrap", {
	priority : 1000,
	// the special identifier is "$$nowrap$$"
	onCreate : function(klass) {
		var mutatorPrefix = this.propPrefix;
		/**
		 * Adds a property to the object's prototype that is not wrapped in the parent method wrapper
		 * @param {string} name The name of the new property
		 * @param {string} property The name of the property to add
		 * @memberOf Classify.Class
		 * @method addUnwrappedProperty
		 * @return {Classify.Class}
		 */
		klass.addUnwrappedProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// unwrapped properties are simply added to the prototype
		objectDefineProperty(klass.prototype, name, property);
	}
});
