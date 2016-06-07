var scope = require('./scope.js')
    , theScope
    , fs = require('fs')
    , checkPluginConf = function (pluginName, app, db, clientSystem) {

        var conf;

        fs.readFile('./lib/pebblebar/plugins/' + pluginName + '/conf.json', 'utf8', function (err, data) {

            // if we have an error
            if (err) {

                //console.log('no conf.json loaded for core : ' + pluginName);

            }

            // if we have data
            if (data) {

                conf = JSON.parse(data);

                // add anything that needs to go to scope.
                if (conf.addToScopeFiles) {

                    scope.addToScope(conf.addToScopeFiles, require('./plugins/' + conf.pluginName + '/' + conf.addToScopeFiles + '.js'));

                }

                // loop threw core files
                conf.coreFiles.forEach(function (coreFile) {

                    var filePath = './plugins/' + pluginName + '/' + coreFile + '.js';

                    // whate to do with each core file
                    switch (coreFile) {

                    case 'responder':

                        //console.log('responder.js file for plugin ' + pluginName + ' found.');

                        theScope.pebble.pushResponder(pluginName);

                        break

                        // add a path
                    case 'path':

                        require(filePath).pluginPath(app, clientSystem);

                        break;

                        // in case of setup scripts
                    case 'setup':

                        require(filePath).setup(app, db, clientSystem, scope);

                        break;

                    }

                });

            }

        });

    };

exports.setup = function (app, db, clientSystem, users, pebble, done, fail) {

    var mainConf, conf;

    if(done === undefined){ done = function(){};}
    if(fail === undefined){ fail = function(){};}
    
    // make the scope?
    scope.createScope(users, pebble, function () {

        // get the scope
        theScope = scope.getScope();

        // clear responders array
        theScope.pebble.clearResponders(function () {

            // read main conf.json
            fs.readFile('./lib/pebblebar/conf.json', 'utf8', function (err, data) {

                // if we have data...
                if (data) {

                    mainConf = JSON.parse(data);

                    for (var core in mainConf.active) {

                        // core conf file
                        checkPluginConf(core, app, db, clientSystem);

                        mainConf.active[core].forEach(function (app) {

                            var appName = core + '_' + app;

                            // app conf file
                            checkPluginConf(appName, app, db, clientSystem);

                        });

                    }
                    
                    done();

                }

            });


        });

    });



};