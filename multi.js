const mineflayer = require("mineflayer");
const {
    pathfinder, Movements, 
    goals: {
        GoalNear, GoalBlock, GoalFollow, GoalInvert
    }
} = require("mineflayer-pathfinder");
const collectBlock = require("mineflayer-collectblock").plugin;

let botArgs = {
    host: "185.137.94.75",
    port: 25568,
    version: "1.18.2"
}

function _round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

//multi bots

//chat and whisper
function reply(bot, username, message) {
    switch (bot.reply) {
        case "forceWhisper":
            bot.whisper(bot.master, message);
            break;

        case "whisper":
            if (username) {
                bot.whisper(username, message);
            }
            else {
                bot.chat(message);
            }
            break;

        case "chat":
            bot.chat(message);
            break;

        default:
            console.log(username);
            console.log(message);
            console.log("---");
    }
}

async function command(bot, defaultMove, username, args) {

    /*console.log("---");
    console.log(bot.username);
    console.log(username);
    console.log(args);
    console.log("---");*/

    if (bot.master) {
        if (username != bot.master) {
            //console.log(bot.username, ":", username, " is not ", bot.master);
            return;
        }
    }

    const target = bot.players[username] ? bot.players[username].entity : null;

    bot.lastRunCommand = args;
    bot.lastRunCommandAuthor = username;

    try {
        switch (args[0]) {
            case "master":
                bot.master = args[1];

                reply(bot, username, "Transfering ownership...");
                reply(bot, bot.master, "Hello my new master");
                
                break;

            case "come":
                if (!target) {
                    reply(bot, username, "I can\'t see you!");
                    return;
                }
                const p = target.position;

                bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));

                break;
            
            case "spread":
                if (!target) {
                    reply(bot, username, "I can\'t see you!");
                    return;
                }
                const ps = target.position;

                if (!args[1]) return;

                bot.pathfinder.setGoal(new GoalInvert(new GoalNear(ps.x, ps.y, ps.z, args[1])));

                break;
            
            case "follow":
                if (!target) {
                    reply(bot, username, "I can\'t see you!");
                    return;
                }
                bot.pathfinder.setGoal(new GoalFollow(target, 3), true);

                break;

            case "goto":
                let goalX = parseInt(args[1]);
                let goalY = parseInt(args[2]);
                let goalZ = parseInt(args[3]);
                if (!goalZ)
                    return;
                if (!goalY)
                    return;
                if (!goalX)
                    return;
                bot.pathfinder.setGoal(new GoalNear(goalX, goalY, goalZ, 0));

                break;

            case "stop":
                bot.pathfinder.stop();

                break;

            case "health":
                reply(bot, username, `Health[${_round(bot.health)}], Food[${_round(bot.food)}], Saturation[${_round(bot.foodSaturation)}]`);

                break;

            case "pos":
                reply(bot, username, Math.round(bot.entity.position.x) + " " + Math.round(bot.entity.position.y) + " " + Math.round(bot.entity.position.z));

                break;
            
            case "chest":
                let chestX = parseInt(args[1]);
                let chestY = parseInt(args[2]);
                let chestZ = parseInt(args[3]);
                reply(bot, username, chestX + " " + chestY + " " + chestZ)
                bot.pathfinder.setMovements(defaultMove);
                bot.pathfinder.goto(new GoalNear(chestX, chestY, chestZ, 1)).then(() => {
                    reply(bot, username, "at chest");

                    let chest = bot.findBlock({
                        matching: bot.mcData.blocksByName.chest.id,
                        maxDistance: 2
                    });

                    bot.openContainer(chest);

                });

                break;
            
            case "echo":
                message = "";
                for (let i = 1; i < args.length; i++) {
                    message += args[i] + " ";
                }
                reply(bot, username, message);

                break;

            case "reply":
                if (args[1]) bot.reply = args[1];
                break;
            
            case "debug":
                bot.debugEnabled = args[1];
                break;
            
            case "quit":
                reply(bot, username, "Goodbye!");
                bot.quit();
                break;
            
            case "add":
                let name = args[1];
                if (!name) name = "Bot_" + bots.length;
                bots.push(new MCBot(name, bot.master));
                break;
            
            case "pathfinder":
                switch (args[1]) {
                    case "refresh":
                        bot.pathfinder.setMovements(defaultMove);
                }
                break;

            case "collect":
                const blockType = bot.mcData.blocksByName[args[1]];
                if (!blockType) return;

                let count = parseInt(args[2]);
                if (!count) return;

                const blocks = bot.findBlocks({
                    matching: blockType.id,
                    maxDistance: bot.blockSearchRadius,
                    count: count
                });

                if (blocks.length == 0) {
                    reply(bot, username, "I can't find that block");
                    return;
                }

                count = Math.min(blocks.length, count);

                const blocksToMine = [];
                for (let i = 0; i < count; i++) {
                    blocksToMine.push(bot.blockAt(blocks[i]));
                }

                reply(bot, username, "Found " + blocksToMine.length);

                await bot.collectBlock.collect(blocksToMine);
                reply(bot, username, "Mined");
                break;
        }
    } catch (err) {
        await bot.pathfinder.stop();
        reply(bot, username, err.message);
        reply(bot, username, "Last run command was \"" + bot.lastRunCommand.join(" ") + "\" by: " + bot.lastRunCommandAuthor + ". Retrying...");
        command(bot, defaultMove, bot.lastRunCommandAuthor, bot.lastRunCommand);
    }
}

