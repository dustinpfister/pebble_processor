How plugins are with pebblebar:



Core plugins, and app plugins:

   we will have "core paths", and "app paths"
   
   core path example : plugins/shops/
   app path example  : plugins/shops_appname/

   * core path : a core path contains assets that are shared by one or more app paths
   * app path : a app path contains just code that is nessacery for a single app function, it depends on a core path.
   
   * both a core and app path can have the following *.js files:
       * responder.js : a script that responds to requests from a client system
       * updater.js : a script that is called by the server every so often to update something server side
       * setup.js : scripts that are to be called when the server starts
   
   shops  // core path for shops contains shops.js dependancy, and setup.js adds that dependacy to the scope object
   shops_getshoppage   // an app that uses shops.js
   shops_getusershops  // an app that uses shops.js
   land
   land_getuserland
   land_update