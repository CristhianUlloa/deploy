// Helpers for client-server communication on the public wishlists page.

//// Wishlists ////

/**
 * Get all public wishlists (titles and _ids only).
 *
 * Author: tdivita@mit.edu
 */
function wishlists_public_get(callback) {
	$.ajax({
		url : '/wishlists/public',
		type: 'GET',
		success: callback, // function (result, status, xhr)
		error: errorCallback
	});
}

/**
 * Get all public wishlists matching the search term (titles and _ids only).
 *
 * Author: tdivita@mit.edu
 */
function wishlists_public_search_get(searchTerm, callback) {
	$.ajax({
		url : '/wishlists/public/' + searchTerm,
		type: 'GET',
		success: callback,
		error: errorCallback
	});
}