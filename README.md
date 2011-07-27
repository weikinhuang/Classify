[Classify](http://www.closedinterval.com/classify)
==================================================

Classify is a Javascript library that allows for cross platform classical inheritance and namespaces behind the prototype syntax in an easy to use interface function.

Classify is tested in IE 6+, Firefox 2+, Safari 3+, Chrome 3+, and Opera 10+.

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

method 1: through the namespace objects
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

method 2: through the Classify function
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

### browser environment
```javascript
	<script src="path/to/classify.js" type="text/javascript"></script>
	<!-- Classify() is now in the global context -->

	<script type="text/javascript">
		var Foo = Classify(...);
		var Bar = Classify(Foo, ...);
		var bar = new Bar(...);
	</script>
```

### server environment
```javascript
	var Classify = require('path/to/classify');

	var Foo = Classify(...);
```

Running the unit tests
--------------------------------------

`make unit`