#!/usr/bin/env node

var print = require("sys").print,
	fs = require("fs"),
	src = fs.readFileSync(process.argv[2], "utf8"),
	min = fs.readFileSync(process.argv[3], "utf8");

print( "Original Size:	" + src.length + " bytes\n" );
print( "Compiled Size:	" + min.length + " bytes\n" );

print( "        Saved:	" + (min.length / src.length * 100).toFixed(2) + "% off the original size\n" );