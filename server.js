// #!/bin/env node

/*    Pebble
 *    Copyright 2016 by Dustin Pfister (GPL-3.0)
 *    dustin.pfister@gamil.com
 *    
 *    https://github.com/dustinpfister/pebble
 *
 *    try to get them all!
 */

var express = require('express')
    , session = require('express-session')
    , MongoStore = require('connect-mongo/es5')(session)
    , openShift = require('./lib/openshift.js').openShiftObj





, mongoose = require('mongoose')
    , db = mongoose.createConnection(openShift.mongo)

// passport




, passport = require('passport')
    , Strategy = require('passport-local').Strategy

// express app




, app = express()

// client system in use:
//,clientSystem = 'vanilla_beta'
//,clientSystem = 'vanilla_updated_pebblebar'




, clientSystem = 'command_only'

// users




, users = require('./lib/users.js')

// pebble lib
pebble = require('./lib/pebble.js');

// use passport local strategy
// following example at : https://github.com/passport/express-4.x-local-example/blob/master/server.js
passport.use(new Strategy(

    function (username, password, cb) {

        users.findByUsername(username, function (err, user) {

            if (err) {
                return cb(err);
            }
            if (!user) {
                return cb(null, false);
            }
            if (user.password != password) {
                return cb(null, false);
            }
            return cb(null, user);
        });

    }

));

passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {

    users.findById(id, function (err, user) {

        if (err) {
            return cb(err);
        }

        cb(null, user);
    });

});

// Use application-level middleware for common functionality, including logging, parsing, and session handling.
app.use(require('cookie-parser')());
app.use(require('body-parser').json({
    limit: '5mb'
}));
app.use(require('body-parser').urlencoded({
    extended: true
    , limit: '5mb'
}));
app.use(session({
    secret: 'keyboard cat', // ALERT! look into express-session and why the secret is important
    resave: false
    , store: new MongoStore({
        url: openShift.mongo
    })
    , saveUninitialized: false
    , limit: '5mb'
}));
app.use(passport.initialize()); // Initialize Passport and restore authentication state, if any, from the session
app.use(passport.session());

// use EJS for rendering
app.set('view engine', 'ejs');
app.use(express.static('views')); // must do this to get external files


app.get('*', function (req, res, next) {

    var visitPaths = ['/login', '/signup'], // paths that are okay to visit without being logged in
        i = 0
        , len = visitPaths.length
        , okay;

    // check if logged in
    if (req.user) {

        next();

        // redirrect to login page
    } else {

        i = 0;
        okay = false;
        while (i < len) {
            if (req.path === visitPaths[i]) {
                okay = true;
                break;
            }
            i++;
        }

        // if not okay redirrect
        if (!okay) {
            res.redirect('/login')
        } else {
            next();
        }

    }

});

app.get('/', function (req, res, next) {

    pebble.getReserve(function (reserve) {

        res.render('systems/' + clientSystem + '/main', {

            req: req
            , reserve: reserve
            , user: req.user

        });

    });

});

app.post('/', function (req, res, next) {

    if (!req.user) {

        // some other action?
        if (req.body.action) {

            switch (req.body.action) {

            case 'logout':

                res.send(JSON.stringify({
                    mess: 'you are not logged in.'
                    , success: false
                }));

                break;

                // login action
            case 'login':

                passport.authenticate('local', function (err, user, info) {

                    if (err) {

                        return res.send(JSON.stringify({
                            mess: 'login fail.'
                            , success: false
                        }));

                    }
                    if (!user) {

                        return res.send(JSON.stringify({
                            mess: 'login fail.'
                            , success: false
                        }));

                    }

                    req.logIn(user, function (err) {

                        if (err) {

                            return res.send(JSON.stringify({
                                mess: 'login fail.'
                                , success: false
                            }));

                        }

                        return res.send(JSON.stringify({
                            mess: 'login good.'
                            , success: true
                        }));
                    });
                })(req, res, next);

                break;


            default:

                res.send({
                    mess: 'unkown action'
                });

                break;

            }

            // if no action just say they are not logged in.
        } else {

            res.send({
                mess: 'you are not logged in.'
                , success: false
            });

        }

        // else if the user is logged in
    } else {

        users.checkIn(req.user.username, function () {

            //console.log(req.user.username + ' has checked in.');

        });

        //require('./lib/pebblebar/responder.js').post(req,res,users,pebble,function(){
        require('./lib/pebblebar/responder.js').post(req, res, function () {

            // not a pebblebar post?

            // some other action?
            if (req.body.action) {

                switch (req.body.action) {

                    // if foo return bar
                case 'foo':

                    res.send(JSON.stringify({
                        mess: 'bar!'
                    }));

                    break;

                case 'login':

                    res.send(JSON.stringify({
                        mess: 'you are all ready loged in as ' + req.user.username
                        , success: false
                    }));


                    break;

                    // logout action
                case 'logout':

                    req.logout();
                    res.send(JSON.stringify({
                        mess: 'logout'
                        , success: true
                    }));

                    break;

                    // grant pebble
                case 'grant':

                    pebble.grant(req, function (response) {

                        response.mess = 'grant response.';
                        res.send(JSON.stringify(response));

                    });

                    break;

                    // the user wants to give pebble away somewhere, how nice.
                case 'give':

                    pebble.give(
                        req,

                        // done
                        function (response) {

                            response.mess = 'thank you.';
                            res.send(JSON.stringify(response));

                        },

                        // fail
                        function (mess) {

                            res.send(JSON.stringify(mess));


                        }

                    );

                    break;

                    // send unkown action response by default
                default:

                    res.send(JSON.stringify({
                        mess: 'unkown action.'
                    }));

                    break;

                }

                // no action? send "hey stop that!"
            } else {

                res.send(JSON.stringify({
                    mess: 'hey stop that!'
                }));

            }
        });

    }

});

app.get('/login', function (req, res, next) {

    res.render('systems/' + clientSystem + '/login', {});

});

app.post('/login',

    // authenticate
    passport.authenticate('local', {
        failureRedirect: '/login'
    }),

    // success
    function (req, res) {

        res.redirect('/');

    }

);

app.get('/logout', function (req, res) {

    req.logout();
    res.redirect('/login');

});

app.get('/signup', function (req, res, next) {

    res.render('systems/' + clientSystem + '/signup', {});

});

app.post('/signup', function (req, res, next) {

    users.newUser(req, res);

});

// start the server
app.listen(openShift.port, openShift.ipaddress, function () {

    var taxloop, pebbleProcess;

    console.log('server.js: pebble lives');

    users.infoCheck(function () {

        pebble.reserveCheck(function () {

            require('./lib/pebblebar/setup.js').setup(app, db, clientSystem, users, pebble);

            // the tax loop
            taxLoop = function () {

                var t = setTimeout(taxLoop, 10000);

                // run pebblebars updater
                require('./lib/pebblebar/updater.js').update();
                
            },
                
            pebbleProcess = function(){
                
                var t = setTimeout(pebbleProcess, 1000);
                
                //console.log('processing transfer requests...');
                
                pebble.processNext();
                
            };
            
            // start tax loop, and pebble process.
            taxLoop();
            pebbleProcess();

        });

    });

});