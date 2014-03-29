/**
 * @module mutator
 */
// regex to test for a mutator name to avoid a loop
var mutatorNameTest = /^\$\$(\w+)\$\$/,
// separator for multiple mutator usages
mutatorSeparator = "_",
// reference to existing mutators
namedGlobalMutators = {},
// list of all mutators in the order of definition
globalMutators = [],
/**
 * Internal "Mutator" class that handles hooks for class object manipulation
 *
 * @constructor
 * @memberOf Classify
 * @alias Mutator
 * @param {String} name The name of the mutator
 * @param {Object} props hash of properties to merge into the prototype
 */
Mutator = function(name, props) {
	if (!(this instanceof Mutator)) {
		return new Mutator(name, props);
	}

	/**
	 * The execution priority of this mutator
	 *
	 * @private
	 * @memberOf Classify.Mutator#
	 * @member priority
	 * @type {Number}
	 */
	this.priority = 100;

	extend(this, props);

	/**
	 * The name of the mutator
	 *
	 * @private
	 * @memberOf Classify.Mutator#
	 * @member name
	 * @type {String}
	 */
	this.name = name;
	/**
	 * Flag determining if all property modifications should be run through
	 * this mutator
	 *
	 * @private
	 * @memberOf Classify.Mutator#
	 * @member greedy
	 * @type {Boolean}
	 */
	this.greedy = props.greedy === true;
	/**
	 * The property matcher prefix of this mutator
	 *
	 * @private
	 * @memberOf Classify.Mutator#
	 * @member propPrefix
	 * @type {String}
	 */
	this.propPrefix = "$$" + name + "$$";
},
/**
 * Adds a global class mutator that modifies the defined classes at different
 * points with hooks
 *
 * @param {String} name The name of the mutator reference to add
 * @param {Object} mutator The mutator definition with optional hooks
 * @param {Function} [mutator._onPredefine] Internal hook to be called as soon
 *            as the constructor is defined
 * @param {Function} [mutator.onCreate] The hook to be called when a class is
 *            defined before any properties are added
 * @param {Function} [mutator.onDefine] The hook to be called when a class is
 *            defined after all properties are added
 * @param {Function} [mutator.onPropAdd] The hook to be called when a property
 *            with the $$name$$ prefix is added
 * @param {Function} [mutator.onPropRemove] The hook to be called when a
 *            property with the $$name$$ prefix is removed
 * @param {Function} [mutator.onInit] The hook to be called during each object's
 *            initialization
 * @param {Function} [mutator.greedy] Attribute to declare that all properties
 *            being added and removed goes through this mutator
 * @throws Error
 * @memberOf Classify
 * @method addMutator
 */
addMutator = function(name, mutator) {
	if (namedGlobalMutators[name]) {
		throw new Error("Adding duplicate mutator \"" + name + "\".");
	}
	var mutatorInstance = new Mutator(name, mutator);
	namedGlobalMutators[name] = mutatorInstance;
	globalMutators.push(mutatorInstance);
},
/**
 * Removes a global class mutator that modifies the defined classes at different
 * points
 *
 * @param {String} name The name of the mutator to be removed
 * @throws Error
 * @memberOf Classify
 * @method removeMutator
 */
removeMutator = function(name) {
	var mutator = namedGlobalMutators[name];
	if (!mutator) {
		throw new Error("Removing unknown mutator.");
	}
	remove(globalMutators, mutator);
	namedGlobalMutators[name] = null;
	try {
		delete namedGlobalMutators[name];
	} catch (e) {
	}
},
// method to get all possible mutators
getMutators = function(klass) {
	var i, l, mutators = globalMutators.slice(0);
	arrayPush.apply(mutators, klass.$$mutator);
	// hook for namespaces!
	if (klass.getMutators) {
		arrayPush.apply(mutators, klass.getMutators() || []);
	}
	for (i = 0, l = mutators; i < l; i++) {
		if (!(mutators[i] instanceof Mutator)) {
			throw new Error("Mutator objects can only be instances of \"Mutator\", please use createMutator.");
		}
	}
	mutators.sort(function(a, b) {
		return a.priority === b.priority ? 0 : (a.priority > b.priority ? -1 : 1);
	});
	return mutators;
};

// export methods to the main object
extend(exportNames, {
	// direct access functions
	Mutator : Mutator,
	addMutator : addMutator,
	removeMutator : removeMutator
});
