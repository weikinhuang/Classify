// Observer class that handles an abstraction layer to class properties (getter and setter methods)
var Observer = create({
	init : function(context, name, value) {
		// an Observer can only be instantiated with an instance of an object
		if (!context) {
			throw new Error("Cannot create Observer without class context.");
		}
		// set internal context
		this.context = context;
		// the name of the property
		this.name = name;
		// array of event listeners to watch for the set call
		this.events = [];
		// flag to check that this observer is writable
		this.writable = true;
		// flag to check if we need to debounce the event listener
		this.delay = 0;
		// flag to the debounce timer
		this._debounce = null;
		// if an object is passed in as value, the break it up into it's parts
		if (value !== null && typeof value === "object") {
			this.getter = isFunction(value.get) ? value.get : null;
			this.setter = isFunction(value.set) ? value.set : null;
			this.value = value.value;
			this.writable = typeof value.writable === "boolean" ? value.writable : true;
			this.delay = typeof value.delay === "number" ? value.delay : 0;
		} else {
			// otherwise only the value is passed in
			this.value = value;
		}
	},
	get : function() {
		// getter method is called for return value if specified
		return this.getter ? this.getter.call(this.context, this.value) : this.value;
	},
	set : function(value) {
		var original = this.value;
		// if this is not writable then we can't do anything
		if (!this.writable) {
			return this.context;
		}
		// setter method is called for return value to set if specified
		this.value = this.setter ? this.setter.call(this.context, value, original) : value;
		// only fire event listeners if the value has changed
		if (this.value !== original) {
			// emit the change event
			this.emit();
		}
		return this.context;
	},
	emit : function() {
		var self = this;
		if (this.delay > 0) {
			if (this._debounce !== null) {
				root.clearTimeout(this._debounce);
			}
			this._debounce = root.setTimeout(function() {
				this._debounce = null;
				self.triggerEmit();
			}, this.delay);
		} else {
			this.triggerEmit();
		}
		return this.context;
	},
	triggerEmit : function() {
		var i = 0, l = this.events.length;
		// fire off all event listeners in the order they were added
		for (; i < l; i++) {
			this.events[i].call(this.context, this.value);
		}
	},
	addListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error("Observer.addListener only takes instances of Function");
		}
		// add the event to the queue
		this.events.push(listener);
		return this.context;
	},
	removeListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error("Observer.removeListener only takes instances of Function");
		}
		// remove the event listener if it exists
		var i = indexOf(this.events, listener);
		if (i < 0) {
			return this.context;
		}
		this.events.splice(i, 1);
		return this.context;
	},
	removeAllListeners : function() {
		// garbage cleanup
		this.events = null;
		// reset the internal events array
		this.events = [];
		return this.context;
	},
	listeners : function() {
		// gets the list of all the listeners
		return this.events;
	},
	toValue : function() {
		// gets the scalar value of the internal property
		return this.value && this.value.toValue ? this.value.toValue() : this.value;
	},
	toString : function() {
		// overriden toString function to say this is an instance of an observer
		return "[observer " + this.name + "]";
	}
});

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
