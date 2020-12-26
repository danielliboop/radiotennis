let curr_user;
let curr_room;
let socketio = io.connect();
var spotify_client_id = "d6593397d36a4419bd3b52adb7f610ff";
var spotify_client_secret = "75f8a38e480f48c4b881f40b4e3776be";
var spotify_redirect_uri = "http://localhost:3456";
var scope = "user-read-private user-read-currently-playing playlist-read-private playlist-read-collaborative user-read-playback-state"
var access_token = "";

var SpotifyWebApi = require('spotify-web-api-js')
var spotifyApi = new SpotifyWebApi();

socketio.on("username_taken", function() {
    $('.incorrect-login').empty();
    $('.incorrect-login').append("Username taken: please enter a different name.");
})

socketio.on("message_to_client",function(data) {
    //Append an HR thematic break and the escaped HTML of the new message
    let message = data["message"];
    let styling = ""

    if(data["bold"]){
        styling += "boldface "; //adds styling
    }
    if(data["italics"]) {
        styling += "italicface ";
    }

    console.log(data["room"]);

    if (data["room"] == curr_room) { //displays actual message
        document.getElementById("chatlog").appendChild(document.createElement("hr"));
        $('#chatlog').append('<span class = message_user>' + data['user'] + '</span>');
        $('#chatlog').append(" " + '<span class = "' + styling + '">' +  message + '</span>');
    }
});

socketio.on("room_name_taken", function(){
    $('.incorrect-room').empty();
    $('.incorrect-room').append("Room name taken: please enter a different name.");
})

socketio.on("room_created", function(data){

    curr_room = data["locations"][curr_user];

    $('.room-name').empty();
    $('.room-name').append(curr_room);

    let color = data["room_colors"][curr_room];
    $('.room').css("background-color", color);

    if(document.getElementById("private").checked){
        const password = prompt("Password for the room: ");
        $('.room').show();
        $('.room_creator').show();
        socketio.emit("create_private_room", {room:data["room"], password: password});
    }

    $('#room_list').empty();
    $('#user_list').empty();


    update_appearance(curr_room, data["locations_keys"], data["locations"], data["rooms"], data["rooms_keys"], data["banned_users"]);

});

socketio.on("verify_password", function(data){
    let verify = prompt("Enter the password for this room");
    if (verify == data["password"]){
        curr_room = data["room"];
        socketio.emit("password_worked", {user: curr_user, room: data["room"]})
    }
});

socketio.on("joined_room", function(data) {

    curr_room = data["locations"][curr_user];
    console.log(curr_room);

    $('.room-name').empty();
    $('.room-name').append(curr_room);

    $('#user_list').empty();

    $('#room_list').empty();

    let color = data["room_colors"][curr_room];
    if (color != undefined) $('.room').css("background-color", color);
    else $('.room').css("background-color", "white");

    update_appearance(curr_room, data["locations_keys"], data["locations"], data["rooms"], data["rooms_keys"], data["banned_users"]);

});

socketio.on("not_logged_in", function(){
    alert("Log in before doing that please")
});

socketio.on("cannot_kick", function(){
    alert("Cannot kick that user!");
});

socketio.on("kicked_user", function(data){
    curr_room = data["locations"][curr_user];

    $('.room-name').empty();
    $('.room-name').append(curr_room);

    $('#user_list').empty();

    $('#room_list').empty();

    let color = data["room_colors"][curr_room];
    if (color != undefined) $('.room').css("background-color", color);
    else $('.room').css("background-color", "white");

    update_appearance(curr_room, data["locations_keys"], data["locations"], data["rooms"], data["rooms_keys"], data["banned_users"]);
});

socketio.on("unbanned_user", function(data){
    curr_room = data["locations"][curr_user];

    $('.room-name').empty();
    $('.room-name').append(curr_room);

    $('#user_list').empty();

    $('#room_list').empty();

    let color = data["room_colors"][curr_room];
    if (color != undefined) $('.room').css("background-color", color);
    else $('.room').css("background-color", "white");

    update_appearance(curr_room, data["locations_keys"], data["locations"], data["rooms"], data["rooms_keys"], data["banned_users"]);
});

