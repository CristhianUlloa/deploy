// Helper Functions for the main wishlist/gift UI

//// General ////

/**
 * Create an HTML element with the specified type, id, and classes.
 *
 * Author: tdivita@mit.edu
 */
function create_ui_element(type, id, classes) {
	var new_elt = $(document.createElement(type));
	new_elt.attr("id", id);
	new_elt.addClass(classes);
	return new_elt;
}

/**
 * Store the email address of the current user, for later use.
 * 
 * Author: tdivita@mit.edu
 */
function save_user_email(user) {
	if ($("#userEmail")) {
		$("#userEmail").html(user.email);
	}
}

//// Wishlists ////

/**
 * Add a wishlist to the sidebar in the main view. Does not do sorting.
 *
 * sharedList is a boolean flag for whether the list is shared with (as
 * opposed to owned by) the user
 *
 * Author: tdivita@mit.edu
 */
function wishlist_ui_add(title, wishlistID, sharedList) {
	var wishlist = create_ui_element("li", wishlistID, "sidebar_wishlist");
	wishlist.html(title);

	if (!sharedList) {
		if ($("#my-wishlists").children().length === 1 && jQuery($("#my-wishlists").children()[0]).hasClass("sidebar_wishlist_default")) {
			$("#my-wishlists").empty();
		}
		$("#my-wishlists").append(wishlist);
	}
	else {
		if ($("#shared-wishlists").children().length === 1 && jQuery($("#shared-wishlists").children()[0]).hasClass("sidebar_wishlist_default")) {
			$("#shared-wishlists").empty();
		}
		$("#shared-wishlists").append(wishlist);
	}
	// Return the newly-created wishlist.
	return wishlist;
}

/**
 * Show a wishlist in the sidebar as selected.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_ui_select(wishlistID) {
	// Clear previous wishlist selection, then select the new one.
	$(".selected_wishlist").removeClass("selected_wishlist");
	$("#" + wishlistID).addClass("selected_wishlist");
}

/**
 * Display the information of a wishlist (title and description).
 *
 * isOwnedBy is a boolean flag for whether this list is owned by the
 * current user, so that the UI may be built accordingly
 *
 * Author: tdivita@mit.edu
 */
function wishlist_ui_display_info(wishlist, isOwnedBy, ownerName, currentUser) {
	$("#wishlistTitle").html(wishlist.title);
	$("#wishlistDescription").html(wishlist.description);
	$("#wishlistID").text(wishlist._id);
	$("#wishlistOwned").text = isOwnedBy.toString();

	$("#wishlistButtonContainer").empty();
	$("#gift_table").empty();

    //add direct link to public wishlists
    if (wishlist.isPublic) {
        $('#wishlistURLDiv').addClass('show');
        $('#wishlistURLDiv').removeClass('hide');
        $("#wishlistURL").html("http://alliwant-ulloac.rhcloud.com/direct/"+wishlist._id);
        $("#wishlistURL").attr("href", "http://alliwant-ulloac.rhcloud.com/direct/"+wishlist._id);
    }
    else {
        $('#wishlistURLDiv').addClass('hide');
        $('#wishlistURLDiv').removeClass('show');
    }

	var privacySetting;
	if (wishlist.isPublic) {
		privacySetting = "Public";
	}
	else {
		privacySetting = "Private";
	}
	$("#wishlistPrivacy").html(privacySetting);

    $('.wishlistDetailDiv').css("display", "inherit");

    // If the current user owns the list, show all the edit and share options.
	if (isOwnedBy) {
		$("#wishlistOwner").html("Me");
		var addGiftButton = $.parseHTML('<button type="button" class="btn btn-default btn-sm wishlist_edit_button" data-toggle="modal" data-target="#createEditDeleteModal" data-dowhat="create gift"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Add Gift</button>');
		var editButton = $.parseHTML('<button type="button" class="btn btn-default btn-sm edit_button wishlist_edit_button" data-toggle="modal" data-target="#createEditDeleteModal" data-dowhat="edit wishlist"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> Edit Wishlist</button>');
		var shareButton = $.parseHTML('<button type="button" class="btn btn-default btn-sm wishlist_edit_button" data-toggle="modal" data-target="#shareModal"><span class="glyphicon glyphicon-share-alt" aria-hidden="true"></span> Share Wishlist</button>');
		$("#wishlistButtonContainer").append(addGiftButton);
		$("#wishlistButtonContainer").append(editButton);
		$("#wishlistButtonContainer").append(shareButton);
	}
	else {
		$("#wishlistOwner").html(ownerName);
		// If the current user does not own the list, but is viewing it on the
		// public page, allow them to share it with themselves or others.
		if (wishlist.isPublic) {
			var shareButton = $.parseHTML('<button type="button" class="btn btn-default btn-sm wishlist_edit_button" data-toggle="modal" data-target="#shareModal"><span class="glyphicon glyphicon-share-alt" aria-hidden="true"></span> Share Wishlist</button>');
			// Add share direct link to modal (maybe make field visible?).

			// Make this say "Saved" when current user is in the shared with list.
			var save;
			if (wishlist.sharedWith.indexOf(currentUser.email) === -1) {
				save = $.parseHTML('<button type="button" class="btn btn-default btn-sm wishlist_edit_button" id="public_save_button"><span class="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> Save Wishlist</button>');
			} else {
				save = $.parseHTML('<div class="wishlist_saved">Saved</div>');
			}
			$("#wishlistButtonContainer").append(save);
			$("#wishlistButtonContainer").append(shareButton);
		}
	}
}

