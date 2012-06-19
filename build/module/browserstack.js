// include the necessary module
var fs = require("fs");
var childProcess = childProcess = require("child_process");
var http = require("http");
var url = require("url");
var path = require("path");
var BrowserStack = require("../vendor/browserstack/browserstack.js");
var io = require("socket.io");
// classify library
var Classify = require("../vendor/classify/classify.min.js");
// require the special array library
require("../vendor/classify/classify-array.min.js")(Classify);
var cArray = Classify("/Array");

var Browser = Classify.create({
	__static_ : {
		uaBrowserMatch : {
			chrome : /chrome\/(\d+(\.\d+)?)/,
			safari : /version\/(\d+(\.\d+)?)/,
			opera : /version\/(\d+(\.\d+)?)/,
			firefox : /firefox\/(\d+(\.\d+)?)/,
			msie : /msie (\d+(\.\d+)?)/
		},
		uaToBrowser : function(ua) {
			var browser = {
				browser : "none",
				version : 0,
				os : "other"
			};
			var osMatches, browserMatches, versionMatches;
			ua = ua.toLowerCase();

			osMatches = /(windows|mac|linux)/.exec(ua);
			if (osMatches == null) {
				return;
			}
			browser.os = osMatches[1];

			browserMatches = /(chrome|safari|opera|firefox|msie)/.exec(ua);
			if (browserMatches == null) {
				return;
			}
			browser.browser = browserMatches[1];
			versionMatches = this.uaBrowserMatch[browser.browser].exec(ua);
			if (versionMatches == null) {
				return;
			}
			// clean up
			if (browser.browser === "msie") {
				browser.browser = "ie";
			}
			if (browser.os === "windows") {
				browser.os = "win";
			}

			browser.version = versionMatches[1];
			return browser.browser + " " + browser.version + " " + browser.os;
		}
	},
	init : function(build, config) {
		this.os = config.os;
		this.device = config.device;
		this.browser = config.browser;
		this.version = config.version;
		this.name = (this.browser || this.device) + " " + this.version + " " + this.os;
		this.build = build;
		this.id = 0;

		this.runtime = 0;
		this.failed = 0;
		this.passed = 0;
		this.total = 0;
		this.results = {};
	},
	setBrowserStackClient : function(client) {
		this.browserstack = client;
	},
	setSocket : function(socket) {
		var self = this, index = 0;
		this.socket = socket;
		this.build.printLine(this.build.color("= ", 34) + "Browser " + this.build.color(this.name, "bold") + " connected");
		socket.on("assertionDone", function(data) {
			data.index = ++index;
			self.logEvent("assertionDone", data);
		});
		socket.on("testStart", function(data) {
			self.logEvent("testStart", data);
		});
		socket.on("testDone", function(data) {
			self.logEvent("testDone", data);
		});
		socket.on("moduleStart", function(data) {
			self.logEvent("moduleStart", data);
		});
		socket.on("moduleDone", function(data) {
			self.logEvent("moduleDone", data);
		});
		socket.on("done", function(data) {
			self.logEvent("done", data);
		});
	},
	setCallback : function(callback) {
		this.callback = callback;
	},
	start : function() {
		var self = this;
		var options = {
			version : this.version,
			os : this.os,
			url : "http://" + (self.build.getOption("browserstack.ip") || "127.0.0.1") + ":" + parseInt(self.build.getOption("browserstack.port") || 80, 10) + "/build/bridge/qunit-browserstack-bridge.html?__browser=" + encodeURIComponent(this.name),
			timeout : 60
		};
		if (this.browser) {
			options.browser = this.browser;
		} else if (this.device) {
			options.device = this.device;
		}

		this.browserstack.createWorker(options, function(error, worker) {
			if (error) {
				self.callback();
				return;
			}
			self.build.printLine(self.build.color("* ", 34) + "Browser " + self.build.color(self.name, "bold") + " initialized");
			self.id = worker.id;
			self.onWait();
		});
	},
	stopWorker : function(callback) {
		var self = this;
		if (this.id) {
			this.browserstack.terminateWorker(this.id, function() {
				self.id = 0;
				if (callback) {
					callback();
				}
			});
		} else {
			if (callback) {
				callback();
			}
		}
		return this;
	},
	onWait : function() {
		var self = this, i = 0, pattern = [ "|", "/", "-", "\\" ];
		var runner = function() {
			self.browserstack.getWorker(self.id, function(error, worker) {
				if (worker.status !== "running") {
					self.build.printTemp(pattern[i++ % 4] + " Waiting for: " + self.build.color(self.name, "bold"));
					setTimeout(runner, 1000);
				}
			});
		};
		runner();
	},
	logEvent : function(type, data) {
		switch (type) {
			case "assertionDone":
				if (data.result === false) {
					if (!this.results[data.module]) {
						this.results[data.module] = [];
					}
					this.results[data.module].push(data);
				}
				break;
			case "testStart":
				this.build.printTemp("Running: " + this.name + " " + this.build.color(data.module, "bold") + " " + data.name);
				break;
			case "testDone":
				break;
			case "moduleStart":
				break;
			case "moduleDone":
				break;
			case "done":
				this.failed = data.failed;
				this.passed = data.passed;
				this.total = data.total;
				this.runtime = data.runtime;
				if (this.failed > 0) {
					this.build.printLine(this.build.color("\u2716 ", 160) + "Browser " + this.build.color(this.name, "bold") + " completed tests");
				} else {
					this.build.printLine(this.build.color("\u2714 ", 34) + "Browser " + this.build.color(this.name, "bold") + " completed tests");
				}
				this.stopWorker();
				this.callback();
				break;
		}
	},
	process : function() {
		var self = this, build = this.build;
		build.printLine("Tests results for: " + build.color(this.name, "bold"));
		Object.keys(this.results).forEach(function(test) {
			build.printLine(build.color("Module: ", "bold") + test);
			self.results[test].forEach(function(assertion) {
				build.printLine("    " + (assertion.result ? build.color("\u2714  ", 34) : build.color("\u2716 ", 160)) + build.color("Test # ", "bold") + assertion.index + "/" + self.total);
				build.printLine("        " + assertion.message + " [" + build.color(assertion.test, 248) + "]");
				if (typeof assertion.expected !== "undefined") {
					build.printLine("            -> " + build.color("Expected: " + assertion.expected, 34));
					// if test failed, then we need to output the result
					if (!assertion.result) {
						build.printLine("            ->   " + build.color("Result: " + assertion.actual, 160));
					}
				}
			});
		});

		if (this.failed > 0) {
			build.printLine(build.color("\u2716 ", 160) + this.failed + " / " + this.total + " Failed");
		} else {
			build.printLine(build.color("\u2714 ", 34) + "All tests [" + this.passed + " / " + this.total + "] passed!");
		}
		build.printLine();
	}
});

