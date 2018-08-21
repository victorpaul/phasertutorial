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

var express = require('express');
var app = express();
var server = require('http').Server(app);

// HTML
app.use(express.static(__dirname + '/app'));
app.get('/', function (req, res) {
    res.render('/app/index.html');
});

// SOCKETS
var io = require('socket.io')(server);
var playerCount = 0;
var id = 0;
io.on('connection', function (socket) {
    playerCount++;
    id++;
    setTimeout(function () {
        socket.emit('connected', {playerId: id});
        io.emit('count', {playerCount: playerCount});
    }, 1500);

    socket.on('disconnect', function () {
        playerCount--;
        io.emit('count', {playerCount: playerCount});
        io.emit('disconnect', {playerCount: playerCount});
    });
    socket.on('update', function (data) {
        socket.broadcast.emit('updated', data);
        console.log(data);
    });
});

// START
server.listen(port, function () {
    console.log('Server running on ' + port);
});