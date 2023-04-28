const {sleep} = require("../time");
const {log} = require("../log");
const {Vec3} = require("vec3");
const locraw = /{"server":"([a-zA-Z\d]*)"(,"gametype":"([a-zA-Z]*)",)?("mode":"([a-zA-Z_\d]*)",)?(.*)?}/
const local = false

function inject(bot) {
    if (local) return
    const {statemachine} = bot
    bot.addChatPattern('locraw', locraw, {parse: true})

    bot.command = (cmd, retries = 0) => {
        // do a command that will trigger a spawn event
        if (retries > 3) {
            log(`Command failed: ${cmd}`)
            return
        }
        let timeout = setTimeout(() => {
            bot.removeListener('spawn', onSpawn)
            bot.removeListener('login', onSpawn)
            log(`Command timed out: ${cmd}`)
            bot.command(cmd, retries + 1)
        }, 10000)

        function onSpawn() {
            clearTimeout(timeout)
        }

        bot.chat(cmd)
        bot.once('spawn', onSpawn)
        bot.once('login', onSpawn)
    }

    bot.on('spawn', async () => {
        statemachine.lobby = "awaiting_locraw"
        await sleep(2000)
        bot.chat('/locraw')
    })

    bot.on('messagestr', (msg) => {
        if (msg.includes("YourUsername has invited you to join their party!")) {
            bot.chat('/p accept YourUsername')
        }
    })

    bot.on('chat:locraw', async (match) => {
        const server = match[0][0]
        await sleep(2000)
        switch (server) {
            case "limbo": {
                bot.command('/l')
                break;
            }
            default: {
                const gametype = match[0][2]
                switch (gametype) {
                    case "PIT": {
                        statemachine.lobby = "await_drop"
                        // bot.chat(`/pickupstash`)
                        const possibleTargets = Object.values(bot.players).filter((player) => {
                            if (!player?.entity) return
                            const {dead, position} = player.entity
                            if (!dead && position.y <= 85 && position.xzDistanceTo(new Vec3(0, 0, 0)) <= 50) {
                                return true
                            }
                        }).length
                        if (possibleTargets <= 8) {
                            log(`Too few targets: ${possibleTargets}`)
                            bot.chat(`/play pit`)
                        } else {
                            log(`Enough targets: ${possibleTargets}`)
                        }
                        break;
                    }
                    default: {
                        await sleep(Math.random() * 500 + 200)
                        bot.command('/play pit')
                        break;
                    }
                }
                break;
            }
        }
    })
}

module.exports = {
    inject
}
