/*
 *    pebblebars main fulfiller.js file
 *
 *    This is called first by pebble.fulfillNext when fulfilling pebble transfers that have been processed.
 *
 */

var scope = require('./scope.js').getScope();

exports.fulfill = function(processed, done){
    
    
    console.log('fufiller.js: processed...');
    console.log(processed);
    
    if(processed.fulfillerPlugin !== 'none'){
        
        console.log('fulfiller.js: we have a script to call in plugin: ' + processed.fulfillerPlugin );
        
        require('./plugins/' + processed.fulfillerPlugin + '/fulfiller.js').fulfill(scope, processed, function(){
            
            console.log('looking good.');
            done(processed);        
            
        })
        
    // no plug-in script
    }else{
        
        console.log('fulfiller.js: no plugin script.');
    
        done(processed);
        
    }
    
};