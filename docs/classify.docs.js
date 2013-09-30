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
 * @refexample summary-base
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
 * @refexample Classify.version
 */
Classify.version = "";
/**
 * Circular reference to itself
 *
 * @static
 * @memberOf Classify
 * @type {Function}
 * @refexample Classify.Classify
 */
Classify.Classify = Classify;

/**
 * Placeholder for class descriptors created with the create method
 *
 * @constructor
 * @static
 * @memberOf Classify
 * @type Object
 * @refexample Classify.Class
 */
Classify.Class = function() {
};
/**
 * Prototype chain for Classify.Class
 *
 * @memberOf Classify.Class
 * @type {Object}
 * @refexample Classify.Class.prototype
 */
Classify.Class.prototype = new Object();
/**
 * Reference to the parent that this object extends from
 *
 * @static
 * @memberOf Classify.Class
 * @type {Classify.Class}
 * @refexample Classify.Class.$$superclass
 */
Classify.Class.$$superclass = Classify.Class;

/**
 * Array containing a reference to all the children that inherit from this object
 *
 * @static
 * @memberOf Classify.Class
 * @type {Array}
 * @refexample Classify.Class.$$subclass
 */
Classify.Class.$$subclass = new Array();
/**
 * Array containing all the objects and classes that this object implements methods and properties from
 *
 * @static
 * @memberOf Classify.Class
 * @type {Array}
 * @refexample Classify.Class.$$implement
 */
Classify.Class.$$implement = new Array();
/**
 * Array containing the list of all the bound properties that is wrapped during object initialization
 *
 * @static
 * @memberOf Classify.Class
 * @type {Array}
 * @refexample Classify.Class.bindings
 */
Classify.Class.bindings = new Array();
/**
 * Flag to determine if this object is created by Classify.create
 *
 * @static
 * @memberOf Classify.Class
 * @type {Boolean}
 * @refexample Classify.Class.$$isclass
 */
Classify.Class.$$isclass = true;
/**
 * Default invocation function when the defined class is called without the "new" keyword. The default behavior is to return a new instance of itself
 *
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.invoke
 */
Classify.Class.invoke = function() {
	return new Classify.Class();
};
/**
 * Create a new instance of the class using arguments passed in as an array
 *
 * @param {Array}
 *            args Array of arguments to construct the object with
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.$$apply
 */
Classify.Class.$$apply = function(args) {
	return new Classify.Class();
};
/**
 * Creates a new class that is a child of the current class
 *
 * @param {Object[]}
 *            [implement] Optional parameter defines where to implement traits from
 * @param {Object}
 *            definition The description of the class to be created
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.extend
 */
Classify.Class.extend = function(implement, definition) {
	return Classify.Class;
};
/**
 * Adds a new property to the object's prototype of base
 *
 * @param {String|Object}
 *            name The property name to add or if object is passed in then it will iterate through it to add properties
 * @param {Object}
 *            [property] The property to add to the class
 * @param {String}
 *            [prefix=""] Prefix of the property name if any
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.addProperty
 */
Classify.Class.addProperty = function(name, property, prefix) {
	return Classify.Class;
};
/**
 * Removes a property from the object's prototype or base
 *
 * @param {String}
 *            name The name of the property to remove
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.removeProperty
 */
Classify.Class.removeProperty = function(name) {
	return Classify.Class;
};
/**
 * Adds a static property to the object's base
 *
 * @param {String}
 *            name The name of the property to add
 * @param {Object}
 *            property The property to store into the object's base
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.addStaticProperty
 */
Classify.Class.addStaticProperty = function(name, property) {
	return Classify.Class;
};
/**
 * Removes a static property from the object's base
 *
 * @param {String}
 *            name The name of the property to remove
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.removeStaticProperty
 */
Classify.Class.removeStaticProperty = function(name) {
	return Classify.Class;
};
/**
 * Adds a context bound property to the object's prototype
 *
 * @param {String}
 *            name The name of the property to add
 * @param {Function}
 *            property The property to always bind the object's context with
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.addBoundProperty
 */
Classify.Class.addBoundProperty = function(name, property) {
	return Classify.Class;
};
/**
 * Removes a context bound property from the object's base
 *
 * @param {String}
 *            name The name of the property to remove
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.removeBoundProperty
 */
Classify.Class.removeBoundProperty = function(name) {
	return Classify.Class;
};
/**
 * Adds a aliased property to the object's prototype based on a existing prototype method
 *
 * @param {String}
 *            name The name of the alias for the new property
 * @param {String}
 *            property The name of the property alias
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.addAliasedProperty
 */
Classify.Class.addAliasedProperty = function(name, property) {
	return Classify.Class;
};
/**
 * Adds a property to the object's prototype that is not wrapped in the parent method wrapper
 *
 * @param {String}
 *            name The name of the new property
 * @param {String}
 *            property The name of the property to add
 * @static
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.addUnwrappedProperty
 */
