var mongoose = require('mongoose')
    , openShift = require('./openshift.js').openShiftObj
    , Schema = mongoose.Schema,

    // users
    users = require('./users.js'),
    
    // fulfiller
    fulfiller = require('./pebblebar/fulfiller.js');

    db = mongoose.createConnection(openShift.mongo),

    Reserve = db.model('reserve', {

        id: String, // the id of the reserve record 'main' is what is used in the game.
        worldTotal: Number, // total world pebbles

        // account
        accountNumber: String, // an account number that sets the reserve appart from other accounts
        wallet: Number, // the number of pebbles in the reserve account

        population: Number, // the current world population ( number of users )
        equalShare: Number, // what an equal share of the total world pebbles is.

        responders: [] // an array of pebblebar plugins that have responder.js files. 


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
        status: String, // the status of the transfer (pending, success, fail)
        fulfillerPlugin : String, // the name of a plugin that has a fulfiller.js file to call when processed.
        fulfillerData: {}
    }),

    TransferProcessed = db.model('transfer_processed', {

        transferNumber: String, // the transfer number
        amount: Number, // the amount of pebble to transfer
        status: String, // the status of the transfer (success or fail only if processed)
        messCode: Number, // a code that will get a message saying what happened,
        fulfillerPlugin: String,
        fulfillerData: {}

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

                done(accountRef);

            } else {

                // assume getBy prop
                switch (accountRef.getBy) {

                    // if username get user prime account via username property
                case 'username':

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

                    exports.getAccount(accountRef.accountNumber,

                        // done
                        function (account) {

                            done(account);

                        },

                        // fail
                        function (mess) {

                            fail(mess);

                        }

                    );

                    break;

                    // if reserve we will be getting the reserve account
                case 'reserve':


                    // get the reserve account
                    exports.getReserve(function (account) {

                        done(account);

                    });

                    break;

                }

            }

            // if not an object
        } else {

            // if reserve
            if (accountRef === 'reserve') {

                // get the reserve account
                exports.getReserve(function (account) {

                    done(account);

                });

                // assume an account number
            } else {

                // ALERT! we dont have a fail callback for pebble.getAccount?
                exports.getAccount(accountRef,

                    // done
                    function (account) {

                        done(account);

                    },

                    // fail
                    function (mess) {

                        fail(mess);

                    }

                );

            }

        }

    };

// clear responders array
exports.clearResponders = function (done) {

    if (done === undefined) {
        done = function () {};
    }

    this.getReserve(function (reserve) {

        reserve.responders = [];

        reserve.save(function () {

            done();

        });

    });

};

// set the given plugin name to the responder array
exports.pushResponder = function (pluginName) {

    this.getReserve(function (reserve) {

        reserve.responders.push(pluginName);

        reserve.save(function () {});

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
exports.getAccount = function (number, done, fail) {

    if (done === undefined) {
        done = function () {};
    }
    if (fail === undefined) {
        fail = function () {};
    }

    Account.findOne({
        accountNumber: number
    }, '', function (err, account) {

        if (err) {

            fail('there was an error getting the account.');

        } else {

            if (account) {

                done(account);

            } else {

                fail('account not found.');

            }

        }

    });

};

// get all the pebble accounts
exports.getAllAccounts = function (done) {

    Account.find({}, '', function (err, accounts) {

        done(accounts);

    });

};

// get a traansfer message from a messCode
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
        , fulfillerPlugin : transReq.fulfillerPlugin

    });

    processed.save(function () {

        console.log('pebble.js: processed transfer request with fullfillerPlugin: ' + transReq.fulfillerPlugin);
        
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

                                    if (fromAccount.wallet >= transReq.amount) {

                                        // fail if same account number
                                        if (fromAccount.accountNumber === toAccount.accountNumber) {

                                            // not enough pebble
                                            self.pushTransfer(
                                                transReq, {
                                                    status: 'fail'
                                                    , messCode: 4

                                                }
                                                , function () {

                                                    locked = false;
                                                }
                                            );

                                            // else make the transfer
                                        } else {

                                            fromAccount.wallet -= transReq.amount;
                                            toAccount.wallet += transReq.amount;

                                            fromAccount.save(function () {

                                                toAccount.save(function () {

                                                    // transfer
                                                    self.pushTransfer(
                                                        transReq, {
                                                            status: 'success'
                                                            , messCode: 0

                                                        }
                                                        , function () {

                                                            locked = false;
                                                        }
                                                    );

                                                });

                                            });

                                        }

                                    } else {

                                        // not enough pebble
                                        self.pushTransfer(
                                            transReq, {
                                                status: 'fail'
                                                , messCode: 3

                                            }
                                            , function () {

                                                locked = false;
                                            }
                                        );

                                    }

                                },

                                // fail getting to account
                                function () {

                                    self.pushTransfer(
                                        transReq, {
                                            status: 'fail'
                                            , messCode: 2

                                        }
                                        , function () {

                                            locked = false;
                                        }
                                    );

                                }
                            );

                        },

                        // fail geting from account
                        function () {

                            self.pushTransfer(
                                transReq, {
                                    status: 'fail'
                                    , messCode: 2

                                }
                                , function () {

                                    locked = false;
                                }
                            );

                        }

                    );

                    // no work to do
                } else {

                    locked = false;

                }

            });

        }

    };

}());

