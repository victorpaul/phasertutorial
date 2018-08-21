const portPattern = /^port=(\d+)$/;
var port = 8080;

process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
    var r = portPattern.exec(val);
    if (r) {
        port = r[1];
        console.log('assign new port ' + port);
    }
});

var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname + '/app')).listen(port, function () {
    console.log('Server running on ' + port);
});