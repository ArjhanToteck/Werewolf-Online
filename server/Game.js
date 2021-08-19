const Player = require('./Player.js').Player;
const Roles = require("./Roles.js");
const deepClone = require("lodash.clonedeep");

// exports game constructor
module.exports = {
	Game
}

// game constructor

Game.games = [];
Game.codes = [];

function Game() {
	this.players = [];
	this.passwords = [];
	this.connections = [];
	this.chat = [];
	this.bannedIps = [];
	this.inGame = false;
	this.votingOpen = false;
	this.dateOpened = new Date();
	this.data = {
		wolfpack: {
			killsAllowed: 1
		}
	};

	this.dayPhase = {
		phase: null,
		timeStarted: new Date()
	};

	// pushes game to static game.games
	Game.games.push(this);

	// generates code
	while (!this.code || Game.codes.includes(this.code)) {
		this.code = Math.round(Math.random() * (999999 - 111111) + 111111);
		this.code = this.code.toString();
	}

	// adds code to list
	Game.codes.push(this.code);

	// join function
	this.join = function(name, spectator) {
		// checks if name is taken
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].name == name){
				return {failed: true, reason: "That username is already taken."}
			}
		}

		// generates player
		let player = new Player(name, this, spectator);
		player.game = this;
		this.players.push(player);
		this.passwords.push(player.password);

		return player;
	}

	// start game function
	this.startGame = function(player) {
		this.inGame = true;
		this.dayPhase = {
			phase: "day",
			timeStarted: new Date()
		};

		this.chat = [];
		this.sendMessage({
			action: "clearChat"
		});

		this.sendMessage({
			action: "recieveMessage",
			messages: [{
				sender: "Moderator",
				date: new Date().toString(),
				message: `${player.name} has started the game and has host permissions.`,
				permission: "village"
			}]
		});

		this.assignRoles();

		// changes day phase in 2 minutes
		setTimeout(() => {
			this.changeDayPhase();
		}, 120000); // 120000 = 2 minutes
	}

	this.assignRoles = function() {
		roles = Roles.generateRoles(this.players.length);
		
		// loops through players
		for(let i = 0; i < this.players.length; i++){
			currentRole = deepClone(roles[i]);
			this.players[i].role = currentRole;
			
			// checks if role contains chatViewPermissions
			if(!!currentRole.chatViewPermissions){
				// puts together list of chatViewPermissions
				for(let j = 0; j < currentRole.chatViewPermissions.length; j++){
					this.players[i].chatViewPermissions.push({name: currentRole.chatViewPermissions[j], start: new Date(), end: null});
				}
			}

			// adds role data to player
			if(!!currentRole.onMessageEvent) this.players[i].onMessageEvents.push(currentRole.onMessageEvent);
			if(!!currentRole.onDayEndEvent) this.players[i].onDayEndEvents.push(currentRole.onDayEndEvent);
			if(!!currentRole.onNightEndEvent) this.players[i].onNightEndEvents.push(currentRole.onNightEndEvent);
			if(!!currentRole.onDeathEvent) this.players[i].onDeathEvents.push(currentRole.onDeathEvent);

			// tells player about their role
			this.players[i].game.sendMessage({
				action: "recieveMessage",
				messages: [{
					sender: "Moderator",
					message: currentRole.description,
					date: new Date(),
					permission: `user:${this.players[i].name}`
				}]
			});
		}
	}

	this.changeDayPhase = function() {
		// checks how many players are ready
		let readyCount = 0;

		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].ready) readyCount++;
		}

		// changes actual cycle
		setTimeout(() => {
			// checks if day
			if (this.dayPhase.phase == "day") {
				// makes it night
				this.dayPhase = {
					phase: "night",
					timeStarted: new Date()
				};

				// closes voting
				this.votingOpen = false;

				// tells everyone it's night
				this.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						date: new Date().toString(),
						message: "The stars begin to shine as the sky turns black. The town is consumed by the night.",
						permission: "village"
					}]
				});

				// loops through players
				for (let i = 0; i < this.players.length; i++) {
					let currentPlayer = this.players[i];

					// resets some data
					currentPlayer.onProtectEvents = [];
					currentPlayer.protection = [];

					// checks if dead
					if(currentPlayer.dead == false){
						// this means role grants a night chat
						if (currentPlayer.role.chatSendPermission != null) {
							currentPlayer.chatSendPermission = currentPlayer.role.chatSendPermission;
						} else {
							// sets night chat to private chat with moderator for player to use commands and stuff
							currentPlayer.chatSendPermission = `user:${currentPlayer.name}`;
						}
					}

					// loops through dayEndEvents in each player
					for(let j = 0; j < this.players[i].onDayEndEvents.length; j++){
						// calls each event
						this.players[i].onDayEndEvents[j](this.players[i]);
					}
				}
			} else {
				// makes it day
				this.dayPhase = {
					phase: "day",
					timeStarted: new Date()
				};

				// resets killsAllowed
				this.data.wolfpack.killsAllowed = 1;

				// opens voting
				this.votingOpen = true;

				// tells everyone it's day
				this.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						date: new Date().toString(),
						message: "The sun rises in the horizon... it is now morning.",
						permission: "village"
					}]
				});

				// loops through players
				for (let i = 0; i < this.players.length; i++) {
					let currentPlayer = this.players[i];
					
					// checks if dead
					if(currentPlayer.dead == false){
						// sets chat permissions for day
						this.players[i].chatSendPermission = "village";
					}

					// loops through nightEndEvents in each player
					for(let j = 0; j < this.players[i].onNightEndEvents.length; j++){
						// calls each event
						this.players[i].onNightEndEvents[j](this.players[i]);
					}
				}
			}
		}, (readyCount / this.players.length) * /*180000*/1); // calculates milliseconds left until day phase depending on ready ratio
	}

	this.sendMessage = function(message) {
		// adds message to chat list if applicable
		if (message.action == "recieveMessage") {
			this.chat = this.chat.concat(message.messages);
		}
		
		// loops through all websockets
		for (let i = 0; i < this.connections.length; i++) {
			// alteredMessage will not contain inaccessible messages
			let alteredMessage = deepClone(message);

			if (message.action == "recieveMessage") {
				for (let j = 0; j < alteredMessage.messages.length; j++) {
					// checks if permissions are appropriate for current message
					let permissionIncluded = false;

					var k = 0;

					// loops through permissions and checks if they match
					for(k = 0; k < this.connections[i].player.chatViewPermissions.length; k++){	
						if(this.connections[i].player.chatViewPermissions[k].name == message.messages[j].permission){
							permissionIncluded = true;
							break;
						}
					}

					// checks if role was had at the time the message was sent
					if(!permissionIncluded || this.connections[i].player.chatViewPermissions[k].start > message.messages[j].date || (!!this.connections[i].player.chatViewPermissions[k].end && this.connections[i].player.chatViewPermissions[k].end < message.messages[j].date)){
						// removes current message
						alteredMessage.messages.splice(j, 1);

						// subtracts from j to compensate for removed message
						j--;
					}
				}

				// checks if any messages are to be sent
				if(alteredMessage.messages.length > 0){
					this.connections[i].sendUTF(JSON.stringify(alteredMessage));
				}
			} else {
				this.connections[i].sendUTF(JSON.stringify(alteredMessage));
			}			
		}
	}

	// closes game if inactive
	setTimeout(() => {
		if (this.inGame == false) {
			this.sendMessage({
				action: "gameClosed",
				message: "This game was closed since it has been open for 15 minutes without starting."
			});
		}
	}, 900000); // 900000 milliseconds = 15 minutes
}