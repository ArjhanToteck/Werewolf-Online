const roles = {
	baker: {
		description: "You are a baker. You can bake and give bread to somebody every night and they will know to trust you as the baker.",
		value: 3,

		role: {
			name: "baker",
			seenByOthers: "baker",
			seenBySelf: "baker"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		onMessageEvent: function(message, player) {
			// checks if alive and night time
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// checks if using !give command
				if (message.action == "sendMessage" && message.message.substring(0, 6) == "!give ") {
					let target = null;

					// !give Moderator easter egg
					if (message.message == "!give Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "I'm flattered, really, but you should give the bread to somebody else.",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// !give self easter egg
					if (message.message == `!give ${player.name}`) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "You're the baker, you can always just make your own bread. Give the bread to someone who isn't you.",
								date: new Date(),
								permission: `user:${player.name}`
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
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// giving bread to a dead player
					if (target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} is dead. You probably shouldn't waste perfectly good bread on a corpse.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// valid target

					// sets target in data
					if (!player.data.baker) player.data.baker = {};
					player.data.baker.target = target;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `Tonight you will give ${target.name} some bread. They will know to trust you.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onNightEndEvent: function(player) {
			if (!!player.data.baker && !!player.data.baker.target) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You wake up to find a loaf of homemade bread given to you by ${player.name} as a gift. You can trust ${player.name}.`,
						date: new Date(),
						permission: `user:${player.data.baker.target.name}`
					}]
				});

				player.data.baker.target = null;
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: 'You are a baker. You can give bread to people by using the command <c>!give username</c>. Replace the word "username" with the username of the player to whom you will give bread.',
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		}
	},

	bloodhound: {
		description: "You are a bloodhound, a wolf with a highly trained sense of smell. From the smell of a man's blood, you can identify their role. Once per night, you can check the role of a player.",
		value: 2,

		role: {
			name: "bloodhound",
			seenByOthers: "bloodhound",
			seenBySelf: "bloodhound"
		},

		faction: {
			name: "wolfpack",
			name: "wolfpack",
			name: "wolfpack",
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack",

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !check command
				if (message.action == "sendMessage" && message.message.substring(0, 7) == "!check ") {
					let target = null;

					// !check Moderator easter egg
					if (message.message == "!check Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "...",
								date: new Date(),
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// !check self easter egg
					if (message.message == `!check ${player.name}`) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "You already know your own role. Check someone else.",
								date: new Date(),
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// loops through players in game
					for (let i = 0; i < player.game.players.length; i++) {
						// checks if current player name matches target name
						if (player.game.players[i].name == message.message.substring(7)) {
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
								message: `There is no player in the game called "${message.message.substring(7)}". Check your spelling or try copy-pasting their name.`,
								date: new Date(),
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// checking a fellow wolf
					if (target.role.faction.name == "wolfpack") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} is a wolfpack member. Why would you want to check them?`,
								date: new Date(),
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// checking a dead player
					if (target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} is dead. Their scent is too obscured by rot and filth for you to check them now.`,
								date: new Date(),
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// valid target

					// sets target in data to target
					if (!player.data.bloodhound) player.data.bloodhound = {};
					player.data.bloodhound.target = target;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You will check ${message.message.substring(7)}'s role tonight.`,
							date: new Date(),
								permission: "wolfpack"
						}]
					});
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a bloodhound. You can use the command <c>!check username</c> to check a player's role.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.data.bloodhound && !!player.data.bloodhound.target) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You checked ${player.data.bloodhound.target.name} is a ${player.data.bloodhound.target.role.role.seenByOthers}.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});

				player.data.bloodhound.target = null;
			}
		}
	},

	bloodletter: {
		description: "You are a bloodletter, a powerful type of wolf. You can kill, like other wolves, but you can also mark people with wolf blood. Marking a player with wolf blood will make seers see them as a wolf.",
		value: -2,

		role: {
			name: "bloodletter",
			seenByOthers: "bloodletter",
			seenBySelf: "bloodletter"
		},

		faction: {
			name: "wolfpack",
			seenByOthers: "wolfpack",
			seenBySelf: "wolfpack"
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack",

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !kill command
				if (message.action == "sendMessage" && message.message.substring(0, 6) == "!kill ") {
					wolfpackKill(message, player);

					// !mark command
				} else if (message.action == "sendMessage" && message.message.substring(0, 6) == "!mark ") {
					let target = null;

					// !mark Moderator easter egg
					if (message.message == "!mark Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "Uh... you cant do that.",
								date: new Date(),
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// !mark self easter egg
					if (message.message == `!mark ${player.name}`) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "Are you trying to mark yourself just to see what I would say?",
								date: new Date(),
								permission: "wolfpack"
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
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// marking a dead player
					if (target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} is dead. Not sure why you would want to mark them.`,
								date: new Date(),
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// marking a wolf
					if (target.role.faction.name == "wolfpack") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} is a werewolf. Why are you trying to mark them?`,
								date: new Date(),
								permission: "wolfpack"
							}]
						});

						// exits function
						return;
					}

					// valid target

					// sets target in data to target
					if (!player.data.bloodletter) player.data.bloodletter = {};
					player.data.bloodletter.target = target;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `${player.name} will mark ${message.message.substring(6)} with wolf blood tonight. Seers will see them as a wolf.`,
							date: new Date(),
							permission: "wolfpack"
						}]
					});
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a bloodletter and a member of the wolfpack. You, and all other wolves, can use the command <c>!kill username</c> to kill a player.  The wolfpack can kill ${player.game.data.wolfpack.killsAllowed} players tonight. Additionally, you, as a bloodletter, can mark a player with wolf blood. This will make seers think they are wolves. Use the command <c>!mark username/c> to use this abillity.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		},

		onNightEndEvent: function(player) {
			// blood mark

			// checks if target was chosen
			if (!!player.data.bloodletter && player.data.bloodletter.target) {
				// marks target
				player.data.bloodletter.target.role.faction.seenByOthers = "wolfpack";

				// resets target
				player.data.bloodletter.target = null;
			}

			// kill

			// checks if target was chosen
			if (!!player.game.data.wolfpack && player.game.data.wolfpack.targets && player.game.data.wolfpack.targets.length > 0) {
				// loops through every target
				for (let i = 0; i < player.game.data.wolfpack.targets.length; i++) {
					// checks if current player is killer
					if (player.game.data.wolfpack.targets[i].killer == player && player.game.data.wolfpack.targets[i].target.dead == false) {
						// kills target
						player.game.data.wolfpack.targets[i].target.die();
					}
				}

				// resets target data
				if (player.game.data.wolfpack.targetsKilled >= player.game.data.wolfpack.targets.length) {
					player.game.data.wolfpack.targetsKilled = 0;
					player.game.data.wolfpack.targets = [];
				}
			}
		}
	},

	fool: {
		description: "You are a seer, a powerful magician. You can peer into the minds of other players and see their true nature. Be aware, however, that some roles are seen unreliably.",
		value: 2,

		role: {
			name: "fool",
			seenByOthers: "fool",
			seenBySelf: "seer"
		},

		faction: {
			name: "village",
			name: "village",
			name: "village",
		},

		chatViewPermissions: null,
		chatSendPermission: null,

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !check command
				if (message.action == "sendMessage" && message.message.substring(0, 7) == "!check ") {
					let target = null;

					// !check Moderator easter egg
					if (message.message == "!check Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "What are you trying to do?",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// !check self easter egg
					if (message.message == `!check ${player.name}`) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "You already know your own faction. Check someone else.",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// loops through players in game
					for (let i = 0; i < player.game.players.length; i++) {
						// checks if current player name matches target name
						if (player.game.players[i].name == message.message.substring(7)) {
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
								message: `There is no player in the game called "${message.message.substring(7)}". Check your spelling or try copy-pasting their name.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// checking a dead player
					if (target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} is dead. You cannot peer into the mind of a dead man.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// valid target

					// sets target in data to target
					if (!player.data.fool) player.data.fool = {};
					player.data.fool.target = target;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You will check ${message.message.substring(7)}'s faction tonight.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a seer. You can use the command <c>!check username</c> to check a player's faction.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.data.fool && !!player.data.fool.target) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						// picks random fake faction
						message: `You checked ${player.data.fool.target.name}'s faction. They are a member of the ${Math.floor(Math.random() * 4) == 0 ? "wolfpack" : "villager"}.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});

				player.data.fool.target = null;
			}
		}
	},

	lycan: {
		description: "You are an ordinary villager. You lack any special power, so you must use your wits to identify and kill off the werewolves plaguing your town.",
		value: -0.5,

		role: {
			name: "lycan",
			seenByOthers: "lycan",
			seenBySelf: "villager"
		},

		faction: {
			name: "village",
			seenByOthers: "wolfpack",
			seenBySelf: "village"
		},
	},

	martyr: {
		description: "You are a martyr. During the night, you can give your life to save the life of another.",
		value: 2,

		role: {
			name: "martyr",
			seenByOthers: "martyr",
			seenBySelf: "martyr"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		onMessageEvent: function(message, player) {
			// checks if alive and night time
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// checks if using !protect command
				if (message.action == "sendMessage" && message.message.substring(0, 9) == "!protect ") {
					let target = null;

					// !protect Moderator easter egg
					if (message.message == "!protect Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "I'm flattered, really, but I'm the all-knowing, all-powerful moderator. I can protect myself.",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// !protect self easter egg
					if (message.message == `!protect ${player.name}`) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "You know that wouldn't do anything, right?.",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// loops through players in game
					for (let i = 0; i < player.game.players.length; i++) {
						// checks if current player name matches target name
						if (player.game.players[i].name == message.message.substring(9)) {
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
								message: `There is no player in the game called "${message.message.substring(9)}". Check your spelling or try copy-pasting their name.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// protecting a dead player
					if (target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${message.message.substring(9)} is... beyond protecting. I don't think you should sacrifice your life for a dead man.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// valid target

					// sets target in data
					if (!player.data.martyr) player.data.martyr = {
						lastTarget: null
					};

					// un-protects target
					if (!!player.data.martyr.target && player.data.martyr.target.protection == player) {
						// removes player from protection list
						target.protection.splice(target.protection.indexOf(player), 1);
					}

					player.data.martyr.target = target;
					target.protection.push(player);

					// kills player on protect
					target.onProtectEvents.push(function() {
						player.die();

						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `You honorably gave your life to save ${target.name}.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});
					})

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `Tonight you will protect ${target.name}. If anyone tries to kill them, they will kill you instead.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onNightEndEvent: function(player) {
			if (!!player.data.protector && !!player.data.protector.target) {
				player.data.protector.lastTarget = player.data.protector.target;
				player.data.protector.target = null;
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: 'You are a martyr. You can protect others by using the command <c>!protect username</c>. If someone tries to kill them, you will be killed instead.',
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		}
	},

	"old man": {
		description: "You are an old man and don't have much time left to live. You will pass away from natural causes in three days, if you are not already dead.",
		value: -0.5,

		role: {
			name: "old man",
			seenByOthers: "old man",
			seenBySelf: "old man"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				// checks if days left aren't defined
				if (!player.data["old man"] || !player.data["old man"].daysLeft) {
					// gives three days to live
					player.data["old man"] = {
						daysLeft: 2
					};

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You are an old man. You have ${player.data["old man"].daysLeft} day${player.data["old man"].daysLeft == 1 ? "" : "s"} left to live.`,
							date: new Date(),
							permission: player.chatSendPermission
						}]
					});
				} else {
					// removes one day of live
					player.data["old man"].daysLeft--;

					// checks if no days are left to live
					if (player.data["old man"].daysLeft <= 0) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `You are an old man. You will die of old age tonight.`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						// kills player at morning
						player.onDayEndEvents.push(function() {
							player.die(true);
						});
					} else {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `You are an old man. You have ${player.data["old man"].daysLeft} days left to live.`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});
					}
				}
			}
		}
	},

	protector: {
		description: "You are a protector. You can protect yourself and others from being killed during the night.",
		value: 3,

		role: {
			name: "protector",
			seenByOthers: "protector",
			seenBySelf: "protector"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		onMessageEvent: function(message, player) {
			// checks if alive and night time
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// checks if using !protect command
				if (message.action == "sendMessage" && message.message.substring(0, 9) == "!protect ") {
					let target = null;

					// !protect Moderator easter egg
					if (message.message == "!protect Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "I'm flattered, really, but I'm the all-knowing, all-powerful moderator. I can protect myself.",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// loops through players in game
					for (let i = 0; i < player.game.players.length; i++) {
						// checks if current player name matches target name
						if (player.game.players[i].name == message.message.substring(9)) {
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
								message: `There is no player in the game called "${message.message.substring(9)}". Check your spelling or try copy-pasting their name.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// protecting a dead player
					if (target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${message.message.substring(9)} is... beyond protecting. In case you haven't noticed, they're dead.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// protecting same player twice
					if (!!player.data.protector && !!player.data.protector.lastTarget && player.data.protector.lastTarget == target) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `You already protected ${message.message.substring(9)} yesterday. Pick someone else.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// valid target

					// sets target in data
					if (!player.data.protector) player.data.protector = {
						lastTarget: null
					};

					// un-protects target
					if (!!player.data.protector.target && player.data.protector.target.protection == player) {
						// removes player from protection list
						target.protection.splice(target.protection.indexOf(player), 1);
					}

					player.data.protector.target = target;
					target.protection.push(player);

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `Tonight you will protect ${target.name}. If anyone tries to kill them, they will fail.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onNightEndEvent: function(player) {
			if (!!player.data.protector && !!player.data.protector.target) {
				player.data.protector.lastTarget = player.data.protector.target;
				player.data.protector.target = null;
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: 'You are a protector. You protect yourself and others using the command <c>!protect username</c>. You cannot protect the same player two nights in a row.',
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		}
	},

	seer: {
		description: "You are a seer, a powerful magician. You can peer into the minds of other players and see their true nature. Be aware, however, that some roles are seen unreliably.",
		value: 2,

		role: {
			name: "seer",
			seenByOthers: "seer",
			seenBySelf: "seer"
		},

		faction: {
			name: "village",
			name: "village",
			name: "village",
		},

		chatViewPermissions: null,
		chatSendPermission: null,

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !check command
				if (message.action == "sendMessage" && message.message.substring(0, 7) == "!check ") {
					let target = null;

					// !check Moderator easter egg
					if (message.message == "!check Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "What are you trying to do?",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// !check self easter egg
					if (message.message == `!check ${player.name}`) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "You already know your own faction. Check someone else.",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// loops through players in game
					for (let i = 0; i < player.game.players.length; i++) {
						// checks if current player name matches target name
						if (player.game.players[i].name == message.message.substring(7)) {
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
								message: `There is no player in the game called "${message.message.substring(7)}". Check your spelling or try copy-pasting their name.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// checking a dead player
					if (target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} is dead. You cannot peer into the mind of a dead man.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// valid target

					// sets target in data to target
					if (!player.data.seer) player.data.seer = {};
					player.data.seer.target = target;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You will check ${message.message.substring(7)}'s faction tonight.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a seer. You can use the command <c>!check username</c> to check a player's faction.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.data.seer && !!player.data.seer.target) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You checked ${player.data.seer.target.name}'s faction. They are a member of the ${player.data.seer.target.role.faction.seenByOthers}.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});

				player.data.seer.target = null;
			}
		}
	},

	"silent wolf": {
		description: "You are a silent wolf. Like all wolves, you can kill people at night. Unlike other wolves, however, a seer will detect you as a regular villager.",
		value: -2,

		role: {
			name: "silent wolf",
			seenByOthers: "silent wolf",
			seenBySelf: "silent wolf"
		},

		faction: {
			name: "wolfpack",
			seenByOthers: "village",
			seenBySelf: "wolfpack"
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack",

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !kill command
				if (message.action == "sendMessage" && message.message.substring(0, 6) == "!kill ") {
					wolfpackKill(message, player);
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a member of the wolfpack. You, and all other wolves, can use the command <c>!kill username</c> to kill a player. The wolfpack can kill ${player.game.data.wolfpack.killsAllowed} players tonight.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.game.data && !!player.game.data.wolfpack && player.game.data.wolfpack.targets && player.game.data.wolfpack.targets.length > 0) {
				// loops through every target
				for (let i = 0; i < player.game.data.wolfpack.targets.length; i++) {
					// checks if current player is killer
					if (player.game.data.wolfpack.targets[i].killer == player && player.game.data.wolfpack.targets[i].target.dead == false) {
						// kills target
						player.game.data.wolfpack.targets[i].target.die();
					}
				}

				// resets target data
				if (player.game.data.wolfpack.targetsKilled >= player.game.data.wolfpack.targets.length) {
					player.game.data.wolfpack.targetsKilled = 0;
					player.game.data.wolfpack.targets = [];
				}
			}
		}
	},

	traitor: {
		description: "You are a traitor. The village treated you poorly and now you want to watch it burn to the ground. Every night, you conspire with the wolves, however, you cannot kill like they can.",
		value: 0,

		role: {
			name: "traitor",
			seenByOthers: "traitor",
			seenBySelf: "traitor"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack",
	},

	vigilante: {
		description: "You are a vigilante, a skilled fighter willing to take justice in your own hands. Once per game, you may kill a player at night.",
		value: 0,

		role: {
			name: "vigilante",
			seenByOthers: "vigilante",
			seenBySelf: "vigilante"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !kill command
				if (message.action == "sendMessage" && message.message.substring(0, 6) == "!kill ") {
					// sets data in player if missing
					if (!player.data.vigilante) player.data.vigilante = {
						killUsed: false,
						target: null
					};

					// checks if kill not already used
					if (!player.data.vigilante.killUsed) {
						let target = null;

						// !kill Moderator easter egg
						if (message.message == "!kill Moderator") {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "Careful where you point that thing!",
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// exits function
							return;
						}

						// suicide easter egg
						if (message.message == `!kill ${player.name}`) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "Please don't try to kill yourself.",
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
									message: `There is no player in the game called "${message.message.substring(6)}".`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							return;
						}

						// killing a dead player
						if (target.dead) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `${message.message.substring(6)} is already dead. Are you wasting your only kill on a corpse?`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// exits function
							return;
						}

						player.data.vigilante.target = target;

					} else {
						// already used power
						if (target.dead) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "Sorry, buddy, but you can only kill one person per game, which you already did. If you're getting bloodthirsty, you can always vote to lynch someone during the day.",
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// exits function
							return;
						}
					}
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a vigilante. You can use the command <c>!kill username</c> to kill a player. This power can only be used once per game. If the player you try to kill is protected, and as a result does not die, you still cannot use this power again.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		},

		onNightEndEvent: function(player) {
			if (!player.data.vigilante) player.data.vigilante = {
				killUsed: false,
				target: null
			};

			if(!!player.data.vigilante.target){
				player.data.vigilante.target.die();
				player.data.killUsed = true;
			}
		},
	},

	villager: {
		description: "You are an ordinary villager. You lack any special power, so you must use your wits to identify and kill off the werewolves plaguing your town.",
		value: 0,

		role: {
			name: "villager",
			seenByOthers: "villager",
			seenBySelf: "villager"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},
	},

	werewolf: {
		description: "You are a werewolf. During the day, you are like everyone else, but at night, you transform into a bloodthirsty monster and slaughter villagers.",
		value: -1,

		role: {
			name: "werewolf",
			seenByOthers: "werewolf",
			seenBySelf: "werewolf"
		},

		faction: {
			name: "wolfpack",
			seenByOthers: "wolfpack",
			seenBySelf: "wolfpack"
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack",

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !kill command
				if (message.action == "sendMessage" && message.message.substring(0, 6) == "!kill ") {
					wolfpackKill(message, player);
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a member of the wolfpack. You, and all other wolves, can use the command <c>!kill username</c> to kill a player. The wolfpack can kill ${player.game.data.wolfpack.killsAllowed} players tonight.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.game.data && !!player.game.data.wolfpack && player.game.data.wolfpack.targets && player.game.data.wolfpack.targets.length > 0) {
				// loops through every target
				for (let i = 0; i < player.game.data.wolfpack.targets.length; i++) {
					// checks if current player is killer
					if (player.game.data.wolfpack.targets[i].killer == player && player.game.data.wolfpack.targets[i].target.dead == false) {

						// removes targets
						if (!player.game.data.wolfpack.targetsKilled) player.game.data.wolfpack.targetsKilled = 0;
						player.game.data.wolfpack.targetsKilled++;

						// kills target
						player.game.data.wolfpack.targets[i].target.die();
					}
				}

				// resets target data
				if (player.game.data.wolfpack.targetsKilled >= player.game.data.wolfpack.targets.length) {
					player.game.data.wolfpack.targetsKilled = 0;
					player.game.data.wolfpack.targets = [];
				}
			}
		}
	},

	"wolf cub": {
		description: "You are a wolf cub, a young werewolf. Like all other wolves, you can kill villagers. If you are killed, the other wolves are enraged and will be able to kill an extra person the next night.",
		value: -1,

		role: {
			name: "werewolf",
			seenByOthers: "werewolf",
			seenBySelf: "werewolf"
		},

		faction: {
			name: "wolfpack",
			seenByOthers: "wolfpack",
			seenBySelf: "wolfpack"
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack",

		onDeathEvent: function(player) {
			player.game.data.wolfpack.killsAllowed++;
			player.data["wolf cub"] = {
				killedToday: true
			};
		},

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !kill command
				if (message.action == "sendMessage" && message.message.substring(0, 6) == "!kill ") {
					wolfpackKill(message, player);
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a member of the wolfpack. You, and all other wolves, can use the command <c>!kill username</c> to kill a player. The wolfpack can kill ${player.game.data.wolfpack.killsAllowed} players tonight.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}

			if (!!player.data["wolf cub"] && player.data["wolf cub"].killedToday == true) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `${player.name}, your wolf cub, died today. Their death has brought rage to the wolfpack. You have an extra kill tonight.`,
						date: new Date(),
						permission: `wolfpack`
					}]
				});
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.game.data && !!player.game.data.wolfpack && player.game.data.wolfpack.targets && player.game.data.wolfpack.targets.length > 0) {
				// loops through every target
				for (let i = 0; i < player.game.data.wolfpack.targets.length; i++) {
					// checks if current player is killer
					if (player.game.data.wolfpack.targets[i].killer == player && player.game.data.wolfpack.targets[i].target.dead == false) {

						// removes targets
						if (!player.game.data.wolfpack.targetsKilled) player.game.data.wolfpack.targetsKilled = 0;
						player.game.data.wolfpack.targetsKilled++;

						// kills target
						player.game.data.wolfpack.targets[i].target.die();
					}
				}

				// resets target data
				if (player.game.data.wolfpack.targetsKilled >= player.game.data.wolfpack.targets.length) {
					player.game.data.wolfpack.targetsKilled = 0;
					player.game.data.wolfpack.targets = [];
				}
			}
		}
	}
}

