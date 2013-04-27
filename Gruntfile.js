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

		"qunit-node" : {
			all : {
				code : [ "src/core.js", "src/create.js", "src/mutator.static.js", "src/mutator.nowrap.js", "src/mutator.alias.js", "src/mutator.bind.js", "src/observer.js", "src/mutator.observable.js", "src/namespace.js", "src/export.js" ],
				tests : [ "test/core.js", "test/create.js", "test/mutator.static.js", "test/mutator.nowrap.js", "test/mutator.alias.js", "test/mutator.bind.js", "test/observer.js", "test/mutator.observable.js", "test/namespace.js", "test/export.js" ],
				setUp : function() {
					this.root = this;
				}
			}
		},

		"qunit-cov" : {
			test : {
				minimum : 0.95,
				srcDir : "src",
				depDirs : [ "test" ],
				outDir : "coverage",
				testFiles : [ "test/*.html" ]
			}
		},

		yuidoc : {
			compile : {
				name : '<%= pkg.name %>',
				description : '<%= pkg.description %>',
				version : '<%= pkg.version %>',
				url : '<%= pkg.homepage %>',
				options : {
					paths : 'src/',
					outdir : 'docs/yuidoc/'
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-compare-size");
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-qunit");
	grunt.loadNpmTasks("grunt-qunit-cov");
	grunt.loadNpmTasks('grunt-contrib-yuidoc');

	grunt.registerMultiTask('qunit-node', 'Run QUnit unit tests in node sandbox.', function() {
		// Nodejs libs.
		var path = require("path"),
		// This task is asynchronous.
		done = this.async(),
		// Reset status.
		status = {
			failed : 0,
			passed : 0,
			total : 0,
			duration : 0
		},
		// other vars
		child;

		// Allow an error message to retain its color when split across multiple lines.
		var formatMessage = function(str) {
			return String(str).split('\n').map(function(s) {
				return s.magenta;
			}).join('\n');
		};

		// Keep track of failed assertions for pretty-printing.
		var failedAssertions = [];
		var logFailedAssertions = function() {
			var assertion;
			// Print each assertion error.
			while (assertion = failedAssertions.shift()) {
				grunt.verbose.or.error(assertion.testName);
				grunt.log.error('Message: ' + formatMessage(assertion.message));
				if (assertion.actual !== assertion.expected) {
					grunt.log.error('Actual: ' + formatMessage(assertion.actual));
					grunt.log.error('Expected: ' + formatMessage(assertion.expected));
				}
				if (assertion.source) {
					grunt.log.error(assertion.source.replace(/ {4}(at)/g, '  $1'));
				}
				grunt.log.writeln();
			}
		};

		child = require("child_process").fork(path.join(__dirname, "test/bridge/qunit-node-bridge.js"), [ JSON.stringify({
			data : this.data,
			dir : __dirname,
			setUp : (this.data.setUp || "").toString()
		}) ], {
			env : process.env
		});

		child.on("message", function(message) {
			var data = message.data || {};
			switch (message.event) {
				case "assertionDone":
					if (data.result === false) {
						failedAssertions.push({
							actual : data.actual,
							expected : data.expected,
							message : data.message,
							source : data.source,
							testName : (data.module ? data.module + ' - ' : '') + data.name
						});
					}
					break;
				case "testStart":
					grunt.verbose.write((data.module ? data.module + ' - ' : '') + data.name + '...');
					break;
				case "testDone":
					// Log errors if necessary, otherwise success.
					if (data.failed > 0) {
						// list assertions
						if (grunt.option('verbose')) {
							grunt.log.error();
							logFailedAssertions();
						} else {
							grunt.log.write('F'.red);
						}
					} else {
						grunt.verbose.ok().or.write('.');
					}
					break;
				case "moduleStart":
					break;
				case "moduleDone":
					break;
				case "done":
					status.failed += data.failed;
					status.passed += data.passed;
					status.total += data.total;
					status.duration += data.runtime;
					// Print assertion errors here, if verbose mode is disabled.
					if (!grunt.option('verbose')) {
						if (data.failed > 0) {
							grunt.log.writeln();
							logFailedAssertions();
						} else {
							grunt.log.ok();
						}
					}
					// Log results.
					if (status.failed > 0) {
						grunt.warn(status.failed + '/' + status.total + ' assertions failed (' + status.duration + 'ms)');
						done(false);
					} else if (status.total === 0) {
						grunt.warn('0/0 assertions ran (' + status.duration + 'ms)');
					} else {
						grunt.verbose.writeln();
						grunt.log.ok(status.total + ' assertions passed (' + status.duration + 'ms)');
					}
					break;
			}
			if (message.event === "done") {
				child.kill();
				done();
			}
		});

		child.on("exit", function(exit_code) {
			if (exit_code > 0 && exit_code !== 143) {
				done(false);
			}
		});
	});

	// Default grunt
	grunt.registerTask("default", [ "concat", "jshint", "uglify" ]);

	// Other tasks
	grunt.registerTask("all", [ "concat", "jshint", "qunit", "qunit-node", "uglify", "compare_size" ]);
	grunt.registerTask("lint", [ "concat", "jshint" ]);
	grunt.registerTask("test", [ "qunit", "qunit-node" ]);
	grunt.registerTask("doc", [ "yuidoc" ]);
	grunt.registerTask("coverage", [ "qunit", "qunit-node", "qunit-cov" ]);
};
