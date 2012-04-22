(function(tests) {
	tests.on("add", function(e) {
		// bind events
		e.target.on("complete", function(e) {
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

			alert(JSON.stringify({
				event : "testDone",
				data : data
			}));
		});
	});

	tests.on("complete", function() {
		alert(JSON.stringify({
			event : "done",
			data : {}
		}));
	});
})(___benchmarks);