Classify.Class.addUnwrappedProperty = function(name, property) {
	return Classify.Class;
};
/**
 * Reference to the constructor function of this object
 *
 * @memberOf Classify.Class
 * @type {Classify.Class}
 * @refexample Classify.Class.prototype.constructor
 */
Classify.Class.prototype.constructor = Classify.Class;
/**
 * True constructor method for this object, will be called when object is called with the "new" keyword
 *
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.prototype.init
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
 * @refexample Classify.Class.prototype.$$parent
 */
Classify.Class.prototype.$$parent = function() {
	return new Object();
};
/**
 * Allow access to the calling context when using a bound method
 *
 * @memberOf Classify.Class
 * @for Classify.Class
 * @property $$context
 * @type {Object}
 * @refexample Classify.Class.prototype.$$context
 */
Classify.Class.prototype.$$context = new Object();
/**
 * Creates a new class that is a child of the current class
 *
 * @param {Object[]}
 *            [implement] Optional parameter defines where to implement traits from
 * @param {Object}
 *            definition The description of the class to be created
 * @memberOf Classify.Class
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Class.prototype.extend
 */
Classify.Class.prototype.extend = function(implement, definition) {
	return Classify.Class;
};
/**
 * Magic method that can invoke any of the parent methods
 *
 * @param {Object}
 *            name The name of the parent method to invoke
 * @param {Array}
 *            args The arguments to pass through to invoke
 * @memberOf Classify.Class
 * @returns {Object}
 * @type {Object}
 * @refexample Classify.Class.prototype.invoke
 */
Classify.Class.prototype.invoke = function(name, args) {
	return new Object();
};

/**
 * Namespace container that hold a tree of classes
 *
 * @constructor
 * @augments {Classify.Class}
 * @super {Classify.Class}
 * @param {String}
 *            name The name of the namespace to construct with
 * @memberOf Classify
 * @refexample Classify.Namespace
 */
Classify.Namespace = function(name) {
};
/**
 * Prototype chain for Classify.Namespace
 *
 * @memberOf Classify.Namespace
 * @type {Classify.Class}
 * @refexample Classify.Namespace.prototype
 */
Classify.Namespace.prototype = new Classify.Class();
/**
 * The name of the namespace
 *
 * @memberOf Classify.Namespace
 * @type {String}
 * @refexample Classify.Namespace.prototype.name
 */
Classify.Namespace.prototype.name = "";
/**
 * Hashtable containing references to all the classes created within this namespace
 *
 * @private
 * @memberOf Classify.Namespace
 * @type {Object}
 * @refexample Classify.Namespace.prototype.ref
 */
Classify.Namespace.prototype.ref = new Object();
/**
 * Creates a new class within this namespace
 *
 * @param {String}
 *            name The name of the created class within the namespace
 * @param {String|Classify.Class}
 *            [parent] Optional second parameter defines what object to inherit from, can be a string referencing a class within any namespace
 * @param {Object[]}
 *            [implement] Optional third parameter defines where to implement traits from
 * @param {Object}
 *            definition The description of the class to be created
 * @memberOf Classify.Namespace
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Namespace.prototype.create
 */
Classify.Namespace.prototype.create = function(name, parent, implement, definition) {
};
/**
 * Removes a defined class from this namespace and it's children classes
 *
 * @param {String}
 *            classname Name of class to remove from this namespace
 * @memberOf Classify.Namespace
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 * @refexample Classify.Namespace.prototype.destroy
 */
Classify.Namespace.prototype.destroy = function(classname) {
	return new Classify.Namespace();
};
/**
 * Checks if a class exists within this namespace
 *
 * @param {String}
 *            classname Name of class to check if it has already been defined
 * @memberOf Classify.Namespace
 * @returns {Boolean}
 * @type {Boolean}
 * @refexample Classify.Namespace.prototype.exists
 */
Classify.Namespace.prototype.exists = function(classname) {
	return true;
};
/**
 * Attempt to retrieve a class within this namespace or the global one
 *
 * @param {String}
 *            name The name of the class to retrieve
 * @memberOf Classify.Namespace
 * @return {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.Namespace.prototype.get
 */
Classify.Namespace.prototype.get = function(name) {
	return Classify.Class;
};
/**
 * Default loader function that loads the internal classes from
 *
 * @param {String}
 *            name The name of the class to load
 * @memberOf Classify.Namespace
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 * @refexample Classify.Namespace.prototype.load
 */
Classify.Namespace.prototype.load = function(name) {
	return new Classify.Namespace();
};
/**
 * Sets the internal autoloader by overriding the Classify.Namespace.prototype.load method
 *
 * @param {Function}
 *            callback The function to call when a class that doesn't exist needs to be loaded
 * @memberOf Classify.Namespace
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 * @refexample Classify.Namespace.prototype.setAutoloader
 */
