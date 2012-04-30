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
		var paramsRegexp = /@param\s+([\S\s]+?)\s*(?:\*\s*@|\*\/$)/;
		var exampleRegexp = /@example\s+[\S\s]+$/g;
		var staticRegexp = /@static\b/;
		var privateRegexp = /@private\b/;
		var constructorRegexp = /@constructor\b/;
		var memberOfRegexp = /@memberOf\s+.+$/m;
		var nameRegexp = /@name\s+.+$/m;
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
			// parse example if any
			var exampleMatch = exampleRegexp.exec(block.doc);
			if (exampleMatch && exampleMatch[0]) {
				doc.example = trim(trim(exampleMatch[0].replace(/\s*\*\/$/, "").replace(/^\s*\*\s*/gm, "").replace(/^\s*\*\s*@\s*$/gm, "").replace(/^\s*@example/, "")).replace(/^\<code\>/, "").replace(/\<\/code\>$/, ""));
			}

			var memberOfMatch = memberOfRegexp.exec(block.doc);
			if (memberOfMatch && memberOfMatch[0]) {
				doc.memberOf = trim(memberOfMatch[0].replace(/@memberOf\s+/, "")).replace(/^{|}$/g, "");
			}
			var typeMatch = typeRegexp.exec(block.doc);
			if (typeMatch && typeMatch[0]) {
				doc.type = trim(typeMatch[0].replace(/@type\s+/, "")).replace(/^{|}$/g, "");
			}

			doc.isStatic = staticRegexp.test(block.doc);
			doc.isPrivate = privateRegexp.test(block.doc);

			// check if it is a function or not
			if (fnRegexp.test(block.def)) {
				doc.varType = "function";
				doc.isConstructor = constructorRegexp.test(block.doc);
				var returnsMatch = returnsRegexp.exec(block.doc);
				if (returnsMatch && returnsMatch[0]) {
					var returnsMatchParts = {};
					var returnsMatchClean = trim(returnsMatch[1].replace(/^\s*\*\s*/gm, "").split(/\n/g).join(" ").replace(/\s+/g, " "));
					returnsMatchParts.type = (/^{?([^\s]+)}/.exec(returnsMatchClean) || [])[1] || null;
					returnsMatchParts.comment = (/^{?[^\s]+}(.+)$/.exec(returnsMatchClean) || [])[1] || null;
					doc.returns = returnsMatchParts;
				}
				var params = [], paramMatcher, paramBlock = block.doc;
				// strip out all the params from block
				while ((paramMatcher = paramsRegexp.exec(paramBlock)) !== null) {
					var paramsMatchParts = {};
					var paramsMatchClean = trim(paramMatcher[1].replace(/^\s*\*\s*/gm, "").split(/\n/g).join(" ").replace(/\s+/g, " "));
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
					paramBlock = paramBlock.replace(paramsRegexp, function(match, part) {
						return match.substr(-1);
					});
				}
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
				doc.varType = "var";
				doc.name = trim((block.def.split("=")[0] || "").replace(/^\s*var\s+/, ""));
			}

			// override the name property if defined
			var nameMatch = nameRegexp.exec(block.doc);
			if (nameMatch && nameMatch[0]) {
				doc.name = trim(nameMatch[0].replace(/@name\s+/, "")).replace(/^{|}$/g, "");
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

	function createMarkdown(options, docGroups) {
		var markdown = [];
		markdown.push("# " + options.name + " `v" + options.version + "`");
		markdown.push("==================================================");
		markdown.push("");
		Object.keys(docGroups).forEach(function(key) {
			var group = docGroups[key];
			// section header
			markdown.push("## `" + key + "`");
			if (group.base) {
				markdown.push(" * [`" + key + "`](#" + key + ")");
			}
			if (group.statics.length > 0) {
				group.statics.forEach(function(doc) {
					markdown.push(" * [`" + doc.name + "`](#" + doc.name + ")");
				});
			}
			if (group.prototypes.length > 0) {
				markdown.push("");
				markdown.push("");
				markdown.push("## `" + key + ".prototype`");
				group.prototypes.forEach(function(doc) {
					markdown.push(" * [`" + doc.name.replace(/\.prototype\./, "#") + "`](#" + doc.name + ")");
				});
			}
			markdown.push("");
			markdown.push("");
		});

		Object.keys(docGroups).forEach(function(key) {
			var group = docGroups[key];
			// section header
			markdown.push("## `" + key + "`");
			if (group.base) {
				markdown.push("");
				outputMarkdownBlock(group.base, markdown);
			}
			if (group.statics.length > 0) {
				group.statics.forEach(function(doc) {
					outputMarkdownBlock(doc, markdown);
				});
			}
			if (group.prototypes.length > 0) {
				markdown.push("");
				markdown.push("");
				markdown.push("## `" + key + ".prototype`");
				group.prototypes.forEach(function(doc) {
					outputMarkdownBlock(doc, markdown);
				});
			}
			markdown.push("");
			markdown.push("");
		});
		return trim(markdown.join("\n"));
	}

	function outputMarkdownBlock(block, messages) {
		var name = block.name;
		if (block.varType === "function") {
			name += "(";
			if (block.params && block.params.length > 0) {
				block.params.forEach(function(param, i) {
					var param_str = "";
					if (i > 0) {
						param_str += ", ";
					}
					param_str += param.name;
					if (param.isOptional) {
						if (param.value) {
							param_str += "=" + param.value;
						}
						param_str = "[" + param_str + "]";
					}
					name += param_str;
				});
			}
			name += ")";
		}
		messages.push('### <a id="' + block.name + '" href="#">`' + name + "`</a>");
		messages.push(block.comment.replace(/\.$/, "") + ".");
		messages.push("[&#9650;](#)");
		messages.push("");
		if (block.varType === "function") {
			if (block.isConstructor) {
				messages.push("");
				messages.push("##### Constructor method");
			}
			if (block.superClass || block.augments) {
				messages.push("");
				messages.push("##### Extends `" + (block.superClass || block.augments) + "`");
			}
			if (block.params && block.params.length > 0) {
				messages.push("");
				messages.push("##### Arguments");
				block.params.forEach(function(param, i) {
					var param_str = "";
					param_str += param.name;
					if (param.isOptional) {
						if (param.value) {
							param_str += "=" + param.value;
						}
						param_str = "[" + param_str + "]";
					}
					name += param_str;
					var param_line = (i + 1) + ". `" + param_str + "` `{" + param.type + "}`";
					if (param.comment) {
						param_line += ": " + param.comment;
					}
					messages.push(param_line);
				});
			}

			if (block.returns) {
				messages.push("");
				messages.push("##### Returns");
				if (block.returns.comment) {
					messages.push("`" + block.returns.type + "`: " + block.returns.comment);
				} else {
					messages.push("`" + block.returns.type + "`");
				}
			}
		} else {
			if (block.comment) {
				messages.push("`" + block.type + "`: " + block.comment);
			} else {
				messages.push("`" + block.type + "`");
			}
		}
		if (block.example) {
			messages.push("");
			messages.push("##### Example");
			messages.push("```javascript");
			messages.push(block.example);
			messages.push("```");
		}
		messages.push("");
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

		if (options.doc.markdown) {
			var markdownOutputName = typeof options.doc.markdown === "string" ? options.doc.markdown : options.name;
			fs.writeFileSync(options.dir.doc + "/" + markdownOutputName + ".md", createMarkdown(options, groups), "utf8");
		}

		callback();
	};
})(global);
