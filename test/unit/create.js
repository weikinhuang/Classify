module("create");

test("basic class creation", function() {
	var c = Create({
		a : 1,
		b : function() {
			return this.a;
		},
		c : function() {
			return this.b();
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

	equals(typeof c, "function", "defined class is an object");
	equals(typeof new c(), "object", "instantiated class is an object");
	equals(new c().a, 1, "member variable is as defined");
	equals(new c().b(), 1, "call to member variable within context");
	equals(new c().c(), 1, "call to member function within context");

	// valueOf is always called ahead of toString when it is defined
	equals(new c() + "", "2", "implicit toString() called explicitly");
	equals((new c()).toString(), "a", "explicit toString() called explicitly");
	equals(+new c(), 2, "implicit valueOf() called explicitly");
	equals((new c()).valueOf(), 2, "explicit valueOf() called explicitly");
});