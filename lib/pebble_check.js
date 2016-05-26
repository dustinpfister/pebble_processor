/*    pebbleCheck.js ( bash script )
 *
 *    this bash script checks the state of the user accounts, and the reserve and
 *    lets you know if everything is okay with the accounts
 *
 *    $ node pebbleCheck.js
 *    "worldTotal:1000,reserve wallet:1962,userSum:42,pebbleSum:2004,sanity:false"
 *
 *    pebbleCheck simply adds up the sum of all the pebbles (both the reserve and user accounts), 
 *    and reports the results. The sum of pebbles should equal the world total, if it does 
 *    then sanity = false.
 *
 *    pebbleCheck just simply checks, and reports the status of accounts, it does not fix anything 
 *    in the event of false sanity. 
 */


var users = require('./users.js'),  // get users
    pebble = require('./pebble.js'), // get pebble
    theReserve,      // store the reserve object
    pebbleSum = 0,   // the total pebble sum
    userSum = 0,     // user sum shoud start at zero
    tabulated = 0;   // current amount of tabulated accounts

// get the reserve
pebble.getReserve(function (reserve) {

    var i, len, pebbleSum, stOut = '';

    // store the reserve object so we can look at it outside of this scope
    theReserve = reserve;
    
    // get Users
    users.getUsers(function (users) {

        i = 0;
        len = users.length;

        // add up user totals
        while (i < len) {

            pebble.getAccount(users[i].primeAccount, function(account){
            
                userSum += account.wallet;
                tabulated += 1;
                
            });
            
            i++;
        }

    });

});

var tabCheck = function(){

    setTimeout(tabCheck, 1000);
    
    if(tabulated === theReserve.population){
        
        pebbleSum += userSum + theReserve.wallet;
        
        console.log(
            '\"worldTotal:' + theReserve.worldTotal + ','+
            'reserve wallet:' + theReserve.wallet + ','+
            'userSum:' + userSum + ',' +
            'pebbleSum:' + pebbleSum + ',' +
            'sanity:' + (pebbleSum === theReserve.worldTotal) + '\"'
        );
        
        process.exit(0);
    }
    
    
},

timeout = function(){
    
    console.log('timeout killing app.');
    process.exit(1);
    
};

setTimeout(tabCheck, 1000);
setTimeout(timeout, 60000);
