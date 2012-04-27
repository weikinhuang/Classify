/*!
 * Classify JavaScript Library v@VERSION
 * http://www.closedinterval.com/
 *
 * Copyright 2011-2012, Wei Kin Huang
 * Classify is freely distributable under the MIT license.
 *
 * Date: @DATE
 */
/**
 * The Main interface function that returns namespaces and creates objects
 *
 * @memberOf Classify
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
var Classify = function() {
	return new Classify.Class();
};
/**
 * The version number of this file
 *
 * @constant
 * @static
 * @memberOf Classify
 * @type String
 */
Classify.version = "";
/**
 * Circular reference to itself
 *
 * @static
 * @memberOf Classify
 * @type {Function}
 */
Classify.Classify = Classify;

/**
 * Placeholder for class descriptors created with the create method
 *
 * @constructor
 * @static
 * @memberOf Classify
 * @type Object
 */
Classify.Class = function() {
};
/**
 * Prototype chain for Classify.Class
 *
 * @memberOf Classify.Class
 * @type {Object}
 */
Classify.Class.prototype = new Object();
/**
 * Reference to the parent that this object extends from
 *
 * @static
 * @memberOf Classify.Class
 * @type {Classify.Class}
 */
Classify.Class.superclass = Classify.Class;

/**
 * Array containing a reference to all the children that inherit from this object
 *
 * @static
 * @memberOf Classify.Class
 * @type {Array}
 */
Classify.Class.subclass = new Array();
/**
 * Array containing all the objects and classes that this object implements methods and properties from
 *
 * @static
 * @memberOf Classify.Class
 * @type {Array}
 */
Classify.Class.implement = new Array();
/**
 * Hashtable containing the definitions of all the observable properties that is implemented by this object
 *
 * @static
 * @memberOf Classify.Class
 * @type {Object}
 */
Classify.Class.observables = new Object();
/**
 * Flag to determine if this object is created by Classify.create
 *
 * @static
 * @memberOf Classify.Class
 * @type {Boolean}
 */
Classify.Class.__isclass_ = true;
/**
 * Default invocation function when the defined class is called without the "new" keyword. The default behavior is to return a new instance of itself
 *
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.invoke = function() {
	return new Classify.Class();
};
/**
 * Create a new instance of the class using arguments passed in as an array
 *
 * @param {Array} args Array of arguments to construct the object with
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.applicate = function(args) {
	return new Classify.Class();
};
/**
 * Adds a new property to the object's prototype of base
 *
 * @param {String|Object} name The property name to add or if object is passed in then it will iterate through it to add properties
 * @param {Object} [property] The property to add to the class
 * @param {String} [prefix=""] Prefix of the property name if any
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.addProperty = function(name, property, prefix) {
	return Classify.Class;
};
/**
 * Removes a property from the object's prototype or base
 *
 * @param {String} name The name of the property to remove
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.removeProperty = function(name) {
	return Classify.Class;
};
/**
 * Adds a static property to the object's base
 *
 * @param {String} name The name of the property to add
 * @param {Object} property The property to store into the object's base
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.addStaticProperty = function(name, property) {
	return Classify.Class;
};
/**
 * Removes a static property from the object's base
 *
 * @param {String} name The name of the property to remove
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.removeStaticProperty = function(name) {
	return Classify.Class;
};
/**
 * Adds a new observable property to the object's prototype
 *
 * @param {String} name The name of the observable property to add
 * @param {Object} property The descriptor of the observable property
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.addObservableProperty = function(name, property) {
	return Classify.Class;
};
/**
 * Removes a observable property to the object's prototype
 *
 * @param {String} name The name of the observable property to remove
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.removeObservableProperty = function(name) {
	return Classify.Class;
};
/**
 * Reference to the constructor function of this object
 *
 * @memberOf Classify.Class
 * @type {Classify.Class}
 */
Classify.Class.prototype.constructor = Classify.Class;
/**
 * Reference to the constructor function of this object
 *
 * @memberOf Classify.Class
 * @type {Classify.Class}
 */
Classify.Class.prototype.self = Classify.Class;
/**
 * True constructor method for this object, will be called when object is called with the "new" keyword
 *
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Class.prototype.init = function() {
	return new Classify.Class();
};
/**
 * Internal reference property for methods that override a parent method, allow for access to the parent version of the function
 *
 * @memberOf Classify.Class
 * @returns {Object}
 * @type {Object}
 */
Classify.Class.prototype.parent = function() {
	return new Object();
};

/**
 * Namespace container that hold a tree of classes
 *
 * @constructor
 * @augments {Classify.Class}
 * @super {Classify.Class}
 * @param {String} name The name of the namespace to construct with
 * @memberOf Classify
 */
