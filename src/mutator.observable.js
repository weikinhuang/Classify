// mutator for adding observable properties to a class
addMutator({
	// the special identifier is "__observable_"
	name : "observable",
	onCreate : function(klass, parent) {
		var mutator = this;
		// re-assign the observable so that it produces copies across child classes
		klass.observable = extend({}, parent.observable || {});
		// shortcut method for adding observable properties
		klass.addObservableProperty = function(name, property) {
			return klass.addProperty(name, property, mutator.propPrefix);
		};
		// shortcut method for removing observable properties
		klass.removeObservableProperty = function(name) {
			return klass.removeProperty(mutator.propPrefix + name);
		};
	},
	onPropAdd : function(klass, parent, name, property) {
		// add the observable to the internal observable array
		klass.observable[name] = property;
		// we need to add the observable property from all children as well as the current class
		each(klass.subclass, function(k) {
			// add it only if it is not redefined in the child classes
			if (!hasOwn.call(k.observable, name)) {
				k.addObservableProperty(name, property);
			}
		});
	},
	onPropRemove : function(klass, name) {
		// keep a reference to the current observable property
		var tmp = klass.observable[name];
		// we need to delete the observable property from all children as well as the current class
		each(klass.subclass, function(k) {
			// remove it only if it is equal to the parent class
			if (k.observable[name] === tmp) {
				k.removeObservableProperty(name);
			}
		});
		// garbage collection
		klass.observable[name] = null;
		// then try to remove the property
		try {
			delete klass.observable[name];
		} catch (e) {
		}
	},
	onInit : function(instance, klass) {
		var prop, observables = klass.observable || null;
		// if there are no observable properties, just continue
		if (observables === null) {
			return;
		}
		// initialize the observable properties if any
		for (prop in observables) {
			if (hasOwn.call(observables, prop)) {
				instance[prop] = new Observer(instance, prop, observables[prop]);
			}
		}
	}
});
