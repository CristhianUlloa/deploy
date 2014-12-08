// Javascript functions for the main (wishlist) view. Includes click listeners and such.

/**
 * Refresh wishlist sidebar in the main view.
 *
 * Author: tdivita@mit.edu
 */
function wishlists_sidebar_refresh() {
	// Clear any existing lists from sidebar.
	$("#my-wishlists").empty();
	$("#shared-wishlists").empty();

	// Load Wishlists
    wishlists_get(function (result, status, xhr) {
    	// Get the sorted user wishlists and shared wishlists.
        var userWishlists = result.userWishlists.sort(function compare(a, b) {
        	return compareWishlistNames(a, b);
		});
        var sharedWishlists = result.sharedWishlists.sort(function compare(a, b) {
        	return compareWishlistNames(a, b);
		});

		// If wishlists were found, add them to the sidebar. Otherwise, show
		// a default message.
		if (userWishlists.length === 0) {
			wishlist_ui_restore_default("my-wishlists");
		}
		else {
			for (var i = 0; i < userWishlists.length; i++ ) {
	            wishlist_ui_add(userWishlists[i].title, userWishlists[i]._id, false);
	        }
		}
        if (sharedWishlists.length === 0) {
        	wishlist_ui_restore_default("shared-wishlists");
        }
        else {
        	for (var j = 0; j < sharedWishlists.length; j++ ) {
	            wishlist_ui_add(sharedWishlists[j].title, sharedWishlists[j]._id, true);
	        }
        }
        
        // Reselect the wishlist that was selected before (if there was one).
        var currentID = $("#wishlistID")[0].innerHTML;
        if (currentID) {
        	wishlist_ui_select(currentID);
        }
    });
}

/**
 * Sort wishlists alphabetically by title.
 *
 * Author: tdivita@mit.edu
 */
function compareWishlistNames(wishlist1, wishlist2) {
  if (wishlist1.title < wishlist2.title) {
    return -1;
  }
  if (wishlist1.title > wishlist2.title) {
    return 1;
  }
  // strings must be equal
  return 0;
}

/**
 * Refresh gift table contents in the main view.
 *
 * Author: tdivita@mit.edu
 */
function gifts_list_refresh(wishlistID) {
	$("#gift_table").empty();
	wishlist_get(wishlistID, function (result, status, xhr) {
		for (var i = 0; i < result.wishlist.gifts.length; i++) {
			gift_ui_add(result.wishlist.gifts[i], result.isOwnedBy, result.isClaimedByMe[i]);
		}
    });
}

/**
 * When a wishlist is clicked, look it up on the server and then update the UI
 * with its contents accordingly.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_click(selectedID) {
	wishlist_get(selectedID, function(result, status, xhr) {
		wishlist_ui_select(selectedID);
		wishlist_ui_display_info(result.wishlist, result.isOwnedBy, result.ownerName, result.user);
		wishlist_ui_share(result.wishlist.sharedWith);
		for (var i = 0; i < result.wishlist.gifts.length; i++) {
			gift_ui_add(result.wishlist.gifts[i], result.isOwnedBy, result.isClaimedByMe[i]);
		}
	});
}

/**
 * When a user clicks the claim button next to a gift, record their claim and 
 * update the gift's row to show it as claimed.
 *
 * Author: kasmus@mit.edu
 */
function make_full_claim(event, giftID) {
	var button = $(event.relatedTarget);
	var wishlistID = $("#wishlistID")[0].innerHTML;
	claim_post(100, giftID, wishlistID, function(result, status, xhr) {
		gift_ui_edit(result.gift);
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
	$(document).on('click', '.sidebar_wishlist', function (event) {
		var selected = event.currentTarget;
		var selectedID = selected.id;
		wishlist_click(selectedID);
	});
});