var mongoose = require('mongoose')
    , openShift = require('./openshift.js').openShiftObj
    , Schema = mongoose.Schema,

    // users
    users = require('./users.js'),

    db = mongoose.createConnection(openShift.mongo),

    Reserve = db.model('reserve', {

        id: String, // the id of the reserve record 'main' is what is used in the game.
        worldTotal: Number, // total world pebbles
        wallet: Number, // the number of pebbles in the reserve account
        population: Number, // the current world population ( number of users )
        equalShare: Number, // what an equal share of the total world pebbles is.

        responders: [], // an array of pebblebar plugins that have responder.js files. 

    }),

    // the account model
    Account = db.model('account', {

        accountNumber: String, // an unique number that id's the account
        wallet: Number, // the account balance
        owners: [] // a list of owners of the account

    }),

    TransferRequest = db.model('transfer_request', {

        transferNumber: String, // the transfer number
        fromAccount: String, // the accountNumber of the account that pebble is being transfered from
        toAccount: String, // the accountNumber of the account that pebble is being transfered to
        amount: Number, // the amount of pebble to transfer
        status: String // the status of the transfer (pending, success, fail)
    }),

    TransferProcessed = db.model('transfer_processed', {

        transferNumber: String, // the transfer number
        amount: Number, // the amount of pebble to transfer
        status: String, // the status of the transfer (success or fail only if processed)
        messCode: Number // a code that will get a message saying what happened

    }),

    // check account reference aurgment, and get the account if you don't all ready have it
    // used in pebble.transfer()
    accountRefCheck = function (accountRef, done, fail) {

        if (done === undefined) {
            done = function () {};
        }
        if (fail === undefined) {
            fail = function () {};
        }

        // if object
        if (typeof accountRef === 'object') {

            // if wallet assume it is all ready an account collection or reserve object.
            if (!(accountRef.wallet === undefined)) {

                //console.log('pebble.js: looks like we all ready have it.');

                done(accountRef);


            } else {

                // assume getBy prop
                switch (accountRef.getBy) {

                    // if username get user prime account via username property
                case 'username':

                    console.log('pebble.js: getting prime user account!');

                    // get user prime account
                    users.getUserPrime(

                        accountRef.username,

                        // done
                        function (account) {

                            done(account);

                        },

                        // fail
                        function (mess) {

                            fail(mess)

                        }
                    );


                    break;

                    // if accountNumber we will be getting the account by it's number
                case 'accountNumber':

                    console.log('pebble.js: getting by account Number!');

                    exports.getAccount(accountRef.accountNumber, function (account) {

                        done(account);

                    });

                    break;

                    // if reserve we will be getting the reserve account
                case 'reserve':

                    console.log('pebble.js: getting by reserve account!');

                    // get the reserve account
                    exports.getReserve(function (account) {

                        done(account);

                    });

                    break;

                }


            }

        } else {

            console.log(accountRef);

            console.log('pebble.js: no object!');

            fail();

        }

    };


exports.clearResponders = function (done) {

    if (done === undefined) {
        done = function () {};
    }

    this.getReserve(function (reserve) {

        reserve.responders = [];

        reserve.save(function () {

            //console.log('pebble.js: reserve responders array cleared.');

            done();

        });

    });

};

// set the given plugin name to the responder array
exports.pushResponder = function (pluginName) {

    this.getReserve(function (reserve) {

        reserve.responders.push(pluginName);

        reserve.save(function () {

            // console.log('pebble.js: added ' + pluginName + ' to the responders array.');

        });


    });

};

// create an account
exports.createAccount = function (owner, done) {

    var newAccount = new Account({

        accountNumber: new Date().getTime()
        , wallet: 0
        , owners: [owner]

    });

    newAccount.save(function () {

        done(newAccount.accountNumber);

    });

};

// get an account by its number
exports.getAccount = function (number, done) {

    Account.findOne({
        accountNumber: number
    }, '', function (err, account) {

        done(account);

    });

};

// get all the pebble accounts
exports.getAllAccounts = function (done) {

    Account.find({}, '', function (err, accounts) {

        done(accounts);

    });

};

/*
exports.pushTransfer = function (status, done) {

    var processed = new TransferProcessed(status);

    processed.save(function () {

        done();

    });

};
*/

exports.getTransferMessgae = function (messCode) {

    switch (messCode) {

    case 4:
        return 'Same account transfer.';
        break;
    case 3:
        return 'Not enough pebble.';
        break;
    case 2:
        return 'Count not get account.';
        break;
    case 1:
        return 'Generic message\/error code. Or no message code set.';
        break;
    case 0:
        return 'Sucessful transfer.';
        break;

    }

};

