/**
 * @module mutator.bind
 */
// mutator for adding bound properties to a class
addMutator("bind", {
	priority : 1000,
	// the special identifier is "$$bind$$"
	onCreate : function(klass, parent) {
		var mutatorPrefix = this.propPrefix;
		// re-assign the bindings so that it produces copies across child classes
		/**
		 * Array containing the list of all the bound properties that is wrapped during object initialization
		 * @memberOf Classify.Class
		 * @property bindings
		 * @type {Array}
		 */
		klass.bindings = (parent.bindings || []).slice(0);
		/**
		 * Adds a context bound property to the object's prototype
		 * @param {string} name The name of the property to add
		 * @param {Function} property The property to always bind the object's context with
		 * @memberOf Classify.Class
		 * @method addBoundProperty
		 * @return {Classify.Class}
		 */
		klass.addBoundProperty = function(name, property) {
			return klass.addProperty(name, property, mutatorPrefix);
		};
		/**
		 * Removes a context bound property from the object's base
		 * @param {string} name The name of the property to remove
		 * @memberOf Classify.Class
		 * @method removeBoundProperty
		 * @return {Classify.Class}
		 */
		klass.removeBoundProperty = function(name) {
			return klass.removeProperty(mutatorPrefix + name);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// add to the bindings array only if not already added and is not an definition of a class
		var i = indexOf(klass.bindings, name);
		if (i < 0 && isFunction(property) && !property.$$isclass) {
			// add the property name to the internal bindings array
			klass.bindings.push(name);
		}
		// add the property normally
		return property;
	},
	onPropRemove : function(klass, name) {
		// remove the bindings if it exists
		if (!remove(klass.bindings, name)) {
			return;
		}

		// we need to delete the bound property from all children as well as the current class
		each(klass.$$subclass, function bindPropRemoveIterator(k) {
			if (indexOf(k.bindings, name) > -1 && !hasOwn.call(k.prototype, name)) {
				k.removeBoundProperty(name);
			}
		});
		// remove the property normally
		removeProperty(klass, name);
	},
	onInit : function(instance, klass) {
		var bindings = klass.bindings || null;
		// if there are no bound properties, just continue
		if (bindings === null || bindings.length === 0) {
			return;
		}
		// wrap all prototypes that needs to be bound to the instance
		each(bindings, function bindingsIterator(prop) {
			var method = klass.prototype[prop];
			objectDefineProperty(instance, prop, function() {
				var tmp = instance.$$context, ret;
				/**
				 * Allow access to the calling context when using a bound method
				 *
				 * @memberOf Classify.Class#
				 * @property $$context
				 * @type {Object}
				 */
				instance.$$context = this;
				// then call the original method with the proper context
				ret = method.apply(instance, arguments);
				if (tmp === undefined) {
					delete instance.$$context;
				} else {
					instance.$$context = tmp;
				}
				return ret;
			});
		});
	}
});
