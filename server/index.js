const http = require("http");
const WebSocketServer = require("websocket").server;
const deepClone = require("lodash.clonedeep");

const Game = require("./Game.js").Game;
const Player = require("./Player.js").Player;
const Roles = require("./Roles.js");

// replace this with frontend domain
const frontend = "https://arjhantoteck.vercel.app";

// opens http server
let server = http.createServer(function(req, res) {
	const headers = {
		"Access-Control-Allow-Origin": frontend,
		"Content-Type": "text/plain"
	};

	if (req.method == "POST") {
		// no path
		if (req.url.split("/").length <= 1) {
			res.writeHead(404, headers);

			res.end("Action not specified\n");
		} else {
			const action = req.url.split("/")[1].split("?")[0];

			switch (action) {
				case "joinGame":
					if (req.url.includes("name=") && req.url.includes("code=")) {

						// checks if name includes Moderator
						if (decodeURIComponent(req.url.split("name=")[1].split("&")[0]).toLowerCase().includes("moderator")) {
							res.writeHead(403, headers);
							res.end('Your name may not contain the word "moderator."\n');
						}

						// checks if name is under 3 characters
						if (decodeURIComponent(req.url.split("name=")[1].split("&")[0]).length < 3) {
							res.writeHead(403, headers);
							res.end("Your name must be at least 3 letters long.\n");
						}

						// checks if name is over 15 characters
						if (decodeURIComponent(req.url.split("name=")[1].split("&")[0]).length > 15) {
							res.writeHead(403, headers);
							res.end("Your name must be at most 15 characters long.\n");
							return;
						}

						// checks if name contains non ASCII characters
						if(/^[\x00-\x7F]*$/.test(decodeURIComponent(req.url.split("name=")[1].split("&")[0])) == false){
							res.writeHead(403, headers);
							res.end("Your name must only contain ASCII characters (characters on a standard US keyboard).\n");
							return;
						}

						// attempts to join game
						const response = joinGame(decodeURIComponent(req.url.split("code=")[1].split("&")[0]), decodeURIComponent(req.url.split("name=")[1].split("&")[0]), false);

						// invalid code
						if (response.failed) {
							res.writeHead(404, headers);

							res.end(`${response.reason}\n`);
						} else {
							// successfully joined game and returns player password
							res.writeHead(200, headers);

							res.end(response);
						}
					} else {
						res.writeHead(404, headers);

						res.end("Name and/or code missing\n");
					}
					break;

				case "publicGames":
					res.writeHead(200, headers);

					// compiles public games into string
					var publicGames = [];
					for(let i = 0; i < Game.publicGames.length; i++){
						publicGames.push(Game.publicGames[i].code);
					}

					res.end(`[${publicGames.toString()}]`);
					break;

				case "startGame":
					if (req.url.includes("name=")) {
						// checks if name includes Moderator
						if (decodeURIComponent(req.url.split("name=")[1].split("&")[0]).toLowerCase().includes("moderator")) {
							res.writeHead(403, headers);
							res.end('Your name may not contain the word "moderator."\n');
						}

						// checks if name is under 3 characters
						if (decodeURIComponent(req.url.split("name=")[1].split("&")[0]).length < 3) {
							res.writeHead(403, headers);
							res.end("Your name must be at least 3 letters long.\n");
						}

						// checks if name is over 15 characters
						if (decodeURIComponent(req.url.split("name=")[1].split("&")[0]).length > 15) {
							res.writeHead(403, headers);
							res.end("Your name must be at most 15 characters long.\n");
							return;
						}

						// checks if name contains non ASCII characters
						if(/^[\x00-\x7F]*$/.test(decodeURIComponent(req.url.split("name=")[1].split("&")[0])) == false){
							res.writeHead(403, headers);
							res.end("Your name must only contain ASCII characters (characters on a standard US keyboard).\n");
							return;
						}

						res.writeHead(200, headers);

						res.end(JSON.stringify(newGame(decodeURIComponent(req.url.split("name=")[1].split("&")[0]))));
					} else {
						res.end("Name missing\n");
					}
					break;				

				default:
					res.writeHead(404, headers);

					res.end("Action invalid\n");
					break;
			}
		}
	} else {
		res.writeHead(405, headers);

		res.end("Method Not Allowed\n");
	}
});
server.listen(8443);
console.log("Server running on port 8443");

// opens websocket server
wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

