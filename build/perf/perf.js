(function(window, tests) {

	function addListener(element, eventName, handler) {
		if (typeof element.addEventListener != 'undefined') {
			element.addEventListener(eventName, handler, false);
		} else if (typeof element.attachEvent != 'undefined') {
			element.attachEvent('on' + eventName, handler);
		}
		return element;
	}

	var table = document.getElementById("perf-tests");
	var statusElem = document.getElementById("perf-status");

	var textProp = document.all ? "innerText" : "textContent";

	tests.on("add", function(e) {
		var test = e.target;
		var tr = document.createElement("tr");
		var tdName = document.createElement("th");
		var tdBody = document.createElement("td");
		var tdStatus = document.createElement("td");
		var i = 0;

		var preBody = document.createElement("pre");
		tdBody.appendChild(preBody);

		var aName = document.createElement("a");
		aName.href = "#restart";
		tdName.appendChild(aName);
		addListener(aName, "click", function() {
			test.abort().reset().run({
				async : true,
				queue : true
			});
			return false;
		});

		tdName.className = "test-name";
		tdBody.className = "test-body";
		tdStatus.className = "test-status";

		aName[textProp] = test.name;
		preBody[textProp] = test.fn.toString().replace(/\t/g, "    ").replace(/^function\s*\(.*\)\s*\{\s*[\n\r]+/, "").replace(/\s*[\n\r]+\s*}\s*$/, "").replace(/^\    /gm, "");
		tdStatus[textProp] = "Ready";

		tr.appendChild(tdName);
		tr.appendChild(tdStatus);
		tr.appendChild(tdBody);
		table.appendChild(tr);

		// bind events
		test.on("start", function(e) {
			tr.className = "";
			statusElem[textProp] = "Starting: " + this.name;
			tdStatus[textProp] = "Running...";
			i = 0;
		}).on("cycle", function(e) {
			var size = ++i;
			statusElem.innerHTML = this.name + " &times; " + Benchmark.formatNumber(this.count) + " (" + size + " sample" + (size == 1 ? "" : "s") + ")";
		}).on("error", function(e) {
			tr.className = "test-error";
		}).on("reset", function(e) {
			tdStatus[textProp] = "Ready";
		}).on("complete", function(e) {
			if (this.error) {
				tdStatus.innerHTML = this.error.message;
				return;
			}
			tdStatus.title = "Ran " + Benchmark.formatNumber(this.count) + " times in " + this.times.cycle.toFixed(3) + " seconds.";
			tdStatus.innerHTML = Benchmark.formatNumber(this.hz.toFixed(this.hz < 100 ? 2 : 0)) + " <small>(&plusmn;" + this.stats.rme.toFixed(2) + "%)</small>";
		});
	});

	tests.on("complete", function() {
		statusElem[textProp] = "All tests completed!";
	}).on("reset", function() {
		statusElem[textProp] = "Initializing...";
	});

	// wrapper function to add a test group
	window.Benchmark.test = function(group, testGroup) {
		testGroup(function(name, test) {
			tests.add.call(tests, group + "." + name, test);
		});
	};
})(this, ___benchmarks);
