exports.setup = function(app, db,clientSystem, scope){
    
    console.log('storage setup file called.');
    
    //require('./path.js').pluginPath(app, clientSystem);
    
    // call setup for shops.js
    require('./storage.js').setup(db);
    
};