exports.setup = function(app, db,clientSystem, scope){
    
    //console.log('setup script for shops plugin.');
    
    //require('./path.js').pluginPath(app, clientSystem);
    
    // call setup for shops.js
    require('./shops.js').setup(db);
    
};