class MCBot {

    constructor(username, master) {
        this.username = username;
        this.host = botArgs["host"];
        this.port = botArgs["port"];
        this.version = botArgs["version"];

        this.master = master;

        this.initBot();
    }

    initBot() {
        this.bot = mineflayer.createBot({
            "username": this.username,
            "host": this.host,
            "port": this.port,
            "version": this.version
        });

        this.bot.master = this.master;
        this.bot.reply = "chat";
        this.bot.debugEnabled = false;
        this.bot.blockSearchRadius = 64;
        this.bot.lastRunCommand = [];
        this.bot.lastRunCommandAuthor = "";

        this.initEvents();
    }

    initEvents() {
        this.bot.loadPlugin(pathfinder);
        this.bot.loadPlugin(collectBlock);

        this.bot.once("spawn", () => {
            reply(this.bot, "", "I am " + this.bot.username);

            const defaultMove = new Movements(this.bot); //doesn't work when made to be this.bot.defaultMove; todo: fix
            this.bot.mcData = require("minecraft-data")(this.bot.version);

            this.bot.pathfinder.setMovements(defaultMove);

            this.bot.on("whisper", (username, message) => {
                let args = message.split(" ");

                if (username === this.bot.username) return;

                command(this.bot, defaultMove, username, args);

            });

            this.bot.on("chat", (username, message) => {
                let args = message.split(" ");

                if (username === this.bot.username) return;

                command(this.bot, defaultMove, username, args);

            });
        });

        this.bot.on("goal_reached", () => {
            if (this.bot.debugEnabled) reply(this.bot, "", "Goal reached");
        });

        this.bot.on("path_reset", (reason) => {
            if (this.bot.debugEnabled) reply(this.bot, "", "path reset: " + reason);
            switch (reason) {
                case "stuck":
                    this.bot.pathfinder.stop();

                    reply(this.bot, "", "stuck: ");
                    reply(this.bot, "", "Last run command was \"" + this.bot.lastRunCommand.join(" ") + "\" by: " + this.bot.lastRunCommandAuthor + ". Retrying...");
                    
                    const defaultMove = new Movements(this.bot);

                    command(this.bot, defaultMove, this.bot.lastRunCommandAuthor, this.bot.lastRunCommand);

                default:
                    break;
            }
        });

        /*this.bot.on('path_update', (r) => {
            const nodesPerTick = (r.visitedNodes * 50 / r.time).toFixed(2)
            reply(this.bot, "", "I can get there in " + r.path.length + " moves. Computation took " + r.time.toFixed(2) + " ms ( " + r.visitedNodes + " nodes, " + nodesPerTick + " nodes/tick)")
        });*/

        this.bot.on("path_stop", () => {
            if (this.bot.debugEnabled) reply(this.bot, "", "Stopped!");
        });
    }
}

let bots = [];
for (let i = 0; i < 1; i++) {
    bots.push(new MCBot("Bot_"+ i, ""));
}