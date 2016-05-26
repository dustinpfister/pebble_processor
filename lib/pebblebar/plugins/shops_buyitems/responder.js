/*    shops_buyitems responder.js
 *
 *    
 */

// create a response for the given clientData object
exports.createAppResponse = function (clientData, req, res, scope, done) {

    if (!clientData.shopId) {

        done({

            plugin: 'shops_buyitems'
            , mess: 'must give a shopId'

        });

    } else {

        if (!clientData.items) {

            done({

                plugin: 'shops_buyitems'
                , mess: 'must give a buyItems array'

            });

        } else {

            if (clientData.items.length > 0) {

                scope.shops.buyShopItems(scope, req.user.username, clientData.shopId, clientData.items, function (status) {

                    done({

                        plugin: 'shops_buyitems'
                        , mess: 'made the call to shops.js'
                        , status: status

                    });

                });

                // no items requested
            } else {

                done({

                    plugin: 'shops_buyitems'
                    , mess: 'no items baught'

                });

            }

        }

    }

};