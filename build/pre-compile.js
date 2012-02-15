#!/usr/bin/env node

var print = require("sys").print,
	src = require("fs").readFileSync("/dev/stdin", "utf8").toString();

print( src );
