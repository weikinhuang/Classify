/**
 * @module mutator.nowrap
 */
// mutator for adding unwrapped function properties to a class
addMutator("nowrap", {
	// the special identifier is "__nowrap_"
	onCreate : function(klass) {
		var mutatorPrefix = this.propPrefix;
		/**
		 * Adds a property to the object's prototype that is not wrapped in the parent method wrapper
		 * @param {String} name The name of the new property
		 * @param {String} property The name of the property to add
		 * @static
		 * @for Classify.Class
		 * @method addUnwrappedProperty
		 * @return {Class}
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
