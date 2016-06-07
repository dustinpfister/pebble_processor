/*
 *    pebblebars main fulfiller.js file
 *
 *    This is called first by pebble.fulfillNext when fulfilling pebble transfers that have been processed.
 *
 */

var scope = require('./scope.js').getScope();

exports.fulfill = function (processed, done, fail) {

    if(done === undefined){ done = function(){}; }
    if(fail === undefined){ fail = function(){}; }

    console.log('fufiller.js: processed...');

    // ALERT! this is a simple fix for now until we update our setup.js to work 
    // as it should when it comes to calling it's done callback.
    if (scope.users) {

        if (processed.fulfillerPlugin !== 'none') {

            console.log('fulfiller.js: we have a script to call in plugin: ' + processed.fulfillerPlugin);

            require('./plugins/' + processed.fulfillerPlugin + '/fulfiller.js').fulfill(scope, processed, function () {

                console.log('looking good.');
                done(processed);

            })

            // no plug-in script
        } else {

            console.log('fulfiller.js: no plugin script.');

            done(processed);

        }

    // if we do not have scope.users keep getting scope until we do
    } else {

        console.log('fulfiller.js : we do not have users.js in the scope!');

        scope = require('./scope.js').getScope();
        
        fail();

    }

};