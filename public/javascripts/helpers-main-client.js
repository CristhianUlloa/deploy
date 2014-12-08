// Client-Side Functions for Server Communication

//// General ////

/**
 * Function called whenever an error occurs
 *
 * Author: ulloac@mit.edu
 */
var errorCallback = function(jqxhr, textStatus, errorThrown){
    var response = $.parseJSON(jqxhr.responseText);
        loadPage('index', {
            error: response.err
        });
}

/**
 * Get the current user.
 *
 * Author: tdivita@mit.edu
 */
function user_get(callback) {
	$.ajax({
		url : '/users/currentuser',
		type: 'GET',
		success: callback, // function (result, status, xhr)
		error: errorCallback
	});
}

//// Wishlists ////

/**
 * Get all wishlists the user can see (titles and _ids only).
 *
 * Author: tdivita@mit.edu
 */
function wishlists_get(callback) {
	$.ajax({
		url : '/wishlists/',
		type: 'GET',
		success: callback, // function (result, status, xhr)
		error: errorCallback
	});
}

/**
 * Get a specific wishlist, with all its gifts.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_get(wishlistID, callback) {
	$.ajax({
		url : '/wishlists/' + wishlistID,
		type: 'GET',
		success: callback, // function (result, status, xhr)
		error: errorCallback
	});
}

/**
 * Create a new wishlist owned by the current user.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_post(title, description, isPublic, callback) {
	$.ajax({
		url : '/wishlists/',
		type: 'POST',
		contentType: "application/json",
		data: JSON.stringify({"wishlist": {"title": title, "description": description, "isPublic": isPublic}}),
		success: callback,
		error: errorCallback
	});
}

/**
 * Edit the specified wishlist in the database (title and description).
 *
 * Author: tdivita@mit.edu
 */
function wishlist_put(wishlistID, newTitle, newDescription, callback) {
	$.ajax({
		url : '/wishlists/' + wishlistID,
		type: 'PUT',
		contentType: "application/json",
		data: JSON.stringify({"wishlist": {"title": newTitle, "description": newDescription}}),
		success: callback,
		error: errorCallback
	});
}

/**
 * Share the specified wishlist with more email addresses.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_share(wishlistID, usersToShareWith, callback) {
	$.ajax({
		url : '/wishlists/share/' + wishlistID,
		type: 'PUT',
		contentType: "application/json",
		data: JSON.stringify({"shareWith": usersToShareWith}),
		success: callback,
		error: errorCallback
	});
}

/**
 * Delete the specified wishlist in the database.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_delete(wishlistID, callback) {
	$.ajax({
		url : '/wishlists/' + wishlistID,
		type: 'DELETE',
		success: callback,
		error: errorCallback
	});
}


//// Gifts ////

/**
 * Get a specific gift, with all its claims.
 *
 * Author: tdivita@mit.edu
 */
function gift_get(giftID, wishlistID, callback) {
	$.ajax({
		url : '/gifts/' + wishlistID + "/" + giftID,
		type: 'GET',
		success: callback, // function (result, status, xhr)
		error: errorCallback
	});
}

/**
 * Create a new gift on the specified wishlist.
 *
 * Author: tdivita@mit.edu
 */
function gift_post(title, description, wishlistID, callback) {
	$.ajax({
		url : '/gifts/',
		type: 'POST',
		contentType: "application/json",
		data: JSON.stringify({"gift": {"title": title, "description": description}, "wishlist_id": wishlistID}),
		success: callback,
		error: errorCallback
	});
}

/**
 * Edit the specified gift in the database (title and description).
 *
 * Author: tdivita@mit.edu
 */
function gift_put(giftID, newTitle, newDescription, wishlistID, callback) {
	$.ajax({
		url : '/gifts/' + giftID,
		type: 'PUT',
		contentType: "application/json",
		data: JSON.stringify({"gift": {"title": newTitle, "description": newDescription}, "wishlist_id": wishlistID}),
		success: callback,
		error: errorCallback
	});
}

/**
 * Delete the specified gift in the database.
 *
 * Author: tdivita@mit.edu
 */
function gift_delete(giftID, wishlistID, callback) {
	$.ajax({
		url : '/gifts/' + giftID,
		type: 'DELETE',
		contentType: "application/json",
		data: JSON.stringify({"wishlist_id": wishlistID}),
		success: callback,
		error: errorCallback
	});
}


//// Claims ////

/**
 * Create a new claim on the specified gift.
 *
 * Author: tdivita@mit.edu
 */
function claim_post(claimPercentage, giftID, wishlistID, callback) {
	$.ajax({
		url : '/claims/',
		type: 'POST',
		contentType: "application/json",
		data: JSON.stringify({"claim": {"percentage": claimPercentage}, "gift_id": giftID, "wishlist_id": wishlistID}),
		success: callback,
		error: errorCallback
	});
}

/**
 * Update a claim on the specified gift.
 *
 * Author: kasmus@mit.edu
 */
function claim_put(claimPercentage, giftID, wishlistID, callback) {
	$.ajax({
		url : '/claims/' + giftID,
		type: 'PUT',
		contentType: "application/json",
		data: JSON.stringify({"claim": {"percentage": claimPercentage}, "wishlist_id": wishlistID}),
		success: callback,
		error: errorCallback
	});
}

/**
 * Delete the user's claim on the specified gift in the database.
 *
 * Author: tdivita@mit.edu
 */
function claim_delete(giftID, callback) {
	$.ajax({
		url : '/claims/' + giftID,
		type: 'DELETE',
		success: callback,
		error: errorCallback
	});
}