var port = 3000;
var express = require('express');
var app = express();
var http = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: http});
var url = require('url');
var kicked = new Map();
var activeChatrooms = new Map();

var commands = new Map();
commands.set('msg_send', sendMsg);
commands.set('name_set', setName);
commands.set('chatroom_req', reqChatroom);
commands.set('mute_client', muteClient);
commands.set('ping_writer', pingWriter);
commands.set('createChatroom', createChatroom);

var names = new Map();
var writers = new Map();
var emotes = new Map();
emotes.set(':)', 'resources/img/emoticon/Smile.png');
emotes.set('Smile', 'resources/img/emoticon/Smile.png');
emotes.set(':(', 'resources/img/emoticon/Sad.png');
emotes.set('Sad', 'resources/img/emoticon/Sad.png');

app.use('/resources', express.static('resources'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

wss.on('connection', function connection(ws) {
    url.parse(ws.upgradeReq.url, true);
    console.log("connected with client");

    ws.on('open', function () {
        writers.set(ws, 'idle');
    });

    ws.on('message', function (msg) {
        var cmd = parseMessage(msg);
        if (cmd === undefined) {
            return;
        }

        if (commands.has(cmd.code)) {
            commands.get(cmd.code)(ws, cmd.args);
        }
    });

    ws.on('close', function () {
		leaveChatroom(ws);
	
        if (ws.name !== undefined && names.has(ws.name)) {
            names.delete(ws.name);
        }

        writers.delete(ws);
    });
});

http.on('request', app);
http.listen(3000, function () {
    console.log('Listening on ' + port);
});

function parseMessage(msg) {
    if (msg.length === 0) {
        return;
    }

    var msgs = msg.split(" ");
    var cmd = {
        code: msgs[0],
        args: msgs.slice(1, msgs.length)
    };

    return cmd;
}

function sendMsg(ws, args) {
    if (ws.muted === true) {
        return;
    }
    var sendMessage = true;
    if(ws.role === 'admin' || ws.role === 'moderator'){
		var otherWS = names.get(args[1]);
		if(otherWS !== undefined && otherWS !== null){
			if (args[0] === '/mod') {
				sendMessage = false;
				setRole(names.get(args[1]), args[2]);
				console.log(args[1] + ' ' + otherWS.role);
				sendAllRoom(ws.roomID,'notification_received', ws.name + ' has changed the role of ' + args[1] + ' to ' + otherWS.role);
			}
			else if (args[0] === '/kick') {
				sendMessage = false;
				var kickedUsers = kicked.get(ws.roomID);
				kickedUsers.push(otherWS);
				send(names.get(args[1]), 'setRoom', 'Lobby');
				leaveChatroom(otherWS);
				sendAllRoom(ws.roomID,'notification_received', ws.name + ' has kicked ' + args[1]); 
			}
			else if (args[0] === '/unkick') {
				sendMessage = false;
				var kickedUsers = kicked.get(ws.roomID);
				if(kickedUsers.includes(otherWS)){
					for(var i = kickedUsers.length -1; i >= 0; i--){
						if(kickedUsers[i] === otherWS){
							kickedUsers.splice(i, 1);
							sendAllRoom(ws.roomID,'notification_received', ws.name + ' has unkicked ' + args[1]); 
							break;
						}
					}
				}
			}
		}
        
    }
    if(sendMessage === false){
        return;
    }

    // Setup data to send
    var scannedMessage = scanMessage(args);

    var data = [];
    // Nickname
    data.push(ws.name);
    // Emote count
    data.push(scannedMessage.emotes.length / 2);
    // Emotes
    data.push(scannedMessage.emotes.join(" "));
    // Message
    data.push(scannedMessage.msg.join(" "));

    var sendMsg = data.join(" ");

    sendAllRoom(ws.roomID, 'msg_received', sendMsg);
    console.log("Sending message: | " + sendMsg + " | by " + ws.name + " to room " + ws.roomID);
}

function scanMessage(msg_args) {
    var fullMsg = msg_args.join(" ");
    fullMsg = fullMsg.replace(/(\r\n|\n|\r)/, "");
    msg_args = fullMsg.split(" ");

    console.log(fullMsg.split(" "));

    var emoteSet = new Set();
    var foundEmotes = [];
    for (var i = 0; i < msg_args.length; i++) {
        var msg = msg_args[i];
        if (emotes.has(msg) && !emoteSet.has(msg)) {
            emoteSet.add(msg);
            foundEmotes.push(msg);
            foundEmotes.push(emotes.get(msg));
        }
    }

    var result = {
        msg: msg_args,
        emotes: foundEmotes
    };

    return result;
}

function reqChatroom(ws, args) {
    console.log('server: finding chatroom id ' + args);
    var roomID = args[0];
    if (activeChatrooms.has(roomID) && !kicked.get(roomID).includes(ws)) {
        console.log('found room ' + roomID);
        // Disconnect from existing chat room if already set
        var clients = activeChatrooms.get(roomID);
        clients.set(ws, true);
        ws.roomID = roomID;
        ws.muted = false;
        send(ws, 'setRoom', roomID);

        updateUserList(roomID);

    } else {
        console.log('no chatroom found with the specified ID');
    }
}

function leaveChatroom(ws) {
	if(ws.roomID === undefined || ws.roomID === null 
		|| !activeChatrooms.has(ws.roomID)){
		return;
	}
	
	var roomID = ws.roomID;
	var clients = activeChatrooms.get(roomID);
	if(clients.has(ws)){
		clients.delete(ws);
	}

	ws.roomID = null;
	
	if(clients.size == 0){
		activeChatrooms.delete(roomID);
	}
	else{
		updateUserList(roomID);
	}
}

function updateUserList(roomID) {
    var clients = activeChatrooms.get(roomID);
    var clientList = [];
    clients.forEach(function search(value, client) {
        clientList.push(client.name);
    });
    
	var allClients = clientList.join(" ");
    clients.forEach(function each(value, client) {
        send(client, 'updateUserList', allClients);
    });
}

function removeFromUserList(roomID, name) {
    var clients = activeChatrooms.get(roomID);
    clients.forEach(function each(value, client) {
        send(client, 'removeFromUserList', name);
    });
}

function muteClient(ws, args) {
    ws.muted === true;
}
function setName(ws, args) {
    if (args.length !== 1) {
        send(ws, 'name_error', 'invalid');
        console.log("Invalid name change error on: " + ws.name);
        return;
    }

    name = args[0];
    if (names.has(name)) {
        send(ws, 'name_error', 'duplicate');
        console.log("Duplicate name change error on: " + ws.name);
        return;
    }

    ws.name = name;
    names.set(ws.name, ws);
    send(ws, 'name_changed', ws.name);

    console.log("Changed a client's name to: " + ws.name);
}

function pingWriter(ws, args) {
    if (args.length !== 1) {
        return;
    }

    var state = args[0];
    if (state === 'idle' || state === 'writing') {
        var currentState = writers.get(ws);
        if (currentState !== state) {
            writers.set(ws, state);
            sendAllRoom(ws.roomID, 'writer_change', ws.name + " " + state);
        }
    }
}

function send(ws, code, args) {
    ws.send(code + " " + args);
}

function sendAllRoom(roomID, code, args) {
    if (activeChatrooms.has(roomID)) {
        var clients = activeChatrooms.get(roomID);
        clients.forEach(function each(value, client) {
            send(client, code, args);
        });
    }
}

function sendAll(code, args) {
    // Get all clients in room and send
    wss.clients.forEach(function each(client) {
        send(client, code, args);
    });
}

function setRole(ws, role) {
    switch (role) {
        case 'admin':
            ws.role = 'admin';
            break;

        case 'moderator':
            ws.role = 'moderator';
            break;

        case 'user':
            ws.role = 'user';
            break;

        case 'spectator':
            ws.role = 'spectator';
            break;
    }
}

//Chatroom creation
var adjectives1 = [
    "Evergreen",
    "Enthusiastic",
    "Famous",
    "Broken",
    "Maddening",
    "Female",
    "Black",
    "Questionable",
    "Anxious",
    "Colorful",
    "Toxic",
    "Tasty",
    "Gigantic",
    "Gruesome",
    "Weary"
];

var adjectives2 = [
    "Practical",
    "Fat",
    "Lazy",
    "Green",
    "Witty",
    "Rare",
    "Dwarf",
    "Stereotyped",
    "Cold",
    "Annoying",
    "Flashy",
    "Pale",
    "Bright",
    "Political",
    "Snobbish"
];

var animals = [
    "Jaguar",
    "Dragon",
    "Cat",
    "Dog",
    "Fish",
    "Heifer",
    "Giraffe",
    "Hamster",
    "Cheetah",
    "Lamb",
    "Chinchilla",
    "Ox",
    "Crocodile",
    "Horse",
    "Octopus"
];

function createChatroom(ws, args) {
    var roomCreator = args;

    var adj1, adj2, animal, roomID;
    do {
        adj1 = randomNumber(0, adjectives1.length);
        adj2 = randomNumber(0, adjectives2.length);
        animal = randomNumber(0, animals.length);

        roomID = adjectives1[adj1] + adjectives2[adj2] + animals[animal];

    } while (activeChatrooms.has(roomID));

    var clients = new Map();
    clients.set(ws, true);
    activeChatrooms.set(roomID, clients);
    kicked.set(roomID, []);

    console.log('chatroom created: ' + roomID);

    // TODO: Check if the user is actually set as Admin
    ws.role = 'admin';
    ws.roomID = roomID;
    ws.muted = false;
    // userList.set(roomID, 'ClientID', roomCreator, 'admin');

    send(ws, 'setRoom', roomID);
    updateUserList(roomID);
}

// [min,max[
function randomNumber(min, max) {
    return Math.floor(Math.random() * ((max - 1) - min + 1)) + min;
}