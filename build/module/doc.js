module.exports = (function(root) {

	// include the fs mmodule
	var fs = require("fs"),
	// include the path module
	path = require("path");

	function trim(str) {
		return str.replace(/^\s*/, "").replace(/\s*$/, "");
	}

	function parseDocs(source) {
		var docRegexp = /\s*\/\*\*(?:[\S\s]+?)\*\//mg;
		var fnRegexp = /\bfunction(\s*|[^\(]+)?\(/;
		var commentRegexp = /^\/\*\*[\S\s]+?\s*(\*\s+@|\*\/$)/;
		var returnsRegexp = /@returns\s+([\S\s]+?)\s*(\*\s+@|\*\/$)/;
		var paramsRegexp = /@param\s+([\S\s]+?)\s*(\*\s+@|\*\/$)/g;
		var exampleRegexp = /@example\n[\S\s]+$/g;
		var staticRegexp = /@static\b/;
		var privateRegexp = /@private\b/;
		var constructorRegexp = /@constructor\b/;
		var memberOfRegexp = /@memberOf\s+.+$/m;
		var superRegexp = /@super\s+.+$/m;
		var augmentsRegexp = /@augments\s+.+$/m;
		var typeRegexp = /@type\s+.+$/m;
		var docs = [];
		// get all docblocks and the line right after it
		source.replace(docRegexp, function(match, index) {
			var docblock = trim(match);
			var definition = source.substr(match.length + index).split(/\n/g)[1];
			docs.push({
				doc : docblock,
				def : definition
			});
		});
		var docblocks = [];
		docs.forEach(function(block) {
			var doc = {};
			// pull out the docblock comment
			var commentMatch = commentRegexp.exec(block.doc);
			if (commentMatch && commentMatch[0]) {
				doc.comment = trim(commentMatch[0].replace(/^\/\*\*/, "").replace(/^\s*\*\s*/gm, "").replace(/^\s*\*\s*@\s*$/gm, "").split(/\n/g).join(" ").replace(/\s+/g, " "));
			}
			// console.log(comment);
			// console.log(block.def);
			// parse example if any
			var exampleMatch = exampleRegexp.exec(block.doc);
			if (exampleMatch && exampleMatch[0]) {
				doc.example = trim(exampleMatch[0].replace(/\s*\*\/$/, "").replace(/^\s*\*\s*/gm, "").replace(/^\s*\*\s*@\s*$/gm, "").replace(/^\s*@example/, ""));
			}

			var memberOfMatch = memberOfRegexp.exec(block.doc);
			if (memberOfMatch && memberOfMatch[0]) {
				doc.memberOf = trim(memberOfMatch[0].replace(/@memberOf\s+/, "")).replace(/^{|}$/g, "");
			}
			var typeMatch = memberOfRegexp.exec(block.doc);
			if (typeMatch && typeMatch[0]) {
				doc.type = trim(typeMatch[0].replace(/@type\s+/, "")).replace(/^{|}$/g, "");
			}

			doc.isStatic = staticRegexp.test(block.doc);
			doc.isPrivate = privateRegexp.test(block.doc);
			// var returns = staticRegexp.test(block.doc);

			// check if it is a function or not
			if (fnRegexp.test(block.def)) {
				doc.type = "function";
				doc.isConstructor = constructorRegexp.test(block.doc);
				var returnsMatch = returnsRegexp.exec(block.doc);
				if (returnsMatch && returnsMatch[0]) {
					var returnsMatchParts = {};
					var returnsMatchClean = trim(returnsMatch[1].replace(/^\s*\*\s*/gm, "").split(/\n/g).join(" ").replace(/\s+/g, " "));
					returnsMatchParts.type = (/^{?([^\s]+)}/.exec(returnsMatchClean) || [])[1] || null;
					returnsMatchParts.comment = (/^{?[^\s]+}(.+)$/.exec(returnsMatchClean) || [])[1] || null;
					doc.returns = returnsMatchParts;
				}
				var params = [];
				// strip out all the params from block
				block.doc.replace(paramsRegexp, function(match, part) {
					var paramsMatchParts = {};
					var paramsMatchClean = trim(part.replace(/^\s*\*\s*/gm, "").split(/\n/g).join(" ").replace(/\s+/g, " "));
					paramsMatchParts.type = (/^{?([^\s]+)}/.exec(paramsMatchClean) || [])[1] || null;
					paramsMatchParts.name = (/^{?[^\s]+}\s+([^\s]+)\s+.+$/.exec(paramsMatchClean) || [])[1] || null;
					paramsMatchParts.isOptional = false;
					if (/^\[.+\]$/.test(paramsMatchParts.name)) {
						var nameParts = paramsMatchParts.name.replace(/^\[|\]$/g, "").split("=");
						paramsMatchParts.isOptional = true;
						paramsMatchParts.name = nameParts.shift();
						paramsMatchParts.value = nameParts.join("=");
					}
					paramsMatchParts.comment = (/^{?[^\s]+}\s+([^\s]+)\s+(.+)$/.exec(paramsMatchClean) || [])[2] || null;
					params.push(paramsMatchParts);
				});
				doc.params = params;

				var superMatch = superRegexp.exec(block.doc);
				if (superMatch && superMatch[0]) {
					doc.superClass = trim(superMatch[0].replace(/@super\s+/, "")).replace(/^{|}$/g, "");
				}
				var augmentsMatch = augmentsRegexp.exec(block.doc);
				if (augmentsMatch && augmentsMatch[0]) {
					doc.augments = trim(augmentsMatch[0].replace(/@augments\s+/, "")).replace(/^{|}$/g, "");
				}
				if (/=/.test(block.def)) {
					doc.name = trim((block.def.split("=")[0] || "").replace(/^\s*var\s+/, ""));
				} else {
					doc.name = trim(block.def.replace(/^\s*function\s+/, "").replace(/([^\(]+).+$/, "$1"));
				}
			} else {
				doc.type = "var";
				doc.name = trim((block.def.split("=")[0] || "").replace(/^\s*var\s+/, ""));
			}
			docblocks.push(doc);
		});
		return docblocks;
	}

	function groupByMembers(docblocks) {
		var groups = {}, sortedGroups = {}, validGroups = {};
		docblocks.forEach(function(doc) {
			var memberOf;
			if (doc.memberOf) {
				memberOf = doc.memberOf;
			} else {
				var name = doc.name.split(".");
				name.pop();
				memberOf = name.length === 0 ? doc : name.join(".");
			}
			validGroups[memberOf] = true;
			if (!groups[memberOf]) {
				groups[memberOf] = {
					statics : [],
					prototypes : []
				};
			}
		});
		docblocks.forEach(function(doc) {
			var memberOf;
			if (doc.memberOf) {
				memberOf = doc.memberOf;
			} else {
				var name = doc.name.split(".");
				name.pop();
				memberOf = name.length === 0 ? doc : name.join(".");
			}
			if (doc.name === memberOf || validGroups[doc.name]) {
				groups[doc.name].base = doc;
			} else {
				groups[memberOf][/\.prototype\b/.test(doc.name) ? "prototypes" : "statics"].push(doc);
			}
		});
		Object.keys(groups).sort().forEach(function(key) {
			sortedGroups[key] = groups[key];
		});
		return sortedGroups;
	}

	return function(options, source, callback) {
		if (options.docs.length === 0) {
			callback();
			return;
		}
		var docsfile = [];
		options.docs.forEach(function(file) {
			docsfile.push(fs.readFileSync(options.dir.doc + "/" + file, "utf8").replace(/\r/g, ""));
		});
		var docblocks = parseDocs(docsfile.join("\n"));

		var groups = groupByMembers(docblocks);
		console.log(groups);

		callback();
	};
})(global);
