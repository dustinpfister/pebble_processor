// fulfiller.js for reserve_take

exports.fulfill = function (scope, processed, done) {


    console.log('fulfiller.js (reserve_take) : script called.');

    console.log('fulfiller.js (reserve_take) : processed: ');
    console.log(processed);
    console.log(scope);

    scope.users.pluginData(
        
        processed.fulfillerData.takeuser
        
        , {
            plugin: 'reserve_take'

        },

        function (plugData) {

            console.log('fulfiller.js (reserve_take) : here we have the plugin data');


        },

        function () {

            console.log('fulfiller.js (reserve_take) : here we have the plugin data');

        }
        
    );

    done(processed);

};