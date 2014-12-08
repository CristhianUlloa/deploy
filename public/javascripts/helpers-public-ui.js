// Helper Functions for the public wishlist/gift UI

//// Wishlists ////

/**
 * Add a wishlist to the sidebar in the public view. Does not do sorting.
 *
 * sharedList is a boolean flag for whether the list is shared with (as
 * opposed to owned by) the user
 *
 * Author: tdivita@mit.edu
 */
function wishlist_public_ui_add(title, wishlistID) {
	var wishlist = create_ui_element("li", wishlistID, "sidebar_public_wishlist");
	wishlist.html(title);
	$("#public-wishlists").append(wishlist);

	// Return the newly-created wishlist.
	return wishlist;
}

/**
 * Delete the public wishlist and return to the splash page.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_public_ui_delete(wishlistID) {
	// Remove the wishlist from the sidebar and restore default text if there are no user-owned wishlists left.
	$("#" + wishlistID).remove();
	if ($(".sidebar_public_wishlist").length === 0) {
		wishlist_ui_restore_default("public-wishlists");
	}

	// Reset the main panel to the default for public lists.
	$("#wishlistTitle").html("Welcome!");
    $('.wishlistDetailDiv').css("display", "none");
	$("#wishlistDescription").html("Welcome to the public wishlist navigator! Use the sidebar on the left to find and view public wishlists. You can save a public wishlist so that it will appear in your Shared Lists by clicking the save button while you are viewing it, or by claiming a gift on it.");
	$("#wishlistID").text("");
	$("#wishlistButtonContainer").empty();
	$("#gift_table").empty();
}

