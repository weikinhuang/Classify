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
		var original = this.value, context = this.context;
		// if this is not writable then we can't do anything
		if (!this.writable) {
			return context;
		}
		// setter method is called for return value to set if specified
		this.value = this.setter ? this.setter.call(context, value, original) : value;
		// only fire event listeners if the value has changed
		if (this.value !== original) {
			// emit the change event
			this.emit();
		}
		return context;
	},
	emit : function() {
		var self = this, args = argsToArray(arguments);
		if (this.delay > 0) {
			if (this._debounce !== null) {
				root.clearTimeout(this._debounce);
			}
			this._debounce = root.setTimeout(function() {
				self._debounce = null;
				self._triggerEmit(args);
			}, this.delay);
		} else {
			this._triggerEmit(args);
		}
		return this.context;
	},
	_triggerEmit : function(args) {
		var i = 0, l = this.events.length, context = this.context, events = this.events;
		args.unshift(this.value);
		// fire off all event listeners in the order they were added
		for (; i < l; ++i) {
			events[i].apply(context, args);
		}
	},
	addListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error("Observer.addListener only takes instances of Function");
		}
		// add the event to the queue
		this.events[this.events.length] = listener;
		return this.context;
	},
	once : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error("Observer.once only takes instances of Function");
		}
		var self = this, temp = function() {
			self.removeListener(temp);
			listener.apply(this, arguments);
		};
		temp.listener = listener;
		this.addListener(temp);
		return this.context;
	},
	removeListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error("Observer.removeListener only takes instances of Function");
		}
		// remove the event listener if it exists
		var context = this.context, events = this.events, index = -1, i = 0, length = events.length;

		for (; i < length; ++i) {
			if (events[i] === listener || (events[i].listener && events[i].listener === listener)) {
				index = i;
				break;
			}
		}
		if (index < 0) {
			return context;
		}
		events.splice(i, 1);
		return context;
	},
	removeAllListeners : function() {
		// garbage collection
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

// alias "on" to addListener
Observer.prototype.on = Observer.prototype.addListener;
