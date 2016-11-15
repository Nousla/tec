var port = 3000;
var express = require('express')();
var http = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: http});
var url = require('url');
var rooms = new Map();
var user = []
rooms.set('Lobby', user);

var commands = new Map();
commands.set('msg_send', sendMsg);
commands.set('name_set', setName);
commands.set('chatroom_req', reqChatroom);
commands.set('create', createRoom);
commands.set('mute_client', muteClient);
boolean muted;

var names = new Map();

express.get('/', function (req, res) {
    res.sendFile(__dirname + '/websocket_client.html');
});

wss.on('connection', function connection(ws) {
    url.parse(ws.upgradeReq.url, true);
    console.log("connected to client");

    ws.on('message', function (msg) {
        var cmd = parseMessage(msg);
        if (cmd == undefined) {
            return;
        }

        if (commands.has(cmd.code)) {
            commands.get(cmd.code)(ws, cmd.args);
        }
    });

    ws.on('close', function () {
        if (ws.name != undefined && names.has(ws.name)) {
            names.delete(ws.name);
        }
    });
});

http.on('request', express);
http.listen(3000, function () {
    console.log('Listening on ' + port);
});

function parseMessage(msg) {
    if (msg.length == 0) {
        return;
    }

    var msgs = msg.split(" ");
    var cmd = {
        code: msgs[0],
        args: msgs.slice(1, msgs.length)
    }

    return cmd;
}

function sendMsg(ws, args) {
	if(muted == false){
    msg = args.join(" ");
	if(ws.role == 'admin'){
		if(args[0] == '/mod'){
			ws.setRole(names.get(args[1]),args[2])
		}
		if(args[0] == '/kick'){
			kicked.push(names.get(args[1]));
		}
	}
    wss.clients.forEach(function each(client) {
        send(client, 'msg_received', msg);
    });
    console.log("Message received: " + msg);
	}
}

function reqChatroom(ws, args) {
    console.log('server: finding chatroom id ' + args);
	if(rooms.has(args)){
		console.log('found room ' + args);
		send(ws, 'setRoom', args);
	}
	else{console.log('no chatroom found with the specified ID')}
	
}
function createRoom(ws, args) {
    rooms.set(args[0],[]);
    console.log('room created ' + args[0]);
}

function muteClient(ws){
	muted == true;
}
function setName(ws, args) {
    if (args.length != 1) {
        ws.send('name_error');
    }

    ws.name = args[0];
    names.set(ws.name, ws);
    send(ws, 'name_changed', ws.name);
    console.log("Changed client name to: " + ws.name);
}

function send(ws, code, args) {
    ws.send(code + " " + args);
}

function setRole(name, role){
	switch(role){
	
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