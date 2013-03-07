module.exports = function(grunt) {
	"use strict";

	grunt.initConfig({
		pkg : grunt.file.readJSON("package.json"),

		compare_size : {
			files : [ "dist/classify.js", "dist/classify.min.map", "dist/classify.min.js" ]
		},

		concat : {
			dist : {
				src : [ "src/intro.js", "src/core.js", "src/create.js", "src/mutator.static.js", "src/mutator.nowrap.js", "src/mutator.alias.js", "src/mutator.bind.js", "src/observer.js", "src/mutator.observable.js", "src/namespace.js", "src/export.js", "src/outro.js" ],
				dest : "dist/classify.js",
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
					beautify : {
						ascii_only : true
					},
					mangle : true
				}
			}
		}
	});

	// grunt.loadNpmTasks("grunt-compare-size");
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks("grunt-contrib-uglify");

	// Default grunt
	grunt.registerTask("default", [ "concat", "jshint", "uglify" ]);
};
