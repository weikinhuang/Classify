/**
 * @module observer
 */
// Observer class that handles an abstraction layer to class properties (getter and setter methods)
var Observer = create({
	/**
	 * The context that this object is created within
	 * @for Classify.Observer
	 * @property context
	 * @type {Class}
	 */
	context : null,
	/**
	 * The name of the property that this object observes
	 * @for Classify.Observer
	 * @property name
	 * @type {String}
	 */
	name : null,
	/**
	 * Array containing all the event listeners for when this value changes
	 * @for Classify.Observer
	 * @property events
	 * @type {Array}
	 */
	events : null,
	/**
	 * Flag to check if this property is writable
	 * @for Classify.Observer
	 * @property writable
	 * @type {Boolean}
	 */
	writable : null,
	/**
	 * Number of seconds to delay the event emitter, 0 will disable delays
	 * @for Classify.Observer
	 * @property delay
	 * @type {Number}
	 */
	delay : null,
	/**
	 * Flag to hold the delay timer
	 * @private
	 * @for Classify.Observer
	 * @property _debounce
	 * @type {Number}
	 */
	_debounce : null,
	/**
	 * The internal value of this object
	 * @for Classify.Observer
	 * @property value
	 * @type {Object}
	 */
	value : null,
	/**
	 * Internal getter method that modifies the internal value being returned by
	 * the Classify.Observer.prototype.get method
	 * @param {Object} value The internal value of this object
	 * @private
	 * @for Classify.Observer
	 * @method getter
	 * @return {Object}
	 */
	getter : null,
	/**
	 * Internal setter method that modifies the internal value being set by
	 * the Classify.Observer.prototype.set method
	 * @param {Object} value The new value that will be set
	 * @param {Object} original The original internal value of this object
	 * @private
	 * @for Classify.Observer
	 * @method setter
	 * @return {Object}
	 */
	setter : null,
	/**
	 * Wrapper object that allows for getter/setter/event listeners of object properties
	 * @constructor
	 * @for Classify.Observer
	 * @extends {Class}
	 * @param {Object} value The internal value can be either an object or a value
	 * @param {Object} value.value The internal value if the parameter was passed in as an object
	 * @param {Boolean} [value.writable=true] Marks this object as writable or readonly
	 * @param {Number} [value.delay=0] Only fire the event emitter after a delay of value.delay ms
	 * @param {Function} [value.getter] The internal get modifier
	 * @param {Function} [value.setter] The internal set modifier
	 */
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
	/**
	 * Gets the value of the internal property
	 * @for Classify.Observer
	 * @method get
	 * @return {Object}
	 */
	get : function() {
		// getter method is called for return value if specified
		return this.getter ? this.getter.call(this.context, this.value) : this.value;
	},
	/**
	 * Sets the value of the internal property
	 * @param {Object} value Mixed value to store internally
	 * @for Classify.Observer
	 * @method set
	 * @return {Class}
	 */
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
	/**
	 * Starts the timers to call the registered event listeners
	 * @for Classify.Observer
	 * @method emit
	 * @return {Class}
	 */
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
	/**
	 * Fires the event listeners in the order they were added
	 * @param {Array} args Array of arguments to pass to the bound event listeners
	 * @private
	 * @for Classify.Observer
	 * @method _triggerEmit
	 */
	_triggerEmit : function(args) {
		var i = 0, l = this.events.length, context = this.context, events = this.events;
		args.unshift(this.value);
		// fire off all event listeners in the order they were added
		for (; i < l; ++i) {
			events[i].apply(context, args);
		}
	},
	/**
	 * Add an event listener for when the internal value is changed
	 * @param {Function} listener The event listener to add
	 * @throws Error
	 * @for Classify.Observer
	 * @method addListener
	 * @return {Class}
	 */
	addListener : function(listener) {
		// event listeners can only be functions
		if (!isFunction(listener)) {
			throw new Error("Observer.addListener only takes instances of Function");
		}
		// add the event to the queue
		this.events[this.events.length] = listener;
		return this.context;
	},
	/**
	 * Add an event listener to be called only once when the internal value is changed
	 * @param {Function} listener The event listener to add
	 * @throws Error
	 * @for Classify.Observer
	 * @method once
	 * @return {Class}
	 */
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
	/**
	 * Remove an event listener from being fired when the internal value is changed
	 * @param {Function} listener The event listener to remove
	 * @throws Error
	 * @for Classify.Observer
	 * @method removeListener
	 * @return {Class}
	 */
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
	/**
	 * Remove all event listeners from this object
	 * @for Classify.Observer
	 * @method removeAllListeners
	 * @return {Class}
	 */
	removeAllListeners : function() {
		// garbage collection
		this.events = null;
		// reset the internal events array
		this.events = [];
		return this.context;
	},
	/**
	 * Returns the array of internal listeners
	 * @for Classify.Observer
	 * @method listeners
	 * @return {Array}
	 */
	listeners : function() {
		// gets the list of all the listeners
		return this.events;
	},
	/**
	 * Returns the internal value of this object in the scalar form
	 * @for Classify.Observer
	 * @method toValue
	 * @return {Boolean|Number|String}
	 */
	toValue : function() {
		// gets the scalar value of the internal property
		return this.value && this.value.toValue ? this.value.toValue() : this.value;
	},
	/**
	 * Returns the special name of this object
	 * @for Classify.Observer
	 * @method toString
	 * @return {String}
	 */
	toString : function() {
		// overriden toString function to say this is an instance of an observer
		return "[observer " + this.name + "]";
	}
});

// alias "on" to addListener
/**
 * Add an event listener for when the internal value is changed, alias to addListener
 *
 * @param {Function} listener The event listener to add
 * @throws Error
 * @see Classify.Observer.prototype.addListener
 * @for Classify.Observer
 * @method on
 * @return {Class}
 */
Observer.prototype.on = Observer.prototype.addListener;

// export methods to the main object
exportNames.Observer = Observer;
