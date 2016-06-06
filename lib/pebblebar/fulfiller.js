/*
 *    pebblebars main fulfiller.js file
 *
 *    This is called first by pebble.fulfillNext when fulfilling pebble transfers that have been processed.
 *
 */



exports.fulfill = function(processed, done){
    
    
    console.log('fufiller.js: processed...');
    console.log(processed);
    
    if(processed.fulfillerPlugin !== 'none'){
        
        console.log('fulfiller.js: we have a script to call in plugin: ' + processed.fulfillerPlugin );
        
    // no plug-in script
    }else{
        
        console.log('fulfiller.js: no plugin script.');
        
    }
    
    done(processed);
    
};