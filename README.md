[Classify.js](http://classifyjs.com) [![Build Status](https://secure.travis-ci.org/weikinhuang/Classify.png?branch=master)](http://travis-ci.org/weikinhuang/Classify)
==================================================

Classify.js is a library that allows for cross platform and cross browser Object Oriented Javascript
class definitions using classical inheritance and namespaces behind the prototype syntax in an easy to
use interface function. Classify also provides "observable" properties that can be assigned getters and
setters and onchange listeners to provide abstractions around `get` and `set` accessors.

Classify is tested in IE 6+, Firefox 2+, Safari 3+, Chrome 3+, and Opera 10+, NodeJs.

Usage
--------------------------------------

#### Creating a class
```javascript
var Pet = Classify({
	type : "",
	init : function(type) { // constructor method
		this.type = type;
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
		this.parent("dog");
		this.breed = breed;
	}
});
```

#### Interfaces
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
		this.parent("cat");
		this.breed = breed;
	}
});
```

#### Namespaces
```javascript
// creating/retrieving a namespace
var namespace = Classify("Life");
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
		this.parent("tortoise");
	}
});
// retrieving classes within a namespace
var Tortoise = namespace.get("Tortoise");

namespace.create("Tortoise.DesertTortoise", "Tortoise", {
	age : null,
	init : function() {
		this.parent();
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
		this.parent("tortoise");
	}
});
// retrieving classes within a namespace
var Tortoise = Classify("Life/Tortoise");

Classify("Life/Tortoise.DesertTortoise", "Tortoise", {
	age : null,
	init : function() {
		this.parent();
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
var Classify = require('classifyjs').Classify;
```

### With an AMD loader like [RequireJS](http://requirejs.org/):
```javascript
require({
	'paths' : {
		'benchmark' : 'path/to/classify'
	}
}, [ 'classify' ], function(Classify) {
	console.log(Classify.version);
});
```

Building the Source
--------------------------------------

After installing NodeJs, just run:

`./make.js`

Running the unit tests: `./make.js unit`

Running JsHint tests: `./make.js lint`

Running JsPerf tests: `./make.js perf`

Other options include: `clean`, `lint`, `unit`, `concat`, `min`, `size`, `perf`, `doc`

Changelog
--------------------------------------

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

Classify copyright 2011-2012 by [Wei Kin Huang](http://closedinterval.com/).

Build Tools: 
[QUnit](https://github.com/jquery/qunit),
[Benchmark.js](https://github.com/bestiejs/benchmark.js),
[UglifyJS](https://github.com/mishoo/UglifyJS),
[JsHint](https://github.com/jshint/jshint),
[JsCoverage](http://siliconforks.com/jscoverage).

All code released under the [MIT License](http://mit-license.org/).

Fork me to show support and help fix bugs!