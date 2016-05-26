// storage.js

// get a users storage, or make it if it is not there
exports.getUserStorage = function(username, scope, done){
    
    var self = this;
    
    scope.users.getPlugData(username, 'storage', function(pluginData){
        
        if(pluginData.success){
            
            done(pluginData);
            
        }else{
            
            self.makeUserStorage(username, scope, function(pluginData){
                
                done(pluginData);
                
            });
            
        }
        
    });
    
};



// make a storage object in the given usernames pluginData
exports.makeUserStorage = function(username, scope, done){
    
    var pluginData = {
      
        plugin : 'storage',
        maxSlots : 10,
        slots : []
        
    };
    
    scope.users.createPlugData(username, pluginData, function(){
    
        done();
    
    });
    
};

exports.setup = function(db){
    
    //console.log('storage.js setup called!');
    
};