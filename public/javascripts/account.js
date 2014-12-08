//handles navigation to account page, and interactions with that page
//author: stahdirk

/**
 * Load an account information page, with claimed gifts and ability to change 
 * name and password
 *
 * Author: stahdirk
 */
var loadAccountPage = function(additional) {
    userinfo_get(function (info, err) {
        var user = info.content.user;
        var data = { name: user.firstName + ' ' + user.lastName, email: user.email, subscribed: user.subscribed };

        claims_get(function (claims, err) {
            data.claims = claims;
            wishlist_info_get(data.claims._id ,function (wishlists, err) {
                data.wishlists = wishlists;
                loadPage('account', data);
            });
        });       
    });
};

/* captures a click on a wishlist link and causes the wishlist
 * to be displayed
 *
 * author: stahdirk
 */
$(document).on('click', '.wishlist_link', function (event) {
    var selected = event.currentTarget;
    var selectedID = selected.id;

    //render page
    loadHomePage();

    //simulate a click on the wishlist
    wishlist_click(selectedID);
});

/* renders the account page when the dropdown link is clicked
 *
 * author: stahdirk
 */
$(document).on('click', '#goto-account', function(evt) {
    loadAccountPage();
});


//no modal needed for subscribing
$(document).on('click', '#subscribeBtn', function() {
    $.ajax({
        url: '/users/subscribe',
        type: 'POST',
        success: function () {
            console.log('subscribed');
            $("#accountUnsubscribed").hide();
            $("#accountSubscribed").show();
        }
    });
});

/* Makes the ajax call to remove a claim
 */
function removeClaim (id, loadAccount) {
    $.ajax({
        url: '/claims/' + String(id),
        type: 'DELETE',
        success: function () {
            if (loadAccount) loadAccountPage();
            else gift_ui_edit(); //load the wishlist page
        },
        error: function() {
            console.log('error in claim deletion');
        }
    });
}
    
//for removing claims - add event listener to each remove claim button
$(document).on('click', '.removeClaimBtn', function (ev) {
    removeClaim(ev.target.id, true);
});


//Author: stahdirk
$(document).ready(function () {

    /**
    * Clears fields on change password modal closing
    *
    * Author: stahdirk
    */
    $(document).on('hidden.bs.modal', "#changePasswordModal", function (e) {
        $("#newPW").val("");
        $("#newPWConfirm").val("");
        $('#mismatchAlert').hide();
        $('#incorrectPasswordAlert').hide();
        $('#oldPW').val("");
    });

    /**
    * Removes the change password modal
    *
    * Author: stahdirk
    */
    $(document).on("click", "#changePasswordSubmit", function (e) {
        var pw = $('#newPW').val();
        var pwconfirm = $('#newPWConfirm').val();
        var oldpw = $('#oldPW').val();

        if (pw !== pwconfirm) {
            $('#mismatchAlert').show();
            $("#newPW").val("");
            $("#newPWConfirm").val("")
        }
        else {
            change_password_post(pw, oldpw, function(result, status, xhr) {
                $("#changePasswordModal").modal("hide");
            }, function(result, status, xhr) { //error callback
                $('#oldPW').val("");
                $('#incorrectPasswordAlert').show();
            });
        }


    });

    /**
    * Clears fields on change name modal closing
    *
    * Author: stahdirk
    */
    $(document).on('hidden.bs.modal', "#changeNameModal", function (e) {
        $("#newFirstName").val("");
        $("#newLastName").val("")
    });

    /**
    * Removes the change name modal
    *
    * Author: stahdirk
    */
    $(document).on("click", "#changeNameSubmit", function (e) {
        $("#changeNameModal").modal("hide");
        var firstname = $('#newFirstName').val();
        var lastname = $('#newLastName').val();

        change_name_post(firstname, lastname, function(result, status, xhr) {
            $("#accountName").html(result.content.user.firstName+" "+result.content.user.lastName);
            $("#username-link").html(result.content.user.firstName);
        });
    });

    $(document).on("click", "#unsubscribeBtn", function() {
        $('#unsubscribeModal').modal('show');
    });


    //Clears stuff when the unsubscribe modal is closed.
    $(document).on('hidden.bs.modal', "#unsubscribeModal", function (e) {
        $("#usubscribeModal").modal("hide");
    });

    
    //if user confirms unsubscribe, make ajax call to store that choice
    $(document).on("click", "#confirmUnsubscribe", function (e) {
        unsubscribe_post(function() {
            $("#unsubscribeModal").modal("hide");
            $("#accountSubscribed").hide();
            $("#accountUnsubscribed").show();
        });
    });
});