Classify.Namespace = function(name) {
};
/**
 * Prototype chain for Classify.Namespace
 *
 * @memberOf Classify.Namespace
 * @type {Classify.Class}
 */
Classify.Namespace.prototype = new Classify.Class();
/**
 * The name of the namespace
 *
 * @memberOf Classify.Namespace
 * @type {String}
 */
Classify.Namespace.prototype.name = "";
/**
 * Hashtable containing references to all the classes created within this namespace
 *
 * @private
 * @memberOf Classify.Namespace
 * @type {Object}
 */
Classify.Namespace.prototype.ref = new Object();
/**
 * Creates a new class within this namespace
 *
 * @param {String} name The name of the created class within the namespace
 * @param {String|Classify.Class} [parent] Optional second parameter defines what object to inherit from, can be a string referencing a class within any
 *            namespace
 * @param {Object[]} [implement] Optional third parameter defines where to implement traits from
 * @param {Object} definition The description of the class to be created
 * @memberOf Classify.Namespace
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Namespace.prototype.create = function(name, parent, implement, definition) {
};
/**
 * Removes a defined class from this namespace and it's children classes
 *
 * @param {String} classname Name of class to remove from this namespace
 * @memberOf Classify.Namespace
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 */
Classify.Namespace.prototype.destroy = function(classname) {
	return new Classify.Namespace();
};
/**
 * Checks if a class exists within this namespace
 *
 * @param {String} classname Name of class to check if it has already been defined
 * @memberOf Classify.Namespace
 * @returns {Boolean}
 * @type {Boolean}
 */
Classify.Namespace.prototype.exists = function(classname) {
	return true;
};
/**
 * Attempt to retrieve a class within this namespace or the global one
 *
 * @param {String} name The name of the class to retrieve
 * @param {Function} [callback] If passed in the first parameter will the found class
 * @memberOf Classify.Namespace
 * @return {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Namespace.prototype.get = function(name, callback) {
	return Classify.Class;
};
/**
 * Default loader function that loads the internal classes from
 *
 * @param {String} name The name of the class to load
 * @param {Function} callback The function to call when the class has loaded
 * @memberOf Classify.Namespace
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 */
Classify.Namespace.prototype.load = function(name, callback) {
	return new Classify.Namespace();
};
/**
 * Sets the internal autoloader by overriding the Classify.Namespace.prototype.load method
 *
 * @param {Function} callback The function to call when a class that doesn't exist needs to be loaded
 * @memberOf Classify.Namespace
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 */
Classify.Namespace.prototype.setAutoloader = function(callback) {
	return new Classify.Namespace();
};
/**
 * Gets the name of this namespace
 *
 * @memberOf Classify.Namespace
 * @type {String}
 */
Classify.Namespace.prototype.getName = function() {
	return "";
};
/**
 * Gets the translated toString name of this object "[namespace Name]"
 *
 * @memberOf Classify.Namespace
 * @type {String}
 */
Classify.Namespace.prototype.toString = function() {
	return "";
};

/**
 * Wrapper object that allows for getter/setter/event listeners of object properties
 *
 * @constructor
 * @augments {Classify.Class}
 * @super {Classify.Class}
 * @param {Object} value The internal value can be either an object or a value
 * @param {Object} value.value The internal value if the parameter was passed in as an object
 * @param {Boolean} [value.writable=true] Marks this object as writable or readonly
 * @param {Function} [value.getter] The internal get modifier
 * @param {Function} [value.setter] The internal set modifier
 * @memberOf Classify
 */
Classify.Observer = function(value) {
};
/**
 * Prototype chain for Classify.Observer
 *
 * @memberOf Classify.Observer
 * @type {Classify.Class}
 */
Classify.Observer.prototype = new Classify.Class();
/**
 * The context that this object is created within
 *
 * @memberOf Classify.Observer
 * @type {Classify.Class}
 */
Classify.Observer.prototype.context = new Classify.Class();
/**
 * The name of the property that this object observes
 *
 * @memberOf Classify.Observer
 * @type {String}
 */
Classify.Observer.prototype.name = "";
/**
 * Flag to check if this property is writable
 *
 * @memberOf Classify.Observer
 * @type {Boolean}
 */
Classify.Observer.prototype.writable = true;
/**
 * The internal value of this object
 *
 * @memberOf Classify.Observer
 * @type {Object}
 */
Classify.Observer.prototype.value = new Object();
/**
 * Array containing all the event listeners for when this value changes
 *
 * @memberOf Classify.Observer
 * @type {Array}
 */
