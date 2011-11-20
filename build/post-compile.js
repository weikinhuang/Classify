#!/usr/bin/env node

var print = require("sys").print,
	src = require("fs").readFileSync(process.argv[2], "utf8");

// Previously done in sed but reimplemented here due to portability issues
src = src.replace( /^(\s*\*\/)(.+)/m, "$1\n$2" ) + ";";

var proto = (/(\w+)="prototype"/).exec(src);
if(proto) {
	src = src.replace(/\.prototype\b/g, "[" + proto[1] + "]");
}

print( src );
