module("core");

test("basic class creation", function() {
	var c = Create({
		a : 1,
		b : function() {
			return this.a;
		},
		toString : function() {
			return "a";
		},
		valueOf : function() {
			return 2;
		}
	});

	// ok(isEven(0), 'Zero is an even number');
	// equals( 2, 1, 'one equals one');
	// same( {}, {}, 'passes, objects have the same content');

	equals(typeof c, "function", "defined class is not an object");
	equals(typeof new c(), "object", "instantiated class is not an object");
	equals(new c().a, 1, "member variable is not as defined");
	equals(new c().b(), 1, "unable to call context within context");
	equals(new c() + "", "2", "implicit toString() no called explicitly");
	equals((new c()).toString(), "a", "explicit toString() no called explicitly");
	equals(+new c(), 2, "implicit valueOf() no called explicitly");
	equals((new c()).valueOf(), 2, "explicit valueOf() no called explicitly");
});