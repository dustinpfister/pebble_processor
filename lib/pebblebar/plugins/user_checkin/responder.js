/*    user_checkin plugin 
 *
 */

// create a response for the given clientData object
exports.createAppResponse = function (clientData, req, res, scope, done) {

    scope.users.checkIn(req.user.username, function(status){
    
        // call done callback with response object
        done({

            plugin: 'user_checkin',
            status: status
            
        });
        
    });


};