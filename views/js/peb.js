/*
 *    peb.js console pebble client

*/


var post = function (path, data, done) {

        // new xhr
        var http = new XMLHttpRequest();

        done = done === undefined ? function (response) { console.log(response) } : done;

        // open a post
        http.open('POST', path);

        //Send the proper header information along with the request
        http.setRequestHeader("Content-type", "application/json");

        // what to do on state change
        http.onreadystatechange = function () {

            if (this.readyState === 4) {

                done(JSON.parse(this.response));

            }

        };

        // send it out
        http.send(JSON.stringify(data));

        return 'sent post...';

    };


    var peb = (function () {

        
        var control = function (obj) {

            if(obj === undefined){
                
                post('/',{action:'pebblebar'});
                
            }else{
                
                post('/', obj );
                
            }
            
            return 'making call to server...';
            
            
        };

        control.post = function (path, obj) {

            post(path, obj, function (response) {
        
                console.log(response);

            })

        },

        control.logout = function () {

            post('/', {action: 'logout'}, function(response){
            
                // redirect to login if success
                if(response.success){
                
                    window.location.href = '/login';
                
                }
                
                console.log(response);
                
            });
            
            return 'peb.logout.';

        },
            
        control.login = function(username, password){
            
            post('/', {action:'login', username: username, password: password}, function(response){
                
                // redirect to root if success
                if(response.success){
                
                    window.location.href = '/';
                
                }
                    
                console.log(response);
                    
                
            });
            
            
            return 'peb.login';
            
        };

        return control;

    }());