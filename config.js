module.exports = {
	name : "classify",
	version : "0.9.7",
	repo : "https://github.com/weikinhuang/Classify",
	wrap : {
		copy : [ "copyright.js" ],
		intro : [ "intro.js" ],
		outro : [ "outro.js" ]
	},
	src : [ "core.js", "create.js", "mutator.static.js", "mutator.nowrap.js", "mutator.alias.js", "mutator.bind.js", "observer.js", "mutator.observable.js", "namespace.js", "export.js" ],
	unit : [ "core.js", "create.js", "mutator.static.js", "mutator.nowrap.js", "mutator.alias.js", "mutator.bind.js", "observer.js", "mutator.observable.js", "namespace.js", "export.js" ],
	perf : [ "create.js" ],
	docs : [ "classify.docs.js" ],
	env : {
		node : true,
		web : true
	},
	lint : {
		expr : true,
		node : true,
		browser : true,
		predef : []
	},
	min : {
		strict_semicolons : false,
		unsafe : true,
		lift_vars : false,
		consolidate : false,
		preparse : function(src) {
			// Previously done in sed but reimplemented here due to portability issues
			src = src.replace(/^(\s*\*\/)(.+)/m, "$1\n$2");

			var proto = (/(\w+)\s*=\s*"prototype"/).exec(src);
			if (proto) {
				src = src.replace(/\.prototype\b/g, "[" + proto[1] + "]");
			}

			return src;
		},
		mangle : {
			toplevel : false,
			defines : {},
			except : [],
			no_functions : false
		},
		squeeze : {
			make_seqs : true,
			dead_code : true
		},
		generate : {
			ascii_only : false,
			beautify : false,
			indent_level : 4,
			indent_start : 0,
			quote_keys : false,
			space_colon : false,
			inline_script : false
		}
	},
	doc : {
		markdown : "README",
		html : "classifyjs.com"
	},
	pkg : {
		file : "package.json",
		desc : {
			name : "classifyjs",
			description : "Classify.js is a library that allows for cross platform and cross browser Object Oriented Javascript class definitions using classical inheritance and namespaces behind the prototype syntax in an easy to use interface function.",
			keywords : [ "util", "functional", "server", "client", "browser", "prototype", "object-oriented", "class", "classes", "inheritance", "abstraction" ],
			author : "Wei Kin Huang <wei@closedinterval.com>",
			version : "@VERSION",
			homepage : "http://classifyjs.com",
			repository : {
				type : "git",
				url : "https://github.com/weikinhuang/Classify.git"
			},
			bugs : {
				url : "https://github.com/weikinhuang/Classify/issues"
			},
			licenses : [ {
				type : "MIT",
				url : "https://github.com/weikinhuang/Classify/blob/master/MIT-LICENSE.txt"
			} ],
			main : "dist/classify"
		}
	},
	build : "clean lint unit concat min size"
};
