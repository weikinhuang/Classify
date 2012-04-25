module.exports = (function(root) {

	// include the fs mmodule
	var fs = require("fs"),
	// execute system commands
	exec = require("child_process");

	function lpad(str, len, chr) {
		return (Array(len + 1).join(chr || " ") + str).substr(-len);
	}

	function gzip(data, callback) {
		var gzip = exec.spawn("gzip", [ "-c", "-q", "-" ]), output = "";
		// Promise events
		gzip.stdout.setEncoding("utf-8");
		gzip.stdout.on("data", function(stdout) {
			output += stdout.toString();
		});
		gzip.on("exit", function(code) {
			callback(output, output.length);
		});
		gzip.stdin.end((data || "").toString(), "utf-8");
	}

	return function(options, source, callback) {
		callback.print("Checking sizes against previous build...");
		var oldsizes = {}, sizes = {};
		try {
			oldsizes = JSON.parse(fs.readFileSync(options.dir.build + "/.sizecache.json", "utf-8"));
		} catch (e) {
		}

		sizes[options.name + ".js"] = source.source.length;
		sizes[options.name + ".min.js"] = source.minSource.length;

		gzip(source.minSource, function(data, length) {
			sizes[options.name + ".min.js.gz"] = length;
			Object.keys(sizes).forEach(function(key) {
				var diff = oldsizes[key] && (sizes[key] - oldsizes[key]);
				if (diff > 0) {
					diff = "+" + diff;
				}
				callback.log(lpad(sizes[key], 8) + " " + lpad(diff ? "(" + diff + ")" : "(-)", 8) + " " + key);
			});
			fs.writeFile(options.dir.build + "/.sizecache.json", JSON.stringify(sizes, true), "utf-8", function() {
				callback();
			});
		});
	};
})(global);