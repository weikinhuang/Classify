[Classify.js](http://classifyjs.com) [![Build Status](https://api.travis-ci.org/weikinhuang/Classify.png?branch=master)](http://travis-ci.org/weikinhuang/Classify)
==================================================

Classify.js is a library that allows for cross platform and cross browser Object Oriented Javascript
class definitions using classical inheritance and namespaces behind the prototype syntax in an easy to
use interface function. Classify also provides "bound" properties that passes the calling context as
the first argument, and "static" properties for static properties and methods on the object definition.

Classify is tested in IE 6+, Firefox 2+, Safari 3+, Chrome 3+, and Opera 10+, NodeJs.
[![Selenium Test Status](https://saucelabs.com/buildstatus/classifyjs)](https://saucelabs.com/u/classifyjs)

Usage
--------------------------------------

#### Creating a class
```javascript
var Pet = Classify({
	type : "",
	eaten : null,
	init : function(type) { // constructor method
		this.type = type;
		// don't assign objects to the prototype, because it
		// will be same reference in all instances
		this.eaten = [];
	},
	eat : function(food) {
		this.eaten.push(food);
	}
});
```

#### Inheritance
```javascript
var Dog = Classify(Pet, {
	breed : "",
	init : function(breed) {
		this.$$parent("dog");
		this.breed = breed;
	}
});
```

#### Mixins/Multiple Inheritance
```javascript
// Implementations will only be attached to the prototype
var feline_traits = {
	is_asleep : false,
	sleep : function() {
		this.is_asleep = true;
	},
	wake : function() {
		this.is_asleep = false;
	}
};
var Cat = Classify(Pet, [ feline_traits ], {
	breed : "",
	init : function(breed) {
		this.$$parent("cat");
		this.breed = breed;
	}
});
```

#### Static Properties/Methods
```javascript
// Static properties can be defined with the "$$static$$" prefix
// or defined in bulk with $$static$$ : {prop1:1, prop2:2}
var Bird = Classify(Pet, {
	breed : "",
	init : function(breed) {
		this.$$parent("bird");
		this.breed = Bird.validateBreed(breed);
	},
	$$static$$BREEDS : {
		parrot : "Parrot",
		canary : "Canary"
	},
	$$static$$validateBreed : function(breed) {
		return Bird.BREEDS[breed] || "Unknown";
	}
});
```

#### Autobinding
```javascript
// Auto bound properties can be defined with the "$$bind$$" prefix
// or defined in bulk with $$bind$$ : {prop1:function(){}, prop2:function(){}}
var Pig = Classify(Pet, {
	init : function() {
		this.$$parent("pig");
	},
	$$bind$$speak : function(event) {
		// this can now be called within the class with this.speak()
		// special property $$context added for the duration of this
		// method to pass along the calling context, with "this" is
		// still the instance
		alert(this.$$context.href);
	}
});
var p = new Pig();
// <a href="#oink" id="some-link">Click me!</a>
document.getElementById("some-link").addEventListener("click", p.speak);
```

#### Calling overridden parent methods
```javascript
var Dog = Classify(Pet, {
	breed : "",
	init : function(breed) {
		// "this.$$parent" is the parent of the calling method
		this.$$parent("dog");
		this.breed = breed;
	},
	eat : function() {
		// the dog can only eat fish...
		this.$$parent("fish");
	},
	eatBiscuit : function() {
		// using "this.$$apply" can call any method in the parent prototype
		// with an array of arguments similar to "Function.apply()"
		// this will call Pet.prototype.eat with the argument biscuit
		// shortcut for Pet.prototype.eat.apply(this, [ "biscuit" ]);
		this.$$apply("eat", [ "biscuit" ]);
	},
	eatDogFood : function() {
		// using "this.$$call" can call any method in the parent prototype
		// with a set of arguments similar to "Function.call()"
		// this will call Pet.prototype.eat with the argument biscuit
		// shortcut for Pet.prototype.eat.call(this, "biscuit");
		this.$$call("eat", "biscuit");
	}
});
```

#### Namespaces
```javascript
// creating/retrieving a namespace
var namespace = Classify("Life");
// OR
var namespace = Classify.Namespace.from("Life", {} /* any object can be a coerced into a namespace */);
// note that this cannot be accessed with 'Classify("Life");'
// if global access is needed use 'Classify.Namespace.from("Life", {}, true);'
```

###### method 1: through the namespace objects
```javascript
// creating classes within a namespace
namespace.create("Reptile", {
	species : "",
	init : function(species) {
		this.species = species;
	}
});
// retrieving classes within a namespace
var Reptile = namespace.get("Reptile");

// extending classes within a namespace
namespace.create("Tortoise", "Reptile", {
	init : function() {
		this.$$parent("tortoise");
	}
});
// retrieving classes within a namespace
var Tortoise = namespace.get("Tortoise");

namespace.create("Tortoise.DesertTortoise", "Tortoise", {
	age : null,
	init : function() {
		this.$$parent();
		this.age = 0;
	}
});
// retrieving classes within a namespace
var DesertTortoise = namespace.get("Tortoise.DesertTortoise");

// instances
var pet = new DesertTortoise();
pet instanceof Tortoise;
pet instanceof Reptile;
pet.getNamespace() === namespace;

// removing a class within a namespace
namespace.destroy("Tortoise.DesertTortoise");

// checking a class within a namespace
namespace.exists("Tortoise.DesertTortoise");
```

###### method 2: through the Classify function
```javascript
// creating classes within a namespace
Classify("Life", "Reptile", {
	species : "",
	init : function(species) {
		this.species = species;
	}
});
// OR using a "/" will denote namespace/classname
Classify("Life/Reptile", {
	species : "",
	init : function(species) {
		this.species = species;
	}
});
// retrieving classes within a namespace
var Reptile = Classify("Life", "Reptile");
// OR using a "/" will denote namespace/classname
var Reptile = Classify("Life/Reptile");

// extending classes within a namespace
// Classify("Life", "Tortoise", "Reptile", {
Classify("Life/Tortoise", "Reptile", {
	init : function() {
		this.$$parent("tortoise");
	}
});
// retrieving classes within a namespace
var Tortoise = Classify("Life/Tortoise");

Classify("Life/Tortoise.DesertTortoise", "Tortoise", {
	age : null,
	init : function() {
		this.$$parent();
		this.age = 0;
	}
});
// retrieving classes within a namespace
var DesertTortoise = Classify("Life/Tortoise.DesertTortoise");

// instances
var pet = new DesertTortoise();
pet instanceof Tortoise;
pet instanceof Reptile;
pet.getNamespace() === namespace;
```

#### Instantiating
```javascript
var Reptile = Classify("Life/Reptile");

// instances
var pet = new Reptile("tortoise");
pet instanceof Reptile;

// instances
var pet = new Classify("Life/Reptile", [ "tortoise" ])
pet instanceof Reptile;
!(pet instanceof Classify);
```

#### Utility
```javascript
(function(Classify) {
	// here you can use the Classify object and remove the global reference to it
	// this function is only available on browser environments
})(Classify.noConflict());
```

Environments
--------------------------------------

Classify is [CommonJS](http://commonjs.org) compliant and can be used in the browser scope or the server scope.

### In the browser:
```html
<script src="path/to/classify.js" type="text/javascript"></script>
<!-- Classify() is now in the global context -->
```

### In [NodeJs](http://nodejs.org/) environment:
```bash
npm install classifyjs
```

```javascript
var Classify = require("classifyjs").Classify;
```

### With an AMD loader like [RequireJS](http://requirejs.org/):
```javascript
require({
	"paths" : {
		"classify" : "path/to/classify"
	}
}, [ "classify" ], function(Classify) {
	console.log(Classify.version);
});
```

Building the Source
--------------------------------------

Classify uses the [grunt](https://github.com/cowboy/grunt) build system. Building Classify requires node.js and a command line gzip program.

```bash
# Install grunt.
$ npm install -g grunt-cli bower

# Clone the Classify git repo.
$ git clone git://github.com/weikinhuang/Classify.git
$ cd Classify

# Install node modules.
$ npm install
$ bower install

# Run grunt.
$ grunt
```

Running the tests:

```bash
$ grunt test
```

For saucelabs users, test can be run from the test task with:

```bash
$ export SAUCE_USERNAME=[saucelabs username]
$ export SAUCE_ACCESS_KEY=[saucelabs access token]
```

To skip the saucelabs tests

```bash
$ grunt test:local
```

There are many other tasks that can be run through grunt. For a list of all tasks:

```bash
$ grunt --help
```


Changelog
--------------------------------------
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
```

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

About
--------------------------------------

Classify copyright 2011-2013 by [Wei Kin Huang](http://closedinterval.com/).

Build Tools: 
[Grunt](https://github.com/cowboy/grunt),
[QUnit](https://github.com/jquery/qunit),
[Benchmark.js](https://github.com/bestiejs/benchmark.js),
[UglifyJS](https://github.com/mishoo/UglifyJS),
[JsHint](https://github.com/jshint/jshint),
[JsCoverage](http://siliconforks.com/jscoverage).

All code released under the [MIT License](http://mit-license.org/).

Fork me to show support and help fix bugs!
