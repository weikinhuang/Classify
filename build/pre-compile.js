#!/usr/bin/env node

var print = require(/^v0\.[012]/.test(process.version) ? "sys" : "util").print,
	src = require("fs").readFileSync("/dev/stdin", "utf8").toString();

print( src );
