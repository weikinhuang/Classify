/**
 * @module mutator.static
 */
// mutator for adding static properties to a class
addMutator("static", {
	priority : 1000,
	// the special identifier is "$$static$$"
	onCreate : function(klass) {
		var mutatorPrefix = this.propPrefix;
		/**
		 * Adds a static property to the object's base
		 * @param {string} name The name of the property to add
		 * @param {Object} property The property to store into the object's base
		 * @memberOf Classify.Class
		 * @method addStaticProperty
		 * @return {Classify.Class}
		 */
		klass.addStaticProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
		/**
		 * Removes a static property from the object's base
		 * @param {string} name The name of the property to remove
		 * @memberOf Classify.Class
		 * @method removeStaticProperty
		 * @return {Classify.Class}
		 */
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
		objectDefineProperty(klass, name, (isFunction(property) && !property.$$isclass) ? store(function() {
			// Force "this" to be a reference to the class itself to simulate "self"
			return property.apply(klass, arguments);
		}, property) : property);
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
