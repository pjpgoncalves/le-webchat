var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    port = 8080;

server.listen(port);

function currentTime() {
    var time = new Date();
    return time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
}
console.log("##### TIMESTAMP on load ##### -> " + currentTime());
console.log("running on port : " + port);

// default connected and disconnected msgs
var connectedmsg = " has connected";
var leavemsg = " has disconnect";
var welcomemsg = " you are now connected, welcome."


// routing for the chat page
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});
// routing for teh css
app.get('/css/chat.css', function(req, res) {
    res.sendfile(__dirname + '/css/chat.css');
});

// routing to my .js
app.get('/js/custom.js', function(req, res) {
    res.sendfile(__dirname + '/js/custom.js');
});

// routing to audio file
app.get('/sound/tick.mp3', function(req, res) {
    res.sendfile(__dirname + '/sound/tick.mp3');
});

app.get('/html5.png', function(req, res) {
    res.sendfile(__dirname + '/html5.png');
});

// users online
var usernames = {};
var usersjson = new Array ();
var usercount = 0;
io.sockets.on('connection', function(socket) {

    // waits for 'newmsg',  from the client and then executes the following
    socket.on('newmsg', function(msg) {
        // tells the client to execute 'updatechat'
        user = socket.username;
        io.sockets.emit('updatechat', '[' + currentTime() +'] ' + user + " -> " + msg);
    });

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username) {
        // stores the username in the socket session for this client
        socket.username = username;
        // add the client's username to the global list
        usersjson.push({id: usercount, name: username, geo: null, idletime: null, logintime: currentTime() });

        var x = null;
        if (usersjson[0].name) {
            x = usersjson[0].name;

            console.log("NICK 0 DO JASON : "+x);
            console.log("HORA DE LOGIN:0 DO JASON : "+ usersjson[0].logintime);
        };

        usernames[username] = username;
        // echo to client they've connected
        socket.emit('updatechat', '<own>' + welcomemsg + '<own>');
        // echo to all clients that a person has connected
        
        socket.broadcast.emit('updatechat', '[' + currentTime() +'] ' + username + connectedmsg);
        // update the list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
    });

    // updates the username geolocation in the server
    socket.on('updatelocation', function(geolocation, username){

        // search for the user and updates its geolocation
        for (var i = 0; i <= usersjson.length; i++) {
            if(usersjson[i].name == username){
                usersjson[i].geo = geolocation;
            }
        };
        
    });
    // search and sends user geolocation by name to the client
    socket.on('getUserLocation',function(username){
        var localGeolocation = "";
        // search for user location and send its geolocation to the client
        for (var i = 0; i <= usersjson.length; i++) {
            if(usersjson[i].name == username){
                localGeolocation = usersjson[i].geo;
                socket.emit('setuserlocation', localGeolocation);
            }
        };
        socket.emit('setuserlocation', username, localGeolocation);
    });

    // when the user disconnects
    socket.on('disconnect', function() {
        // remove the username from global usernames list
        delete usernames[socket.username];
        // update list of users in chat. client-side
        io.sockets.emit('updateusers', usernames);
        // echo to all clients that this client has left
        socket.broadcast.emit('updatechat', '[' + currentTime() +']' + socket.username + leavemsg);
    });

});
