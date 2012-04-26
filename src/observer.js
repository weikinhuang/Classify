// Observer class that handles an abstraction layer to the 
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
		// if an object is passed in as value, the break it up into it's parts
		if (value !== null && typeof value === "object") {
			this.getter = isFunction(value.get) ? value.get : null;
			this.setter = isFunction(value.set) ? value.set : null;
			this.value = value.value;
			this.writable = typeof value.writable === "boolean" ? value.writable : true;
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
		var i = 0, l = this.events.length, original = this.value;
		// if this is not writable then we can't do anything
		if (!this.writable) {
			return this.context;
		}
		// setter method is called for return value to set if specified
		this.value = this.setter ? this.setter.call(this.context, value, original) : value;
		// fire off all event listeners in the order they were added
		for (; i < l; i++) {
			this.events[i].call(this.context, value, original);
		}
		return this.context;
	},
	addListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error('addListener only takes instances of Function');
		}
		// add the event to the queue
		this.events.push(listener);
		return this.context;
	},
	removeListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error('removeListener only takes instances of Function');
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
