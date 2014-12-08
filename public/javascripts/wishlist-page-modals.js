// Javascript functions for modals on the main (wishlist) view. Includes click listeners and such.

$(document).ready(function () {

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CREATE/EDIT/DELETE MODAL ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    /**
    * Initializes the appropriate create or edit fields on the createEditDeleteModal.
    *
    * Author: kasmus@mit.edu
    */
    $(document).on('show.bs.modal', '#createEditDeleteModal', function (event) {
        // remove old click listeners, we'll assign a new one as needed
        $(document).off("click", "#modalSave");
        $(document).off("click", "#modalDelete");

        // hide alerts by default, specific modals will show them if necessary
        $("#modalAlert").hide();
        $("#modalToggleAlert").hide();
        $("#modalGiftWarning").hide();
        $("#modalWishlistWarning").hide();

        // hide the delete button (edit modals will show it in later calls)
        $("#modalDelete").hide();

        // hide the public/private toggle (create wishlist will show it later)
        $("#modalPublicToggle").hide();

        var button = $(event.relatedTarget) // Button that triggered the modal
        var dowhat = button.data('dowhat') // Extract info from data-* attributes

        // depending on which button was clicked, initialize the appropriate fields in the modal
        if (dowhat == "create wishlist") {
            setupCreateWishlistModal();
        } else if (dowhat == "create gift") {
            setupCreateGiftModal();
        } else if (dowhat == "edit wishlist") {
            setupEditWishlistModal();
        } else if (dowhat == "edit gift") {
            var title = button.data("title");
            var desc = button.data("description");
            var giftID = button.data("giftid");
            setupEditGiftModal(title, desc, giftID);
        }
    });

    /**
    * Initializes a Create New Wishlist modal.
    *
    * Author: kasmus@mit.edu
    */
    function setupCreateWishlistModal() {
        // title text
        $("#modalTitle").html("Create a New Wishlist");

        // show public/private toggle
        $("#modalPublicToggle").show();
        $("#modalPrivateButton").addClass("active");
        $("#modalPublicButton").removeClass("active");

        // empty fields with placeholder text
        $("#modalTitleInput").attr("placeholder", "Wishlist Title");
        $("#modalTitleInput").val('');
        $("#modalDescInput").attr("placeholder", "Wishlist Description \n\nEspecially if this wishlist is public, we recommend including contact information and an address here, so that people can verify who you are and get gifts to you.");
        $("#modalDescInput").val('');

        // save button text and click listener
        $("#modalSave").html("Create Wishlist");
        $(document).on("click", "#modalSave", createWishlist);
    }

    /**
    * Initializes an Add New Gift modal.
    *
    * Author: kasmus@mit.edu
    */
    function setupCreateGiftModal() {
        // title text
        $("#modalTitle").html("Add a New Gift");

        // empty fields with placeholder text
        $("#modalTitleInput").attr("placeholder", "Gift Title");
        $("#modalTitleInput").val('');
        $("#modalDescInput").attr("placeholder", "Gift Description");
        $("#modalDescInput").val('');

        // save button text and click listener
        $("#modalSave").html("Add Gift");
        $(document).on("click", "#modalSave", createGift);
    }

    /**
    * Initializes an Edit or Delete Wishlist modal.
    *
    * Author: kasmus@mit.edu
    */
    function setupEditWishlistModal() {
        // title text
        $("#modalTitle").html("Edit or Delete Wishlist");

        // pre-populate fields based on existing values, if present
        $("#modalTitleInput").attr("placeholder", "Wishlist Title");
        var currentTitle = $("#wishlistTitle").html();
        $("#modalTitleInput").val(currentTitle); 
        $("#modalDescInput").attr("placeholder", "Wishlist Description");
        var currentDesc = $("#wishlistDescription").html();
        if (currentDesc != "") {
            $("#modalDescInput").val(currentDesc);
        } else {
        	$("#modalDescInput").val('');
        }

        // show delete warning message
        $("#modalWishlistWarning").show();

        // show delete button, add button text and click listeners
        $("#modalDelete").show();
        $("#modalSave").html("Save Wishlist");
        $(document).on("click", "#modalSave", saveWishlist);
        $(document).on("click", "#modalDelete", deleteWishlist);
    }

    /**
    * Initializes an Edit or Delete Gift modal.
    *
    * Author: kasmus@mit.edu
    */
    function setupEditGiftModal(currentTitle, currentDesc, giftID) {
        // title text
        $("#modalTitle").html("Edit or Delete Gift");

        // pre-populate fields based on existing values, if present
        $("#modalTitleInput").attr("placeholder", "Gift Title");
        $("#modalTitleInput").val(currentTitle);
        $("#modalDescInput").attr("placeholder", "Gift Description");
        if (currentDesc != "") {
            $("#modalDescInput").val(currentDesc);
        } else {
        	$("#modalDescInput").val('');
        }

        // show delete warning message
        $("#modalGiftWarning").show();

        // show delete button, add button text and click listeners
        $("#modalDelete").show();
        $("#modalSave").html("Save Gift");
        $(document).on("click", "#modalSave", function() { saveGift(giftID); });
        $(document).on("click", "#modalDelete", function() { deleteGift(giftID); });
    }

    /**
    * Click listener for submitting a Create New Wishlist modal.
    *
    * Author: kasmus@mit.edu
    */
    function createWishlist() {
        // get the parameters
        var title = $("#modalTitleInput").val();
        var desc = $("#modalDescInput").val();
        var isPublic = $("#modalPublicButton").hasClass("active");
        var isPrivate = $("#modalPrivateButton").hasClass("active");

        // must include a title, otherwise show error
        if (!title) {
            $("#modalAlert").show();
            return;
        }

        if ((!isPublic && !isPrivate) || (isPublic && isPrivate)) {
            $("#modalToggleAlert").show();
            return;
        }

        // call to the AJAX function to update database, with callback to update UI
        wishlist_post(title, desc, isPublic, function(result, status, xhr) {
            var wishlist = wishlist_ui_add(result.wishlist.title, result.wishlist._id);
            wishlist.click();
            $("#createEditDeleteModal").modal("hide");
        });
    };

    /**
    * Click listener for submitting an Add a Gift modal.
    *
    * Author: kasmus@mit.edu
    */
    function createGift() {
        // get the parameters
        var wishlistID = $("#wishlistID")[0].innerHTML;
        var title = $("#modalTitleInput").val();
        var desc = $("#modalDescInput").val();

        // must include a title, otherwise show error
        if (!title) {
            $("#modalAlert").show();
            return;
        } 

        // call to the AJAX function to update database, with callback to update UI
        gift_post(title, desc, wishlistID, function(result, status, xhr) {
            gift_ui_add(result.gift, true);
            $("#createEditDeleteModal").modal("hide");
        });
    };

    /**
    * Click listener for saving edits on an Edit/Delete Wishlist modal.
    *
    * Author: kasmus@mit.edu
    */
    function saveWishlist() {
        // get the parameters
        var wishlistID = $("#wishlistID")[0].innerHTML;
        var title = $("#modalTitleInput").val();
        var desc = $("#modalDescInput").val();

        // must include a title, otherwise show error
        if (!title) {
            $("#modalAlert").show();
        }

        // call to the AJAX function to update database, with callback to update UI
        wishlist_put(wishlistID, title, desc, function(result, status, xhr) {
            wishlist_ui_edit(result.wishlist);
            $("#createEditDeleteModal").modal("hide");
        });
    };

    /**
    * Click listener for deleting a wishlist on an Edit/Delete Wishlist modal.
    *
    * Author: kasmus@mit.edu
    */
    function deleteWishlist() {
        // get the parameters
        var wishlistID = $("#wishlistID")[0].innerHTML;

        // call to the AJAX function to update database, with callback to update UI
       	wishlist_delete(wishlistID, function(result, status, xhr) {
			if ($("#public-wishlists").size() > 0) {
				wishlist_public_ui_delete(result.wishlistID);
			}
			else {
				wishlist_ui_delete(result.wishlistID);
			}
			$("#createEditDeleteModal").modal("hide");
		});
    };

    /**
    * Click listener for saving edits on an Edit/Delete Gift modal.
    *
    * Author: kasmus@mit.edu
    */
    function saveGift(giftID) {
        // get the parameters
        var wishlistID = $("#wishlistID")[0].innerHTML;
        var title = $("#modalTitleInput").val();
        var desc = $("#modalDescInput").val();

        // must include a title, otherwise show error
        if (!title) {
            $("#modalAlert").show();
            return;
        }

        // call to the AJAX function to update database, with callback to update UI
        gift_put(giftID, title, desc, wishlistID, function(result, status, xhr) {
            gift_ui_edit(result.gift);
            $("#createEditDeleteModal").modal("hide");
        });
    };

    /**
    * Click listener for deleting a gift on an Edit/Delete Gift modal.
    *
    * Author: kasmus@mit.edu
    */
    function deleteGift(giftID) {
        // get the parameters
        var wishlistID = $("#wishlistID")[0].innerHTML;

        // call to the AJAX function to update database, with callback to update UI
        gift_delete(giftID, wishlistID, function(result, status, xhr) {
            gift_ui_delete(result.giftID);
            $("#createEditDeleteModal").modal("hide");
        });     
    };

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SHARE MODAL ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    /**
    * Initializes a shareModal for sharing a wishlist.
    *
    * Author: kasmus@mit.edu
    */
    $(document).on('show.bs.modal', '#shareModal', function (event) {
        $("#shareAlert").hide();
        $("#shareInput").val('');

    });
    $(document).on("click", "#shareSubmit", shareWishlist);

    /**
    * Click listener for submitting a Share Wishlist modal.
    *
    * Author: kasmus@mit.edu
    */
    function shareWishlist() {
        // get the parameters
        var wishlistID = $("#wishlistID")[0].innerHTML;
        var emailsString = $("#shareInput").val();

        // must include at least one email, otherwise show error
        if (!emailsString) {
            $("#shareAlert").show();
            return;
        }

        // do regex checking of the comma-separated list of emails and save them
        var validatedEmails = [];
        var emails = emailsString.split(",");
        emails.forEach(function(entry) {
            var email = entry.trim(); //remove whitespace from ends
            if (!validateEmail(email)) {
                $("#shareAlert").show();
                return;
            }
            validatedEmails.push(email);
        });

        // call to the AJAX function to update database, with callback to update UI
        wishlist_share(wishlistID, validatedEmails, function(result, status, xhr) {
            $("#shareModal").modal("hide");
            wishlist_ui_share(result.wishlist.sharedWith);
        });
    };


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SPLIT CLAIM MODAL ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    /**
    * Initializes a splitModal for placing a split claim on a gift.
    *
    * Author: kasmus@mit.edu
    */
    $(document).on('show.bs.modal', '#splitModal', function (event) {
    	var wishlistID = $("#wishlistID")[0].innerHTML;
        var button = $(event.relatedTarget);
        var giftID = button.data("giftid");
        var title = button.data("title");
        var desc = button.data("description");
        var percentLeft = button.data("percentleft");
        var doWhat = button.data("dowhat");
        var myClaim = button.data("myclaim");

		// hide alerts and extra buttons
        $("#newSplitMsg").hide();
        $("#existingSplitMsg").hide();
        $("#updateSplitMsg").hide();
        $("#noUpdateSplitMsg").hide();
        $("#splitSubmit").show();
        $("#splitDelete").hide();
        $("#splitTableLabel").show();

        $("#splitForm").show();

        // remove click listeners
        $(document).off("click", "#splitSubmit");
        $(document).off("click", "#splitDelete");

        // setup the title and description fields
        $("#splitGiftTitle").html("  "+title);
        if (desc != "") {
            $("#splitGiftDesc").html("  "+desc);
            $("#splitGiftDesc").show();
        } else {
            $("#splitGiftDesc").hide();
        }

        // setup the table showing claims so far
        gift_get(giftID, wishlistID, function(result, status, xhr) {
			claims_ui_display(result.gift);
		});

        // complete context-specific setup
        if (doWhat == "edit") {
        	setupEditSplitModal(giftID, percentLeft, myClaim);
        } else {
        	setupMakeSplitModal(giftID, percentLeft);
        }
    });

    /**
    *    
    * Finishes setting up a Split Modal with elements specific to placing a new split claim.
    * Author: kasmus@mit.edu
    */
	function setupMakeSplitModal(giftID, percentLeft) {
		$("#splitModalTitle").html("Make a Split Claim");

		// set up percentage options
		$("#splitPercentageSelect").html("");
		for (var i = percentLeft; i >= 5; i = i-5) {
			var option = $.parseHTML('<option name='+i+'>'+i+'</option>');
			$("#splitPercentageSelect").append(option);
		}

		// show instruction alert
		if (percentLeft == 100) {
			$("#splitTableLabel").hide();
			$("#newSplitMsg").show();
		} else {
			$("#existingSplitMsg").show();
		}

		$("#splitSubmit").text("Claim");
        $(document).on("click", "#splitSubmit", function() {makeSplitClaim(giftID);});
	}

    /**
    * Finishes setting up a Split Modal with elements specific to editing/deleting an existing split claim.
    *
    * Author: kasmus@mit.edu
    */
	function setupEditSplitModal(giftID, percentLeft, myClaim) {
		// if there's no percentage left, you can only view
		if (percentLeft == 0) {
            $("#splitModalTitle").html("View Your Split Claim");      

			$("#noUpdateSplitMsg").show();

            $("#splitForm").hide();

            $("#splitSubmit").hide();
            $("#splitDelete").hide();

        // if there's percentage left, you can edit stuff.
		} else {
            $("#splitModalTitle").html("Edit or Delete Your Split Claim");      

			$("#updateSplitMsg").show();

            // set up percentage options
            $("#splitPercentageSelect").html("");
            for (var i = percentLeft+myClaim; i >= 5; i = i-5) {
                var option = $.parseHTML('<option name='+i+'>'+i+'</option>');
                $("#splitPercentageSelect").append(option);
            }
            $("#splitPercentageSelect").val(myClaim);

            $("#splitDelete").show();
            $("#splitSubmit").text("Update Claim");

            $(document).on("click", "#splitSubmit", function() {editSplitClaim(giftID);});
            $(document).on("click", "#splitDelete", function() {deleteSplitClaim(giftID);});
		}


	}

    /**
    * Click listener for submitting a Split Claim modal.
    *
    * Author: kasmus@mit.edu
    */
    function makeSplitClaim(giftID) {
        // get the parameters
        var wishlistID = $("#wishlistID")[0].innerHTML;
        var percentage = $("#splitPercentageSelect").val();

        // call to the AJAX function to update database, with callback to update UI
        claim_post(percentage, giftID, wishlistID, function(result, status, xhr) {
            $("#splitModal").modal("hide");
            gift_ui_edit(result.gift);
        });
    };

    /**
    * Click listener for submitting an Edit Split Claim modal.
    *
    * Author: kasmus@mit.edu
    */
    function editSplitClaim(giftID) {
        // get the parameters
        var wishlistID = $("#wishlistID")[0].innerHTML;
        var percentage = $("#splitPercentageSelect").val();

        // call to the AJAX function to update database, with callback to update UI
        claim_put(percentage, giftID, wishlistID, function(result, status, xhr) {
            $("#splitModal").modal("hide");
            gift_ui_edit(result.gift);
        });
    };

    /**
    * Click listener for unclaiming a Split Claim.
    *
    * Author: kasmus@mit.edu
    */
    function deleteSplitClaim(giftID) {
        // call to the AJAX function to update database, with callback to update UI
        claim_delete(giftID, function(result, status, xhr) {
            $("#splitModal").modal("hide");
            gift_ui_edit(result.gift);
        });
    };

});
