const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalNear } = require('mineflayer-pathfinder').goals;

let botArgs = {
    host: 'localhost',
    port: 25565,
    version: '1.18.2'
}

function _round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

//multi bots

//chat and whisper
function reply(bot, username, message) {
    if (username) {
        bot.whisper(username, message);
    }
    else {
        bot.chat(message);
    }
}

function command(bot, mcData, defaultMove, username, args) {
    const target = bot.players[username] ? bot.players[username].entity : null;

    switch (args[0]) {
        case 'come':
            if (!target) {
                reply(bot, username, 'I can\'t see you!');
                return;
            }
            const p = target.position;

            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));

            break;

        case 'goto':
            let goalX = parseInt(args[1]);
            let goalY = parseInt(args[2]);
            let goalZ = parseInt(args[3]);
            if (!goalZ)
                return;
            if (!goalY)
                return;
            if (!goalX)
                return;
            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.setGoal(new GoalNear(goalX, goalY, goalZ, 0));

            break;

        case 'stop':
            bot.pathfinder.stop();

            break;

        case 'health':
            reply(bot, username, `Health[${_round(bot.health)}], Food[${_round(bot.food)}], Saturation[${_round(bot.foodSaturation)}]`);

            break;

        case 'pos':
            reply(bot, username, Math.round(bot.entity.position.x) + ' ' + Math.round(bot.entity.position.y) + ' ' + Math.round(bot.entity.position.z));

            break;
        
        case 'chest':
            let chestX = parseInt(args[1]);
            let chestY = parseInt(args[2]);
            let chestZ = parseInt(args[3]);
            console.log(chestX + ' ' + chestY + ' ' + chestZ)
            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.goto(new GoalNear(chestX, chestY, chestZ, 1)).then(() => {
                console.log('at chest');

                let chest = bot.findBlock({
                    matching: mcData.blocksByName.chest.id,
                    maxDistance: 2
                });

                bot.openContainer(chest);

            });

            break;
        
            case 'echo':
                message = "";
                for (let i = 1; i < args.length; i++) {
                    message += args[i] + " ";
                }
                reply(bot, username, message);
                reply(bot, "", message);

                break;
    }
}

class MCBot {

    constructor(username) {
        this.username = username;
        this.host = botArgs["host"];
        this.port = botArgs["port"];
        this.version = botArgs["version"];

        this.initBot();
    }

    initBot() {
        this.bot = mineflayer.createBot({
            "username": this.username,
            "host": this.host,
            "port": this.port,
            "version": this.version
        });

        this.initEvents();
    }

    initEvents() {
        this.bot.loadPlugin(pathfinder);

        this.bot.once('spawn', () => {
            this.bot.chat('I am ' + this.bot.username);

            const defaultMove = new Movements(this.bot);
            this.mcData = require('minecraft-data')(this.bot.version);

            this.bot.on('whisper', (username, message) => {
                let args = message.split(' ');

                if (username === this.bot.username) return;

                command(this.bot, this.mcData, defaultMove, username, args);

            });
        });
    }
}

let bots = [];
for (var i = 0; i < 3; i++) {
    bots.push(new MCBot('Bot_'+ i));
}