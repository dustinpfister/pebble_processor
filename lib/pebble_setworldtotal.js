/*    pebble_setworldtotal.js ( bash script )
 *
 *    set the world total of the reserve account
 *
 *    $ node pebbleFix.js
 */

// get pebble
var pebble = require('./pebble.js'),
    
    newTotal = process.argv[2] ? process.argv[2] : 1000;


pebble.getReserve(function(reserve){
    
    console.log('old world total: ' + reserve.worldTotal);
   
    reserve.worldTotal = newTotal;
    
    console.log('new world total: ' + reserve.worldTotal);
    
    reserve.save(function(){
    
        console.log('wolrd total updated be sure to fix the account with pebble_fix.js');
        process.exit(0);
        
    });
    
});