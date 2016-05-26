var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ShopBase;


// get the given shop page
exports.getShopPage = function (pageNumber, shopsPerPage, done) {

    var maxPage = 1;


    if (pageNumber === undefined) {
        pageNumber = 0;
    }
    if (shopsPerPage === undefined) {
        shopsPerPage = 3;
    }

    // find tottal page count
    // ALERT! This could be stored in some collection that is updated every time a store is made or lost.
    ShopBase.find({}, function (err, shops) {

        maxPage = Math.ceil(shops.length / shopsPerPage);

    });

    // find current page
    ShopBase.find().sort({
        weight: -1
    }).skip(pageNumber * shopsPerPage).limit(shopsPerPage).exec(
        function (err, shopPage) {

            done(shopPage, maxPage, pageNumber, shopsPerPage);

        });

};

// find a shop document by the given id
exports.findShopById = function (id, cb) {
    ShopBase.findOne({
        'id': id
    }, '', function (err, shop) {
        if (shop) {
            return cb(null, shop);
        } else {
            return cb(null, null);
        }
    });
};

// start a new shop if the user has enough pebble
exports.startShop = function (scope, username, done) {

    var newShop, self = this;

    // get the users pluginData for shops  
    self.checkPluginIndex(username, scope, function (pluginIndex) {

        // find the user
        scope.users.findByUsername(username, function (err, user) {

            if (user) {

                // get the users pluginData for shops  
                //self.checkPluginIndex(username, scope, function(pluginIndex){


                var pluginData;

                // no index?
                if (pluginIndex === -1) {

                    done({
                        mess: 'the user does not have pluginData for shops.'
                    })

                } else {

                    pluginData = user.pluginData[pluginIndex];

                    // get the users prime account
                    scope.pebble.getAccount(user.primeAccount, function (userAccount) {

                        // check if the user has the pebble
                        if (userAccount.wallet >= 100) {

                            // check if the player has not reached max shops
                            if (pluginData.userShops.length < pluginData.maxShops) {

                                // get the reserve
                                scope.pebble.getReserve(function (reserve) {

                                    // if we have the reserve
                                    if (reserve) {

                                        // make the transfer, and give the player the shop
                                        scope.pebble.transfer(userAccount, reserve, 100, function () {

                                            // the new shop
                                            newShop = new ShopBase({

                                                id: new Date().getTime()
                                                , shopName: 'A Farm'
                                                , shopType: 'farm'
                                                , weight: 1000
                                                , shopOwner: user.username
                                                , production: [
                                                    {
                                                        productName: 'food'
                                                        , lastMade: new Date().toString()
                                                        , rate: 90000
                                            }
                                        ]
                                                , forSale: []
                                                , forSaleLimit: 5

                                            });

                                            // update plugin data
                                            //user.pluginData[pluginIndex].userShops.push(newShop.id);
                                            pluginData.userShops.push(newShop.id);

                                            user.markModified('pluginData');

                                            // save the user object
                                            user.save(function () {

                                                // save the shop
                                                newShop.save(function () {

                                                    done({

                                                        mess: 'looks good lets give you one...'
                                                        , theShop: newShop

                                                    });

                                                });

                                            });

                                        });

                                    } else {

                                        done({
                                            mess: 'no reserve!?'
                                        });

                                    }

                                });



                            } else {

                                done({
                                    mess: 'to many shops sell one'
                                });

                            }

                        } else {

                            done({
                                mess: 'sorry, you do not have the pebble.'
                            })


                        }

                    });

                } // end if pluginIndex === -1

                // if no user
            } else {


                done({
                    mess: 'user not found.'
                });

            }

        });

    });

};

// get a users shops
exports.getUsersShops = function (scope, username, done) {

    // get the user
    scope.users.findByUsername(username, function (err, user) {

        if (user) {

            scope.users.getPlugIndex(username, 'shops', function (pluginIndex) {

                var query = [];

                if (pluginIndex === -1) {

                    done([]);

                } else {

                    // build query
                    user.pluginData[pluginIndex].userShops.forEach(function (shopId) {

                        query.push({

                            id: shopId
                        })

                    });

                    // get the shops
                    ShopBase.find({
                        "$or": query
                    }, function (err, shops) {

                        done(shops);

                    });

                }

            });

        } else {

            done([]);

        }


    });

};

