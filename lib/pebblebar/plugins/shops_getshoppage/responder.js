/*    shops_getshoppage responder.js
 *
 *    
 */

//var shops = require('./shops.js');

// create a response for the given clientData object
exports.createAppResponse = function(clientData,req,res, scope, done){
    
    scope.shops.getShopPage(clientData.pageNumber, clientData.shopsPerPage, function (page, maxPage, pageNumber, shopsPerPage) {
        
            done({
                
                plugin: 'shops_getshoppage',
                page : page,
                maxPage : maxPage,
                pageNumber: pageNumber,
                shopsPerPage: shopsPerPage
                
            });
        
    });
        
};