var port = 3000;
var express = require('express')();
var http = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: http});
var url = require('url');
var kicked = [];
var activeChatrooms = new Map();

var commands = new Map();
commands.set('msg_send', sendMsg);
commands.set('name_set', setName);
commands.set('chatroom_req', reqChatroom);
//commands.set('create', createRoom);
commands.set('mute_client', muteClient);
commands.set('ping_writer', pingWriter);
commands.set('createChatroom', createChatroom);

var names = new Map();
var writers = new Map();

//userList.set(roomName, userID, nickname, role);
var userList = new Map();



express.get('/', function (req, res) {
    res.sendFile(__dirname + '/websocket_client.html');
});

wss.on('connection', function connection(ws) {
    url.parse(ws.upgradeReq.url, true);
    console.log("connected with client");

    ws.on('open', function () {
        writers.set(ws, 'idle');
    });

    ws.on('message', function (msg) {
        var cmd = parseMessage(msg);
        if (cmd === 'undefined') {
            return;
        }

        if (commands.has(cmd.code)) {
            commands.get(cmd.code)(ws, cmd.args);
        }
    });

    ws.on('close', function () {
        if (ws.name !== 'undefined' && names.has(ws.name)) {
            names.delete(ws.name);
        }

        writers.delete(ws);

        // Notify other clients in chat room
    });
});

http.on('request', express);
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
    if (ws.muted === false) {
        msg = args.join(" ");
        if (ws.role === 'admin') {
            if (args[0] === '/mod') {
                ws.setRole(names.get(args[1]), args[2]);
            }
            if (args[0] === '/kick') {
                kicked.push(names.get(args[1]));
            }
            if (args[0] === '/mute') {
                ws.muted = true;
            }
            if (args[0] === '/unmute') {

            }
        } else if (ws.role === 'moderator') {
            if ((ws.role !== 'admin') || (ws.role !== 'moderator')) {
                if (args[0] === '/kick') {
                    kicked.push(names.get(args[1]));

                }
                if (args[0] === '/mute') {
                    ws.muted = true;
                }
                if (args[0] === '/unmute') {

                }
            }
        }
    }
    sendAllRoom('msg_received', msg);
    console.log("Message received: " + msg);
}

function reqChatroom(ws, args) {
    console.log('server: finding chatroom id ' + args);
    if (activeChatrooms.has(args)) {
        console.log('found room ' + args);
        send(ws, 'setRoom', args);
    } else {
        console.log('no chatroom found with the specified ID');
    }

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
            sendAllRoom('writer_change', ws.name + " " + state);
        }
    }
}

function send(ws, code, args) {
    ws.send(code + " " + args);
}

function sendAllRoom(code, args) {
    // Get all clients in room and send
    wss.clients.forEach(function each(client) {
        send(client, code, args);
    });
}

function setRole(name, role) {
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

    activeChatrooms.set(roomID);
    console.log('chatroom created: ' + roomID);
    
    // TODO: Check if the user is actually set as Admin
    userList.set(roomID, 'ClientID', roomCreator, 'admin');

    send(ws, 'setRoom', roomID);
}

// [min,max[
function randomNumber(min, max) {
    return Math.floor(Math.random() * ((max - 1) - min + 1)) + min;
}