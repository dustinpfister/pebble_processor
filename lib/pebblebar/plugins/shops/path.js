exports.pluginPath = function(app, clientSystem){
    
    app.get('/shops', function (req, res) {


        res.render('systems/' + clientSystem + '/shops', {

            req: req
            , user: req.user

        });


    });
    
};