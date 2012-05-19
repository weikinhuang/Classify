module.exports = {
	name : "classify",
	pkg : "package.json",
	version : "0.9.6",
	wrap : {
		copy : [ "copyright.js" ],
		intro : [ "intro.js" ],
		outro : [ "outro.js" ]
	},
	src : [ "core.js", "create.js", "mutator.static.js", "mutator.nowrap.js", "mutator.alias.js", "observer.js", "mutator.observable.js", "namespace.js", "export.js" ],
	unit : [ "core.js", "create.js", "observer.js", "namespace.js", "export.js" ],
	perf : [],
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
		markdown : "README"
	},
	build : "clean lint unit concat min size"
};
