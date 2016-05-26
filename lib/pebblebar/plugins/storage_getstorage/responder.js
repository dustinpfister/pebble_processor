/*    storage_getstorage responder.js
 *
 *    
 */

// create a response for the given clientData object
exports.createAppResponse = function (clientData, req, res, scope, done) {

    
    console.log('storage_getstorage: creating app response...');
    
    scope.storage.getUserStorage(req.user.username, scope, function(pluginData){
        
        done({

            plugin: 'storage_getstorage'
            , pluginData: pluginData

        });
        
    });

};