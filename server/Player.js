const Roles = require("./Roles.js").Roles;

// exports player constructor
module.exports =
{
  Player
}
  
// player constructor
function Player(name, game, spectator = false, host = false){
  this.name = name;
	this.game = game;
  this.spectator = spectator;
	this.host = host;
	this.role = null;
	this.dead = false;
	this.chatSendPermission = "village";
	this.chatViewPermissions = ["village", `user:${player.name}`];
	this.ready = true;

	// generates random password for player
  this.password = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

	// connections
	this.connections = [];

	// onMessageEvents
	this.onMessageEvents = [
		// sends message
		function(message, player){
			if(message.action == "sendMessage"){
				// changes message action
				let alteredMessage = {action: "recieveMessage", messages: [{sender: player.name, message: message.message, date: message.date, permission: player.chatSendPermission}]};

				// sends altered message
				player.game.sendMessage(alteredMessage);
			}
		},

		// !start command
		function(message, player){
			if(message.action == "sendMessage" && message.message == "!start" && player.game.inGame == false){
				player.game.startGame(player);
			}
		},

		// !players command
		function(message, player){
			if(message.action == "sendMessage" && message.message == "!players"){
				
				let playersList = [];

				// gets list of player names
				for(let i = 0; i < player.game.players.length; i++){
					playersList.push(player.game.players[i].name);
				}

				// sends list of player names
				player.game.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", message: `All players currently in the game: ${playersList.join(", ")}`, date: new Date(), permission: player.chatSendPermission}]});
			}
		},

		// !players alive command
		function(message, player){
			if(message.action == "sendMessage" && message.message == "!players alive"){
				
				let playersList = [];

				// gets list of living player names
				for(let i = 0; i < player.game.players.length; i++){
					if(player.game.players[i].dead == false) playersList.push(player.game.players[i].name);
				}
				
				// checks if any living players are left
				if(playersList.length != 0){
					// sends list of living player names
					player.game.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", message: `All players in the game that are currently still alive: ${playersList.join(", ")}`, date: new Date(), permission: player.chatSendPermission}]});
				} else {
					player.game.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", message: `No players in this game are left alive. Wow.`, date: new Date(), permission: player.chatSendPermission}]});
				}				
			}
		},

		// !players dead command
		function(message, player){
			if(message.action == "sendMessage" && message.message == "!players dead"){
				
				let playersList = [];

				// gets list of dead player names
				for(let i = 0; i < player.game.players.length; i++){
					if(player.game.players[i].dead) playersList.push(player.game.players[i].name);
				}
				
				// checks if any dead players are left
				if(playersList.length != 0){
					// sends list of dead player names
					player.game.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", message: `All players in the game that are currently dead: ${playersList.join(", ")}`, date: new Date(), permission: player.chatSendPermission}]});
				} else {
					player.game.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", message: `No players in this game are dead. For now.`, date: new Date(), permission: player.chatSendPermission}]});
				}				
			}
		}
	];
}