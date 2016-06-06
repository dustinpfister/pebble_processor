// fulfiller.js for reserve_take

exports.fulfill = function(scope, processed, done){
    
    
    console.log('reserve_take fulfiller.js: script called.');
    
    console.log('reserve_take fulfiller.js: processed: ');
    console.log(processed);
    
    done(processed);
    
};