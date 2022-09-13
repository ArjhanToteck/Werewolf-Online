const roles = {
	avenger: {
		description: "You are an <a href=\"roles/avenger.html\">avenger</a>. If you die, you will kill the player who wronged you in your final breath. If you are killed by vote, you will kill a random player who voted for you. This kill will ignore any protection.",
		value: 0,

		role: {
			name: "avenger",
			seenByOthers: "avenger",
			seenBySelf: "avenger"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		onDeathEvent: function(player, killer) {
			// checks if player was killed by vote
			if (killer.lynched) {
				// chooses random voter as victom
				let victim = killer.voters[Math.floor(Math.random() * killer.voters.length)];

				victim.die(player, true, `As ${player.name} hung from a noose, they reached out and strangled ${victim.name} for revenge in their final breath.`);
			} else {
				console.log(`killer (${killer.name}) being killed`);
				killer.die(player, true);
			}
		}
	},

	baker: {
		description: "You are a <a href=\"roles/baker.html\">baker</a>. You can bake and give bread to somebody every night and they will know to trust you as the baker.",
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

					player.ready = true;

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
						message: `You wake up to find a loaf of fresh homemade bread left at your door by ${player.name} as a gift. You now know for certain that ${player.name} is a village member.`,
						date: new Date(),
						permission: `user:${player.data.baker.target.name}`
					}]
				});

				player.data.baker.target = null;
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.ready = false;

				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: 'You are a <a href=\"roles/baker.html\">baker</a>. You can give bread to people by using the command <c>!give username</c>. Replace the word "username" with the username of the player to whom you will give bread.',
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			} else {
				player.ready = true;
			}
		}
	},

	bloodhound: {
		description: "You are a <a href=\"roles/bloodhound.html\">bloodhound</a>, a wolf with a highly trained sense of smell. From the smell of a man's blood, you can identify their role. Once per night, you can check the role of a player.",
		value: 2,

		role: {
			name: "bloodhound",
			seenByOthers: "bloodhound",
			seenBySelf: "bloodhound"
		},

		faction: {
			name: "wolfpack",
			seenByOthers: "wolfpack",
			seenBySelf: "wolfpack",
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack",

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false) {
				// !kill command
				if (message.action == "sendMessage" && message.message.substring(0, 6) == "!kill ") {
					wolfpackKill(message, player);

					// !check command
				} else if (message.action == "sendMessage" && message.message.substring(0, 7) == "!check ") {
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
					player.ready = true;

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
				player.ready = false;

				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a <a href=\"roles/bloodhound.html\">bloodhound</a>. You can use the command <c>!check username</c> to check a player's role.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			} else {
				player.ready = true;
			}
		},

		onNightEndEvent: function(player) {
			// !kill
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
						player.game.data.wolfpack.targets[i].target.die(player);
					}
				}

				// resets target data
				if (player.game.data.wolfpack.targetsKilled >= player.game.data.wolfpack.targets.length) {
					player.game.data.wolfpack.targetsKilled = 0;
					player.game.data.wolfpack.targets = [];
				}
			}

			// !check
			// checks if target was chosen
			if (!!player.data.bloodhound && !!player.data.bloodhound.target) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `Last night, you checked ${player.data.bloodhound.target.name} and found they are a <a href="roles/${player.data.bloodhound.target.role.role.seenByOthers.split(" ").join("%20")}.html">${player.data.bloodhound.target.role.role.seenByOthers}</a>.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});

				player.data.bloodhound.target = null;
			}
		}
	},

	bloodletter: {
		description: "You are a <a href=\"roles/bloodletter.html\">bloodletter</a>, a powerful type of wolf. You can kill, like other wolves, but you can also mark people with wolf blood. Marking a player with wolf blood will make seers see them as a wolf.",
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
						message: `You are a <a href=\"roles/bloodletter.html\">bloodletter</a> and a member of the wolfpack. You, and all other wolves, can use the command <c>!kill username</c> to kill a player.  The wolfpack can kill ${player.game.data.wolfpack.killsAllowed} players tonight. Additionally, you, as a bloodletter, can mark a player with wolf blood. This will make seers think they are wolves. Use the command <c>!mark username/c> to use this abillity.`,
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
						player.game.data.wolfpack.targets[i].target.die(player);
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

	doppelgänger: {
		description: "You are a <a href=\"roles/doppelgänger.html\">doppelgänger</a>. On the first night you will choose another player. You will become the role that player was.",
		value: 0,

		role: {
			name: "doppelgänger",
			seenByOthers: "doppelgänger",
			seenBySelf: "doppelgänger"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		onMessageEvent: function(message, player) {
			if (player.role.role.name == "doppelgänger" && player.game.dayPhase.phase == "night" && player.dead == false) {
				// !copy command
				if (message.action == "sendMessage" && message.message.substring(0, 6) == "!copy ") {
					let target = null;

					// !check Moderator easter egg
					if (message.message == "!copy Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "I know you wish you were me, but you can't be me.",
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// !check self easter egg
					if (message.message == `!copy ${player.name}`) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "Would that make you a doppelgänger for another night or would that... forget it, you can't do it to yourself.",
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

					// checking a dead player
					if (target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} is dead. Wait a second, this is the first night, how is there a dead player?`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// valid target

					// sets target in data to target
					if (!player.data.doppelgänger) player.data.doppelgänger = {};
					player.data.doppelgänger.target = target;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You will copy ${message.message.substring(6)}'s role tonight.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (player.role.role.name == "doppelgänger" && !!player.data.doppelgänger && !!player.data.doppelgänger.target) {
				// lets player now what they have become
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You have copied ${player.data.doppelgänger.target.name}'s role. ${player.data.doppelgänger.target.role.description}`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
				
				// copies role from target to player
				player.role = player.data.doppelgänger.target.role;
				player.faction = player.data.doppelgänger.target.faction;

				// checks if role comes with chat permissions
				if (!!player.role.chatViewPermissions) {
					// adds chat permissions from role to player
					for (let i = 0; i < player.role.chatViewPermissions.length; i++) {
						player.chatViewPermissions.push({
							name: player.role.chatViewPermissions[i],
							start: new Date(),
							end: null
						});
					}
				}

				// adds role data to player
				if (!!player.role.onMessageEvent) player.onMessageEvents.push(player.role.onMessageEvent);
				if (!!player.role.onDayEndEvent) player.onDayEndEvents.push(player.role.onDayEndEvent);
				if (!!player.role.onNightEndEvent) player.onNightEndEvents.push(player.role.onNightEndEvent);
				if (!!player.role.onDeathEvent) player.onDeathEvents.push(player.role.onDeathEvent);
				if (!!player.role.subfactions) player.subfactions = player.subfactions.concat(player.role.subfactions);

				// removes doppelgänger data
				delete player.data.doppelgänger;
			}
		},

		onDayEndEvent: function(player) {
			if (player.role.role.name == "doppelgänger") {
				if (player.dead == false) {
					player.ready = false;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You are a <a href=\"roles/doppelgänger.html\">doppelgänger</a>. You can use the command <c>!copy username</c> to copy a player's role. If you do not choose a player, a random one will be chosen for you.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});

					// gets living players
					let livingPlayers = [];

					// loops through every player
					for (let i = 0; i < player.game.players.length; i++) {
						// adds player to list if alive
						let currentPlayer = player.game.players[i];
						if (!currentPlayer.dead) livingPlayers.push(currentPlayer);
					}

					// sets player target to random living player
					player.data.doppelgänger = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
				} else {
					player.ready = true;
				}
			}
		},
	},

	fool: {
		description: "You are a <a href=\"roles/seer.html\">seer</a>, a powerful magician. You can peer into the minds of other players and see their true nature. Be aware, however, that some roles are seen unreliably.",
		value: 2,

		role: {
			name: "fool",
			seenByOthers: "fool",
			seenBySelf: "seer"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village",
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
						message: `You are a <a href=\"roles/seer.html\">seer</a>. You can use the command <c>!check username</c> to check a player's faction.`,
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
						message: `You checked ${player.data.fool.target.name}'s faction. Their faction is "${Math.floor(Math.random() * 4) == 0 ? "wolfpack" : "village"}".`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});

				player.data.fool.target = null;
			}
		}
	},

	gravedigger: {
		description: "You are a <a href=\"roles/gravedigger.html\">gravedigger</a>. Once per night, you may dig up a dead player's corpse and find out what their role was while they were alive.",
		value: 2,

		role: {
			name: "gravedigger",
			seenByOthers: "gravedigger",
			seenBySelf: "gravedigger"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village",
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
								message: "I'm not... I... What?",
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
								message: "Listen, I ran out of funny lines to say when you misuse abilities. Just don't check yourself, okay?",
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

					// checking a living player
					if (!target.dead) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `${player.name} isn't dead yet. I understand you're eager, but be patient and wait until they die.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// valid target
					player.ready = true;

					// sets target in data to target
					if (!player.data.gravedigger) player.data.gravedigger = {};
					player.data.gravedigger.target = target;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You will check ${message.message.substring(7)}'s role tonight.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.ready = false;

				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a <a href=\"roles/gravedigger.html\">gravedigger</a>. You can use the command <c>!check username</c> to check the role of a dead player.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			} else {
				player.ready = true;
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.data.gravedigger && !!player.data.gravedigger.target) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You dug up ${player.data.gravedigger.target.name}'s corpse and found out they were a </a href="roles/${player.data.gravedigger.target.role.role.seenByOthers.split(" ").join("%20")}.html">${player.data.gravedigger.target.role.role.seenByOthers}</a>.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});

				player.data.gravedigger.target = null;
			}
		}
	},

	"lost mason": {
		description: "You are a <a href=\"roles/lost%20mason.html\">lost mason</a>, a member of a secret society who was seperated from the group. Every night, you can try to reunite yourself with your fellow masons.",
		value: 2,

		role: {
			name: "lost mason",
			seenByOthers: "lost mason",
			seenBySelf: "lost mason"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village",
		},

		chatViewPermissions: null,
		chatSendPermission: null,

		onMessageEvent: function(message, player) {
			if (player.game.dayPhase.phase == "night" && player.dead == false && (!player.data["lost mason"] || !player.data["lost mason"].reunited)) {
				// !check command
				if (message.action == "sendMessage" && message.message.substring(0, 7) == "!check ") {
					let target = null;

					// !check Moderator easter egg
					if (message.message == "!check Moderator") {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "Saddly, I'm not a mason. Checks someone else.",
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
								message: "You have to find another mason, not yourself.",
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
								message: `${player.name} is dead. I don't think they can help you find the masons.`,
								date: new Date(),
								permission: `user:${player.name}`
							}]
						});

						// exits function
						return;
					}

					// valid target
					player.ready = true;

					// sets target in data to target
					if (!player.data["lost mason"]) player.data["lost mason"] = {
						reunited: false
					};
					player.data["lost mason"].target = target;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `Tonight you will check if ${message.message.substring(7)} is a mason.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				// checks if mason is not yet reunited
				if ((!player.data["lost mason"] || !player.data["lost mason"].reunited)) {
					player.ready = false;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You are a <a href=\"roles/lost%20mason.html\">lost mason</a>. You can use the command <c>!check username</c> to check if a player is a mason. If they are, you will be able to join your fellow masons tomorrow night.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				} else {
					player.ready = true;

					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: 'You were a lost mason who is now reunited with your secret society. You can converse with your fellow masons at night.',
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			} else {
				player.ready = true;
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.data["lost mason"] && !!player.data["lost mason"].target) {
				// checks if target is mason
				if (player.data["lost mason"].target.subfactions.includes("masons")) {
					// tells masons player was reunited
					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `${player.name} was a lost mason but they found ${player.data["lost mason"].target.name} and is now a member of the masons.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});

					// tells player they were reunited
					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You checked ${player.data["lost mason"].target.name} to see if they are a mason. It turns out they were. You are now reunited with the masons.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});

					// sets player data
					player.data["lost mason"].reunited = true;

					// gives player mason permissions
					player.chatViewPermissions.push({
						name: "mason",
						start: new Date(),
						end: null
					});

					player.nightChatSendPermission = "mason";
				} else {
					// tells player target was not mason
					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You checked ${player.data["lost mason"].target.name} to see if they are a mason. Saddly, they weren't. You can try to check someone else again tonight.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}

				player.data["lost mason"].target = null;
			}
		}
	},

	lycan: {
		description: "You are an ordinary <a href=\"roles/villager.html\">villager</a>. You lack any special power, so you must use your wits to identify and vote to lynch the werewolves plaguing your town.",
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
		description: "You are a <a href=\"roles/martyr.html\">martyr</a>. During the night, you can give your life to save the life of another.",
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
								message: "You know that wouldn't do anything, right? You can't give your own life to save yourself.",
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
					player.ready = true;

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
						player.die(player, true);

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
				player.ready = false;

				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: 'You are a <a href=\"roles/martyr.html\">martyr</a>. You can protect others by using the command <c>!protect username</c>. If someone tries to kill them, you will be killed instead.',
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			} else {
				player.ready = true;
			}
		}
	},

	mason: {
		description: "You are a <a href=\"roles/mason.html\">mason</a>, a trusted member of a secret organization that meets at night. At night, you may talk with other masons.",
		value: 0,

		role: {
			name: "mason",
			seenByOthers: "mason",
			seenBySelf: "mason"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		subfactions: ["masons"],

		chatViewPermissions: ["mason"],
		chatSendPermission: "mason",

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: 'You are a <a href=\"roles/mason.html\">mason</a>. You can converse with your fellow masons at night.',
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			}
		}
	},

	"old man": {
		description: "You are an <a href=\"roles/old%20man.html\">old man</a> and don't have much time left to live. You will pass away from natural causes in three days, if you are not already dead.",
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
							message: `You are an <a href=\"roles/old%20man.html\">old man</a>. You have ${player.data["old man"].daysLeft} day${player.data["old man"].daysLeft == 1 ? "" : "s"} left to live.`,
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
								message: `You are an <a href=\"roles/old%20man.html\">old man</a>. You will die of old age tonight.`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						// kills player at morning
						player.onDayEndEvents.push(function() {
							player.die(player, true);
						});
					} else {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `You are an <a href=\"roles/old%20man.html\">old man</a>. You have ${player.data["old man"].daysLeft} days left to live.`,
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
		description: "You are a <a href=\"roles/protector.html\">protector</a>. You can protect yourself and others from being killed during the night.",
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
					player.ready = true;

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
				player.ready = false;

				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: 'You are a <a href=\"roles/protector.html\">protector</a>. You protect yourself and others using the command <c>!protect username</c>. You cannot protect the same player two nights in a row.',
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			} else {
				player.ready = true;
			}
		}
	},

	seer: {
		description: "You are a <a href=\"roles/seer.html\">seer</a>, a powerful magician. You can peer into the minds of other players and see their true nature. Be aware, however, that some roles are seen unreliably.",
		value: 2,

		role: {
			name: "seer",
			seenByOthers: "seer",
			seenBySelf: "seer"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village",
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
					player.ready = true;

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
				player.ready = false;

				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You are a <a href=\"roles/seer.html\">seer</a>. You can use the command <c>!check username</c> to check a player's faction.`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});
			} else {
				player.ready = true;
			}
		},

		onNightEndEvent: function(player) {
			// checks if target was chosen
			if (!!player.data.seer && !!player.data.seer.target) {
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `You checked ${player.data.seer.target.name}'s faction. Their faction is "${player.data.seer.target.role.faction.seenByOthers}".`,
						date: new Date(),
						permission: `user:${player.name}`
					}]
				});

				player.data.seer.target = null;
			}
		}
	},

	"silent wolf": {
		description: "You are a <a href=\"roles/silent%20wolf.html\">silent wolf</a>. Like all wolves, you can kill people at night. Unlike other wolves, however, a seer will detect you as a regular villager.",
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
						message: `You are a <a href=\"roles/silent%20wolf.html\">silent wolf</a>, a member of the wolfpack. You, and all other wolves, can use the command <c>!kill username</c> to kill a player. The wolfpack can kill ${player.game.data.wolfpack.killsAllowed} players tonight.`,
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
						player.game.data.wolfpack.targets[i].target.die(player);
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

	tanner: {
		description: "You are a <a href=\"roles/tanner.html\">tanner</a>. The village forces you to skin animals, and you hate it. Unlike other villagers, you win the game if you get voted off and hung. Dying during the night will not result in you winning.",
		value: 0,

		role: {
			name: "tanner",
			seenByOthers: "tanner",
			seenBySelf: "tanner"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		chatViewPermissions: ["village"],
		chatSendPermission: "village",

		onDeathEvent: function(player, killer) {
			// checks if tanner died by lynching
			if(killer.lynched){
				// tells players the tanner won
				player.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: `${player.name}'s limp corpse hangs from the gallows. Their neck snaps and their lower body drops to the floor like a ragdoll, leaving a severed head swinging on the rope, bearing a twisted smile. You shouldn't have hung them. The game is now over and ${player.name} won since they were a tanner and the village hung them.`,
						date: new Date(),
						permission: "village"
					}]
				});

				// ends game
				player.game.endGame();
			}
		}
	},

	traitor: {
		description: "You are a <a href=\"roles/traitor.html\">traitor</a>. The village treated you poorly and now you want to watch it burn to the ground. Every night, you conspire with the wolves, however, you cannot kill like they can.",
		value: 0,

		role: {
			name: "traitor",
			seenByOthers: "traitor",
			seenBySelf: "traitor"
		},

		faction: {
			name: "wolfpack",
			seenByOthers: "village",
			seenBySelf: "wolfpack"
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack",
	},

	vigilante: {
		description: "You are a <a href=\"roles/vigilante.html\">vigilante</a>, a skilled fighter willing to take justice in your own hands. Once per game, you may kill a player at night.",
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

					// already used power
					if (player.data.vigilante.killUsed) {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "Sorry, buddy, but you can only kill one person per game, which you already did. If you're getting bloodthirsty, cheer up, you can always vote to lynch someone during the day.",
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						// exits function
						return;
					}

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

					// valid target
					player.ready = true;

					player.data.vigilante.target = target;
					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `Tonight you will kill ${target.name}.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			}
		},

		onDayEndEvent: function(player) {
			if (player.dead == false) {
				player.ready = false;

				// sets data in player if missing
				if (!player.data.vigilante) player.data.vigilante = {
					killUsed: false,
					target: null
				};

				if (!player.data.vigilante.killUsed) {
					player.game.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							message: `You are a <a href=\"roles/vigilante.html\">vigilante</a>. You can use the command <c>!kill username</c> to kill a player. This power can only be used once per game. If the player you try to kill is protected, and as a result does not die, you still cannot use this power again.`,
							date: new Date(),
							permission: `user:${player.name}`
						}]
					});
				}
			} else {
				player.ready = true;
			}
		},

		onNightEndEvent: function(player) {
			if (!player.data.vigilante) player.data.vigilante = {
				killUsed: false,
				target: null
			};

			if (!!player.data.vigilante.target) {
				player.data.vigilante.target.die(player);
				player.data.vigilante.killUsed = true;
			}
		},
	},

	villager: {
		description: "You are an ordinary <a href=\"roles/villager.html\">villager</a>. You lack any special power, so you must use your wits to identify and kill off the werewolves plaguing your town.",
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
		description: "You are a <a href=\"roles/werewolf.html\">werewolf</a>. During the day, you are like everyone else, but at night, you transform into a bloodthirsty monster and slaughter villagers.",
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
						message: `You are a <a href=\"roles/werewolf.html\">werewolf</a>, amember of the wolfpack. You, and all other wolves, can use the command <c>!kill username</c> to kill a player. The wolfpack can kill ${player.game.data.wolfpack.killsAllowed} players tonight.`,
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
						player.game.data.wolfpack.targets[i].target.die(player);
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
		description: "You are a <a href=\"roles/wolf%20cub.html\">wolf cub</a>, a young werewolf. Like all other wolves, you can kill villagers. If you are killed, the other wolves are enraged and will be able to kill an extra person the next night.",
		value: -1,

		role: {
			name: "wolf cub",
			seenByOthers: "wolf cub",
			seenBySelf: "wolf cub"
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
						message: `You are a <a href=\"roles/wolf%20cub.html\">wolf cub</a>, amember of the wolfpack. You, and all other wolves, can use the command <c>!kill username</c> to kill a player. The wolfpack can kill ${player.game.data.wolfpack.killsAllowed} players tonight.`,
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
						message: `${player.name}, your <a href=\"roles/wolf%20cub.html\">wolf cub</a>, died. Their death has brought rage to the wolfpack. As a result, you have an extra kill tonight.`,
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
						player.game.data.wolfpack.targets[i].target.die(player);
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

function generateRoles(game) {
	const powerRoles = [roles.avenger, roles.baker, roles.gravedigger, roles.doppelgänger, roles["lost mason"], roles.martyr, roles.mason, roles.protector, roles.seer, roles.vigilante];
	const negativePowerRoles = [roles.fool, roles["old man"], roles.traitor, roles.tanner];
	const wolfRoles = [roles.bloodhound, roles.bloodletter, roles["silent wolf"], roles.werewolf, roles["wolf cub"]];
	
	let outputRoles = [];
	let outputRoleNames = [];

	// one power role for about every 3 players
	let powerRolesAmount = Math.round(game.players.length / 3);

	// one wolf for about every 5 players
	let wolvesAmount = Math.round(game.players.length / 5);

	// one negative power role for every 8 players if there are at least 10 players
	let negativePowerRolesAmount = game.players.length >= 10 ? Math.round(game.players.length / 8) : 0;

	// villagers amount is left unset since it can change
	let villagersAmount;

	// adds power roles
	for (let i = 0; i < powerRolesAmount; i++) {
		// gets random role
		let randomRole = powerRoles[Math.floor(Math.random() * powerRoles.length)];

		// removes gravedigger if roles are revealed on death (as it would be a pointless role)
		if(game.settings.revealRolesOnDeath){
			// sets randomRole to a random role until it's not gravedigger anymore
			while(randomRole.role.name == "gravedigger"){
				randomRole = powerRoles[Math.floor(Math.random() * powerRoles.length)];
			}
		}

		// adds randomRole to list of roles
		outputRoles.push(randomRole);
		outputRoleNames.push(randomRole.role.name);
	}

	// fixes lost masons but no regular masons
	if (outputRoleNames.includes("lost mason") && !outputRoleNames.includes("mason")) {
		// turns one of the lost masons into a regular mason
		let index = outputRoleNames.indexOf("lost mason");
		outputRoles[index] = roles.mason;
		outputRoleNames[index] = "mason";
	}

	// fixes only one mason
	if (outputRoleNames.filter(x => x == "mason").length == 1) {
		// 1/3 chance to add new mason (unless less than 7 players)
		if (Math.floor(Math.random() * 2) == 0 && game.players.length >= 7) {
			// increases power role amount and adds extra mason
			powerRolesAmount++;
			outputRoles.push(roles.mason);
			outputRoleNames.push("mason");
		} else {
			// gets random index of item in outputRoles
			let index = Math.floor(Math.random() * outputRoles.length);

			// makes sure it isn't the index of a mason
			while (outputRoles[index].role.name == "mason") {
				index = Math.floor(Math.random() * outputRoles.length);
			}

			// replaces role in index with a mason
			outputRoles[index] = roles.mason;
			outputRoleNames[index] = "mason";
		}
	}

	// adds wolf roles
	for (let i = 0; i < wolvesAmount; i++) {
		// gets random role
		let randomRole = wolfRoles[Math.floor(Math.random() * wolfRoles.length)];

		// adds randomRole to list of roles
		outputRoles.push(randomRole);
		outputRoleNames.push(randomRole.role.name);
	}

	// fixes wolf cub with no other wolves
	if (wolvesAmount == 1 && outputRoleNames.includes("wolf cub")){
		// gets random wolf role
		let randomRole = wolfRoles[Math.floor(Math.random() * wolfRoles.length)];

		// makes sure random wolf role isn't wolf cub
		while(randomRole.role.name == "wolf cub"){
			randomRole = wolfRoles[Math.floor(Math.random() * wolfRoles.length)];
		}

		// turns wolf cub into random role
		let index = outputRoleNames.indexOf("wolf cub");
		outputRoles[index] = randomRole;
		outputRoleNames[index] = randomRole.role.name;
	}

	// adds regular villagers
	villagersAmount = game.players.length - wolvesAmount - powerRolesAmount - negativePowerRolesAmount;

	for (let i = 0; i < villagersAmount; i++) {
		// adds villager to roles list
		outputRoles.push(roles.villager);
		outputRoleNames.push("villager");
	}

	// shuffles roles
	let newOutputRoles = [];
	let outputRolesLength = outputRoles.length;
	for(let i = 0; i < outputRolesLength; i++){
		// gets random index in roles
		let randomIndex = Math.floor(Math.random() * outputRoles.length);
		newOutputRoles.push(outputRoles[randomIndex]);
		outputRoles.splice(randomIndex, 1);
	}

	// returns output roles
	return newOutputRoles;
}

// exports roles
module.exports = {
	roles,
	generateRoles
}