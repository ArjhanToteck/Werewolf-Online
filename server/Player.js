const Roles = require("./Roles.js");

// exports player constructor
module.exports = {
	Player
}

// player constructor
function Player(name, game, spectator = false, host = false) {
	this.name = name.replace(/[\u00A0-\u9999<>\&]/gim, i => {
		return '&#' + i.charCodeAt(0) + ';'
	}); // removes HTML from name
	this.game = game;
	this.ips = [];
	this.spectator = spectator;
	this.host = host;
	this.role = null;
	this.dead = false;
	this.chatSendPermission = "village";
	this.chatViewPermissions = [{
		name: "village",
		start: this.game.dateOpened,
		end: null
	}, {
		name: `user:${this.name}`,
		start: this.game.dateOpened,
		end: null
	}];
	this.ready = true;
	this.data = {};
	this.protection = [];

	// generates random password for player
	this.password = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

	// connections
	this.connections = [];

	// kick
	this.kick = function(ipBan = false) {
		// kicks player from frontend
		for (let i = 0; i < this.connections.length; i++) {
			this.connections[i].sendUTF(JSON.stringify({
				action: "gameClosed",
				message: "You were kicked from the game."
			}));
		}

		// IP ban
		if (ipBan) {
			this.game.bannedIps = this.game.bannedIps.concat(this.ips);
		}

		// deletes password from game
		this.game.passwords.splice(this.game.passwords.indexOf(this.password), 1);

		// deletes player from game
		this.game.players.splice(this.game.players.indexOf(this), 1);
	}

	// death
	this.die = function(ignoreProtection = false) {
		// checks if protected
		if ((typeof(this.protection) == "object" && this.protection.length > 0) || ignoreProtection) {
			for (let i = 0; i < this.onProtectEvents.length; i++) {
				this.onProtectEvents[i]();
			}
		} else {
			// makes sure not already dead
			if (this.dead == false) {
				this.dead = true;
				this.chatSendPermission = "dead";
				this.chatViewPermissions.push({
					name: "dead",
					start: new Date(),
					end: null
				});

				this.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `${this.name} was found dead in the morning.`,
						date: new Date(),
						permission: "village"
					}]
				});

				for (let i = 0; i < this.onDeathEvents.length; i++) {
					this.onDeathEvents[i]();
				}
			}
		}
	}

	this.onProtectEvents = [];
	this.onDeathEvents = [];
	this.onNightEndEvents = [];
	this.onDayEndEvents = [];

	// onMessageEvents
	this.onMessageEvents = [
		// sends message
		function(message, player) {
			if (message.action == "sendMessage" && !!message.message) {
				// changes message action
				let alteredMessage = {
					action: "recieveMessage",
					messages: [{
						sender: player.name,
						message: message.message.replace(/[\u00A0-\u9999<>\&]/gim, i => {
							return '&#' + i.charCodeAt(0) + ';'
						}), // removes html from message
						date: new Date(),
						permission: player.chatSendPermission
					}]
				};

				// sends altered message
				player.game.sendMessage(alteredMessage);
			}
		},

		// global commands
		function(message, player) {
			if (message.action == "sendMessage" && !!message.message) {
				// !kick command
				if (message.message.substring(0, 5) == "!ban ") {
					// checks if game started
					if (player.game.inGame == false) {

						// checks if player is host
						if (player.host) {
							// !kick Moderator easter egg
							if (message.message == "!ban Moderator") {
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: "I thought we were friends!",
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});

								// exits function
								return;
							}

							let target = null;

							// loops through players in game
							for (let i = 0; i < player.game.players.length; i++) {
								// checks if current player name matches target name
								if (player.game.players[i].name == message.message.substring(5)) {
									target = player.game.players[i];
									break;
								}
							}

							// target not found
							if (target == null) {
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: `There is no player in the game called "${message.message.substring(5)}". Check your spelling or try copy-pasting their name.`,
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});

								// exits function
								return;
							}

							// valid target

							// warns player
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `Are you sure you want to permanently ban ${message.message.substring(5)} out of the game? They will not be able to join back into the game. Bans cannot be reverted. Type <c>confirm</c> to confirm the ban.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// gets index of future onMessage event for self destruction purposes
							var index = player.onMessageEvents.length;
							var timesFired = 0;

							// checks for next message to be "confirm"
							player.onMessageEvents.push(function(message, player) {
								// makes sure second time being called
								timesFired++;
								if(timesFired == 1) return;

								if (message.action == "sendMessage" && !!message.message) {
									if (message.message == "confirm") {
										// sends message confirming kick
										player.game.sendMessage({
											action: "recieveMessage",
											messages: [{
												sender: "Moderator",
												message: `${target.name} was permanently banned by ${player.name}`,
												date: new Date(),
												permission: player.chatSendPermission
											}]
										});

										// kicks out target
										target.kick(true);
									}

									// event listener self destructs
									player.onMessageEvents.splice(index, 1);
								}
							})

						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "You can't ban anyone, lmao, you dont have host permissions.",
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
					} else {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "The game already started, too late to ban anyone now.",
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});
					}
				}

				// !kick command
				if (message.message.substring(0, 6) == "!kick ") {
					// checks if game started
					if (player.game.inGame == false) {

						// checks if player is host
						if (player.host) {
							// !kick Moderator easter egg
							if (message.message == "!kick Moderator") {
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: "I thought we were friends!",
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});

								// exits function
								return;
							}

							// loops through players in game
							for (let i = 0; i < player.game.players.length; i++) {
								// checks if current player name matches target name
								if (player.game.players[i].name == message.message.substring(6)) {
									target = player.game.players[i];
									break;
								}
							}

							// target not found
							if (target == null) {
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: `There is no player in the game called "${message.message.substring(6)}". Check your spelling or try copy-pasting their name.`,
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});

								// exits function
								return;
							}

							// valid target

							// warns player
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `Are you sure you want to kick ${message.message.substring(6)} out of the game? They will still be able to join back. Type <c>confirm</c> to kick them out.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// gets index of future onMessage event for self destruction purposes
							var index = player.onMessageEvents.length;
							var timesFired = 0;

							// checks for next message to be "confirm"
							player.onMessageEvents.push(function(message, player) {
								// makes sure second time being called
								timesFired++;
								if(timesFired == 1) return;

								console.log(message.action + "\n" + message.message);
								if (message.action == "sendMessage" && !!message.message) {
									if (message.message == "confirm") {
										// sends message confirming kick
										player.game.sendMessage({
											action: "recieveMessage",
											messages: [{
												sender: "Moderator",
												message: `${target.name} was kicked by ${player.name}`,
												date: new Date(),
												permission: player.chatSendPermission
											}]
										});

										// kicks out target
										target.kick();
									}
								}

									// event listener self destructs
									player.onMessageEvents.splice(index, 1);
							});

						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "You can't kick anyone out, lmao, you dont have host permissions.",
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
					} else {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "The game already started, too late to kick anyone out now.",
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});
					}
				}

				switch (message.message) {
					// !players command
					case "!players":
						var playersList = [];

						// gets list of player names
						for (let i = 0; i < player.game.players.length; i++) {
							playersList.push(player.game.players[i].name);
						}

						// sends list of player names
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `All players currently in the game: ${playersList.join(", ")}`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});
						break;

						// !players alive command
					case "!players alive":
						var playersList = [];

						// gets list of living player names
						for (let i = 0; i < player.game.players.length; i++) {
							if (player.game.players[i].dead == false) playersList.push(player.game.players[i].name);
						}

						// checks if any living players are left
						if (playersList.length != 0) {
							// sends list of living player names
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `All players in the game that are currently still alive: ${playersList.join(", ")}`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `No players in this game are left alive. Wow.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
						break;

					case "!players dead":
						var playersList = [];

						// gets list of dead player names
						for (let i = 0; i < player.game.players.length; i++) {
							if (player.game.players[i].dead) playersList.push(player.game.players[i].name);
						}

						// checks if any dead players are left
						if (playersList.length != 0) {
							// sends list of dead player names
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `All players in the game that are currently dead: ${playersList.join(", ")}`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `No players in this game are dead. For now.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
						break;

						// !start command
					case "!start":
						if (player.game.inGame == false) {
							player.game.startGame(player);
						}
						break;
				}
			}
		}
	];
}