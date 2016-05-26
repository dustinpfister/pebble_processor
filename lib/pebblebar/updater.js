// update plugins


var scope = require('./scope.js').getScope();

exports.update = function(){
    
    /*
    require('./plugins/shops/shops.js').updateShops(function(){
        
        //console.log('shops updated');
        
    });
    */
    
    // just calling the shops updater for now.
    
    if(scope.shops){
    
        require('./plugins/shops/updater.js').update(scope);
        
    }
    
};