socketio.on("banned_user", function(data){
    curr_room = data["locations"][curr_user];

    $('.room-name').empty();
    $('.room-name').append(curr_room);

    $('#user_list').empty();
    $('#banned_user_list').empty();

    $('#room_list').empty();

    let color = data["room_colors"][curr_room];
    if (color != undefined) $('.room').css("background-color", color);
    else $('.room').css("background-color", "white");

    update_appearance(curr_room, data["locations_keys"], data["locations"], data["rooms"], data["rooms_keys"], data["banned_users"]);

});

socketio.on("cannot_ban", function(){
    alert("Cannot ban that user!");
});

socketio.on("cannot_unban", function(){
    alert("Cannot unban that user!");
})

socketio.on("login_update_appearance", function(data) {

    let users = data["users"];
    curr_room = data["locations"][curr_user];

    if ($.inArray(curr_user, users) != -1) { //only does this if user exists (loggedin)
    //FIGURE OUT WHY THIS DOESNT WORK

        $('.login').hide();

        $('.lobby').show();

        $('#room_list').show();
        $('#room_list_head').show();
        $('#room_list').empty(); //makes login screen go away and shows lobby

        $('#dm_input').hide();

        $('.room-name').empty();
        $('.room-name').append(curr_room);
        $('.room-name').show();

        $('#user_list').show();
        $('#user_list_head').show();

        $('.room-name').empty();
        $('.room-name').append(curr_room);

        $('.room').show();


        update_appearance (curr_room, data["locations_keys"], data["locations"], data["rooms"], data["rooms_keys"], data["banned_users"])

    }


});

socketio.on("sent_private_message", function(data) {
    if (curr_user == data['to_user'] || curr_user == data['from_user']) {
        document.getElementById("chatlog").appendChild(document.createElement("hr"));
        $('#chatlog').append('<span class = private_message_user>' + data['from_user'] +  " " + '(private) </span>');
        $('#chatlog').append(data['message']);
    }
});

function update_appearance (curr_room, locations_keys, locations, rooms, rooms_keys, banned_users) { //needs banned_users, rooms(keys), locations keys, locations, rooms

    document.getElementById("private").checked = false;
    $('#dm_submit').empty();
    $('#banned_user_list_head').hide();
    $('#banned_user_list').hide();
    $('#banned_user_list').empty();

    $('.incorrect-room').empty();
    $('#user_list').empty();
    $('#dm_input').hide();
    $('.incorrect-login').empty();

    for (let r of rooms_keys) { //makes rooms appear

        $("#room_list").append(r);

        if (banned_users[r] != curr_user && r != curr_room) {
            var join = $('<button/>', {
                    text: "join", //set text 1 to 10
                    class: "btn btn-outline-primary btn-sm",
                    id: r,
                    click: (function(){
                        join_room(this);
                    })
                });

            $('#room_list').append(join);

        }
        $('#room_list').append("<br />");

        if (curr_room == r && rooms[r] == curr_user) {
            let banned = banned_users[curr_room];

            $('#banned_user_list_head').show();
            $('#banned_user_list').show();

            if (banned != undefined) {
                for (let i = 0; i < banned.length; i++) {

                $('#banned_user_list').append(banned[i]);

                    var join = $('<button/>', {
                        text: "unban", //set text 1 to 10
                        class: "btn btn-outline-primary btn-sm",
                        id: banned[i],
                        click: (function(){
                            unban_user(this);
                        })
                    });

                    $('#banned_user_list').append(join);
                    $('#banned_user_list').append('<br>');

                }
            }
        }

    } //makes rooms appear


    //makes users appear
    for (let r of locations_keys) { //iterates through location keys, adds user to list if they're in the room

        if (locations[r] == curr_room) {
            $("#user_list").append(r);


            if (r != curr_user) {
                var dm = $('<button/>', {
                    text: "dm", //set text 1 to 10
                    id: r,
                    class: "btn btn-primary btn-sm",
                    click: (function(){
                        private_message(this);
                    })
                });
            $("#user_list").append(dm);

        }


        if (rooms[curr_room] == curr_user && r != curr_user) { //if user created room, they can kick/ban
            var kick = $('<button/>', {
                    text: "kick", //set text 1 to 10
                    id: r,
                    class: "btn btn-primary btn-sm",
                    click: (function(){
                        kick_user(this);
                    })
                });

            $('#user_list').append(kick);

            if ($.inArray(banned_users[curr_room], r) != -1) {
                var ban = $('<button/>', {
                        text: "unban", //set text 1 to 10
                        id: r,
                        class: "btn btn-primary btn-sm",
                        click: (function(){
                            unban_user(this);
                        })
                    });

            $('#user_list').append(ban);

            }

            else {
                var ban = $('<button/>', {
                        text: "ban", //set text 1 to 10
                        id: r,
                        class: "btn btn-primary btn-sm",
                        click: (function(){
                            ban_user(this);
                        })
                    });

                $('#user_list').append(ban);

            }
        }
        $('#user_list').append("<br />");

        }

    }
}

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
    function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
    };

