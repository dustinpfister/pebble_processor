/*    shops_newshop responder.js
 *
 *    
 */

// create a response for the given clientData object
exports.createAppResponse = function (clientData, req, res, scope, done) {

    // if new shop requested
    if (clientData.newShop) {

        scope.shops.startShop(scope, req.user.username, function (shopObj) {

            done({

                plugin: 'shops_newshop'
                , status: 'shop requested'
                , newShop: shopObj

            });

        });
        
    // no new shop
    } else {

        done({

            plugin: 'shops_newshop'
            , status: 'no new shop'

        });

    }

};