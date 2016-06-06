// fulfiller.js for reserve_take

exports.fulfill = function(scope, processed, done){
    
    
    console.log('reserve_take fulfiller.js: script called.');
    
    
    done(processed);
    
};