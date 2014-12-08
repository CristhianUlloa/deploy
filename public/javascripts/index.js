currentUser = undefined;

/**
 * When index.ejs is loaded, check to see if a user is logged in
 * and load contents of page corresponding to status of user sign in
 * 
 * Author: ulloac@mit.edu
 */
$(document).ready(function() {
	$('#direct_link').css('visibility', 'hidden');
    $.get('/users/current', function(response) {
        var name = "Not Logged In";
        if (response.content.loggedIn) {
            currentUser = response.content.user;
            name = currentUser.firstName;
            var st = name +" ▼" ;
            $('#username-link').text(st);
            $('.dropdown-toggle').css("visibility", "visible");
        }
        var list_id = $('#direct_link').text();
        loadHomePage(list_id);
        $('#username-link').text(st);
    });
});

/* Renders the public wishlist exploration page when the dropdown link is clicked.
 *
 * Author: tdivita@mit.edu
 */
$(document).on('click', '#goto-public', function(evt) {
    loadPublicWishlistNavigationPage();
});

/**
 * Load webpage specifed by template and adds data to 
 * the main container in index.ejs
 * 
 * Author: ulloac@mit.edu
 */
var loadPage = function(template, data) {
    data = data || {};
    filename = "/templates/" + template + ".ejs";
    html = new EJS({url:filename}).render(data);    
    $('#main-container').html(html);
};

/**
 * Loads the signin or landing page as appropriate.
 * 
 * Author: ulloac@mit.edu
 */
var loadHomePage = function(data) {
    if (currentUser) {
        loadLandingPage(data);
    } else {
        loadPage('index',data); 
    }
};

/**
 * Load the main view for the user, with sidebar populated with wishlists and
 * welcome message displayed in main area.
 *
 * Author: tdivita@mit.edu
 */
var loadLandingPage = function(data) {
    $.get('/users/current', function(response) {
        if (response.content.loggedIn) {
            loadPage('main_view', data);
            $('.wishlistDetailDiv').css("display", "none");
            // Load Wishlists
            wishlists_sidebar_refresh();
            if(data) {
                wishlist_click(data);
            }
        }
        else { //no user logged in - redirect to login page
            loadPage('index', data);
        }
    });
};

/**
 * Load the public wishlist view, with sidebar populated with public wishlists.
 *
 * Author: tdivita@mit.edu
 */
var loadPublicWishlistNavigationPage = function(additional) {
    loadPage('public_list_navigation');
    $('.wishlistDetailDiv').css("display", "none");
    // Load Public Wishlists
    wishlists_public_sidebar_refresh();

    // Find the current user's email address.
    user_get(function(result, status, xhr) {
        save_user_email(result.currentUser[0]);
    });
};

