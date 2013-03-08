var fs = require("fs");

module.exports = function(grunt) {
	"use strict";

	grunt.initConfig({
		pkg : grunt.file.readJSON("package.json"),

		compare_size : {
			files : [ "dist/classify.js", "dist/classify.min.map", "dist/classify.min.js" ]
		},

		concat : {
			dist : {
				src : [ "srcwrap/intro.js", "src/core.js", "src/create.js", "src/mutator.static.js", "src/mutator.nowrap.js", "src/mutator.alias.js", "src/mutator.bind.js", "src/observer.js", "src/mutator.observable.js", "src/namespace.js", "src/export.js", "srcwrap/outro.js" ],
				dest : "dist/classify.js",
			},
			options : {
				banner : fs.readFileSync("srcwrap/copyright.js", "utf8")
			}
		},

		jshint : {
			dist : {
				src : [ "dist/classify.js" ],
				options : {
					latedef : true,
					noempty : true,
					undef : true,
					strict : true,
					node : true,
					browser : true,
					quotmark : "double",
					maxcomplexity : 7,
					predef : []
				}
			}
		},

		uglify : {
			all : {
				files : {
					"dist/classify.min.js" : [ "dist/classify.js" ]
				},
				options : {
					banner : "/*! ClassifyJs v<%= pkg.version %> | (c) 2011-<%= grunt.template.today(\"yyyy\") %>, Wei Kin Huang | <%= pkg.homepage %> | MIT license | <%= grunt.template.today(\"yyyy-mm-dd\") %> */;",
					sourceMap : "dist/classify.min.map",
					sourceMappingURL : "classify.min.map",
					sourceMapPrefix : 1,
					beautify : {
						ascii_only : true
					},
					mangle : true
				}
			}
		},

		qunit : {
			all : [ 'test/*.html' ]
		},

		"qunit-cov" : {
			test : {
				minimum : 0.95,
				srcDir : "src",
				depDirs : [ "test" ],
				outDir : "coverage",
				testFiles : [ "test/*.html" ]
			}
		}
	});

	grunt.loadNpmTasks("grunt-compare-size");
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-qunit");
	// grunt.loadNpmTasks("grunt-contrib-nodeunit");
	grunt.loadNpmTasks("grunt-qunit-cov");

	// Default grunt
	grunt.registerTask("default", [ "concat", "jshint", "uglify" ]);

	// Other tasks
	grunt.registerTask("all", [ "concat", "jshint", "qunit", "uglify" ]);
	grunt.registerTask("lint", [ "concat", "jshint" ]);
	grunt.registerTask("test", [ "qunit" ]);
	grunt.registerTask("coverage", [ "qunit", "qunit-cov" ]);
};
