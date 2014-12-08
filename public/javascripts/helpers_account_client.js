//Client-side ajax calls

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
 * Retrieve all gifts that a user has claimed
 *
 * Author: stahdirk
 */
function claims_get(callback) {
	$.ajax({
		url : '/claims/',
		type: 'GET',
		success: callback,
		error: errorCallback
	});
}

/**
 * Retrieve the information from the current user
 *
 * Author: stahdirk
 */
function userinfo_get(callback) {
	$.ajax({
		url: '/users/current',
		type: 'GET',
		success: callback,
		error: errorCallback
	});
}

/**
 * Sends the new first and last name to the server
 *
 * Author: stahdirk
 */
function change_name_post(firstname, lastname, callback, errorCallback) {
	$.ajax({
		url: '/users/changename',
		type: 'POST',
		data: {
			firstname: firstname,
			lastname: lastname
		},
		success: callback,
		error: errorCallback
	});
}

/**
 * Update a user's password
 *
 * Author: stahdirk
 */
function change_password_post(pw, oldpw, callback, errorCallback) {
	$.ajax({
		url: '/users/password',
		type: 'POST',
		data: {
			oldpassword: oldpw,
			password: pw
		},
		success: callback,
		error: errorCallback
	});	
}


/**
 * Get a populated wishlist
 *
 * Author: stahdirk
 */
function wishlist_info_get(id, callback) {
	$.ajax({
		url: '/wishlists/',// + id,
		type: 'GET',
		success: callback,
		error: errorCallback
	});	
}

function unsubscribe_post(callback) {
	$.ajax({
	    url : '/users/unsubscribe',
	    type: 'POST',
	    data: {},
	    success: callback()
	});
}
