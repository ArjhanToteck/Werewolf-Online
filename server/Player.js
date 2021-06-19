// exports player constructor
module.exports =
   {
     Player
   }
  
// player constructor
function Player(name, game, spectator = false){
  this.name = name;
	this.game = game;
  this.spectator = spectator;

	// generates random password for player
  this.password = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

	// link connection
	this.connection = undefined;

	this.linkConnection = function(connection){
		this.connection = connection;
		
	}
}