wsServer.on("request", function(request) {
	// checks if origin matches
	if (!!request.origin && request.origin.indexOf(frontend) == -1) {
		// rejec && ts bad request
		request.reject();
		return;
	} else {
		const connection = request.accept(null, request.origin);

		// listens for connection to game
		connection.on("message", function(data) {
			if (verifyMessage(data)) {
				const message = JSON.parse(data.utf8Data);

				const game = Game.games[Game.codes.indexOf(message.code)];
				if(game.bannedIps.includes(request.socket.remoteAddress)){
					connection.sendUTF(JSON.stringify({
						action: "gameClosed",
						message: `You were banned from joining ${message.code}.`
					}));
				}

				let player = game.players[game.passwords.indexOf(message.password)];

				// makes sure player is up to date  in connection
				connection.player = player;

				// checks if connection is in player object
				if (player.connections.includes(connection) == false) {

					// adds connection to player
					player.connections.push(connection);
					connection.player = player;
					game.connections.push(connection);

					// adds ip address to player (for ip bans)
					if(!player.ips.includes(request.socket.remoteAddress)) player.ips.push(request.socket.remoteAddress);

					// sends current chat to player
					let visibleChat = deepClone(game.chat);
					let removedMessages = 0;
					
					for (let i = 0; i < game.chat.length; i++) {
						// checks if permissions are appropriate for current message
						let permissionIncluded = false;

						let j = 0;

						// loops through permissions and checks if they match
						for(j = 0; j < player.chatViewPermissions.length; j++){
							if(player.chatViewPermissions[j].name == game.chat[i].permission){
								permissionIncluded = true;
								break;
							}
						}

						// checks if role was had at the time the message was sent
						if(!permissionIncluded || player.chatViewPermissions[j].start > game.chat[i].date || (!!player.chatViewPermissions[j].end && player.chatViewPermissions[j].end < game.chat[i].date)){
							// removes current message
							visibleChat.splice(i - removedMessages, 1);
							removedMessages++;
						}
					}

					// sends chat
					connection.sendUTF(JSON.stringify({
						action: "recieveMessage",
						messages: visibleChat
					}));

					// prepares for connection to close
					connection.on("close", function() {
						// removes connection from game
						game.connections = game.connections.splice(game.connections.indexOf(connection), 1);

						// removes connection from player
						player.connections = player.connections.splice(player.connections.indexOf(connection), 1);
					});
				}

				// calls all onMessageEvents in player
				for (let i = 0; i < player.onMessageEvents.length; i++) {
					player.onMessageEvents[i](message, player);
				}
			} else {
				connection.sendUTF(JSON.stringify({
					action: "gameClosed",
					message: "This game does not exist."
				}));
			}
		});
	}
});

function newGame(name) {
	// creates new game
	let newGame = new Game();

	// creates new player 
	let player = newGame.join(name);
	player.host = true;

	// game creation message
	newGame.sendMessage({
		action: "recieveMessage",
		messages: [{
			sender: "Moderator",
			date: new Date(),
			message: `${player.name} has opened the game room. When you have at least five players, use <c>!start</c> to start the game. Use the <c>!help</c> command for help.`,
			permission: "village"
		}]
	});

	// returns new game's code and password of new player
	return {
		code: newGame.code,
		password: player.password
	};
}

function joinGame(code, name) {
	// gets index of code
	const index = Game.codes.indexOf(code);

	// makes sure code is valid
	if (index == -1) {
		return {failed: true, reason: "Game not found."};
	} else {
		// checks if game already started
		if(Game.games[index].inGame) return {failed: true, reason: "That game already started. It's too late to join now."};

		// joins game and returns new player password
		let player = Game.games[index].join(name);

		if(player.failed == true){
			return {failed: true, reason: player.reason};
		}

		// message that they joined the game
		Game.games[index].sendMessage({
			action: "recieveMessage",
			messages: [{
				sender: "Moderator",
				date: new Date(),
				message: `${player.name} has joined the game.`,
				permission: "village"
			}]
		});

		// returns password
		return player.password;
	}
}

// verifies whether or not a message is valid
function verifyMessage(data) {
	if (data.type == "utf8") {
		// parses message
		const message = JSON.parse(data.utf8Data);

		// checks if message is to link player and game is valid
		if (Game.codes.includes(message.code)) {
			const game = Game.games[Game.codes.indexOf(message.code)];

			// checks if password is valid
			if (game.passwords.includes(message.password)) {
				let player = game.players[game.passwords.indexOf(message.password)];

				return true;
			}
		}

		return false;
	}
}
