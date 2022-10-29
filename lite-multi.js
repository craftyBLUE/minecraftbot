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

        this.bot.on('spawn', () => {
            this.bot.chat('I am ' + this.bot.username);

            const defaultMove = new Movements(this.bot);
            this.mcData = require('minecraft-data')(this.bot.version);

            this.bot.on('whisper', (username, message) => {
                let args = message.split(' ');

                if (username === this.bot.username) return;

                const target = this.bot.players[username] ? this.bot.players[username].entity : null;

                switch (args[0]) {
                    case 'come':
                        if (!target) {
                            this.bot.chat('I don\'t see you !');
                            return;
                        }
                        const p = target.position;

                        this.bot.pathfinder.setMovements(defaultMove);
                        this.bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));

                        ////// 'come'
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
                        this.bot.pathfinder.setMovements(defaultMove);
                        this.bot.pathfinder.setGoal(new GoalNear(goalX, goalY, goalZ, 0));

                        ////// 'goto'
                        break;

                    case 'stop':
                        this.bot.pathfinder.stop();

                        ////// 'stop'
                        break;

                    case 'health':
                        this.bot.chat(`Health[${_round(this.bot.health)}], Food[${_round(this.bot.food)}], Saturation[${_round(this.bot.foodSaturation)}]`);

                        ////// 'health'
                        break;

                    case 'pos':
                        this.bot.chat(Math.round(this.bot.entity.position.x) + ' ' + Math.round(this.bot.entity.position.y) + ' ' + Math.round(this.bot.entity.position.z));

                        ////// 'pos'
                        break;
                }

            });
        });
    }
}

let bots = [];
for (var i = 0; i < 3; i++) {
    bots.push(new MCBot('Bot_'+ i));
}