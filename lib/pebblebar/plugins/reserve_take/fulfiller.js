// fulfiller.js for reserve_take

exports.fulfill = function (scope, processed, done, fail) {

    if(done === undefined){ done = function(){}; }
    if(fail === undefined){ fail = function(){}; }

    console.log('fulfiller.js (reserve_take) : script called.');

    scope.users.pluginData(
        
        // getting the plugin data this way, to showcase the inportance of the fulfillerData property of TransactionProcessed.
        processed.fulfillerData.takeuser
        
        // ALERT! this may cause a problem in a case where the users pluginData is not yet in the pluginData array.
        // to fix this the pluginDefault object in reserve_takes responder.js should be in some kind of shared asset.
        // otherwise I will have to have seperate copys of the same object accross files.
        , {
            
            plugin: 'reserve_take'

        },

        // success getting plugin data
        function (plugData) {

            console.log('fulfiller.js (reserve_take) : here we have the plugin data');
            console.log(plugData);
            
            done(processed);


        },

        // fail getting plugin data.
        function () {

            console.log('fulfiller.js (reserve_take) : there was a problem getting the data');
            
            fail();

        }
        
    );

    

};