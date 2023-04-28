const owner = "YourUsername"
const {Vec3} = require("vec3");
const movement = require("mineflayer-movement")

function inject(bot) {
    bot.loadPlugin(movement.plugin)
    bot.movement.heuristic.register('distance')
    bot.movement.heuristic.register('danger')
    bot.movement.heuristic.register('proximity')
    bot.movement.heuristic.register('conformity')

    function angleBetween(targetPos) {
        const botLookVector = new Vec3(-Math.sin(bot.entity.yaw), 0, -Math.cos(bot.entity.yaw));
        const targetVector = targetPos.minus(bot.entity.position).normalize();
        return Math.acos(botLookVector.dot(targetVector)) * (180 / Math.PI);
    }

    bot.on(`physicsTick`, () => {
        switch (bot.statemachine.lobby) {
            case "follow": {
                if (bot.players[owner]?.entity?.position && bot.entity.position.distanceTo(bot.players[owner].entity.position) > 5) {
                    bot.setControlState('forward', true)
                    bot.setControlState('sprint', true)
                    bot.smoothLook.lookAt(bot.players[owner].entity.position.offset(0, 1.3 + Math.random() * 0.1, 0), 200)
                }
                break;
            }
            case "upgrades": {
                if (bot.entity.position.distanceTo(new Vec3(-1, 114, 12)) <= 3) {
                    console.log(`Arrived at upgrades villager`)
                    bot.statemachine.lobby = "arrived_at_upgrade"
                    bot.emit(`upgrades`)
                    return bot.clearControlStates()
                } else {
                    bot.movement.heuristic.get('proximity')
                        .target(new Vec3(-1, 114, 12))

                    // move towards the nearest entity
                    const yaw = bot.movement.getYaw(160, 15, 2)
                    bot.movement.steer(yaw, false)
                    bot.setControlState('forward', true)
                    bot.setControlState('sprint', true)
                }
                break;
            }
            case "prestige": {
                if (bot.entity.position.distanceTo(new Vec3(0, 115, -11)) <= 3) {
                    console.log(`Arrived at prestige villager`)
                    bot.statemachine.lobby = "arrived_at_upgrade"
                    bot.emit(`prestige`)
                    return bot.clearControlStates()
                } else {
                    bot.movement.heuristic.get('proximity')
                        .target(new Vec3(0, 115, -11))

                    // move towards the nearest entity
                    const yaw = bot.movement.getYaw(160, 15, 2)
                    bot.movement.steer(yaw, false)
                    bot.setControlState('forward', true)
                    bot.setControlState('sprint', true)
                }
                break;
            }
            case "stopped": {
                return bot.clearControlStates()
            }
        }
        if (!bot.target) {
            return
        }
        switch (bot.statemachine.pvp) {
            case "melee": {
                bot.smoothLook.lookAt(bot.target.position.offset(0, 1.45, 0), angleBetween(bot.target.position) / 30 * (200) + Math.random() * (angleBetween(bot.target.position) / 30 * (300)))
                bot.setControlState('jump', true)
                bot.setControlState('forward', true)
                bot.setControlState('sprint', true)
                break;
            }
        }
    })
}

module.exports = {
    inject
}