var BrowserList = Classify.create({
	init : function(build, server) {
		this.build = build;
		this.browsers = {};
		this.validbrowsers = null;
		this.client = BrowserStack.createClient({
			username : this.build.getOption("browserstack.username"),
			password : this.build.getOption("browserstack.password")
		});
	},
	setCallback : function(callback) {
		this.callback = callback;
	},
	setServer : function(server) {
		this.server = server;
	},
	terminateOldWorkers : function() {
		// kill existing workers
		var self = this;
		this.client.getWorkers(function(error, workers) {
			workers.forEach(function(worker) {
				self.client.terminateWorker(worker.id, function() {
					self.build.printTemp("Terminated worker: " + worker.id);
				});
			});
		});
	},
	listBrowsers : function(callback) {
		var self = this;
		if (this.validbrowsers !== null) {
			callback(this.validbrowsers);
			return this;
		}
		this.client.getBrowsers(function(error, browsers) {
			if (error) {
				throw error;
			}
			self.validbrowsers = browsers;
			callback(browsers);
		});
		return this;
	},
	addBrowser : function(config) {
		var browser = new Browser(this.build, config);
		browser.setBrowserStackClient(this.client);
		this.browsers[browser.name] = browser;
		return browser;
	},
	getBrowser : function(name) {
		return this.browsers[name];
	},
	start : function() {
		var self = this, list = cArray().getNewObject(Object.keys(this.browsers));
		list.threadEach(function(next, name) {
			var browser = this.getBrowser(name);
			browser.setCallback(next);
			browser.start();
		}, function() {
			this.server.stop();
			// output results && kill all the running workers before stopping
			self.build.printLine();
			list.threadEach(function(next, name) {
				var browser = this.getBrowser(name);
				browser.process();
				browser.stopWorker(next);
			}, function() {
				self.callback();
			}, this);
		}, this);
	}
});