/**
 * Update the wishlist information based on an edit to the title and/or description.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_ui_edit(wishlist) {
	// Update the wishlist title in the sidebar.
	$("#" + wishlist._id).html(wishlist.title);
	// Update both the title and the description in the main panel.
	$("#wishlistTitle").html(wishlist.title);
	$("#wishlistDescription").html(wishlist.description);
}

/**
 * Delete the wishlist and return to the splash page.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_ui_delete(wishlistID) {
	// Remove the wishlist from the sidebar and restore default text if there are no user-owned wishlists left.
	$("#" + wishlistID).remove();
	if ($("#my-wishlists").children().length === 0) {
		wishlist_ui_restore_default("my-wishlists");
	}

	// Reset the main panel to the default.
	$("#wishlistTitle").html("Welcome!");
    $('#wishlistURLDiv').removeClass('show');
    $('#wishlistURLDiv').addClass('hide');
    $('.wishlistDetailDiv').css("display", "none");
	$("#wishlistDescription").html("Welcome to All I Want [for Christmas]! Use the sidebar on the left to create and view wishlists.");
	$("#wishlistID").text("");
	$("#wishlistButtonContainer").empty();
	$("#gift_table").empty();
}

/**
 * Restore the default (no lists) sidebar contents.
 *
 * Author: tdivita@mit.edu
 */
function wishlist_ui_restore_default(sidebarListID) {
	$("#" + sidebarListID).empty();
	default_elt = create_ui_element("li", sidebarListID + "-default", "sidebar_wishlist_default");
	if (sidebarListID === "my-wishlists") {
		default_elt.html("You don't have any wishlists yet! Use the plus button above to create one.");
	}
	else if (sidebarListID === "shared-wishlists") {
		default_elt.html("No wishlists have been shared with you yet!");
	}
	else if (sidebarListID === "public-wishlists") {
		default_elt.html("No one has created any public wishlists yet!");
	}
	else if (sidebarListID === "public-wishlists-no-results") {
		sidebarListID = "public-wishlists";
		default_elt.html("There were no public wishlists matching your query.");
	}
	$("#" + sidebarListID).append(default_elt);
}

/**
 * Update the "already shared with" list on the Share this Wishlist modal.
 *
 * Author: kasmus@mit.edu
 */
function wishlist_ui_share(emailList) {
	var emailString = "";
	for (var i = 0; i < emailList.length; i++) {
		emailString = emailList[i] + ", " + emailString;
	}
	emailString = emailString.substring(0, emailString.length-2);
	$("#alreadySharedWith").html(emailString);
}

//// Gifts ////

/**
 * Add a gift to the main panel gift list in the main view.
 *
 * Author: tdivita@mit.edu and kasmus@mit.edu, edited by stahdirk
 */
