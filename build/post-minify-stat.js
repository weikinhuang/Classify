var print = require("sys").print,
	fs = require("fs"),
	exec = require('child_process').exec,
	src = fs.readFileSync(process.argv[2], "utf8"),
	min = fs.readFileSync(process.argv[3], "utf8");

function escapeshellarg (arg) {
	var ret = '';
	ret = arg.replace(/[^\\]'/g, function (m, i, s) {
		return m.slice(0, 1) + '\\\'';
	});
	return "'" + ret + "'";
}

print( "Original Size:	" + src.length + " bytes\n" );
print( "Compiled Size:	" + min.length + " bytes\n" );

print( "        Saved:	" + ((src.length - min.length) / src.length * 100).toFixed(2) + "% off the original size\n" );

/*
exec("gzip -cq " + escapeshellarg(process.argv[2]), function (error_s, stdout_s) {
	exec("gzip -cq " + escapeshellarg(process.argv[3]), function (error_m, stdout_m) {
		print( "Original Size:	" + src.length + " bytes (" + stdout_s.length + " bytes gzipped)\n" );
		print( "Compiled Size:	" + min.length + " bytes (" + stdout_m.length + " bytes gzipped)\n" );

		print( "        Saved:	" + ((src.length - min.length) / src.length * 100).toFixed(2) + "% off the original size (" + ((stdout_s.length - stdout_m.length) / stdout_s.length * 100).toFixed(2) + "% off the gzipped size)\n" );
	});
});
*/