/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */
    function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
    }

document.getElementById("connect-spotify-btn").addEventListener("click", function(event) {
    console.log("HITTING CONNECT_TO_SPOTIFY")
    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(spotify_client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(spotify_redirect_uri);
    url += '&state=' + encodeURIComponent(generateRandomString(16));
    window.location = url;
}, false);

document.getElementById("login-btn").addEventListener("click", function(event) {
    var params = getHashParams();
    spotifyApi.setAccessToken(params.access_token)
    console.log("MAIN ACCESS TOKEN: ")
    curr_user = document.getElementById("curr_user").value;
    socketio.emit("add_user", {user:curr_user});
}, false);

function create_room() {
    $('#chatlog').empty();
    curr_room = document.getElementById("create_room").value;
    let color = $("input[name='color']:checked").val(); //undefined if not selected
    document.getElementById("create_room").value = "";
    socketio.emit("create_room", {room:curr_room, user:curr_user, color:color});
}

function join_room(button) {
    $('#chatlog').empty();
    socketio.emit("join_room", {room: button.id, user:curr_user});
}

function private_message(button) {

    $('#dm_input').show();

    var send = $('<button/>', {
        text: "send", //set text 1 to 10
        id: button.id,
        class: "btn btn-primary btn-sm",
        click: (function(){
            send_private_message(this);
        })
    });
    $('#dm_submit').empty();
    $('#dm_submit').append(send);
}

function send_private_message(button) {
    let message = document.getElementById("dm_input").value;
    socketio.emit("send_private_message", {from_user: curr_user, to_user:button.id, message: message});
}

document.getElementById("send-btn").addEventListener("click", function(event) {
    let msg = document.getElementById("message_input").value;
    let bold = document.getElementById("bold").checked;
    let italics = document.getElementById("italics").checked;
    document.getElementById("message_input").value = "";
    socketio.emit("message_to_server", {message:msg, user: curr_user, bold:bold, italics:italics, room:curr_room});
}, false);

document.getElementById("play-song-btn").addEventListener("click", function(event) {
    var track = spotifyApi.getTrack("312WNtMs3F28cUukaPY9bo");
    console.log(track);
}, false);

function kick_user(button) {
    let user_to_kick = button.id;
    socketio.emit("kick_user", {user_to_kick: user_to_kick, user:curr_user, room: curr_room});
}

function ban_user(button) {
    let user_to_ban = button.id;
    socketio.emit("ban_user", {user_to_ban: user_to_ban, user:curr_user, room: curr_room});
}

function unban_user(button) {
    let user_to_unban = button.id;
    socketio.emit("unban_user", {user_to_unban: user_to_unban, user:curr_user, room: curr_room} );
}
