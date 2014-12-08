//author: stahdirk

/*
Wishlist
			create
			edit
			share
			delete
	get
Gift
	get
			post
			put
			delete
User
			create
			login
			logout
Claim
			make
			remove
			split
*/



var email = 'alliwant.mailer@gmail.com';
var pw = 'testing' + String(Math.random());
var email2 = 'alliwantforchristmas2014@gmail.com';
var pw2 = 'testing' + String(Math.random());
var wishlistID = null;
var giftID = null;

//add java-like strip and lstrip functionality
if (typeof(String.prototype.strip) === "undefined") {
    String.prototype.strip = function() {
        return String(this).replace(/\s+$/g, '');
    };
}
if (typeof(String.prototype.lstrip) === "undefined") {
    String.prototype.lstrip = function() {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

QUnit.config.reorder = false;


QUnit.test('create user test', function(assert) {
	$.ajax({
		url: "/users/",
		method: "POST",
		async: false,
		data: {
			email: email,
    		password: pw,
    		firstname: 'John',
    		lastname: 'Smith'
		},
		success: function(data) {
			expect(0);
		}
	});
});

var wishlistID = null;
QUnit.test('create wishlist', function(assert) {
	var wishlist = {};
	var title = "New wishlist " + String(Math.random());
	wishlist.title = title;
	wishlist.description = "New wishlist description " + String(Math.random());
	wishlist.isPublic = false;

	$.ajax({
		url: "/wishlists/",
		method: "POST",
		async: false,
		data: {
			wishlist: wishlist
		},
		success: function(data) {
			assert.equal(data.wishlist.title.lstrip(), title.strip());
			wishlistID = data.wishlist._id;
		},
		error: function(err) {
		}
	});
});

QUnit.test('edit wishlist', function(assert) {
	var wishlist = {};
	var title = "Edited wishlist";
	wishlist.title = title;
	wishlist.description = "Edited description";

	$.ajax({
		url: "/wishlists/" + wishlistID,
		method: "PUT",
		async: false,
		data: {
			wishlist: wishlist
		},
		success: function(data) {
			assert.equal(data.wishlist.title.lstrip(), title.strip());
		},
		error: function(err) {
		}
	});
});

var giftID = null;
QUnit.test('add gift', function(assert) {
	var gift = {};
	gift.title = "New Gift";
	gift.description = "New description";

	$.ajax({
		url: "/gifts/",
		method: "POST",
		async: false,
		data: {
			gift: gift,
			wishlist_id: wishlistID
		},
		success: function(data) {
			assert.equal(data.gift.title, "New Gift");
			giftID = data.gift._id;
		},
		error: function(err) {
		}
	});
});

QUnit.test('edit gift', function(assert) {
	var gift = {};
	gift.title = "Edited Gift";
	gift.description = "Edited description";
	gift._id = giftID;

	$.ajax({
		url: "/gifts/" + String(giftID),
		method: "PUT",
		async: false,
		data: {
			gift: gift,
			wishlist_id: wishlistID
		},
		success: function(data) {
			assert.equal(data.gift.title, "Edited Gift");
		},
		error: function(err) {
		}
	});
});

var giftID2 = null;
QUnit.test('add another gift', function(assert) {
	var gift = {};
	gift.title = "New Gift";
	gift.description = "New description";

	$.ajax({
		url: "/gifts/",
		method: "POST",
		async: false,
		data: {
			gift: gift,
			wishlist_id: wishlistID
		},
		success: function(data) {
			assert.equal(data.gift.title, "New Gift");
			giftID2 = data.gift._id;
		},
		error: function(err) {
		}
	});
});

QUnit.test('delete gift', function(assert) {
	var gift = {};
	gift.title = "New Gift";
	gift.description = "New description";

	$.ajax({
		url: "/gifts/" + String(giftID2),
		method: "DELETE",
		async: false,
		data: {
			wishlist_id: wishlistID
		},
		success: function(data) {
			assert.equal(data.giftID, giftID2)
		},
		error: function(err) {
		}
	});
});

QUnit.test('share wishlist', function(assert) {
	$.ajax({
		url: "/wishlists/share/" + wishlistID,
		method: "PUT",
		async: false,
		data: {
			shareWith: [email2]
		},
		success: function(data) {
			assert.equal(data.wishlist.sharedWith.length, 1);
			assert.equal(data.wishlist.sharedWith[0], email2);
		},
		error: function(err) {
		}
	});
});

QUnit.test('get user\'s wishlists', function(assert) {
	$.ajax({
		url: "/wishlists/",
		method: "GET",
		async: false,
		data: {},
		success: function(data) {
			assert.equal(data.userWishlists.length, 1);
			assert.equal(data.userWishlists[0].title, "Edited wishlist");
		},
		error: function(err) {
		}
	});
});

QUnit.test('logout user', function(assert) {
	$.ajax({
		url: "/users/logout",
		method: "POST",
		async: false,
		data: {},
		success: function(data) {
			$.ajax({
				url: "/users/current",
				method: "GET",
				async: false,
				data: {},
				success: function(data) {
					assert.equal(data.content.loggedIn, false);
				}
			});
		}
	});
});

QUnit.test('create another user', function(assert) {
	$.ajax({
		url: "/users/",
		method: "POST",
		async: false,
		data: {
			email: email2,
    		password: pw2,
    		firstname: 'John',
    		lastname: 'Smith'
		},
		success: function(data) {
			assert.equal(data.content.user.email, email2);
		}
	});
});

QUnit.test('create a claim', function(assert) {
	$.ajax({
		url: "/claims/",
		method: "POST",
		async: false,
		data: {
			claim: { percentage: 100 },
			wishlist_id: wishlistID,
			gift_id: giftID
		},
		success: function(data) {
			assert.equal(data.claim.percentage, 100);
		}
	});
});

QUnit.test('delete claim', function(assert) {
	$.ajax({
		url: "/claims/" + String(giftID),
		method: "DELETE",
		async: false,
		data: {},
		success: function(data) {
			assert.equal(data.gift._id, giftID);
		}
	});
});

QUnit.test('create a split claim', function(assert) {
	$.ajax({
		url: "/claims/",
		method: "POST",
		async: false,
		data: {
			claim: { percentage: 50 },
			wishlist_id: wishlistID,
			gift_id: giftID
		},
		success: function(data) {
			assert.equal(data.claim.percentage, 50);
		}
	});
});

QUnit.test('logout user', function(assert) {
	$.ajax({
		url: "/users/logout",
		method: "POST",
		async: false,
		data: {},
		success: function(data) {
			$.ajax({
				url: "/users/current",
				method: "GET",
				async: false,
				data: {},
				success: function(data) {
					assert.equal(data.content.loggedIn, false);
				}
			});
		}
	});
});

QUnit.test('login user', function(assert) {
	$.ajax({
		url: "/users/login",
		method: "POST",
		async: false,
		data: {
			email: email,
			password: pw
		},
		success: function(data) {
			assert.equal(data.content.user.email, email);
		}
	});
});

QUnit.test('delete wishlist', function(assert) {
	$.ajax({
		url: "/wishlists/" + wishlistID,
		method: "DELETE",
		async: false,
		data: {},
		success: function(data) {
			assert.equal(data.wishlistID, wishlistID);
		},
		error: function(err) {
		}
	});
});

QUnit.test('delete user', function(assert) {
    $.ajax({
        url: "/users/" + email,
        method: "DELETE",
        async: false,
        data: {},
        success: function(data) {
            expect(0);
        }
    });
});

QUnit.test('delete user', function(assert) {
    $.ajax({
        url: "/users/" + email2,
        method: "DELETE",
        async: false,
        data: {},
        success: function(data) {
            expect(0);
        }
    });
});