// create a TransferProcessed instance, push it to the database, and purge the TransferRequest
exports.pushTransfer = function (transReq, aurg, done) {

    if (aurg === undefined) {
        aurg = {};
    }
    if (aurg.messCode === undefined) {
        aurg.messCode = 0;
    }
    if (aurg.status === undefined) {
        aurg.status = 'fail';
    }

    // create the Transfer Processed instance
    var processed = new TransferProcessed({

        transferNumber: transReq.transferNumber
        , amount: transReq.amount
        , status: aurg.status
        , messCode: aurg.messCode

    });

    processed.save(function () {

        TransferRequest.remove({
            transferNumber: transReq.transferNumber
        }, function (err) {


            done();

        });


    });

};

// process the next transfer request
exports.processNext = (function () {

    var locked = false
        , self = this
        , fromAccount
        , toAccount;

    return function () {

        var self = this;

        if (!locked) {

            // do not process any other transfers until unlocked
            locked = true;

            TransferRequest.findOne({}, {}, {
                sort: {
                    'created_at': -1
                }
            }, function (err, transReq) {

                if (transReq) {

                    //console.log('transfer #: ' + trans.transferNumber);

                    //console.log(transReq)

                    // check the fromAccount aurg and fix
                    accountRefCheck(transReq.fromAccount,

                        // done
                        function (fix) {

                            fromAccount = fix;

                            // check the toAccount aurg and fix
                            accountRefCheck(transReq.toAccount,

                                // done
                                function (fix) {

                                    toAccount = fix;

                                    console.log(fromAccount);
                                    console.log(toAccount);

                                },

                                // fail
                                function () {

                                    console.log('fail getting to account');

                                    self.pushTransfer(
                                        transReq, {
                                            status: 'fail'
                                            , messCode: 1

                                        }
                                        , function () {

                                            locked = false;
                                        }
                                    );

                                }
                            );

                        },

                        // fail
                        function () {

                            console.log('fail getting from acccount');

                            self.pushTransfer(
                                transReq, {
                                    status: 'fail'
                                    , messCode: 1

                                }
                                , function () {

                                    locked = false;
                                }
                            );

                        }

                    );

                } else {

                    console.log('no work to do');
                    locked = false;
                }

                //locked = false;

            });

        }

    };

}());

// transfer pebbles from one account to another
exports.transfer = (function () {

    // count is used in the creation of transfer numbers
    var count = 0;

    return function (fromAccount, toAccount, amount, done, fail) {

        var self = this;

        // check the fromAccount aurg and fix
        accountRefCheck(fromAccount, function (fix) {

                fromAccount = fix;

                // check the toAccount aurg and fix
                accountRefCheck(toAccount,

                    // done            
                    function (fix) {

                        toAccount = fix;

                        // logg the request
                        var transfer = new TransferRequest({

                            transferNumber: 'c' + count + ':t' + new Date().getTime()
                            , fromAccount: fromAccount.accountNumber
                            , toAccount: toAccount.accountNumber
                            , amount: amount
                            , status: 'pending'

                        });

                        transfer.save(function () {

                            console.log('transfer request.');

                            done({
                                mess: 'transfer requested.'
                            });

                        });

                        count += 1;

                        // count loops back to zero every now and then
                        if (count >= 10000) {

                            count = 0;

                        }

                    },

                    // fail
                    function (mess) {

                        fail({
                            mess: mess
                        });

                    });

            },

            function (mess) {

                fail({
                    mess: mess
                });

            });

    };

}());


/*
// transfer pebbles from one account to another
exports.transfer = function (fromAccount, toAccount, amount, done, fail) {

    var self = this;

    // check the fromAccount aurg and fix
    accountRefCheck(fromAccount, function (fix) {

            fromAccount = fix;

            // check the toAccount aurg and fix
            accountRefCheck(toAccount, function (fix) {

                    toAccount = fix;

                    // make transfer
                    if (fromAccount.wallet >= amount) {

                        if (fromAccount.accountNumber === toAccount.accountNumber) {

                            done({
                                mess: 'same account, no transfer'
                            })

                        } else {
                            
                            console.log('from account wallet: ' + fromAccount.wallet);
                            
                            
                            
                            
                            fromAccount.wallet -= amount;
                            toAccount.wallet += amount;

                            fromAccount.save(function () {

                                toAccount.save(function () {

                                    done({
                                        mess: 'transfer successful.'
                                    });

                                });

                            });
                            

                        }

                    } else {

                        fail({
                            mess: 'insufficient pebble'
                        });

                    }

                },

                function (mess) {

                    fail({mess:mess});

                });

        },

        function (mess) {

            fail({mess:mess});

        });

};
*/