exports.fulfillNext = function () {

    TransferProcessed.findOne({}, {}, {
        sort: {
            'created_at': -1
        }
    }, function (err, processed) {

        if (processed) {

            fulfiller.fulfill(processed, function (processed) {

                TransferProcessed.remove({
                    transferNumber: processed.transferNumber
                }, function (err) {

                    console.log('purged');

                });

            });

        }
        
    });

};
// request a transfer of pebbles from one account to another
exports.transferRequest = (function () {

    var count = 0;

    return function (options) {

        var self = this, fromAccount, toAccount;

        if(options.done === undefined){ options.done = function(){}; }
        if(options.fail === undefined){ options.fail = function(){}; }
        if(options.fulfillerPlugin === undefined){ options.fulfillerPlugin = 'none'; }
        
        // check the fromAccount aurg and fix
        accountRefCheck(options.from, function (fix) {

                fromAccount = fix;

                // check the toAccount aurg and fix
                accountRefCheck(options.to,

                    // done            
                    function (fix) {

                        toAccount = fix;

                        // logg the request
                        var transfer = new TransferRequest({

                            transferNumber: 'c' + count + ':t' + new Date().getTime()
                            , fromAccount: fromAccount.accountNumber
                            , toAccount: toAccount.accountNumber
                            , amount: options.amount
                            , status: 'pending'
                            , fulfillerPlugin : options.fulfillerPlugin

                        });

                        transfer.save(function () {

                            console.log('transfer request.');

                            options.done({
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

                        console.log('fail?');
                    
                        options.fail({
                            mess: mess
                        });

                    });

            },

            function (mess) {

                options.fail({
                    mess: mess
                });

            });


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

            console.log('pebble.js: reserve account found: ');
            console.log('pebble.js: world total: ' + reserve.worldTotal);
            console.log('pebble.js: reserve wallet: ' + reserve.wallet);
            console.log('pebble.js: popuation: ' + reserve.population);
            console.log('pebble.js: equal share: ' + reserve.equalShare);

            done(reserve);

        } else {

            console.log('pebble.js: reserve account not found!');
            console.log('pebble.js: making new one...');

            reserve = new Reserve({

                id: 'main'
                , worldTotal: 1000
                , equalShare: 1000
                , population: 0
                , accountNumber: 'reserve'
            , });

            reserve.wallet = reserve.worldTotal;
            reserve.responders = [];

            reserve.save(function () {

                console.log('pebble.js: new reserve saved');

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

            reserve.save(function () {

                console.log('pebble.js: reserve account data updated');

            });

        }

    });

};

// a take request from the reserve to the given user.
/*
exports.takeRequest = function (username, amount, done) {

    amount = Math.floor(amount);

    Reserve.findOne({
        id: 'main'
    }, '', function (err, reserve) {

        console.log('take request!');

        if (reserve) {

            if (reserve.wallet >= amount) {

                users.creditUserPrime(reserve, username, amount, function (wallet) {


                    done(wallet, amount);

                });

            }

        }

    });

};
*/