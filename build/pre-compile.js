#!/usr/bin/env node

var print = require("sys").print,
	src = require("fs").readFileSync("/dev/stdin", "utf8").toString();

var proto = (/(\w+)\s*=\s*"prototype"/m).exec(src);
if(proto) {
	src = src.replace(/\.prototype\b/g, "[" + proto[1] + "]");
}

print( src );