Classify.Namespace.prototype.setAutoloader = function(callback) {
	return new Classify.Namespace();
};
/**
 * Gets the name of this namespace
 *
 * @memberOf Classify.Namespace
 * @type {String}
 * @refexample Classify.Namespace.prototype.getName
 */
Classify.Namespace.prototype.getName = function() {
	return "";
};
/**
 * Gets the translated toString name of this object "[namespace Name]"
 *
 * @memberOf Classify.Namespace
 * @type {String}
 * @refexample Classify.Namespace.prototype.toString
 */
Classify.Namespace.prototype.toString = function() {
	return "";
};

/**
 * Creates a new Classify class
 *
 * @param {Classify.Class}
 *            [parent] Optional first parameter defines what object to inherit from
 * @param {Object[]}
 *            [implement] Optional second parameter defines where to implement traits from
 * @param {Object}
 *            definition The description of the class to be created
 * @static
 * @memberOf Classify
 * @returns {Classify.Class}
 * @type {Classify.Class}
 * @refexample Classify.create
 */
Classify.create = function(parent, implement, definition) {
	return Classify.Class;
};

/**
 * Retrieves a namespace and creates if it it doesn't already exist
 *
 * @param {String}
 *            namespace Dot separated namespace string
 * @static
 * @memberOf Classify
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 * @refexample Classify.getNamespace
 */
Classify.getNamespace = function(namespace) {
	return new Classify.Namespace();
};

/**
 * Destroy an existing namespace
 *
 * @param {String}
 *            namespace Dot separated namespace string
 * @static
 * @memberOf Classify
 * @refexample Classify.destroyNamespace
 */
Classify.destroyNamespace = function(namespace) {
};

/**
 * Retrieves the first namespace that matches the namespace chain "Ns1.ns2.ns3.ns4"
 *
 * @param {String}
 *            namespace Dot separated namespace string
 * @static
 * @memberOf Classify
 * @returns {Classify.Namespace}
 * @type {Classify.Namespace}
 * @refexample Classify.testNamespace
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
 * @refexample Classify.getGlobalNamespace
 */
Classify.getGlobalNamespace = function() {
	return new Classify.Namespace();
};

/**
 * The globally named namespace
 *
 * @static
 * @memberOf Classify
 * @type {Classify.Namespace}
 * @refexample Classify.global
 */
Classify.global = new Classify.Namespace();

/**
 * Adds a global class mutator that modifies the defined classes at different points with hooks
 *
 * @param {String}
 *            name The name of the mutator reference to add
 * @param {Object}
 *            mutator The mutator definition with optional hooks
 * @param {Function}
 *            [mutator.onCreate] The hook to be called when a class is defined
 * @param {Function}
 *            [mutator.onPropAdd] The hook to be called when a property with the $$name$$ prefix is added
 * @param {Function}
 *            [mutator.onPropRemove] The hook to be called when a property with the $$name$$ prefix is removed
 * @param {Function}
 *            [mutator.onInit] The hook to be called during each object's initialization
 * @throws Error
 * @static
 * @memberOf Classify
 * @refexample Classify.addMutator
 */
Classify.addMutator = function(name, mutator) {
};

/**
 * Removes a global class mutator that modifies the defined classes at different points
 *
 * @param {String}
 *            name The name of the mutator to be removed
 * @throws Error
 * @static
 * @memberOf Classify
 * @refexample Classify.removeMutator
 */
Classify.removeMutator = function(name) {
};

/**
 * Utility function to provide functionality to quickly add properties to objects
 *
 * @param {Object}
 *            base The base object to copy properties into
 * @param {Object[]}
 *            args Set of objects to copy properties from
 * @static
 * @memberOf Classify
 * @returns {Object}
 * @type {Object}
 * @refexample Classify.extend
 */
Classify.extend = function(base, args) {
	return new Object();
};

/**
 * Utility function to provide functionality to allow for name provisioning
 *
 * @param {String}
 *            namespace The dot separated namespace tree to create
 * @param {Object}
 *            base The object to create the namespace tree within
 * @static
 * @memberOf Classify
 * @returns {Object}
 * @type {Object}
 * @refexample Classify.provide
 */
Classify.provide = function(namespace, base) {
};

/**
 * Utility function for web to avoid namespace issues with other libraries
 *
 * @static
 * @memberOf Classify
 * @returns {Classify}
 * @type {Classify}
 * @example <code>
 * (function(Classify) {
 *     // here you can use the Classify object and remove the global reference to it
 *     // this function is only available on browser environments
 * })(Classify.noConflict());
 * </code>
 */
Classify.noConflict = function() {
	return Classify;
};
