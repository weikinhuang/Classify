(function() {
	var currentmodule = null, currenttest = null;

	// Run tests in the order they were defined.
	QUnit.config.reorder = false;
	// Run tests in series.
	QUnit.config.autorun = false;

	// keep reference to original functions
	var original_log = QUnit.log,
	// original test hooks
	original_testStart = QUnit.testStart, original_testDone = QUnit.testDone,
	// original module hooks
	original_moduleStart = QUnit.moduleStart, original_moduleDone = QUnit.moduleDone,
	// original done hook
	original_done = QUnit.done;

	// pass data to the process
	function send(data) {
		alert(JSON.stringify(data));
	}

	QUnit.log = function(data) {
		if (data.message === '[dataect Object], undefined:undefined') {
			return;
		}
		data.module = currentmodule;
		data.test = currenttest;
		data.actual = QUnit.jsDump.parse(data.actual);
		data.expected = QUnit.jsDump.parse(data.expected);
		send({
			event : "assertionDone",
			data : data
		});
		original_log.apply(this, arguments);
	};

	QUnit.testStart = function(data) {
		currentmodule = data.module || currentmodule;
		currenttest = data.name || currenttest;

		send({
			event : "testStart",
			data : data
		});
		original_testStart.apply(this, arguments);
	};

	QUnit.testDone = function(data) {
		data.module = data.module || currentmodule;

		send({
			event : "testDone",
			data : data
		});
		original_testDone.apply(this, arguments);
	};

	QUnit.moduleStart = function(data) {
		send({
			event : "moduleStart",
			data : data
		});
		original_moduleStart.apply(this, arguments);
	};

	QUnit.moduleDone = function(data) {
		send({
			event : "moduleDone",
			data : data
		});
		original_moduleDone.apply(this, arguments);
	};

	QUnit.done = function(data) {
		var coverage = {};
		Object.keys(window._$jscoverage).forEach(function(key) {
			coverage[key] = {
				lines : Array.prototype.slice.call(window._$jscoverage[key], 0),
				conditionals : window._$jscoverage[key].conditionals || []
			};
		});
		data.coverage = coverage;
		send({
			event : "done",
			data : data
		});
		original_done.apply(this, arguments);
	};
})();
