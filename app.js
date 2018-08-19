var port = 8080;

var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname + '/app')).listen(port, function () {
    console.log('Server running on ' + port);
});