/**
 * @module mutator.bind
 */
// mutator for adding bound properties to a class
addMutator("bind", {
	// the special identifier is "__bind_"
	onCreate : function(klass, parent) {
		var mutator = this;
		// re-assign the bindings so that it produces copies across child classes
		/**
		 * Array containing the list of all the bound properties that is wrapped during object initialization
		 * @static
		 * @for Classify.Class
		 * @property bindings
		 * @type {Array}
		 */
		klass.bindings = (parent.bindings || []).slice(0);
		/**
		 * Adds a context bound property to the object's prototype
		 * @param {String} name The name of the property to add
		 * @param {Function} property The property to always bind the object's context with
		 * @static
		 * @for Classify.Class
		 * @method addBoundProperty
		 * @return {Class}
		 */
		klass.addBoundProperty = function(name, property) {
			return klass.addProperty(name, property, mutator.propPrefix);
		};
		/**
		 * Removes a context bound property from the object's base
		 * @param {String} name The name of the property to remove
		 * @static
		 * @for Classify.Class
		 * @method removeBoundProperty
		 * @return {Class}
		 */
		klass.removeBoundProperty = function(name) {
			return klass.removeProperty(mutator.propPrefix + name);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// add to the bindings array only if not already added and is not an definition of a class
		var i = indexOf(klass.bindings, name);
		if (i < 0 && isFunction(property) && !property.__isclass_) {
			// add the property name to the internal bindings array
			klass.bindings.push(name);
		}
		// add the property normally
		addProperty(klass, parent, name, property);
	},
	onPropRemove : function(klass, name) {
		// remove the bindings if it exists
		var i = indexOf(klass.bindings, name);
		if (i < 0) {
			return;
		}
		klass.bindings.splice(i, 1);

		// we need to delete the bound property from all children as well as the current class
		each(klass.subclass, function(k) {
			if (indexOf(k.bindings, name) > -1 && !hasOwn.call(k.prototype, name)) {
				k.removeBoundProperty(name);
			}
		});
		// remove the property normally
		removeProperty(klass, name);
	},
	onInit : function(instance, klass) {
		var bindings = klass.bindings || null;
		// if there are no observable properties, just continue
		if (bindings === null || bindings.length === 0) {
			return;
		}
		// wrap all prototypes that needs to be bound to the instance
		each(bindings, function(prop) {
			objectDefineProperty(instance, prop, function() {
				// convert the arguments to an array
				var args = argsToArray(arguments);
				// so we can push the context in as the first argument
				args.unshift(this);
				// then call the original method with the proper context
				return klass.prototype[prop].apply(instance, args);
			});
		});
	}
});
