var socket = io.connect('http://192.168.6.216:8080');
var localUsername;
socket.on('connect', function() {
    // call the server-side function 'adduser' passing the user name parameter
    localUsername = prompt("What's your name?");
    socket.emit('adduser', localUsername);
    updateLocation();
});


// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function(msg) {
    $('#chat').append('<b>' + msg + '</b><br>');
});


// listener, whenever the server emits 'updateusers', this func. updates the username list
socket.on('updateusers', function(data) {
    // TODO "play new user sound"
    $('#users').empty();
    $.each(data, function(key, value) {
        $('#users').append('<li id="' + key + '" class="user">' + key + '</li>');
    });
});


    // when the client clicks SEND
    $('#datasend').click(function() {
        var message = $('#data').val();
        $('#data').val('');
        // tell server to execute 'newmsg' and send along one parameter
        socket.emit('newmsg', message);
    });

    // when the client hits ENTER on their keyboard
    $('#data').keypress(function(e) {
        if (e.which == 13) {
            $(this).blur();
            $('#datasend').focus().click();
        }
    });


    /****** GEOLOCATION API *****/
    // checks user location and sends it to the server  
    // updates every 10 secs.
    
    function updateLocation(){
        watcher = navigator.geolocation.watchPosition( function(position) {
            var lat = position.coords.latitude;
            var log = position.coords.longitude;
            socket.emit('updatelocation', lat+"|"+log, localUsername);
        });
        // sends to server the user geo position
        
    }
    
    /*              BREAKS THE WHOLE THING          */
    // emits userlocation to the server on mouseover the username.
    $( ".user" ).mouseover(function() {
        socket.emit('getUserLocation', this.id);
      })
    
    // sets the hovered user's location
    socket.on('setuserlocation', function( username, location ){        
        $("#"+username).attr("title",location);
    });



    
    /****** MEDIA API *****/  
    // listens for changes in the chat room. plays a sound when a change in the #chat element is detected.
    $('#chat').bind("DOMSubtreeModified",function(){
        var media = document.getElementById("chat_sound");
        media.play();
        // checks if the local username was mentioned, triggers a notification if it did.
        var tempLastLine = $( "#chat b" ).last().text();
        // checks if its a user msg or just a server msg
        if (tempLastLine.indexOf("->") != -1 ) {
            var msg = tempLastLine.substring(tempLastLine.indexOf("->")+2,tempLastLine.length);
            // checks if the message contains the local user's name            
            if (msg.indexOf(localUsername) != -1) {
                // user who mentioned local user
                var hater = tempLastLine.substring(tempLastLine.indexOf("]")+1,tempLastLine.indexOf("-"));
                mentionNotify(hater, msg);
            };

        };
    });

    /****** NOTIFICATION API *****/  
    // buttom listner, triggers notifications API authorization.
    document.querySelector('#notPerm').addEventListener('click', function() {
        window.webkitNotifications.requestPermission();
    });

    // generates the notification.
    function mentionNotify(name, msg){
        if (window.webkitNotifications.checkPermission() == 0){
            notification = window.webkitNotifications.createNotification('html5.png', "MENTION: ", name + " has mentioned you : " + msg );
            notification.show();
        }

    }