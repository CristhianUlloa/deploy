// Client-Side Functions for Server Communication

//// Users ////

/**
 * Logs user in.
 *
 * Author: ulloac@mit.edu
 */
function userlogin_post(values, callback, errorCallback) {
	$.ajax({
		url : '/users/login',
		type: 'POST',
		contentType: "application/json",
		data: JSON.stringify(values),
		success: callback,
		error: errorCallback
	});
}

/**
 * Log user in upon receiving direct link.
 *
 * Author: ulloac@mit.edu
 */
function userlogin_get_wishlist(values, wishlistID, callback, errorCallback) {
	$.ajax({
		url : '/users/login/' + wishlistID,
		type: 'GET',
		contentType: "application/json",
		data: JSON.stringify(values),
		success: callback, // function (result, status, xhr)
		error: errorCallback
	});
}

/**
 * Creates user account.
 *
 * Author: ulloac@mit.edu
 */
function usersubmit_post(values, callback, errorCallback) {
	$.ajax({
		url: '/users',
		type: 'POST',
		contentType: "application/json",
		data: JSON.stringify(values),
		success: callback,
		error: errorCallback
	});
}

/**
 * Logs user out.
 *
 * Author: ulloac@mit.edu
 */
function userlogout_post(callback, errorCallback) {
	$.ajax({
		url: '/users/logout',
		type: 'POST',
		contentType: "application/json",
		success: callback,
		error: errorCallback
	});
}