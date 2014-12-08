QUnit.asyncTest("wishlist test", function() {
		//////// login user ///////////////////////////////////
	$.ajax({
		url: "/users/login",
		method: "POST",
		async: false,
		data: {
			email: email,
			password: pw
		},
		success: function(data) {
	  		ok(1==1);

	  		var wishlist = { title: 'New testing wishlist 1', description: 'wishlistwishlistwishlist'};
			console.log('test3');

			//////// create wishlist ///////////////////////////////////
			$.ajax({
				url: '/wishlists',
				method: 'POST',
				async: false,
				data: {
					wishlist: wishlist
				},
				success: function(data) {
					wishlistID = data.wishlist._id;
					ok(1==1);
					console.log('test4');

					var gift = { title: 'gift1', description: 'gift1 description'};
					//////// add gift ///////////////////////////////////
					$.ajax({
						url: '/gifts',
						method: 'POST',
						async: false,
						data: {
							gift: gift,
							wishlist_id: wishlistID
						},
						success: function(data) {
							giftID = data.gift._id;
							ok(data.gift.title == 'gift1');

							sharedWith = ['test2@mit.edu'];
							//////// share with other user ///////////////////////////////////
							$.ajax({
								url: '/wishlists/share/' + wishlistID,
								method: 'PUT',
								async: false,
								data: {
									shareWith: sharedWith
								},
								success: function(data) {
									ok(data != null);

									//////// logout user 1 ///////////////////////////////////
									$.ajax({
										url: '/users/logout',
										method: 'POST',
										async: false,
										data: {},
										success: function(data) {
											ok(data.success);

											//////// login user 2 ///////////////////////////////////
											$.ajax({
												url: '/users/login',
												method: 'POST',
												async: false,
												data: {
													email: email2,
													password: pw2
												},
												success: function(data) {
													ok(data.success);

													var claim = { percentage: 100 };
													//////// add a claim ///////////////////////////////////
													$.ajax({
														url: '/claims',
														method: 'POST',
														async: false,
														data: {
															claim: claim,
															wishlist_id: wishlistID,
															gift_id: giftID
														},
														success: function(data) {
															ok(data.claim.percentage == 100);
															//////// delete everything ///////////////////////////////////

															$.ajax({
																url: '/claims',
																method: 'GET',
																async: false,
																data: {},
																success: function(data) {
																	cleanup();
																	QUnit.start();
																}
															})
														}
													});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
});


//called at the end to remove the wishlist creatd (and consequently gifts and claims)
function cleanup() {
	$.ajax({
		url: '/users/login',
		method: 'POST',
		async: false,
		data: {
			email: email,
			password: pw
		},
		success: function(data) {
			//////// delete wishlist ///////////////////////////////////
			$.ajax({
				url: '/wishlists/' + wishlistID,
				method: 'DELETE',
				async: false,
				data: {},
				success: function(data) {
					ok(1==1);
				}
			});
		}
	});
}

}