// give pebble away, but why?
exports.give = function (req, done, fail) {

    if (req.body.amount) {

        if (req.body.giveTo) {

            switch (req.body.giveTo) {

                // give to the reserve
            case 'reserve':

                // make the transfer
                this.transfer({
                        getBy: 'username'
                        , username: req.user.username
                    }, {
                        getBy: 'reserve'
                    }, req.body.amount,

                    // done
                    function (toWallet) {

                        done({
                            giveStatus: 'give to reserve.'
                        });

                    },

                    // fail
                    function (mess) {


                        fail(mess);

                    }

                );

                break;

                // give to a usernames prime account
            case 'username':

                if (req.body.username) {

                    // make the transfer
                    this.transfer({
                            getBy: 'username'
                            , username: req.user.username
                        }, {
                            getBy: 'username'
                            , username: req.body.username
                        , }, req.body.amount, function (toWallet) {

                            done({
                                giveStatus: 'give to reserve.'
                            });

                        },

                        // fail
                        function (mess) {

                            fail(mess)

                        }

                    );

                } else {

                    done({
                        giveStatus: 'no username given.'
                    });

                }

                break;

            default:

                done({
                    giveStatus: 'fail, unkown giveTo.'
                });

                break;

            }

        } else {

            done({
                giveStatus: 'fail, no giveTo prop in request.'
            });

        }

    } else {

        done({
            giveStatus: 'fail, no amount prop in request.'
        });

    }

};

// how about a grant?
exports.grant = function (req, done) {

    var amount = req.body.amount
        , self = this;

    // if we have an amount
    if (amount) {

        // get the reserve
        this.getReserve(function (reserve) {

            // can we grant the pebble?
            if (amount <= reserve.wallet && amount > 0) {

                // make the transfer
                self.transfer({
                    getBy: 'reserve'
                }, {
                    getBy: 'username'
                    , username: req.user.username
                }, amount, function (toWallet) {

                    done({
                        grandStatus: 'success'
                        , reserveWallet: reserve.wallet
                        , yourWallet: toWallet
                    });

                });


            } else {

                done({
                    grantStatus: 'rejected, something wrong with amount requested'
                });

            }

        });


    } else {

        done({
            grantStatus: 'rejected'
        });

    }

};

// check for the reserve account and create it if it is not there
exports.reserveCheck = function (done) {

    if (done === undefined) {
        done = function () {};
    }

    Reserve.findOne({
        id: 'main'
    }, '', function (err, reserve) {

        if (reserve) {

            console.log('reserve account found: ');
            console.log('world total: ' + reserve.worldTotal);
            console.log('reserve wallet: ' + reserve.wallet);
            console.log('popuation: ' + reserve.population);
            console.log('equal share: ' + reserve.equalShare);

            done(reserve);

        } else {

            console.log('reserve account not found!');
            console.log('making new one...');

            reserve = new Reserve({

                id: 'main'
                , worldTotal: 1000
                , equalShare: 1000
                , population: 0
            , });
            reserve.wallet = reserve.worldTotal;

            reserve.responders = [];

            // old stuff
            //reserve.brackets = [];
            //reserve.lastCollection = new Date();

            reserve.save(function () {

                console.log('new reserve saved');

                done(reserve);

            });


        }

    });

};

// just get the reserve
exports.getReserve = function (done) {

    Reserve.findOne({
        id: 'main'
    }, '', function (err, reserve) {

        if (reserve) {

            done(reserve);

        } else {

            done(null);

        }

    });

};

// population has changed to the given population
exports.popChange = function (population) {

    Reserve.findOne({
        id: 'main'
    }, '', function (err, reserve) {

        if (reserve) {

            // update population and equal share
            reserve.population = population;
            reserve.equalShare = reserve.worldTotal / reserve.population;
            reserve.brackets = brackets = [
                {
                    lessThen: reserve.equalShare / 10
                    , rate: 0
                }





















                
                , {
                    lessThen: reserve.equalShare / 5
                    , rate: 0.05
                }





















                
                , {
                    lessThen: reserve.equalShare / 2
                    , rate: 0.12
                }





















                
                , {
                    lessThen: reserve.equalShare
                    , rate: 0.25
                }
            ];





            reserve.save(function () {

                console.log('reserve account data updated');

            });

        }


    });

};

// a take request from the reserve to the given user.
exports.takeRequest = function (username, amount, done) {

    amount = Math.floor(amount);

    Reserve.findOne({
        id: 'main'
    }, '', function (err, reserve) {

        console.log('take request!');

        if (reserve) {

            if (reserve.wallet >= amount) {

                console.log('there are pebbles in the account to give the take.');

                /*
                reserve.wallet -= amount;
                reserve.save(function () {

                    users.creditUser(username, amount, function (wallet) {

                        console.log('wallet');
                        console.log(wallet);
                        done(wallet, amount);

                    });

                });

                */

                users.creditUserPrime(reserve, username, amount, function (wallet) {


                    done(wallet, amount);

                });

            }

        }


    });

};