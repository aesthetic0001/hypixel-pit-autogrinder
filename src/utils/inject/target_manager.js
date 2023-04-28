const {parentPort} = require('worker_threads')
const {Vec3} = require("vec3");
// health, distance, smarthealth
const sortMode = "smarthealth"
let oofed = false
function inject(bot) {
    let whitelist = new Set()
    let targetName = null
    let ticks = 0
    bot.target = null

    parentPort.on('message', ({type, data}) => {
        switch (type) {
            case "SPacketWhitelistUpdate": {
                whitelist = new Set(data)
                break;
            }
        }
    })

        bot.on(`physicsTick`, () => {
        switch (bot.statemachine.lobby) {
            case "await_drop": {
                targetName = null
                bot.target = null
                if (bot.entity.position.y < 85) {
                    bot.statemachine.lobby = "awaiting_pvp"
                    break;
                }
                if (bot.entity.position.xzDistanceTo(new Vec3(0, 0, 0)) <= 3) {
                    return bot.clearControlStates()
                }
                bot.lookAt(new Vec3(0, 80 + Math.random() * 10, 0), false)
                bot.setControlState('jump', true)
                bot.setControlState('forward', true)
                bot.setControlState('sprint',  true)
                break;
            }
            case "awaiting_pvp": {
                if (bot.entity.position.y > 85) {
                    bot.statemachine.lobby = "await_drop"
                    break;
                }
                if (bot.entity.position.xzDistanceTo(new Vec3(0, 0, 0)) >= 50 && !oofed) {
                    oofed = true
                    bot.chat(`/oof`)
                    break;
                }
                oofed = false
                // sort by health
                let proposedName
                switch (sortMode) {
                    case "health": {
                        const lowestHealth = {
                            health: Infinity,
                            username: null
                        }
                        Object.values(bot.players).forEach((player) => {
                            if (!player?.entity) return
                            const {username, dead, position, health} = player.entity
                            if (Math.abs(bot.entity.position.y - position.y) <= 2 && !whitelist.has(username) && !dead && position.y <= 85 && position.distanceTo(bot.entity.position) <= 5 && position.xzDistanceTo(new Vec3(0, 0, 0)) <= 50) {
                                if (health < lowestHealth.health) {
                                    lowestHealth.health = player.health
                                    lowestHealth.username = username
                                }
                                return true
                            }
                        })
                        if (!lowestHealth.username) {
                            proposedName = bot.nearestEntity((entity) => {
                                const {type, username, dead, position} = entity
                                if (Math.abs(bot.entity.position.y - position.y) <= 2 && type === "player" && !whitelist.has(username) && !dead && position.y <= 85 && position.xzDistanceTo(new Vec3(0, 0, 0)) <= 50) {
                                    return true
                                }
                            })?.username
                        } else proposedName = lowestHealth.username
                        break;
                    }
                    case "smarthealth": {
                        const lowestHealth = {
                            health: Infinity,
                            username: null
                        }
                        Object.values(bot.players).forEach((player) => {
                            if (!player?.entity) return
                            const {username, dead, position, health} = player.entity
                            if (Math.abs(bot.entity.position.y - position.y) <= 2 && !whitelist.has(username) && !dead && position.y <= 85 && position.distanceTo(bot.entity.position) <= 5 && position.xzDistanceTo(new Vec3(0, 0, 0)) <= 50) {
                                if (health < lowestHealth.health && health < 12) {
                                    lowestHealth.health = player.health
                                    lowestHealth.username = username
                                }
                                return true
                            }
                        })
                        if (!lowestHealth.username) {
                            proposedName = bot.nearestEntity((entity) => {
                                const {type, username, dead, position} = entity
                                if (Math.abs(bot.entity.position.y - position.y) <= 2 && type === "player" && !whitelist.has(username) && !dead && position.y <= 85 && position.xzDistanceTo(new Vec3(0, 0, 0)) <= 50) {
                                    return true
                                }
                            })?.username
                        } else proposedName = lowestHealth.username
                        break;
                    }
                    case "distance": {
                        proposedName = bot.nearestEntity((entity) => {
                            const {type, username, dead, position} = entity
                            if (Math.abs(bot.entity.position.y - position.y) <= 2 && type === "player" && !whitelist.has(username) && !dead && position.y <= 85 && position.xzDistanceTo(new Vec3(0, 0, 0)) <= 50) {
                                return true
                            }
                        })?.username
                        break;
                    }
                }
                if (proposedName) {
                    if (!targetName) {
                        targetName = proposedName
                        break;
                    }
                    if (proposedName !== targetName) {
                        ticks++
                        if (ticks >= 5 || bot.target.position.distanceTo(bot.entity.position) >= 6) {
                            targetName = proposedName
                            ticks = 0
                        }
                    } else ticks = 0
                } else {
                    targetName = null
                    bot.target = null
                    ticks = 0
                }
                break;
            }
            default: {
                targetName = null
                bot.target = null
                break;
            }
        }
    })

    bot.on('physicsTick', () => {
        if (!targetName) return bot.target = null
        bot.target = bot.nearestEntity((entity) => {
            const {type, username, dead} = entity
            if (type === "player" && username === targetName && !dead) {
                return true
            }
        })
    })

    bot.on('entityDead', (entity) => {
        if (entity?.username === targetName) {
            targetName = null
            bot.target = null
        }
        entity.dead = true
        delete bot.entities[entity.id]
    })

    bot.on('entityGone', (entity) => {
        if (entity?.username === targetName) {
            targetName = null
            bot.target = null
        }
        entity.dead = true
        delete bot.entities[entity.id]
    })
}

module.exports = {
    inject
}
