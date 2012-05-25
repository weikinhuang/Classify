Benchmark.test("core", function(test) {
	test("define basic class", function() {
		var ci = create({
			init : function(a) {
				this.a = a;
			},
			a : function() {
				return 1;
			}
		});
	});

	var ci = create({
		init : function(a) {
			this.a = a;
		},
		a : function() {
			return 1;
		}
	});
	test("define inherited class", function() {
		var cp = create(ci, {
			init : function(a) {
				this.a = a;
			},
			a : function() {
				return 1;
			}
		});
	});

	var cl = create({
		a : function() {
			return 1;
		}
	});

	test("init with no init function", function() {
		var a = new cl();
	});

	var ci = create({
		init : function(a) {
			this.a = a;
		},
		a : function() {
			return 1;
		}
	});

	test("init with init function", function() {
		var a = new ci();
	});

	var Person = create({
		init : function(name) {
			this.name = name;
		},
		setAddress : function(country, city, street) {
			this.country = country;
			this.city = city;
			this.street = street;
		}
	});

	var p = new Person("Mary");
	test("access method 0 chain", function() {
		p.setAddress("France", "Paris", "CH");
	});

	var FrenchGuy = create(Person, {
		setAddress : function(city, street) {
			this.parent("France", city, street);
		}
	});

	var p2 = new FrenchGuy("Mary");
	test("access parent 1 chain", function() {
		p2.setAddress("Paris", "CH");
	});

	var ParisLover = create(FrenchGuy, {
		setAddress : function(street) {
			this.parent("Paris", street);
		}
	});

	var p3 = new ParisLover("Mary");
	test("access parent 2 chain", function() {
		p3.setAddress("CH");
	});
});