function gift_ui_add(gift, isOwnedBy, isClaimedBy) {
	// create the row that will contain the gift's title and the appropriate action button
	// clicking this row will toggle the next row, containing the gift's description, to expand or collapse
	var giftID = gift._id;
	var giftHTML = $.parseHTML( '<tr id="gift_row_' +giftID+ '"></tr>' );
	var giftRow = $(giftHTML);
	giftRow.addClass("wishlist_gift_row accordion-toggle");

	// create the cell containing the gift title
	var giftTitle = create_ui_element("td", "gift_title_" + giftID, "wishlist_gift_cell")[0];
	giftTitle.innerHTML = gift.title;

	var arrowToggle;
	if (gift.description != "") {
		arrowToggle = $.parseHTML('<td class="arrow-cell"><span class="arrow-toggle collapsed" data-toggle="collapse" data-target="#gift_description_' +giftID+ '"><span class="glyphicon glyphicon-chevron-down"></span><span class="glyphicon glyphicon-chevron-up"></span></span></td>')
	} else {
		arrowToggle = $.parseHTML('<td class="arrow-cell">');
	}
	giftRow.append($(arrowToggle)[0]);
	giftRow.append($(giftTitle));

	// create the cell containing an action button
	var buttonCell = create_ui_element("td", "gift_edit_cell_" + giftID, "wishlist_gift_button_cell")[0];
	if (isOwnedBy) {
		// if the logged in user owns this list, it should be button to edit this gift
		var editHTML = $.parseHTML( '<button id="gift_edit_button_' +giftID+ '" data-toggle="modal" data-target="#createEditDeleteModal" data-dowhat="edit gift" data-title="'+gift.title.replace(/"/g, "")+'" data-description="'+gift.description.replace(/"/g, "")+'" data-giftid="'+gift._id+'"/>' );
		var editButton = $(editHTML);
		editButton.addClass("btn btn-xs btn-default");
		var pencilSpan = $.parseHTML('<span class="glyphicon glyphicon-pencil"></span>');
		editButton.append(pencilSpan);
		buttonCell.appendChild(editButton[0]);

	// otherwise, it should be a claim button to claim this gift (or text showing if the gift has already been claimed)
	} else if (($("#alreadySharedWith").html().indexOf($("#userEmail").html()) > -1) || $("#userEmail").length === 0) {

		// calculate unclaimed percentage
		var percentLeft = 100;
		for (var i = 0; i < gift.claims.length; i++) {
			percentLeft = percentLeft - gift.claims[i].percentage;
		}

		if (percentLeft == 0) {
			buttonCell.innerHTML = "Claimed&nbsp;&nbsp;";
			giftRow.attr('bgcolor', '#D4E7D8');
			if (isClaimedBy > 0) {

				if (gift.claims.length == 1) {
					//add a remove claim button
					var unclaimHTML = $.parseHTML( '<button id="unclaim_button_' + giftID + '"/>' );
					var unclaimButton = $(unclaimHTML);
					unclaimButton.addClass('btn btn-xs btn-default');
					unclaimButton.html("Unclaim");
					unclaimButton.click(function(event) { removeClaim(giftID); });
					buttonCell.appendChild(unclaimButton[0]);
				} else {
					// it's a split claim that can't be unclaimed, show View Claim Button
					var viewHTML = $.parseHTML( '<button id="split_claim_button_' +giftID+ '" data-toggle="modal" data-target="#splitModal" data-title="'+gift.title.replace(/"/g, "")+'" data-description="'+gift.description.replace(/"/g, "")+'" data-giftid="'+gift._id+'" data-percentleft="'+percentLeft+'" data-dowhat="edit" data-myclaim="'+isClaimedBy+'"/>' );			
					var viewButton = $(viewHTML);
					viewButton.addClass("btn btn-xs btn-default");
					viewButton.html("View Split");
					buttonCell.appendChild(viewButton[0]);
				}
			}
		} else {
			// full claim button (if no split claim has been made yet)
			if (percentLeft == 100) {
				var claimHTML = $.parseHTML( '<button id="gift_claim_button_' +giftID+ '"/>' );
				var claimButton = $(claimHTML);
				claimButton.addClass("btn btn-xs btn-default");
				claimButton.html("Claim");
				claimButton.click(function(event) {make_full_claim(event, giftID);});
				buttonCell.appendChild(claimButton[0]);
			} else {
				buttonCell.innerHTML = "Split&nbsp;&nbsp;";
				giftRow.attr('bgcolor', '#EEB4B4');
			}

			if (isClaimedBy > 0) {
				var splitHTML = $.parseHTML( '<button id="split_claim_button_' +giftID+ '" data-toggle="modal" data-target="#splitModal" data-title="'+gift.title.replace(/"/g, "")+'" data-description="'+gift.description.replace(/"/g, "")+'" data-giftid="'+gift._id+'" data-percentleft="'+percentLeft+'" data-dowhat="edit" data-myclaim="'+isClaimedBy+'"/>' );			
				var splitButton = $(splitHTML);
				splitButton.addClass("btn btn-xs btn-default");
				splitButton.html("Edit Split");
				buttonCell.appendChild(splitButton[0]);
			} else {
				// split claim button
				var splitHTML = $.parseHTML( '<button id="split_claim_button_' +giftID+ '" data-toggle="modal" data-target="#splitModal" data-title="'+gift.title.replace(/"/g, "")+'" data-description="'+gift.description.replace(/"/g, "")+'" data-giftid="'+gift._id+'" data-percentleft="'+percentLeft+'" data-dowhat="claim"/>' );			
				var splitButton = $(splitHTML);
				splitButton.addClass("btn btn-xs btn-default");
				splitButton.html("Split Claim");
				buttonCell.appendChild(splitButton[0]);
			}
		}
	}
	giftRow.append($(buttonCell));

	// create the row and cell containing the gift's description, which is initially collpased
	var giftDescriptionRow = create_ui_element("tr", "gift_description_row_" + giftID, "wishlist_gift_description_row");
	var giftDescriptionCell = create_ui_element("td", "gift_description_cell_" + giftID, "wishlist_gift_description_cell");
	giftDescriptionCell[0].colSpan = 3; 
	var giftDescription = create_ui_element("div", "gift_description_" + giftID, " accordion-body collapse gift_description")[0];
	giftDescription.innerHTML = gift.description;
	giftDescriptionCell.append(giftDescription);
	giftDescriptionRow.append(giftDescriptionCell);

	// append the rows to the wishlist's gift table
	$("#gift_table").append(giftRow);
	$("#gift_table").append(giftDescriptionRow);
}