var Server = Classify.create({
	__static_ : {
		contentType : {
			js : "text/javascript",
			json : "text/javascript",
			css : "text/css",
			html : "text/html"
		}
	},
	init : function(build) {
		this.build = build;
		this.server = null;
		this.tunnel = null;
	},
	setList : function(list) {
		this.list = list;
	},
	start : function(callback) {
		if (this.server) {
			callback();
			return this;
		}
		var self = this;
		this.server = http.createServer(function(request, response) {
			var uri = url.parse(request.url).pathname, filename = path.join(self.build.dir.base, uri);
			self.build.printTemp(filename);
			path.exists(filename, function(exists) {
				if (!exists) {
					response.writeHead(404, {
						"Content-Type" : "text/plain"
					});
					response.write("404 Not Found\n");
					response.end();
					return;
				}

				if (fs.statSync(filename).isDirectory()) {
					filename = filename.replace(/\/$/, "") + "/index.html";
				}

				fs.readFile(filename, "binary", function(err, file) {
					if (err) {
						response.writeHead(500, {
							"Content-Type" : "text/plain"
						});
						response.write(err + "\n");
						response.end();
						return;
					}

					response.writeHead(200, {
						"Content-Type" : self.constructor.contentType[filename.split(".").pop()] || "text/html"
					});
					response.write(file, "binary");
					response.end();
				});
			});
		}).listen(parseInt(this.build.getOption("browserstack.port") || 80, 10), function() {
			var host = self.build.getOption("browserstack.ip") || "127.0.0.1";
			var port = parseInt(self.build.getOption("browserstack.port") || 80, 10);
			self.build.printLine("Unit test server running at => http://" + host + ":" + port);

			if (self.build.getOption("browserstack.tunnel") === true || self.build.getOption("browserstack.tunnel") === "true") {
				self.tunnel = childProcess.spawn("ssh", [ "-R", port + ":localhost:" + port, host, "-N" ], {
					env : process.env
				});
				self.tunnel.stderr.setEncoding("utf8");
				self.tunnel.stderr.on("data", function(stderr) {
					self.build.printLine(stderr);
				});
				setTimeout(callback, 1000);
			} else {
				self.build.printLine("Possibly create a reverse tunnel with: \"ssh -f -R " + port + ":localhost:" + port + " " + host + " -N\"");
				setTimeout(callback, 1);
			}
		});

		io.listen(this.server, {
			log : false,
			transports : [ "websocket", "flashsocket", "htmlfile", "jsonp-polling" ],
			"flash policy port" : parseInt(this.build.getOption("browserstack.port") || 80, 10)
		}).sockets.on("connection", function(socket) {
			socket.on("browserConnect", function(data) {
				self.list.getBrowser(data.browser).setSocket(socket);
			});
		});

		return this;
	},
	stop : function() {
		if (this.server) {
			this.server.close();
		}
		if (this.tunnel) {
			this.tunnel.kill();
		}
		return this;
	}
});

module.exports = function(build, callback) {
	build.printHeader(build.color("Running unit tests on BrowserStack.com...", "bold"));

	var server = new Server(build);
	server.start(function() {
		var list = new BrowserList(build);
		// kill existing workers
		list.terminateOldWorkers();
		list.setCallback(callback);
		list.setServer(server);
		server.setList(list);
		list.listBrowsers(function(browsers) {
			(build.getOption("browserstack.browsers") || []).forEach(function(browser) {
				list.addBrowser(browser);
			});
			list.start();
		});
	});
};
