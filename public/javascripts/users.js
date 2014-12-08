// Javascript functions for the main (index) view. Includes click listeners and such.

$(document).ready(function () {
    /**
     * signs user in.
     *
     * Author: ulloac@mit.edu
     */
    $(document).on('submit', '#signin-form', function(evt) {
        evt.preventDefault();
        //First take in the information from the form
        var $inputs = $("#signin-form :input");
        var values = {};
        $inputs.each(function() {
            values[this.name] = $(this).val();
        });

        //when a user logs in, save the user for session and load home page
        userlogin_post(values, function(response) {
            currentUser = response.content.user;

            var wishlistID = $('#direct_link').text();
            if (wishlistID) {
            	loadHomePage(wishlistID);
            }
            else {
            	loadHomePage();
            }
            
            if(response.content.direct) {
                //////////////////////////////////////////////////////////////////////////////////
                // $("#"+response.content.list_id).click();
            }
            $('#username-link').text(currentUser.firstName +" ▼");
            $('.dropdown-toggle').css("visibility", "visible");

        }, function(jqxhr, textStatus, errorThrown){
            var response = $.parseJSON(jqxhr.responseText);
            loadPage('index', {
                error: response.err
            });
        });
    });

    /**
     * Registers a user.
     *
     * Author: ulloac@mit.edu
     */
    $(document).on('submit', '#register-form', function(evt) {
        evt.preventDefault();
        var $inputs = $('#register-form :input');
        var values = {};
        $inputs.each(function() {
            values[this.name] = $(this).val();
        });

        //check the passwords and make sure the match before registering user
        if (values.password !== values.confirm) {
            $('#register-error').text('Password and confirmation do not match!');
            return;
        }

        //register user for session and load home page contents
        usersubmit_post(values, function(response) {
            currentUser = response.content.user;
            loadHomePage();
            $('#username-link').text(currentUser.firstName + " ▼");
            $('.dropdown-toggle').css("visibility", "visible");

        }, function(jqxhr, textStatus, errorThrown) {
            var response = $.parseJSON(jqxhr.responseText);
            loadPage('index', {
                error: response.err
            });
        });
    });

    /**
     * Logs user out.
     *
     * Author: ulloac@mit.edu
     */
    $(document).on('click', '#logout-link', function(evt) {
        evt.preventDefault();
        userlogout_post(function(response) {
            currentUser = undefined;
            loadHomePage();
            $('.dropdown-toggle').css("visibility", "hidden");

            $('#username-link').text("Not Logged In" + " ▼");
        }, function(jqxhr, textStatus, errorThrown) {
            var response = $.parseJSON(jqxhr.responseText);
            loadLandingPage({
                error: response.err
            });
        });
    });

    /**
     * Click listener for link in dropdown to get to wishlist.
     *
     * Author: ulloac@mit.edu
     */
    $(document).on('click', '#wishlist-link', function(evt) {
        evt.preventDefault();
        loadLandingPage();
    });
});
