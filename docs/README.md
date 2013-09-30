# classify `v0.10.2`
==================================================

## `Classify`
 * [`Classify`](#Classify)
 * [`Classify.version`](#Classify.version)
 * [`Classify.Classify`](#Classify.Classify)
 * [`Classify.create`](#Classify.create)
 * [`Classify.getNamespace`](#Classify.getNamespace)
 * [`Classify.destroyNamespace`](#Classify.destroyNamespace)
 * [`Classify.testNamespace`](#Classify.testNamespace)
 * [`Classify.getGlobalNamespace`](#Classify.getGlobalNamespace)
 * [`Classify.global`](#Classify.global)
 * [`Classify.addMutator`](#Classify.addMutator)
 * [`Classify.removeMutator`](#Classify.removeMutator)
 * [`Classify.extend`](#Classify.extend)
 * [`Classify.provide`](#Classify.provide)
 * [`Classify.noConflict`](#Classify.noConflict)


## `Classify.Class`
 * [`Classify.Class`](#Classify.Class)
 * [`Classify.Class.$$superclass`](#Classify.Class.$$superclass)
 * [`Classify.Class.$$subclass`](#Classify.Class.$$subclass)
 * [`Classify.Class.$$implement`](#Classify.Class.$$implement)
 * [`Classify.Class.bindings`](#Classify.Class.bindings)
 * [`Classify.Class.$$isclass`](#Classify.Class.$$isclass)
 * [`Classify.Class.invoke`](#Classify.Class.invoke)
 * [`Classify.Class.$$apply`](#Classify.Class.$$apply)
 * [`Classify.Class.extend`](#Classify.Class.extend)
 * [`Classify.Class.addProperty`](#Classify.Class.addProperty)
 * [`Classify.Class.removeProperty`](#Classify.Class.removeProperty)
 * [`Classify.Class.addStaticProperty`](#Classify.Class.addStaticProperty)
 * [`Classify.Class.removeStaticProperty`](#Classify.Class.removeStaticProperty)
 * [`Classify.Class.addBoundProperty`](#Classify.Class.addBoundProperty)
 * [`Classify.Class.removeBoundProperty`](#Classify.Class.removeBoundProperty)
 * [`Classify.Class.addObservableProperty`](#Classify.Class.addObservableProperty)
 * [`Classify.Class.removeObservableProperty`](#Classify.Class.removeObservableProperty)
 * [`Classify.Class.addAliasedProperty`](#Classify.Class.addAliasedProperty)
 * [`Classify.Class.addUnwrappedProperty`](#Classify.Class.addUnwrappedProperty)


## `Classify.Class.prototype`
 * [`Classify.Class.prototype`](#Classify.Class.prototype)
 * [`Classify.Class#constructor`](#Classify.Class.prototype.constructor)
 * [`Classify.Class#init`](#Classify.Class.prototype.init)
 * [`Classify.Class#$$parent`](#Classify.Class.prototype.$$parent)
 * [`Classify.Class#extend`](#Classify.Class.prototype.extend)
 * [`Classify.Class#$$apply`](#Classify.Class.prototype.$$apply)
 * [`Classify.Class#$$call`](#Classify.Class.prototype.$$call)


## `Classify.Namespace`
 * [`Classify.Namespace`](#Classify.Namespace)


## `Classify.Namespace.prototype`
 * [`Classify.Namespace.prototype`](#Classify.Namespace.prototype)
 * [`Classify.Namespace#name`](#Classify.Namespace.prototype.name)
 * [`Classify.Namespace#ref`](#Classify.Namespace.prototype.ref)
 * [`Classify.Namespace#create`](#Classify.Namespace.prototype.create)
 * [`Classify.Namespace#destroy`](#Classify.Namespace.prototype.destroy)
 * [`Classify.Namespace#exists`](#Classify.Namespace.prototype.exists)
 * [`Classify.Namespace#get`](#Classify.Namespace.prototype.get)
 * [`Classify.Namespace#load`](#Classify.Namespace.prototype.load)
 * [`Classify.Namespace#setAutoloader`](#Classify.Namespace.prototype.setAutoloader)
 * [`Classify.Namespace#getName`](#Classify.Namespace.prototype.getName)
 * [`Classify.Namespace#toString`](#Classify.Namespace.prototype.toString)


## `Classify.Observer`
 * [`Classify.Observer`](#Classify.Observer)


## `Classify.Observer.prototype`
 * [`Classify.Observer.prototype`](#Classify.Observer.prototype)
 * [`Classify.Observer#context`](#Classify.Observer.prototype.context)
 * [`Classify.Observer#name`](#Classify.Observer.prototype.name)
 * [`Classify.Observer#writable`](#Classify.Observer.prototype.writable)
 * [`Classify.Observer#delay`](#Classify.Observer.prototype.delay)
 * [`Classify.Observer#_debounce`](#Classify.Observer.prototype._debounce)
 * [`Classify.Observer#value`](#Classify.Observer.prototype.value)
 * [`Classify.Observer#events`](#Classify.Observer.prototype.events)
 * [`Classify.Observer#getter`](#Classify.Observer.prototype.getter)
 * [`Classify.Observer#setter`](#Classify.Observer.prototype.setter)
 * [`Classify.Observer#get`](#Classify.Observer.prototype.get)
 * [`Classify.Observer#set`](#Classify.Observer.prototype.set)
 * [`Classify.Observer#emit`](#Classify.Observer.prototype.emit)
 * [`Classify.Observer#_triggerEmit`](#Classify.Observer.prototype._triggerEmit)
 * [`Classify.Observer#addListener`](#Classify.Observer.prototype.addListener)
 * [`Classify.Observer#on`](#Classify.Observer.prototype.on)
 * [`Classify.Observer#once`](#Classify.Observer.prototype.once)
 * [`Classify.Observer#removeListener`](#Classify.Observer.prototype.removeListener)
 * [`Classify.Observer#removeAllListeners`](#Classify.Observer.prototype.removeAllListeners)
 * [`Classify.Observer#listeners`](#Classify.Observer.prototype.listeners)
 * [`Classify.Observer#toValue`](#Classify.Observer.prototype.toValue)
 * [`Classify.Observer#toString`](#Classify.Observer.prototype.toString)


## `Classify`

### <a id="Classify" href="#">`Classify()`</a>
The Main interface function that returns namespaces and creates objects.
[&#9650;](#)


##### Returns
`Classify.Class`

##### Example
```javascript
<span class="comment">// Different ways to call Classify</span>

<span class="comment">// Calling Classify with a string returns a namespace</span>
<span class="comment">// @see Classify.getNamespace</span>
Classify(<span class="string">"Vehicles"</span>) === Classify.getNamespace(<span class="string">"Vehicles"</span>);

<span class="comment">// Calling Classify with a string ending in a "/" returns a namespace</span>
<span class="comment">// @see Classify.getNamespace</span>
Classify(<span class="string">"Vehicles"</span>) === Classify.getNamespace(<span class="string">"Vehicles"</span>);

<span class="comment">// Calling Classify with a string separated by "/" returns a defined</span>
<span class="comment">// class within a namespace</span>
<span class="comment">// @see Classify.Namespace.get</span>
Classify(<span class="string">"Vehicles/Ship"</span>) === Classify.getNamespace(<span class="string">"Vehicles"</span>).get(<span class="string">"Ship"</span>);

<span class="comment">// Calling Classify with 2 string parameters returns a defined class within</span>
<span class="comment">// a namespace</span>
<span class="comment">// @see Classify.Namespace.get</span>
Classify(<span class="string">"Vehicles"</span>, <span class="string">"Ship"</span>) === Classify.getNamespace(<span class="string">"Vehicles"</span>).get(<span class="string">"Ship"</span>);

<span class="comment">// Calling Classify with first parameter as a string, and second parameter as</span>
<span class="comment">// an object, creates a class within the namespace</span>
<span class="keyword">var</span> Ship = Classify(<span class="string">"Vehicles/Ship"</span>, {
    init : <span class="keyword">function</span>() {
    }
});
<span class="comment">// Calling Classify with first parameter as a string, second parameter as a string, and</span>
<span class="comment">// third parameter as an object, creates a class within the namespace</span>
<span class="keyword">var</span> Ship = Classify(<span class="string">"Vehicles"</span>, <span class="string">"Ship"</span>, {
    init : <span class="keyword">function</span>() {
    }
});
<span class="comment">// The above 2 statements are the same as the following statement to create classes</span>
<span class="comment">// @see Classify.Namespace.create</span>
<span class="keyword">var</span> Ship = Classify.getNamespace(<span class="string">"Vehicles"</span>).create(<span class="string">"Ship"</span>, {
    init : <span class="keyword">function</span>() {
    }
});

<span class="comment">// To inherit from other classes, the first parameter is the class name, second parameter</span>
<span class="comment">// is the parent (can be from other namespaces with "Namespace/Class"), third parameter</span>
<span class="comment">// is the descriptor</span>
<span class="keyword">var</span> Battleship = Classify(<span class="string">"Vehicles/Battleship"</span>, <span class="string">"Ship"</span>, {
    init : <span class="keyword">function</span>() {
    }
});
<span class="comment">// The same can be achieved with the following signature</span>
<span class="keyword">var</span> Battleship = Classify(<span class="string">"Vehicles"</span>, <span class="string">"Battleship"</span>, <span class="string">"Ship"</span>, {
    init : <span class="keyword">function</span>() {
    }
});
<span class="comment">// The above 2 statements are the same as the following statement to create classes</span>
<span class="comment">// @see Classify.Namespace.create</span>
<span class="keyword">var</span> Battleship = Classify.getNamespace(<span class="string">"Vehicles"</span>).create(<span class="string">"Battleship"</span>, <span class="string">"Ship"</span>, {
    init : <span class="keyword">function</span>() {
    }
});

<span class="comment">// Calling Classify with objects with create classes with the object descriptor.</span>
<span class="comment">// Using the Classify method in this manner is analogous to calling Classify.create()</span>
<span class="comment">// Please see Classify.create for documentation</span>
<span class="comment">// @see Classify.create</span>
<span class="keyword">var</span> Energy = Classify({
    init : <span class="keyword">function</span>() {
    }
});
<span class="comment">// The above statement is the same as</span>
<span class="keyword">var</span> Energy = Classify.create({
    init : <span class="keyword">function</span>() {
    }
});
```

### <a id="Classify.version" href="#">`Classify.version`</a>
The version number of this file.
[&#9650;](#)

`String`: The version number of this file

### <a id="Classify.Classify" href="#">`Classify.Classify`</a>
Circular reference to itself.
[&#9650;](#)

`Function`: Circular reference to itself

### <a id="Classify.create" href="#">`Classify.create([parent][, implement], definition)`</a>
Creates a new Classify class.
[&#9650;](#)


##### Arguments
1. `[parent]` `{Classify.Class}`: Optional first parameter defines what object to inherit from
2. `[implement]` `{Object[]}`: Optional second parameter defines where to implement traits from
3. `definition` `{Object}`: The description of the class to be created

##### Returns
`Classify.Class`

### <a id="Classify.getNamespace" href="#">`Classify.getNamespace(namespace)`</a>
Retrieves a namespace and creates if it it doesn't already exist.
[&#9650;](#)


##### Arguments
1. `namespace` `{String}`: Dot separated namespace string

##### Returns
`Classify.Namespace`

### <a id="Classify.destroyNamespace" href="#">`Classify.destroyNamespace(namespace)`</a>
Destroy an existing namespace.
[&#9650;](#)


##### Arguments
1. `namespace` `{String}`: Dot separated namespace string

### <a id="Classify.testNamespace" href="#">`Classify.testNamespace(namespace)`</a>
Retrieves the first namespace that matches the namespace chain "Ns1.ns2.ns3.ns4".
[&#9650;](#)


##### Arguments
1. `namespace` `{String}`: Dot separated namespace string

##### Returns
`Classify.Namespace`

### <a id="Classify.getGlobalNamespace" href="#">`Classify.getGlobalNamespace()`</a>
Retieves the globally named namespace.
[&#9650;](#)


##### Returns
`Classify.Namespace`

### <a id="Classify.global" href="#">`Classify.global`</a>
The globally named namespace.
[&#9650;](#)

`Classify.Namespace`: The globally named namespace

### <a id="Classify.addMutator" href="#">`Classify.addMutator(name, mutator[, mutator.onCreate][, mutator.onPropAdd][, mutator.onPropRemove][, mutator.onInit])`</a>
Adds a global class mutator that modifies the defined classes at different points with hooks.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the mutator reference to add
2. `mutator` `{Object}`: The mutator definition with optional hooks
3. `[mutator.onCreate]` `{Function}`: The hook to be called when a class is defined
4. `[mutator.onPropAdd]` `{Function}`: The hook to be called when a property with the $$name$$ prefix is added
5. `[mutator.onPropRemove]` `{Function}`: The hook to be called when a property with the $$name$$ prefix is removed
6. `[mutator.onInit]` `{Function}`: The hook to be called during each object's initialization

### <a id="Classify.removeMutator" href="#">`Classify.removeMutator(name)`</a>
Removes a global class mutator that modifies the defined classes at different points.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the mutator to be removed

### <a id="Classify.extend" href="#">`Classify.extend(base, args)`</a>
Utility function to provide functionality to quickly add properties to objects.
[&#9650;](#)


##### Arguments
1. `base` `{Object}`: The base object to copy properties into
2. `args` `{Object[]}`: Set of objects to copy properties from

##### Returns
`Object`

### <a id="Classify.provide" href="#">`Classify.provide(namespace, base)`</a>
Utility function to provide functionality to allow for name provisioning.
[&#9650;](#)


##### Arguments
1. `namespace` `{String}`: The dot separated namespace tree to create
2. `base` `{Object}`: The object to create the namespace tree within

##### Returns
`Object`

### <a id="Classify.noConflict" href="#">`Classify.noConflict()`</a>
Utility function for web to avoid namespace issues with other libraries.
[&#9650;](#)


##### Returns
`Classify`

##### Example
```javascript
(function(Classify) {
    // here you can use the Classify object and remove the global reference to it
    // this function is only available on browser environments
})(Classify.noConflict());
```



## `Classify.Class`

### <a id="Classify.Class" href="#">`Classify.Class()`</a>
Placeholder for class descriptors created with the create method.
[&#9650;](#)


##### Constructor method

### <a id="Classify.Class.$$superclass" href="#">`Classify.Class.$$superclass`</a>
Reference to the parent that this object extends from.
[&#9650;](#)

`Classify.Class`: Reference to the parent that this object extends from

### <a id="Classify.Class.$$subclass" href="#">`Classify.Class.$$subclass`</a>
Array containing a reference to all the children that inherit from this object.
[&#9650;](#)

`Array`: Array containing a reference to all the children that inherit from this object

### <a id="Classify.Class.$$implement" href="#">`Classify.Class.$$implement`</a>
Array containing all the objects and classes that this object implements methods and properties from.
[&#9650;](#)

`Array`: Array containing all the objects and classes that this object implements methods and properties from

### <a id="Classify.Class.bindings" href="#">`Classify.Class.bindings`</a>
Array containing the list of all the bound properties that is wrapped during object initialization.
[&#9650;](#)

`Array`: Array containing the list of all the bound properties that is wrapped during object initialization

### <a id="Classify.Class.$$isclass" href="#">`Classify.Class.$$isclass`</a>
Flag to determine if this object is created by Classify.create.
[&#9650;](#)

`Boolean`: Flag to determine if this object is created by Classify.create

### <a id="Classify.Class.invoke" href="#">`Classify.Class.invoke()`</a>
Default invocation function when the defined class is called without the "new" keyword. The default behavior is to return a new instance of itself.
[&#9650;](#)


##### Returns
`Classify.Class`

### <a id="Classify.Class.$$apply" href="#">`Classify.Class.$$apply(args)`</a>
Create a new instance of the class using arguments passed in as an array.
[&#9650;](#)


##### Arguments
1. `args` `{Array}`: Array of arguments to construct the object with

##### Returns
`Classify.Class`

### <a id="Classify.Class.extend" href="#">`Classify.Class.extend([implement], definition)`</a>
Creates a new class that is a child of the current class.
[&#9650;](#)


##### Arguments
1. `[implement]` `{Object[]}`: Optional parameter defines where to implement traits from
2. `definition` `{Object}`: The description of the class to be created

##### Returns
`Classify.Class`

### <a id="Classify.Class.addProperty" href="#">`Classify.Class.addProperty(name[, property][, prefix=""])`</a>
Adds a new property to the object's prototype of base.
[&#9650;](#)


##### Arguments
1. `name` `{String|Object}`: The property name to add or if object is passed in then it will iterate through it to add properties
2. `[property]` `{Object}`: The property to add to the class
3. `[prefix=""]` `{String}`: Prefix of the property name if any

##### Returns
`Classify.Class`

### <a id="Classify.Class.removeProperty" href="#">`Classify.Class.removeProperty(name)`</a>
Removes a property from the object's prototype or base.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the property to remove

##### Returns
`Classify.Class`

### <a id="Classify.Class.addStaticProperty" href="#">`Classify.Class.addStaticProperty(name, property)`</a>
Adds a static property to the object's base.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the property to add
2. `property` `{Object}`: The property to store into the object's base

##### Returns
`Classify.Class`

### <a id="Classify.Class.removeStaticProperty" href="#">`Classify.Class.removeStaticProperty(name)`</a>
Removes a static property from the object's base.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the property to remove

##### Returns
`Classify.Class`

### <a id="Classify.Class.addBoundProperty" href="#">`Classify.Class.addBoundProperty(name, property)`</a>
Adds a context bound property to the object's prototype.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the property to add
2. `property` `{Function}`: The property to always bind the object's context with

##### Returns
`Classify.Class`

### <a id="Classify.Class.removeBoundProperty" href="#">`Classify.Class.removeBoundProperty(name)`</a>
Removes a context bound property from the object's base.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the property to remove

##### Returns
`Classify.Class`

### <a id="Classify.Class.addAliasedProperty" href="#">`Classify.Class.addAliasedProperty(name, property)`</a>
Adds a aliased property to the object's prototype based on a existing prototype method.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the alias for the new property
2. `property` `{String}`: The name of the property alias

##### Returns
`Classify.Class`

### <a id="Classify.Class.addUnwrappedProperty" href="#">`Classify.Class.addUnwrappedProperty(name, property)`</a>
Adds a property to the object's prototype that is not wrapped in the parent method wrapper.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the new property
2. `property` `{String}`: The name of the property to add

##### Returns
`Classify.Class`



## `Classify.Class.prototype`
### <a id="Classify.Class.prototype" href="#">`Classify.Class.prototype`</a>
Prototype chain for Classify.Class.
[&#9650;](#)

`Object`: Prototype chain for Classify.Class

### <a id="Classify.Class.prototype.constructor" href="#">`Classify.Class.prototype.constructor`</a>
Reference to the constructor function of this object.
[&#9650;](#)

`Classify.Class`: Reference to the constructor function of this object

### <a id="Classify.Class.prototype.init" href="#">`Classify.Class.prototype.init()`</a>
True constructor method for this object, will be called when object is called with the "new" keyword.
[&#9650;](#)


##### Returns
`Classify.Class`

### <a id="Classify.Class.prototype.$$parent" href="#">`Classify.Class.prototype.$$parent()`</a>
Internal reference property for methods that override a parent method, allow for access to the parent version of the function.
[&#9650;](#)


##### Returns
`Object`

### <a id="Classify.Class.prototype.extend" href="#">`Classify.Class.prototype.extend([implement], definition)`</a>
Creates a new class that is a child of the current class.
[&#9650;](#)


##### Arguments
1. `[implement]` `{Object[]}`: Optional parameter defines where to implement traits from
2. `definition` `{Object}`: The description of the class to be created

##### Returns
`Classify.Class`

### <a id="Classify.Class.prototype.$$apply" href="#">`Classify.Class.prototype.$$apply(name, args)`</a>
Magic method that can invoke any of the parent methods with an array of arguments.
[&#9650;](#)


##### Arguments
1. `name` `{Object}`: The name of the parent method to invoke
2. `args` `{Array}`: The arguments to pass through to invoke

##### Returns
`Object`

### <a id="Classify.Class.prototype.$$call" href="#">`Classify.Class.prototype.$$call(name, [arg1, [arg2...]])`</a>
Magic method that can invoke any of the parent methods with a series of arguments.
[&#9650;](#)


##### Arguments
1. `name` `{Object}`: The name of the parent method to invoke
2. `[arg1]` `{Object}`: Optional argument
2. `[arg2]` `{Object}`: Optional argument

##### Returns
`Object`



## `Classify.Namespace`

### <a id="Classify.Namespace" href="#">`Classify.Namespace(name)`</a>
Namespace container that hold a tree of classes.
[&#9650;](#)


##### Constructor method

##### Extends `Classify.Class`

##### Arguments
1. `name` `{String}`: The name of the namespace to construct with



## `Classify.Namespace.prototype`
### <a id="Classify.Namespace.prototype" href="#">`Classify.Namespace.prototype`</a>
Prototype chain for Classify.Namespace.
[&#9650;](#)

`Classify.Class`: Prototype chain for Classify.Namespace

### <a id="Classify.Namespace.prototype.name" href="#">`Classify.Namespace.prototype.name`</a>
The name of the namespace.
[&#9650;](#)

`String`: The name of the namespace

### <a id="Classify.Namespace.prototype.ref" href="#">`Classify.Namespace.prototype.ref`</a>
Hashtable containing references to all the classes created within this namespace.
[&#9650;](#)

`Object`: Hashtable containing references to all the classes created within this namespace

### <a id="Classify.Namespace.prototype.create" href="#">`Classify.Namespace.prototype.create(name[, parent][, implement], definition)`</a>
Creates a new class within this namespace.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the created class within the namespace
2. `[parent]` `{String|Classify.Class}`: Optional second parameter defines what object to inherit from, can be a string referencing a class within any namespace
3. `[implement]` `{Object[]}`: Optional third parameter defines where to implement traits from
4. `definition` `{Object}`: The description of the class to be created

##### Returns
`Classify.Class`

### <a id="Classify.Namespace.prototype.destroy" href="#">`Classify.Namespace.prototype.destroy(classname)`</a>
Removes a defined class from this namespace and it's children classes.
[&#9650;](#)


##### Arguments
1. `classname` `{String}`: Name of class to remove from this namespace

##### Returns
`Classify.Namespace`

### <a id="Classify.Namespace.prototype.exists" href="#">`Classify.Namespace.prototype.exists(classname)`</a>
Checks if a class exists within this namespace.
[&#9650;](#)


##### Arguments
1. `classname` `{String}`: Name of class to check if it has already been defined

##### Returns
`Boolean`

### <a id="Classify.Namespace.prototype.get" href="#">`Classify.Namespace.prototype.get(name)`</a>
Attempt to retrieve a class within this namespace or the global one.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the class to retrieve

### <a id="Classify.Namespace.prototype.load" href="#">`Classify.Namespace.prototype.load(name)`</a>
Default loader function that loads the internal classes from.
[&#9650;](#)


##### Arguments
1. `name` `{String}`: The name of the class to load

##### Returns
`Classify.Namespace`

### <a id="Classify.Namespace.prototype.setAutoloader" href="#">`Classify.Namespace.prototype.setAutoloader(callback)`</a>
Sets the internal autoloader by overriding the Classify.Namespace.prototype.load method.
[&#9650;](#)


##### Arguments
1. `callback` `{Function}`: The function to call when a class that doesn't exist needs to be loaded

##### Returns
`Classify.Namespace`

### <a id="Classify.Namespace.prototype.getName" href="#">`Classify.Namespace.prototype.getName()`</a>
Gets the name of this namespace.
[&#9650;](#)


### <a id="Classify.Namespace.prototype.toString" href="#">`Classify.Namespace.prototype.toString()`</a>
Gets the translated toString name of this object "[namespace Name]".
[&#9650;](#)




## `Classify.Observer`

### <a id="Classify.Observer" href="#">`Classify.Observer(value, value.value[, value.writable=true][, value.delay=0][, value.getter][, value.setter])`</a>
Wrapper object that allows for getter/setter/event listeners of object properties.
[&#9650;](#)


##### Constructor method

##### Extends `Classify.Class`

##### Arguments
1. `value` `{Object}`: The internal value can be either an object or a value
2. `value.value` `{Object}`: The internal value if the parameter was passed in as an object
3. `[value.writable=true]` `{Boolean}`: Marks this object as writable or readonly
4. `[value.delay=0]` `{Number}`: Only fire the event emitter after a delay of value.delay ms
5. `[value.getter]` `{Function}`: The internal get modifier
6. `[value.setter]` `{Function}`: The internal set modifier



## `Classify.Observer.prototype`
### <a id="Classify.Observer.prototype" href="#">`Classify.Observer.prototype`</a>
Prototype chain for Classify.Observer.
[&#9650;](#)

`Classify.Class`: Prototype chain for Classify.Observer

### <a id="Classify.Observer.prototype.context" href="#">`Classify.Observer.prototype.context`</a>
The context that this object is created within.
[&#9650;](#)

`Classify.Class`: The context that this object is created within

### <a id="Classify.Observer.prototype.name" href="#">`Classify.Observer.prototype.name`</a>
The name of the property that this object observes.
[&#9650;](#)

`String`: The name of the property that this object observes

### <a id="Classify.Observer.prototype.writable" href="#">`Classify.Observer.prototype.writable`</a>
Flag to check if this property is writable.
[&#9650;](#)

`Boolean`: Flag to check if this property is writable

### <a id="Classify.Observer.prototype.delay" href="#">`Classify.Observer.prototype.delay`</a>
Number of seconds to delay the event emitter, 0 will disable delays.
[&#9650;](#)

`Number`: Number of seconds to delay the event emitter, 0 will disable delays

### <a id="Classify.Observer.prototype._debounce" href="#">`Classify.Observer.prototype._debounce`</a>
Flag to hold the delay timer.
[&#9650;](#)

`Number`: Flag to hold the delay timer

### <a id="Classify.Observer.prototype.value" href="#">`Classify.Observer.prototype.value`</a>
The internal value of this object.
[&#9650;](#)

`Object`: The internal value of this object

### <a id="Classify.Observer.prototype.events" href="#">`Classify.Observer.prototype.events`</a>
Array containing all the event listeners for when this value changes.
[&#9650;](#)

`Array`: Array containing all the event listeners for when this value changes

### <a id="Classify.Observer.prototype.getter" href="#">`Classify.Observer.prototype.getter(value)`</a>
Internal getter method that modifies the internal value being returned by the Classify.Observer.prototype.get method.
[&#9650;](#)


##### Arguments
1. `value` `{Object}`: The internal value of this object

##### Returns
`Object`

### <a id="Classify.Observer.prototype.setter" href="#">`Classify.Observer.prototype.setter(value, original)`</a>
Internal setter method that modifies the internal value being set by the Classify.Observer.prototype.set method.
[&#9650;](#)


##### Arguments
1. `value` `{Object}`: The new value that will be set
2. `original` `{Object}`: The original internal value of this object

##### Returns
`Object`

### <a id="Classify.Observer.prototype.get" href="#">`Classify.Observer.prototype.get()`</a>
Gets the value of the internal property.
[&#9650;](#)


##### Returns
`Object`

### <a id="Classify.Observer.prototype.set" href="#">`Classify.Observer.prototype.set(value)`</a>
Sets the value of the internal property.
[&#9650;](#)


##### Arguments
1. `value` `{Object}`: Mixed value to store internally

##### Returns
`Classify.Class`

### <a id="Classify.Observer.prototype.emit" href="#">`Classify.Observer.prototype.emit()`</a>
Starts the timers to call the registered event listeners.
[&#9650;](#)


##### Returns
`Classify.Class`

### <a id="Classify.Observer.prototype._triggerEmit" href="#">`Classify.Observer.prototype._triggerEmit(args)`</a>
Fires the event listeners in the order they were added.
[&#9650;](#)


##### Arguments
1. `args` `{Array}`: Array of arguments to pass to the bound event listeners

### <a id="Classify.Observer.prototype.addListener" href="#">`Classify.Observer.prototype.addListener(listener)`</a>
Add an event listener for when the internal value is changed.
[&#9650;](#)


##### Arguments
1. `listener` `{Function}`: The event listener to add

##### Returns
`Classify.Class`

### <a id="Classify.Observer.prototype.on" href="#">`Classify.Observer.prototype.on(listener)`</a>
Add an event listener for when the internal value is changed, alias to addListener.
[&#9650;](#)


##### Arguments
1. `listener` `{Function}`: The event listener to add

##### Returns
`Classify.Class`

### <a id="Classify.Observer.prototype.once" href="#">`Classify.Observer.prototype.once(listener)`</a>
Add an event listener to be called only once when the internal value is changed.
[&#9650;](#)


##### Arguments
1. `listener` `{Function}`: The event listener to add

##### Returns
`Classify.Class`

### <a id="Classify.Observer.prototype.removeListener" href="#">`Classify.Observer.prototype.removeListener(listener)`</a>
Remove an event listener from being fired when the internal value is changed.
[&#9650;](#)


##### Arguments
1. `listener` `{Function}`: The event listener to remove

##### Returns
`Classify.Class`

### <a id="Classify.Observer.prototype.removeAllListeners" href="#">`Classify.Observer.prototype.removeAllListeners()`</a>
Remove all event listeners from this object.
[&#9650;](#)


##### Returns
`Classify.Class`

### <a id="Classify.Observer.prototype.listeners" href="#">`Classify.Observer.prototype.listeners()`</a>
Returns the array of internal listeners.
[&#9650;](#)


##### Returns
`Array`

### <a id="Classify.Observer.prototype.toValue" href="#">`Classify.Observer.prototype.toValue()`</a>
Returns the internal value of this object in the scalar form.
[&#9650;](#)


##### Returns
`Boolean|Number|String`

### <a id="Classify.Observer.prototype.toString" href="#">`Classify.Observer.prototype.toString()`</a>
Returns the special name of this object.
[&#9650;](#)


##### Returns
`String`