exports.buyShopItems = function (scope, buyer, shopId, items, done) {

    var report = {

            mess: 'shop not found, or sothing went wrong.'
            , items: []

        }
        , itemsProcessed = 0;

    if (shopId === undefined) {

        done({

            mess: 'shops.buyShopItems : no shopId given.'
            , report: report

        });

    } else {


        // get the buyers UserRec
        scope.users.findByUsername(buyer, function (err, user) {

            // get the shop
            ShopBase.findOne({
                id: shopId
            }, '', function (err, shop) {

                // if we have the shop
                if (shop) {

                    report = {
                        mess: 'shop found.'
                        , items: []

                    };

                    // for each item the buyer wants
                    items.forEach(function (itemId, itemIndex) {

                        // get the shop owners userRec
                        scope.users.findByUsername(shop.shopOwner, function (err, shopUser) {

                            var i = 0
                                , len = shop.forSale.length;


                            // find the item that the buyer wants
                            while (i < len) {

                                // if it is the item that the buyer wants
                                if (String(shop.forSale[i]._id) === itemId) {

                                    scope.pebble.transfer({
                                            getBy: 'username'
                                            , username: user.username
                                        }, {
                                            getBy: 'username'
                                            , username: shopUser.username
                                        }
                                        , shop.forSale[i].pebbleCost,

                                        // done
                                        function () {

                                            //console.log(shop.forSale.splice(i, 1)[0]);

                                            report.items.push({

                                                item: itemId
                                                , mess: 'item was bought'

                                            });
                                            itemsProcessed += 1;

                                            if (itemsProcessed === items.length) {

                                                console.log(report);
                                                console.log('items processed ' + itemsProcessed);
                                                done({

                                                    mess: 'well something happend, check the report'
                                                    , report: report

                                                });

                                            }

                                            // save records
                                            //user.save();
                                            //shopUser.save();
                                            //shop.save();

                                        },

                                        // fail
                                        function () {

                                            report.items.push({

                                                item: itemId
                                                , mess: 'something went wrong with the transfer'

                                            });
                                            itemsProcessed += 1;

                                            if (itemsProcessed === items.length) {

                                                console.log(report);
                                                console.log('items processed ' + itemsProcessed);
                                                done({

                                                    mess: 'well something happend, check the report'
                                                    , report: report

                                                });

                                            }

                                        }

                                    );



                                    break;

                                }

                                i++;

                            }

                            if (i === len) {

                                report.items.push({

                                    item: itemId
                                    , mess: 'no item was found with the given id.'

                                });
                                itemsProcessed += 1;


                            }

                            if (itemsProcessed === items.length) {

                                console.log(report);
                                console.log('items processed ' + itemsProcessed);
                                done({

                                    mess: 'well something happend, check the report'
                                    , report: report

                                });

                            }



                        });


                    });


                    // else if we do not have a shop
                } else {

                    done({

                        mess: 'shop of given id was not found.'
                        , report: report

                    });

                }

            });


        });


    }

};


