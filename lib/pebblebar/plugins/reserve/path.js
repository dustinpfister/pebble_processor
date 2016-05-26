// reserve path

exports.pluginPath = function (app, clientSystem) {

    app.get('/reserve', function (req, res) {

        res.render('systems/' + clientSystem + '/reserve', {

            req: req
            , user: req.user

        });

    });

};
