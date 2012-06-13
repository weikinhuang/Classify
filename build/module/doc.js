// include the fs mmodule
var fs = require("fs"),
// include the path module
path = require("path"),
// execute system commands
exec = require("child_process"),
// syntax highlighter
hljs = require('../vendor/highlight/highlight.js').hljs;
hljs.LANGUAGES.javascript = require('../vendor/highlight/highlight.javascript.js')(hljs);

function highlight(string) {
	var code = hljs.highlight("javascript", string);
	return (code && code.value) || string;
}

function roundFileSize(b, d) {
	var i = 0;
	while ((b / 1000) > 1) {
		b /= 1000;
		i++;
	}
	return b.toFixed(d === 0 || d ? d : 2) + " " + [ "b", "kb", "Mb", "Gb", "Tb" ][i];
}

function parseDocs(source) {
	var docRegexp = /\s*\/\*\*(?:[\S\s]+?)\*\//mg;
	var fnRegexp = /\bfunction(\s*|[^\(]+)?\(/;
	var commentRegexp = /^\/\*\*[\S\s]+?\s*(\*\s+@|\*\/$)/;
	var returnsRegexp = /@returns\s+([\S\s]+?)\s*(\*\s+@|\*\/$)/;
	var paramsRegexp = /@param\s+([\S\s]+?)\s*(?:\*\s*@|\*\/$)/;
	var exampleRegexp = /@example\s+<code>([\S\s]+?)<\/code>/g;
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
		var docblock = match.trim();
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
			doc.comment = commentMatch[0].replace(/^\/\*\*/, "").replace(/^\s*\*\s*/gm, "").replace(/^\s*\*\s*@\s*$/gm, "").split(/\n/g).join(" ").replace(/\s+/g, " ").trim();
		}
		// parse example if any
		var exampleMatch = exampleRegexp.exec(block.doc);
		if (exampleMatch && exampleMatch[1]) {
			doc.example = exampleMatch[1].trim().replace(/^\s*\* ?/gm, "").replace(/\t/g, "    ").trim();
		}

		var memberOfMatch = memberOfRegexp.exec(block.doc);
		if (memberOfMatch && memberOfMatch[0]) {
			doc.memberOf = memberOfMatch[0].replace(/@memberOf\s+/, "").trim().replace(/^\{|\}$/g, "");
		}
		var typeMatch = typeRegexp.exec(block.doc);
		if (typeMatch && typeMatch[0]) {
			doc.type = typeMatch[0].replace(/@type\s+/, "").trim().replace(/^\{|\}$/g, "");
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
				var returnsMatchClean = returnsMatch[1].replace(/^\s*\*\s*/gm, "").split(/\n/g).join(" ").replace(/\s+/g, " ").trim();
				returnsMatchParts.type = (/^\{?([^\s]+)\}/.exec(returnsMatchClean) || [])[1] || null;
				returnsMatchParts.comment = (/^\{?[^\s]+\}(.+)$/.exec(returnsMatchClean) || [])[1] || null;
				doc.returns = returnsMatchParts;
			}
			var params = [], paramMatcher, paramBlock = block.doc, matchCleaner = function(match, part) {
				return match.substr(-1);
			};
			// strip out all the params from block
			while ((paramMatcher = paramsRegexp.exec(paramBlock)) !== null) {
				var paramsMatchParts = {};
				var paramsMatchClean = paramMatcher[1].replace(/^\s*\*\s*/gm, "").split(/\n/g).join(" ").replace(/\s+/g, " ").trim();
				paramsMatchParts.type = (/^\{?([^\s]+)\}/.exec(paramsMatchClean) || [])[1] || null;
				paramsMatchParts.name = (/^\{?[^\s]+\}\s+([^\s]+)\s+.+$/.exec(paramsMatchClean) || [])[1] || null;
				paramsMatchParts.isOptional = false;
				if (/^\[.+\]$/.test(paramsMatchParts.name)) {
					var nameParts = paramsMatchParts.name.replace(/^\[|\]$/g, "").split("=");
					paramsMatchParts.isOptional = true;
					paramsMatchParts.name = nameParts.shift();
					paramsMatchParts.value = nameParts.join("=");
				}
				paramsMatchParts.comment = (/^\{?[^\s]+\}\s+([^\s]+)\s+(.+)$/.exec(paramsMatchClean) || [])[2] || null;
				params.push(paramsMatchParts);
				paramBlock = paramBlock.replace(paramsRegexp, matchCleaner);
			}
			doc.params = params;

			var superMatch = superRegexp.exec(block.doc);
			if (superMatch && superMatch[0]) {
				doc.superClass = superMatch[0].replace(/@super\s+/, "").trim().replace(/^\{|\}$/g, "");
			}
			var augmentsMatch = augmentsRegexp.exec(block.doc);
			if (augmentsMatch && augmentsMatch[0]) {
				doc.augments = augmentsMatch[0].replace(/@augments\s+/, "").trim().replace(/^\{|\}$/g, "");
			}
			if (block.def.indexOf("=") > -1) {
				doc.name = (block.def.split("=")[0] || "").replace(/^\s*var\s+/, "").trim();
			} else {
				doc.name = block.def.replace(/^\s*function\s+/, "").replace(/([^\(]+).+$/, "$1").trim();
			}
		} else {
			doc.varType = "var";
			doc.name = (block.def.split("=")[0] || "").replace(/^\s*var\s+/, "").trim();
		}

		// override the name property if defined
		var nameMatch = nameRegexp.exec(block.doc);
		if (nameMatch && nameMatch[0]) {
			doc.name = nameMatch[0].replace(/@name\s+/, "").trim().replace(/^\{|\}$/g, "");
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

function createMarkdown(build, docGroups, callback) {
	var markdown = [];
	markdown.push("# " + build.name + " `v" + build.version + "`");
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
	callback(markdown.join("\n").trim());
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

function parseChangelog(build) {
	var changelog_doc = fs.readFileSync(build.dir.doc + "/CHANGELOG.md", "utf8");
	changelog_doc = changelog_doc.replace(/\r/g, "");
	var changegroups = changelog_doc.split("####");
	var changelog = {};
	changegroups.forEach(function(group) {
		group = group.trim();
		if (!group) {
			return;
		}
		var changes = group.split("\n");
		var version = changes.shift();
		var changedata = [];
		changes.forEach(function(change) {
			var c = change.trim();
			if (c) {
				changedata.push(c);
			}
		});
		if (changedata.length > 0) {
			changelog[version] = changedata;
		}
	});
	return changelog;
}

function outputHtmlChangelogBlock(build, changelog) {
	var changetemplate = [];
	Object.keys(changelog).forEach(function(version) {
		changetemplate.push("<div class=\"changelog\">");
		changetemplate.push("<b class=\"changelog-header\">" + version + "</b>");
		changetemplate.push("<ul class=\"changelog-list\">");
		changelog[version].forEach(function(change) {
			changetemplate.push("<li>" + change + "</li>");
		});
		changetemplate.push("</ul>");
		changetemplate.push("</div>");
	});
	return changetemplate.join("\n");
}

function createHtmlDoc(build, docGroups) {
	var markdown = [];

	Object.keys(docGroups).forEach(function(key) {
		var group = docGroups[key];
		// section header
		markdown.push("<h3 id=\"doc-header-" + key + "\">" + key + "</h3>");
		if (group.base) {
			outputHtmlDocBlock(group.base, markdown);
		}
		if (group.statics.length > 0) {
			group.statics.forEach(function(doc) {
				outputHtmlDocBlock(doc, markdown);
			});
		}
		if (group.prototypes.length > 0) {
			group.prototypes.forEach(function(doc) {
				outputHtmlDocBlock(doc, markdown);
			});
		}
	});
	return markdown.join("\n").trim();
}

function outputHtmlDocBlock(block, messages) {
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
	messages.push("<div id=\"doc-" + block.name + "\" class=\"doc-block doc-type-" + block.varType + "\">");

	messages.push("<h4 id=\"def-" + block.name + "\">" + block.name + "</h4>");
	messages.push("<code class=\"def-definition\">" + name + "</code>");

	messages.push("<div class=\"doc-comment\">");
	messages.push(block.comment.replace(/\.$/, "").replace(/\n/g, "<br />\n") + ".");
	messages.push("</div>");

	if (block.varType === "function") {
		if (block.isConstructor) {
			messages.push("<div class=\"def-constructor\">Constructor method</div>");
		}
		if (block.superClass || block.augments) {
			messages.push("<div class=\"def-extends\">Extends <code>" + (block.superClass || block.augments) + "</code></div>");
		}
		if (block.params && block.params.length > 0) {
			messages.push("<div class=\"type-args\">");
			messages.push("<b>Arguments</b>");
			messages.push("<ol>");
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
				var param_line = "<code>" + param_str + "</code> <code>{" + param.type + "}</code>";
				if (param.comment) {
					param_line += " " + param.comment;
				}
				messages.push("<li>");
				messages.push("<span class=\"def-arg-count\">" + (i + 1) + ".</span>");
				messages.push(param_line);
				messages.push("</li>");
			});
			messages.push("</ol>");
			messages.push("</div>");
		}

		if (block.returns) {
			messages.push("<div class=\"type-return\">");
			messages.push("<b>Returns</b>");
			if (block.returns.comment) {
				messages.push("<code>" + block.returns.type + "</code> " + block.returns.comment);
			} else {
				messages.push("<code>" + block.returns.type + "</code>");
			}
			messages.push("</div>");
		}
	} else {
		if (block.comment) {
			messages.push("<code class=\"def-type\">" + block.type + "</code> " + block.comment);
		} else {
			messages.push("<code class=\"def-type\">" + block.type + "</code>");
		}
	}

	messages.push("</div>");

	if (block.example) {
		messages.push("<pre class=\"code-block javascript\">");
		messages.push(highlight(block.example));
		messages.push("</pre>");
	}
}

function createHtmlIndex(build, docGroups, callback) {
	build.getMinifiedSource(function(min) {
		build.getGzippedSource(function(zip) {
			var htmlInputName = typeof build.getOption("doc.html") === "string" ? build.getOption("doc.html") : build.name;
			var template = fs.readFileSync(build.dir.doc + "/" + htmlInputName + ".html", "utf8");
			template = template.replace(/@VERSION\b/g, build.version);
			template = template.replace(/@REPO_URI\b/g, build.repoUrl);
			template = template.replace(/@FULLSIZE\b/g, roundFileSize(min.length));
			template = template.replace(/@MINSIZE\b/g, roundFileSize(zip.length));
			template = template.replace(/@CHANGELOG\b/g, outputHtmlChangelogBlock(build, parseChangelog(build)));
			template = template.replace(/@DOCUMENTATION\b/g, createHtmlDoc(build, docGroups));
			callback(template);
		});
	});
}

module.exports = function(build, callback) {
	build.printHeader(build.color("Generating documentation files...", "bold"));

	if (!build.getOption("doc.files") || build.getOption("doc.files").length === 0) {
		callback();
		return;
	}

	var docsfile = [], num_processed = 0;
	build.getOption("doc.files").forEach(function(file) {
		docsfile.push(fs.readFileSync(build.dir.doc + "/" + file, "utf8").replace(/\r/g, ""));
	});
	var docblocks = parseDocs(docsfile.join("\n"));
	var groups = groupByMembers(docblocks);

	if (build.getOption("doc.markdown")) {
		num_processed++;
		var markdownOutputName = typeof build.getOption("doc.markdown") === "string" ? build.getOption("doc.markdown") : build.name;
		createMarkdown(build, groups, function(doc) {
			fs.writeFileSync(build.dir.doc + "/" + markdownOutputName + ".md", doc, "utf8");
			setTimeout(function() {
				if (--num_processed === 0) {
					callback();
				}
			}, 1);
		});
	}

	if (build.getOption("doc.html")) {
		num_processed++;
		var htmlOutputName = typeof build.getOption("doc.html") === "string" ? build.getOption("doc.html") : build.name;
		createHtmlIndex(build, groups, function(doc) {
			fs.writeFileSync(build.dir.doc + "/" + htmlOutputName + ".out.html", doc, "utf8");
			setTimeout(function() {
				if (--num_processed === 0) {
					callback();
				}
			}, 1);
		});
	}
};