function wolfpackKill(message, player) {
	let target = null;

	// !kill Moderator easter egg
	if (message.message == "!kill Moderator") {
		player.game.sendMessage({
			action: "recieveMessage",
			messages: [{
				sender: "Moderator",
				message: "Why are you trying to kill me? What did I ever do to you?",
				date: new Date(),
				permission: player.chatSendPermission
			}]
		});

		// exits function
		return;
	}

	// suicide easter egg
	if (message.message == `!kill ${player.name}`) {
		player.game.sendMessage({
			action: "recieveMessage",
			messages: [{
				sender: "Moderator",
				message: "Please don't try to kill yourself.",
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
				message: `There is no player in the game called "${message.message.substring(6)}".`,
				date: new Date(),
				permission: player.chatSendPermission
			}]
		});

		return;
	}

	// killing a fellow wolf
	if (target.role.faction.name == "wolfpack") {
		player.game.sendMessage({
			action: "recieveMessage",
			messages: [{
				sender: "Moderator",
				message: "Pro tip: killing a fellow werewolf is probably a bad strategy.",
				date: new Date(),
				permission: player.chatSendPermission
			}]
		});

		// exits function
		return;
	}

	// killing a dead player
	if (target.dead) {
		player.game.sendMessage({
			action: "recieveMessage",
			messages: [{
				sender: "Moderator",
				message: `${message.message.substring(6)} is already dead. Are you planning on mauling a corpse?`,
				date: new Date(),
				permission: "wolfpack"
			}]
		});

		// exits function
		return;
	}

	if (!!player.game.data.wolfpack.targets) {

		// checks if target is already a target of wolfpack
		let includesTarget = false;
		for (let i = 0; i < player.game.data.wolfpack.targets.length; i++) {
			if (player.game.data.wolfpack.targets[i].target == target) {
				includesTarget = true;
				break;
			}
		}

		// killing the same target twice
		if (includesTarget) {
			player.game.sendMessage({
				action: "recieveMessage",
				messages: [{
					sender: "Moderator",
					message: `${player.name} is already one of your targets. Are you expecting to kill the same guy twice in one night?`,
					date: new Date(),
					permission: "wolfpack"
				}]
			});

			// exits function
			return;
		}
	}

	// this means it is a valid player

	// sets target in data to target
	if (!player.game.data.wolfpack) player.game.data.wolfpack = {};
	if (!player.game.data.wolfpack.targets) player.game.data.wolfpack.targets = [];

	player.game.data.wolfpack.targets.push({
		target: target,
		killer: player
	});

	// checks if allowed kills is exceeded
	if (player.game.data.wolfpack.targets.length > player.game.data.wolfpack.killsAllowed) {
		player.game.data.wolfpack.targets.shift();
	}

	let outputMessage = "";

	if (player.game.data.wolfpack.targets.length == 1) {
		outputMessage = `${player.name} will kill ${message.message.substring(6)} tonight.`
	} else {
		outputMessage = `${player.game.data.wolfpack.targets[0].killer.name} will kill ${player.game.data.wolfpack.targets[0].target.name}`;

		for (let i = 1; i < player.game.data.wolfpack.targets.length - 1; i++) {
			outputMessage += `, ${player.game.data.wolfpack.targets[i].killer.name} will kill ${player.game.data.wolfpack.targets[i].target.name}`;
		}

		outputMessage += `, and ${player.game.data.wolfpack.targets[player.game.data.wolfpack.targets.length - 1].killer.name} will kill ${player.game.data.wolfpack.targets[player.game.data.wolfpack.targets.length - 1].target.name} tonight.`;
	}

	player.game.sendMessage({
		action: "recieveMessage",
		messages: [{
			sender: "Moderator",
			message: outputMessage,
			date: new Date(),
			permission: "wolfpack"
		}]
	});
}

function generateRoles(playerCount) {
	return [roles.werewolf, roles["wolf cub"]];
}

// exports roles
module.exports = {
	roles,
	generateRoles
}