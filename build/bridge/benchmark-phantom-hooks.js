(function(window, tests) {
	// pass data to the process
	function send(data) {
		alert(JSON.stringify(data));
	}

	tests.on("add", function(e) {
		var i = 0, test = e.target, testData = {
			id : test.id,
			name : test.name
		};

		// bind events
		test.on("start", function(e) {
			i = 0;
			send({
				event : "testStart",
				data : testData
			});
		}).on("cycle", function(e) {
			send({
				event : "testCycle",
				data : {
					id : this.id,
					name : this.name,
					size : ++i,
					count : this.count
				}
			});
		}).on("error", function(e) {
			send({
				event : "testError",
				data : testData
			});
		}).on("reset", function(e) {
			send({
				event : "testReset",
				data : testData
			});
		}).on("complete", function(e) {
			var data = {
				id : this.id,
				name : this.name,
				stats : this.stats,
				times : this.times,
				count : this.count,
				cycles : this.cycles,
				hz : this.hz
			};
			if (this.error) {
				data.error = this.error.message;
			}

			send({
				event : "testComplete",
				data : data
			});
		});
	});

	tests.on("complete", function() {
		send({
			event : "done",
			data : {}
		});
	});

	// wrapper function to add a test group
	window.Benchmark.test = function(group, testGroup) {
		testGroup(function(name, test) {
			tests.add.call(tests, group + "." + name, test);
		});
	};
})(window, ___benchmarks);
