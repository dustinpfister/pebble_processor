/*    shops_getusershops responder.js
 *
 *    
 */

// create a response for the given clientData object
exports.createAppResponse = function (clientData, req, res, scope, done) {

    // get user shops
    scope.shops.getUsersShops(scope, req.user.username, function (userShops) {

        done({

            plugin: 'shops_getusershops'
            , userShops: userShops

        });

    });

};