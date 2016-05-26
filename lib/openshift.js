/*
 *    openshift.js
 *
 *    Exports and object that can be used to get openshift enviorment variables, or local alternatives
 *
 *    // get the object with your file
 *    var openShift = require('./openshift.js').openShiftObj;
 *
 *    // connect to mongodb (assuming mongoose.js)
 *    var db = mongoose.createConnection(openShift.mongo);
 *
 *    // express.js app.listen
 *    app.listen(openShift.port, openShift.ipaddress);
 */

// setup the openShift Object
exports.openShiftObj = {

    /*    openShift.ipaddress
     *  
     *    The ip address to pass to app.listen, or other such function. If deployed to openshift, the ipaddress should be at
     *    process.env.OPENSHIFT_NODEJS_IP, however if devloping offline this enviornment variable may not be threre, and 
     *    will result in undefined. In the case of working offline you should use the string 'localhost', the loop ip '127.0.0.1', of the
     *    local ip address of the computer you are working on which should be something like '192.168.1.4'
     *
     *    ALERT!
     *    in windows 10, when working off line, it looks like i need to use 127.0.0.1 in the mongo URL, localhost does not work offline.
     *
     *    in windows use the ip address of the computer you are using node on, and use a browser other than chrome to avoid a security problem
     */
    ipaddress : process.env.OPENSHIFT_NODEJS_IP || 'localhost', //'192.168.1.75' 'localhost' '127.0.0.1',

    // the port to pass to app.listen, or oher such function
    port : process.env.OPENSHIFT_NODEJS_PORT || 8080,

    // get the string needed to make a connection to mogodb
    mongo : process.env.OPENSHIFT_MONGODB_DB_PASSWORD ? 'mongodb://'+process.env.OPENSHIFT_MONGODB_DB_USERNAME +
        ":" + process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
        process.env.OPENSHIFT_APP_NAME : 'mongodb://127.0.0.1/pebble' //'mongodb://127.0.0.1/pebble'

};