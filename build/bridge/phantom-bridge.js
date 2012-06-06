// create a new webpage
var page = require("webpage").create(),
// path to the bridge html file
bridge_url = phantom.args[0];

page.onAlert = function(args) {
	console.log(args);
	try {
		if (JSON.parse(args).event === "done") {
			phantom.exit(0);
		}
	} catch (e) {
	}
};

page.open(bridge_url, function(status) {
	if (status !== "success") {
		phantom.exit(1);
	}
});
