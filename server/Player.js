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
	this.factions = [];

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
				let alteredMessage = {action: "recieveMessage", messages: [{sender: player.name, message: message.message, date: message.date, stringifyHTML: false}]};

				// sends altered message
				player.game.sendMessage(alteredMessage);
			}
		},

		// !start command
		function(message, player){
			if(message.action == "sendMessage" && message.message == "!start" && player.host && player.game.inGame == false){
				player.game.startGame(player);
			}
		}
	];
}