/**
 * Update the gift list based on an edit to a gift.
 *
 * Author: tdivita@mit.edu
 */
function gift_ui_edit(gift) {
	var currentWishlistID = $("#wishlistID")[0].innerHTML;
	gifts_list_refresh(currentWishlistID)
}

/**
 * Delete a gift from the gift list.
 *
 * Author: tdivita@mit.edu
 */
function gift_ui_delete(giftID) {
	$("#gift_row_" + giftID).remove();
	$("#gift_description_row_" + giftID).remove();
}

/**
 * Populates the claims table shown on a Split Claim modal.
 *
 * Author: kasmus@mit.edu
 */
function claims_ui_display(gift) {
	$("#splitTable").html("");
	gift.claims.forEach(function(claim) {
		var claimRow = create_ui_element("tr", "claim_row_" + claim._id, "claim_row");

		var claimNameCell = create_ui_element("td", "claim_name_cell_" + claim._id, "claim_cell");
		var claimEmailCell = create_ui_element("td", "claim_email_cell_" + claim._id, "claim_cell");
		var claimPercentageCell = create_ui_element("td", "claim_percentage_cell_" + claim._id, "claim_cell");

		var claimName = create_ui_element("div", "claim_name_" + claim._id, " claim_info")[0];
		var claimEmail = create_ui_element("div", "claim_email_" + claim._id, " claim_info")[0];
		var claimPercentage = create_ui_element("div", "claim_percentage_" + claim._id, " claim_info")[0];

		claimName.innerHTML = claim.claimant.firstName;
		claimEmail.innerHTML = claim.claimant.email;
		claimPercentage.innerHTML = claim.percentage+"%";

		claimNameCell.append(claimName);
		claimEmailCell.append(claimEmail);
		claimPercentageCell.append(claimPercentage);

		claimRow.append(claimNameCell);
		claimRow.append(claimEmailCell);
		claimRow.append(claimPercentageCell);

		$("#splitTable").append(claimRow);
	});
}