Classify.Observer.prototype.events = new Array();
/**
 * Internal getter method that modifies the internal value being returned by the Classify.Observer.prototype.get method
 *
 * @param {Object} value The internal value of this object
 * @private
 * @memberOf Classify.Observer
 * @returns {Object}
 * @type {Object}
 */
Classify.Observer.prototype.getter = function(value) {
	return new Object();
};
/**
 * Internal setter method that modifies the internal value being set by the Classify.Observer.prototype.set method
 *
 * @param {Object} value The new value that will be set
 * @param {Object} original The original internal value of this object
 * @private
 * @memberOf Classify.Observer
 * @returns {Object}
 * @type {Object}
 */
Classify.Observer.prototype.setter = function(value, original) {
	return new Object();
};
/**
 * Gets the value of the internal property
 *
 * @memberOf Classify.Observer
 * @returns {Object}
 * @type {Object}
 */
Classify.Observer.prototype.get = function() {
	return new Object();
};
/**
 * Sets the value of the internal property
 *
 * @param {Object} value Mixed value to store internally
 * @memberOf Classify.Observer
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Observer.prototype.set = function(value) {
	return new Classify.Class();
};
/**
 * Add an event listener for when the internal value is changed
 *
 * @param {Function} listener The event listener to add
 * @throws Error
 * @memberOf Classify.Observer
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Observer.prototype.addListener = function(listener) {
	return new Classify.Class();
};
/**
 * Remove an event listener from being fired when the internal value is changed
 *
 * @param {Function} listener The event listener to remove
 * @throws Error
 * @memberOf Classify.Observer
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Observer.prototype.removeListener = function(listener) {
	return new Classify.Class();
};
/**
 * Remove all event listeners from this object
 *
 * @memberOf Classify.Observer
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.Observer.prototype.removeAllListeners = function() {
	return new Classify.Class();
};
/**
 * Returns the array of internal listeners
 *
 * @memberOf Classify.Observer
 * @returns {Array}
 * @type {Array}
 */
Classify.Observer.prototype.listeners = function() {
	return new Array();
};
/**
 * Returns the internal value of this object in the scalar form
 *
 * @memberOf Classify.Observer
 * @returns {Boolean|Number|String}
 * @type {Boolean|Number|String}
 */
Classify.Observer.prototype.toValue = function() {
	return new Object();
};
/**
 * Returns the special name of this object
 *
 * @memberOf Classify.Observer
 * @returns {String}
 * @type {String}
 */
Classify.Observer.prototype.toString = function() {
	return "";
};

/**
 * Creates a new Classify class
 *
 * @param {Classify.Class} [parent] Optional first parameter defines what object to inherit from
 * @param {Object[]} [implement] Optional second parameter defines where to implement traits from
 * @param {Object} definition The description of the class to be created
 * @static
 * @memberOf Classify
 * @returns {Classify.Class}
 * @type {Classify.Class}
 */
Classify.create = function(parent, implement, definition) {
	return Classify.Class;
};

/**
 * Retrieves a namespace and creates if it it doesn't already exist
 *
 * @param {String} namespace Dot separated namespace string
 * @static
 * @memberOf Classify
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 */
Classify.getNamespace = function(namespace) {
	return new Classify.Namespace();
};

/**
 * Destroy an existing namespace
 *
 * @param {String} namespace Dot separated namespace string
 * @static
 * @memberOf Classify
 */
Classify.destroyNamespace = function(namespace) {
};

/**
 * Retrieves the first namespace that matches the namespace chain "Ns1.ns2.ns3.ns4"
 *
 * @param {String} namespace Dot separated namespace string
 * @static
 * @memberOf Classify
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 */
Classify.testNamespace = function(namespace) {
	return new Classify.Namespace();
};

/**
 * Retieves the globally named namespace
 *
 * @static
 * @memberOf Classify
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 */
Classify.getGlobalNamespace = function() {
	return new Classify.Namespace();
};

/**
 * Utility function to provide functionality to quickly add properties to objects
 *
 * @param {Object} base The base object to copy properties into
 * @param {Object[]} args Set of objects to copy properties from
 * @static
 * @memberOf Classify
 * @returns {Object}
 * @type {Object}
 */
Classify.extend = function(base, args) {
	return new Object();
};

/**
 * Utility function to provide functionality to allow for name provisioning
 *
 * @param {String} namespace The dot separated namespace tree to create
 * @param {Object} base The object to create the namespace tree within
 * @static
 * @memberOf Classify
 * @returns {Object}
 * @type {Object}
 */
Classify.provide = function(namespace, base) {
};
