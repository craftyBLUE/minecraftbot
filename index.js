const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalNear } = require('mineflayer-pathfinder').goals;
const inventoryViewer = require('mineflayer-web-inventory');
const autoeat = require("mineflayer-auto-eat");
const armorManager = require('mineflayer-armor-manager');

const bot = mineflayer.createBot({
    host: 'Kruh.aternos.me',
    port: 45886,
    username: 'Duck_1',
    version: '1.18.2'
});

function _round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

bot.loadPlugin(autoeat);
bot.loadPlugin(armorManager);

inventoryViewer(bot);
console.log('Bot inventory viewer started at: http://localhost:3000/');

bot.loadPlugin(pathfinder);

bot.once('spawn', () => {
    bot.autoEat.options = {
        priority: 'foodPoints',
        startAt: 18,
        bannedFood: []
    };
});

bot.on("autoeat_started", () => {
    bot.chat("Hasam!");
})

bot.on("autoeat_stopped", () => {
    bot.chat("Gotov has!");
})

bot.once('spawn', () => {
    bot.chat('Pozz');
    mcData = require('minecraft-data')(bot.version);

    const defaultMove = new Movements(bot);

    bot.on('chat', (username, message) => {
        let args = message.split(' ');

        if (username === bot.username) return;

        const target = bot.players[username] ? bot.players[username].entity : null;

        switch (args[0]) {
            case 'come':
                if (!target) {
                    bot.chat('I don\'t see you !');
                    return;
                }
                const p = target.position;

                bot.pathfinder.setMovements(defaultMove);
                bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));

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
                bot.pathfinder.setMovements(defaultMove);
                bot.pathfinder.setGoal(new GoalNear(goalX, goalY, goalZ, 0));

                ////// 'goto'
                break;

            case 'stop':
                bot.pathfinder.stop();

                ////// 'stop'
                break;

            case 'health':
                bot.chat(`Health[${_round(bot.health)}], Food[${_round(bot.food)}], Saturation[${_round(bot.foodSaturation)}]`);

                ////// 'health'
                break;

            case 'armor':
                bot.armorManager.equipAll();

                ////// 'health'
                break;

            case 'pos':
                bot.chat(Math.round(bot.entity.position.x) + ' ' + Math.round(bot.entity.position.y) + ' ' + Math.round(bot.entity.position.z));

                ////// 'pos'
                break;


            case 'chest':
                let chestX = parseInt(args[1]);
                let chestY = parseInt(args[2]);
                let chestZ = parseInt(args[3]);
                console.log(chestX + ' ' + chestY + ' ' + chestZ)
                bot.pathfinder.setMovements(defaultMove);
                bot.pathfinder.goto(new GoalNear(chestX, chestY, chestZ, 0), () => {
                    console.log('at chest');

                    let chest = bot.findBlock({
                        matching: mcData.blocksByName.chest.id,
                        maxDistance: 2
                    });

                    bot.openContainer(chest);

                });




                ////// 'chest'
                break;


        }

    });
});

let lastHealthInfo = { lastHealth: 20, lastFood: 20, lastSaturation: 20 }

bot.on('health', () => {
    if (bot.food === 20) {
        bot.autoEat.disable(); // Disable the plugin if the bot is at 20 food points
    } else { bot.autoEat.enable(); } // Else enable the plugin again

    if (lastHealthInfo.lastHealth !== Math.round(bot.health) ||
        lastHealthInfo.lastFood !== Math.round(bot.food) ||
        lastHealthInfo.lastSaturation !== Math.round(bot.foodSaturation)
    ) {
        lastHealthInfo.lastHealth = Math.round(bot.health);
        lastHealthInfo.lastFood = Math.round(bot.food);
        lastHealthInfo.lastSaturation = Math.round(bot.foodSaturation);
        bot.chat(`Health[${_round(bot.health)}], Food[${_round(bot.food)}], Saturation[${_round(bot.foodSaturation)}]`);
    }
});