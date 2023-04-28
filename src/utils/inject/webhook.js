const {LogData, log} = require("../log");
const levelup = /PIT LEVEL UP! (\[\d+]) ➟ (\[\d+])/
let lastAutoPerk = 0

function inject(bot) {
    const bounty = `BOUNTY CLAIMED! \[\d+] ${bot._client.username} killed \[\d+] (.*) for (.*)g`
    // create regex pattern for bounty
    bot.addChatPattern('bounty', new RegExp(bounty), {parse: true})
    bot.addChatPattern('levelup', levelup, {parse: true})

    bot.on('chat:levelup', (match) => {
        log(new LogData(`Level up from ${match[0][0]} to ${match[0][1]}!`, `success`))
        bot.hook.sendEmbedded(`Level up`, `\`${bot._client.username}\` has leveled up from \`${match[0][0]}\` to \`${match[0][1]}\`!`, "#eed139")
        if (match[0][1] === "120") {
            // log(new LogData(`Auto Prestiging`, `success`))
            // bot.hook.sendEmbedded(`Auto Prestiging`, `\`${bot._client.username}\` is prestiging!`, "#39e8ee")
            // bot.emit(`chat:partychat`, [["YourUsername", "prestige"]])
        }
    })

    bot.on('chat:bounty', (match) => {
        log(new LogData(`Claimed ${match[0][1]} bounty from ${match[0][0]}!`, `success`))
        bot.hook.sendEmbedded(`Bounty Claimed`, `\`${bot._client.username}\` has claimed a \`${match[0][1]}\` bounty from \`${match[0][0]}\`!`, "#ee39a0")
    })

    // bot.on(`gold`, (gold) => {
    //     if (gold >= 25000 && Date.now() - lastAutoPerk > 1200000) {
    //         bot.once('windowOpen', async () => {
    //             console.log(`Perks Window Opened`)
    //             await sleep(1000)
    //             bot.emit(`chat:partychat`, [["YourUsername", "level_up"]])
    //             await sleep(1000)
    //             bot.emit(`chat:partychat`, [["YourUsername", "level_up"]])
    //             await sleep(1000)
    //             bot.emit(`chat:partychat`, [["YourUsername", "level_up"]])
    //         })
    //         log(new LogData(`Auto Perking`, `success`))
    //         bot.hook.sendEmbedded(`Auto Perking`, `\`${bot._client.username}\` is auto adding perks.`, "#39ee57")
    //         bot.emit(`chat:partychat`, [["YourUsername", "level_up"]])
    //         lastAutoPerk = Date.now()
    //     }
    // })

    // todo: auto shop

    setInterval(() => {
        if (Object.keys(bot?.scoreboard).length > 0) {
            if (bot.scoreboard['1']?.itemsMap) {
                for (const key of Object.keys(bot.scoreboard['1'].itemsMap)) {
                    const itemMap = bot.scoreboard['1'].itemsMap[key]
                    if (itemMap.displayName.toString().includes('Gold: ')) {
                        const parts = []
                        for (const MsgClass of itemMap.displayName.extra) {
                            if (!isNaN(parseInt(MsgClass.text.replace(/,/g, '').replaceAll('g', '')))) {
                                parts.push(MsgClass.text.replace(/,/g, '').replaceAll('g', ''))
                            }
                        }
                        bot.gold = parseInt(parts.join(''))
                        bot.emit(`gold`, bot.gold)
                    }
                }
            }
        }
    }, 1000)
}

module.exports = {
    inject
}
