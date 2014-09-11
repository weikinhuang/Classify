#### v0.14.1
	Adding `priority` property to mutators to allow for mutator processing order

#### v0.14.0
	Ability to set internal references for namespaces created with `Namespace.from()`

#### v0.13.1
	BREAKING CHANGE: Renaming more additional internal props for consistiency
```javascript
	Namespace.nsname => Namespace.$$nsname
	Namespace.nsref => Namespace.$$nsref
```

#### v0.13.0
	BREAKING CHANGE: the mutator prefix is now $$\w+$$
	BREAKING CHANGE: underscores are no longer allowed in mutator names
	BREAKING CHANGE: multiple mutators can be specified in the mutator prefix separated by an _
	BREAKING CHANGE: the mutator prefix is always removed regardless if there is a mutator attached or not
	greedy mutators can be added to always be run onPropAdd and onPropRemove
```javascript
	// prefix change
	{ __mutator_prop : 1 } => { $$mutator$$ : 1 }
	// multiple mutators
	{ $$mutate1_mutate2$$ : 1 }
	// greedy mutators
	addMutator({ greedy : true })
	// prefix removed when attached to an object
	$$abc$$prop : 1 => prop : 1
``

#### v0.12.0
	BREAKING CHANGE: Class.toString now returns the init method body
	BREAKING CHANGE: Renaming internal properties and certain magic properties.
	BREAKING CHANGE: Change behavior of the bind mutator to make context a property instead of a argument.
```javascript
	// calling parent method
	this.parent => this.$$parent
	this.invoke => this.$$apply
	adding this.$$call
	// internal variables
	Class.superclass => Class.$$superclass
	Class.subclass => Class.$$subclass
	Class.implement => Class.$$implement
	Class.mutators => Class.$$mutator
	Class.applicate => Class.$$apply
	Class.__isclass_ => Class.$$isclass
	// bind mutator
	function(context) {} => function() { this.$$context; }
	// shortcuts
	removed this.self, use Class.prototype.constructor/this.constructor instead
```

#### v0.11.0
	Removing Observer and observable mutator from core. Now in Classify-Observable[https://github.com/weikinhuang/Classify-Observer]

#### v0.10.4
	Pass arguments to onInit mutators
	
#### v0.10.3
	Allow for mutators to be defined on a per class/namespace level
	Ability to create mutators out of any object
	Convert to grunt build system

#### v0.10.2
	Fix requirejs and amd definitions, remove async autoloader to support it

#### v0.10.1
	Android Mobile thinks typeof RegExp == "function"

#### v0.10.0
	Allow init mutators to override constructor return value & throw on scalar values
	Adding null value to the prototype for observable properties
	Observer properties don't need to go through objectDefineProperty

#### v0.9.10
	BREAKING CHANGE, implements overrides extends when defining a class that institutes both
	Use ES5 Object.create when possible

#### v0.9.9
	Fix issue when extending non Classify objects overriding special properties
	Global namespace is now a property of Classify on Classify.global
	Updated Observers to have a 'on' alias and be able to bind events to be fired only once
	Using Object.prototype.hasOwnProperty instead of .hasOwnProperty

#### v0.9.8
	The called context is passed in as argument 1 for auto bound functions

#### v0.9.7
	Refactoring internals so that adding and removing mutators can be externalized
	Added mutator to auto bind functions to a class instance

#### v0.9.6
	Fix case where classes are added as properties of other classes

#### v0.9.5
	Added ability to add non wrapped methods to the class prototype

#### v0.9.4
	Adding Travis-ci config file
	Fix issue with IE6-9 when extending from non Classify classes
	General bug fixes, removing support for IE<6

#### v0.9.3
	Renaming Class.Extend to Class.extend

#### v0.9.2
	Ability to delay event listeners from being triggered in observers

#### v0.9.0
	Ability to add statics and observers in a container

#### v0.8.5
	Fix issue with adding overriding functions to a parent prototype

#### v0.8.0
	Only fire observer listeners when the value has changed

#### v0.7.5
	fixing parent invocation using applicate in default invoke method

#### v0.7.0
	Ability to inherit from objects that are not created with Classify.create.
	Allow Classify to be AMD compatible.
	extend utility function that "extends" objects with properties from other objects in a shallow manner
	fix issue with class invocation of "invoke" when class is a direct property of a namespace
	"get" in namespace cascades into "GLOBAL" namespace classes
	groundwork for ability to extend native and non create objects
	Removing check for native objects (IE doesn't allow extending native objects).
	throw Error objects instead of strings

#### v0.6.0
	better detection of parameters for using Classify function ("namespace/classname" for retrieval)
	minification optimizations
	quicker access to the GLOBAL namespace

#### v0.4.0
	ability to inherit the parent invoke method if not defined
	exporting provide to the Classify object
	GLOBAL namespace that all namespaced classes can inherit from

#### v0.3.5
	ability to get a class definition synchronously and asynchronously in Classify
	ability to test if a namespace exists
	adding Classify.noConflict for conflict free usage of Classify

#### v0.3.0
	using more standardized nomenclature
	"_construct_" => "init"
	"_invoke_" => "invoke"
	"_apply_" => "applicate"
	"_parent_" => "parent"
	"_self_" => "self"

#### v0.2.0
	ability to create and destory classes created within namespaces
	better checking of enumerable keys in IE < 9
	bugfix on Extend functionality
	Classify function endpoint has ability to to get namespace and create classes within the namespace
	fixing issue with adding multiple properties to a class with the addProperty call
	"get" in namespace takes in a callback and passes in the class
	global references
	namespacing functionality
	only export classify to root object if it's a browser
	pulled out the body of invoke to apply and default invoke will call apply
	the exported object is created using the internal Create method
	updated to "use strict";