/*
exports.buyShopItems = function (scope, buyer, shopId, items, done) {

    var report = {

        mess: 'shop not found, or sothing went wrong.'
        , items: []

    },
    itemsProcessed = 0;

    if (shopId === undefined) {

        done({

            mess: 'shops.buyShopItems : no shopId given.'
            , report: report

        });

    } else {


        // get the buyers UserRec
        scope.users.findByUsername(buyer, function (err, user) {

            // get the shop
            ShopBase.findOne({
                id: shopId
            }, '', function (err, shop) {

                // if we have the shop
                if (shop) {

                    report = {
                        mess: 'shop found.'
                        , items: []

                    };

                    // for each item the buyer wants
                    items.forEach(function (itemId, itemIndex) {

                        // get the shop owners userRec
                        scope.users.findByUsername(shop.shopOwner, function (err, shopUser) {

                            var i = 0
                                , len = shop.forSale.length;

                            scope.users.getUserPrime(shopUser.username, function (shopAccount) {

                                scope.users.getUserPrime(user.username, function (userAccount) {

                                    // find the item that the buyer wants
                                    while (i < len) {

                                        // if it is the item that the buyer wants
                                        if (String(shop.forSale[i]._id) === itemId) {

                                            //console.log('what the fuck');
                                            
                                            // does the buyer have the pebble for the item?
                                            if (userAccount.wallet >= shop.forSale[i].pebbleCost) {

                                                // debit the buyer, and credit the owner
                                                //scope.pebble.transfer(userAccount, shopAccount, shop.forSale[i].pebbleCost, function () {
                                                    
                                                
                                                scope.pebble.transfer(
                                                    {getBy:'username', username: user.username}, 
                                                    {getBy:'username', username: shopUser.username},
                                                    shop.forSale[i].pebbleCost, 
                                                    function () {

                                                    // the buyer gets the item, and the owner looses it from inventory
                                                    // user.storage.push(shop.forSale.splice(i, 1)[0]);

                                                    //console.log('shops.js: item '+ itemId +' found!');

                                                    //console.log(shop.forSale.splice(i, 1)[0]);

                                                    report.items.push({

                                                        item: itemId
                                                        , mess: 'item was bought'

                                                    });
                                                    itemsProcessed += 1;

                                                    // save records
                                                    user.save();
                                                    shopUser.save();
                                                    shop.save();

                                                });

                                            } else {

                                                report.items.push({

                                                    item: itemId
                                                    , mess: 'The player does not have the pebble to buy it.'

                                                });
                                                itemsProcessed += 1;

                                            }

                                            //console.log(report)

                                            break;

                                        }

                                        i++;

                                    }

                                    if (i === len) {

                                        report.items.push({

                                            item: itemId
                                            , mess: 'no item was found with the given id.'

                                        });
                                        itemsProcessed += 1;

                                        //console.log(report);

                                        //console.log('shops.js: item ' + itemId + ' not found')

                                    }

                                    if (itemIndex === items.length - 1) {

                                        console.log(report);
                                        console.log('items processed ' + itemsProcessed);
                                        done({

                                            mess: 'well something happend, check the report'
                                            , report: report

                                        });

                                    }

                                });

                            });

                        });


                    });


                    // else if we do not have a shop
                } else {

                    done({

                        mess: 'shop of given id was not found.'
                        , report: report

                    });

                }

            });


        });


    }

};

*/

// update shops
exports.updateShops = function (done) {

    ShopBase.find(function (err, shops) {

        // for each shop
        shops.forEach(function (shop) {

            // for each shop production
            shop.production.forEach(function (production) {

                // the amount of time sense last production
                var time = new Date() - new Date(production.lastMade)
                    , proCount
                    , freeSpace;

                // if time is greater then production rate
                if (time >= production.rate) {

                    // the production count
                    proCount = Math.floor(time / production.rate);

                    while (proCount > 0) {

                        // break out of limit is reached
                        if (shop.forSale.length >= shop.forSaleLimit) {

                            break;

                        }

                        shop.forSale.push({

                            productName: production.productName
                            , pebbleCost: 10

                        });

                        proCount -= 1;

                    }

                    production.lastMade = new Date().toString();
                }

            });

            shop.save();

        });


    });

    done();

};

// check for the plugins index, if -1 create the plugin object for the user
exports.checkPluginIndex = function (username, scope, done) {

    var self = this;

    scope.users.getPlugIndex(username, 'shops', function (pluginIndex) {

        // no plugin? make it.
        if (pluginIndex === -1) {

            self.makePluginData(username, scope, function (plug, pluginIndex) {

                // return with the index of the new pluginData object
                done(pluginIndex);

            });

            // if we are good just give the index
        } else {

            done(pluginIndex);

        }

    });

};

// make a storage object in the given usernames pluginData
exports.makePluginData = function (username, scope, done) {

    var pluginData = {

        plugin: 'shops'
        , userShops: [], // an array of shop id's that the user owns
        maxShops: 3 // the max number of shops that the player can have

    };

    // create the plugin data in the userRec
    scope.users.createPlugData(username, pluginData, function (pluginData, index) {

        done(pluginData, index);

    });

};

// what should be done on plugin setup?
exports.setup = function (db) {

    ShopBase = db.model('shop', new Schema({

        // Basic shop info
        id: String, // the id of the stop
        shopName: String, // the name of the shop
        shopOwner: String, // the username of the player that owns the shop.

        // Weight (weight effects the shop rank on the shop list?)
        weight: Number,

        // type
        shopType: String,

        // Production (what products are being produced and the rate at which they are made)
        production: [

            {
                productName: String, // the name of the product to produce
                lastMade: String, // a time stamp that reflects the last time production occured.
                rate: Number // the amount of time that needs to pass until one unit of the procuct is made

        }

    ],

        // For Sale
        forSale: [ // products that are for sale to anyone who wants them.
            {
                productName: String, // the product name (food, oil, water, wood, ect)
                pebbleCost: Number // the amount of pebble needed to buy the product from the shop owner.
        }
    ]
        , forSaleLimit: Number

    }));

};