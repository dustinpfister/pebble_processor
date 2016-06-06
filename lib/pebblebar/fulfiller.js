/*
 *    pebblebars main fulfiller.js file
 *
 *    This is called first by pebble.fulfillNext when fulfilling pebble transfers that have been processed.
 *
 */



exports.fulfill = function(processed, done){
    
    
    console.log('fufiller.js: processed...');
    console.log(processed);
    done();
    
};