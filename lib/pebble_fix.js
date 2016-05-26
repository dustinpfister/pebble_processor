/*    pebblefix.js ( bash script )
 *
 *    this is a batch script that will fix the user accounts and the reserve in the event of 
 *    false sanity.
 *
 *    $ node pebbleFix.js
 */


var users = require('./users.js'), // get users
    pebble = require('./pebble.js'), // get pebble
    theReserve, // store the reserve object
    pebbleSum = 0, // the total pebble sum
    userSum = 0, // user sum shoud start at zero
    tabulated = 0, // current amount of tabulated accounts
    sanity = false, // assume false sanity
    pebbles = 0,
    userSum = 0,
    

    fix = function () {

        pebble.getReserve(function (reserve) {


            pebbles = reserve.worldTotal;

            console.log('old reserve wallet: ' + reserve.wallet);
            console.log('fixing reserve account first...');
            
            // correct the reserve
            reserve.wallet = Math.floor(reserve.worldTotal * (reserve.wallet / pebbleSum));
            pebbles -= reserve.wallet;
            
            console.log('new reserve wallet: ' + reserve.wallet);
            console.log('fixing user accounts with remaing pebble amount of ' + pebbles);

            // fix accounts
            
            pebble.getAllAccounts(function(accounts){
                
               //console.log(accounts); 
                
                accounts.forEach(function(account){
                    
                    var newAmount;
                    
                    // if we have pebble fix the account
                    if(pebbles > 0){
                    
                        console.log('account number: '+account.accountNumber + ', wallet: ' + account.wallet);   
                    
                        newAmount = Math.floor( reserve.worldTotal * (account.wallet / pebbleSum) );
                        
                        
                        account.wallet = newAmount;
                        pebbles -= newAmount;
               
                        
                    // else sorry none remaining
                    }else{
                        
                        account.wallet = 0;
                        
                    }
                    
                    account.save();
                    
                });
                
            });
            
            reserve.save();

        });


        setTimeout(fixCheck, 1000);

    },

    fixCheck = function () {

        console.log('fix check:');
        

        if(pebbles > 0){
        
            console.log('crediting remaing pebbles to reserve account: ' + pebbles);
            
            pebble.getReserve(function(reserve){
               
                reserve.wallet += pebbles;
                pebbles = 0;
                
                reserve.save();
                
            });
            
            
        }
        
        setTimeout(fixCheck, 1000);

        //process.exit(0);

    },

    tabCheck = function () {

        var t = setTimeout(tabCheck, 1000);

        if (tabulated === theReserve.population) {

            pebbleSum += userSum + theReserve.wallet;
            sanity = pebbleSum === theReserve.worldTotal;

            console.log(
                '\"worldTotal:' + theReserve.worldTotal + ',' +
                'reserve wallet:' + theReserve.wallet + ',' +
                'userSum:' + userSum + ',' +
                'pebbleSum:' + pebbleSum + ',' +
                'sanity:' + sanity + '\"'
            );

            if (!sanity) {

                console.log('sanity check failed, running fix...');

                clearTimeout(t);

                fix();

                //process.exit(0);

            } else {

                console.log('things look fine, not fixing.');
                process.exit(0);

            }
        }


    },

    timeout = function () {

        console.log('timeout killing app.');
        process.exit(1);

    };

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

            pebble.getAccount(users[i].primeAccount, function (account) {

                userSum += account.wallet;
                tabulated += 1;

            });

            i++;
        }

    });

});

setTimeout(tabCheck, 1000);
setTimeout(timeout, 10000);

/*
var users = require('./users.js'), // get users
pebble = require('./pebble.js'), // get pebble
pebbleSum = 0,
sanity = true,
    
// reset accounts based on % of wealth relative to invalid pebble sum    
fix = function(done){
    
    console.log('******************************');
    console.log('sanity check failed fixing...');  
    
    
    pebble.getReserve(function (reserve) {
        
        var pebbles = reserve.worldTotal, userSum;
        
        console.log('old reserve wallet: ' + reserve.wallet);
        
        // correct the reserve
        reserve.wallet = Math.floor( reserve.worldTotal * (reserve.wallet / pebbleSum) );
        
        pebbles -= reserve.wallet;
        
        console.log('new reserve wallet: ' + reserve.wallet);
        console.log('fixing user accounts with remaing pebble of: ' + pebbles + '...');
    
        // get Users
        users.getUsers(function (allUsers) {
            
            userSum = 0;
         
            allUsers.forEach(function(user){
               
                // if we have pebbles to give
                if(pebbles > 0){
                
                    console.log('******************************');
                    console.log('fixing wallet of user: ' + user.username + '...');
                    
                    console.log('old wallet total: ' + user.wallet);
                    
                    // fix user wallet
                    user.wallet = Math.floor( reserve.worldTotal * (user.wallet / pebbleSum) );
               
                    userSum += user.wallet;
                    
                    console.log('new wallet total:' + user.wallet );
                    
                    pebbles -= user.wallet;
                    
                    console.log('pebble remaining: ' + pebbles);
                    
                    // save user
                    //users.setUserWallet(user.username, user.wallet);
                    user.save();
                    
                }
                
            });
            
            console.log('******************************');
            console.log('remaining pebble that will be added to reserve: ' + pebbles);
        
            reserve.wallet += pebbles;
            console.log('world total: ' + reserve.worldTotal);
            console.log('final new reserve wallet total: ' + reserve.wallet);
            console.log('usersum:' + userSum);
            console.log('sanity: ' + (userSum + reserve.wallet === reserve.worldTotal) );
            
            // save reserve
            reserve.save(function(){
                
                console.log('we are good?');
            
                // we are done
                done();
                
            });
            
            
            
        });
        
        
    });
    
},
    
timeout = function(){
    
    console.log('timeout killing app.');
    process.exit(1);
    
};
    

// Check for sanity
pebble.getReserve(function (reserve) {

    var i, len;

    // start off the pebble sum at the reserve wallets total
    pebbleSum = reserve.wallet
        , userSum = 0; // user sum shoud start at zero

    // get Users
    users.getUsers(function (users) {

        i = 0;
        len = users.length;

        // add up user totals
        while (i < len) {

            userSum += users[i].wallet;
            i++;
            
        }

        // add user sum to total
        pebbleSum += userSum;

        sanity = pebbleSum === reserve.worldTotal; 
        
        console.log('sanity:'+sanity);
        
        // if no sanity, fix
        if(!sanity){
        
            fix(function(){
            
                process.exit(0);

            });
            
        }else{
        
            // kill script
            process.exit(0);

        }
    });

});


setTimeout(timeout, 10000);
*/