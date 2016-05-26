
// create a response for the given clientData object
//exports.createAppResponse = function(clientData,req,res, users, pebble, done){
exports.createAppResponse = function(clientData,req,res, scope, done){  
    
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
    
};
