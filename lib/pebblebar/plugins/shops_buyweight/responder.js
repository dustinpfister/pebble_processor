/*    shops_buyweight responder.js
 *
 *    
 */

// create a response for the given clientData object
exports.createAppResponse = function (clientData, req, res, scope, done) {

    // if we have a shopId
    if (clientData.shopId) {

        // buying weight for a shop?
        if (clientData.amount) {

            scope.users.getUserPrime(req.user.username, function (userAccount) {

                if (userAccount.wallet >= clientData.amount) {

                    scope.shops.findShopById(clientData.shopId, function (err, shop) {

                        // if we get the shop
                        if (shop) {

                            // make the transfer
                            pebble.transfer({
                                    getBy: 'username'
                                    , username: req.user.username
                                }, {
                                    getBy: 'reserve'
                                }
                                , clientData.amount
                                , function (toWallet) {

                                    shop.weight += clientData.amount;
                                    shop.save(function () {

                                        done({

                                            plugin: 'shops_buyweight'
                                            , status: 'weight baught'

                                        });

                                    });

                                }

                            );

                            // if we do not get the shop
                        } else {

                            done({

                                plugin: 'shops_buyweight'
                                , status: 'shop not found.'

                            })

                        }

                    });

                    // no new weight becuase the player does not have the pebble
                } else {

                    done({

                        plugin: 'shops_buyweight'
                        , status: 'no pebble'

                    });

                }

            });

            // no new weight
        } else {

            done({

                plugin: 'shops_buyweight'
                , status: 'no amount given, or zero amount'

            });

        }

        // else if we where not given a shop id
    } else {

        done({

            plugin: 'shops_buyweight'
            , status: 'no shop id given, need to know what shop you want weight for.'

        });

    }

};