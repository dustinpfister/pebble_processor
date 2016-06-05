/*
 *    reserve_take responder.js
 *
 *    respond to a take request from the client
 */

// the default object this is stored in the userRecs pluginData property.
var pluginDefault = {

    plugin: 'reserve_take'
    , takeCount: 0
    , lastTake: new Date(0)
    , lockedOut: false

};


// create a response for the given clientData object
exports.createAppResponse = function (clientData, req, res, scope, done) {

    if (clientData.amount === undefined) {

        done({

            plugin: 'reserve_take'
            , sucess: false
            , mess: ' no amount property given'

        });


    } else {


        if (typeof clientData.amount === 'number') {

            // take may be requested if amount is greater then 0, and less than 100
            if (clientData.amount > 0 && clientData.amount <= 100) {

                scope.users.pluginData(
                    req.user.username
                    , pluginDefault,

                    // done getting the users pluginData
                    function (pluginData) {

                        pluginData.takeCount += 1;
                        pluginData.lastTake = new Date();

                        //pluginData.save(function(){
                        scope.users.updatePluginData(req.user.username, pluginData,

                            // done updating data
                            function () {


                                scope.pebble.transfer(
                                    
                                    {
                                        getBy: 'reserve'
                                    }, 
                                    
                                    {
                                        getBy: 'username'
                                        , username: req.user.username

                                    },

                                    clientData.amount,

                                    // done
                                    function () {

                                        done({

                                            plugin: 'reserve_take'
                                            , sucess: true
                                            , mess: 'the transaction request was made.'


                                        });

                                    },

                                    // fail
                                    function () {


                                        done({

                                            plugin: 'reserve_take'
                                            , sucess: false
                                            , mess: 'an error happend while requesting the transfer.'

                                        });

                                    }

                                );



                            }

                            // fail
                            
                            , function () {

                                done({

                                    plugin: 'reserve_take'
                                    , success: false
                                    , mess: 'there was a problem updating data'

                                });

                            }

                        );

                    },

                    // fail
                    function () {

                        done({

                            plugin: 'reserve_take'
                            , sucess: false
                            , mess: 'something went wrong getting the pluginData'

                        });

                    }

                );

                /*
                done({

                    plugin: 'reserve_take'
                    , sucess: true
                    , mess: 'the transaction request was made.'

                });
                */

            } else {

                done({

                    plugin: 'reserve_take'
                    , sucess: false
                    , mess: 'the number given is zero or lower, above 100, or NaN'

                });

            }

        } else {

            done({

                plugin: 'reserve_take'
                , sucess: false
                , mess: 'amount propert given is not a number'

            });

        }

    }

    /*
    if(clientData.requested){
    
        scope.pebble.takeRequest(req.user.username, clientData.requested, function (wallet) {

            done({
                plugin: 'take',
                takeWalletAfter: wallet
                , take: 'take complete maybe'
            });

        
        });
        
    }else{
           
        done({
            plugin : 'take',
            mess: 'take not compleate, requested pebble not found.'
        })
        
    }
    
    */

};