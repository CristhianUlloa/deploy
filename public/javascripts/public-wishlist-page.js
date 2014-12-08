// Javascript functions for the public wishlist view. Includes click listeners and such.

/**
 * Refresh public wishlist sidebar in the public wishlist navigation view.
 *
 * Author: tdivita@mit.edu
 */
function wishlists_public_sidebar_refresh() {
	// Clear any existing lists from sidebar.
	$("#public-wishlists").empty();

	// Load Wishlists
    wishlists_public_get(function (result, status, xhr) {
    	// Get the sorted user wishlists and shared wishlists.
        var publicWishlists = result.publicWishlists.sort(function compare(a, b) {
        	return compareWishlistNames(a, b);
		});

		// If wishlists were found, add them to the sidebar. Otherwise, show
		// a default message.
		if (publicWishlists.length === 0) {
			wishlist_ui_restore_default("public-wishlists");
		}
		else {
			for (var i = 0; i < publicWishlists.length; i++ ) {
	            wishlist_public_ui_add(publicWishlists[i].title, publicWishlists[i]._id);
	        }
		}	
    });
}

/**
 * Refresh public wishlist sidebar in the public wishlist navigation view.
 *
 * Author: tdivita@mit.edu
 */
function wishlists_public_sidebar_show_search_results() {
	// Clear any existing lists from sidebar.
	$("#public-wishlists").empty();
	
	// Get the search term
	var searchTerm = $("#sidebar_search_term").val();

    // Load Wishlists
    wishlists_public_search_get(searchTerm, function(result, status, xhr) {
		// Get the sorted user wishlists and shared wishlists.
        var resultWishlists = result.publicWishlists.sort(function compare(a, b) {
        	return compareWishlistNames(a, b);
		});

		// If wishlists matching the search were found, add them to the sidebar.
		// Otherwise, show a default message.
		if (resultWishlists.length === 0) {
			wishlist_ui_restore_default("public-wishlists-no-results");
		}
		else {
			for (var i = 0; i < resultWishlists.length; i++ ) {
	            wishlist_public_ui_add(resultWishlists[i].title, resultWishlists[i]._id);
	        }
		}
	});
}

/**
 * When the document is ready, attach click listeners.
 *
 * Author: tdivita@mit.edu
 */
$(document).ready(function () {

	/**
 	* When a wishlist is clicked in the sidebar, switch the main panel
 	* to show the contents of the selected wishlist.
 	*
 	* Author: tdivita@mit.edu
 	*/
	$(document).on("click", ".sidebar_public_wishlist", function (event) {
		var selected = event.currentTarget;
		var selectedID = selected.id;
		wishlist_click(selectedID);
	});

	/**
 	* When the save button is clicked for a wishlist, share it with the current
 	* user so that they will be able to find it later.
 	*
 	* Author: tdivita@mit.edu
 	*/
	$(document).on("click", "#public_save_button", function (event) {
		var wishlistID = $("#wishlistID")[0].innerHTML;
		var usersToShareWith = [];
		usersToShareWith.push(String($("#userEmail").html()));
		wishlist_share(wishlistID, usersToShareWith, function(result, status, xhr) {
            wishlist_ui_share(result.wishlist.sharedWith);
            $("#"+wishlistID).click();
        });
		this.blur();
	});

	$(document).on("click", "#view_all_button", function (event) {
		$("#sidebar_search_term").val("");
		wishlists_public_sidebar_refresh();
		this.blur();
	});

	$(document).on("click", "#sidebar_search_submit", function (event) {
		wishlists_public_sidebar_show_search_results();
		this.blur();
	});

	$(document).keypress(function(e) {
		// When enter key is pressed on the search box, submit the query.
	    if(e.target.id === "sidebar_search_term" && e.which === 13) {
	        wishlists_public_sidebar_show_search_results();
	    }
	});
});

