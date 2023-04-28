const Item = require('prismarine-item')("1.8.9")
const {workerData, parentPort} = require('worker_threads')
const {sleep} = require("../time");
const {Vec3} = require("vec3");
const {log} = require("../log");
const partyChatRegex = /Party > (?:\[.*] )?(.*): (.*)/
const owner = "YourUsername"
const valuables = new Set(["cactus", "minecart", "leather_leggings", "leather_helmet", "golden_sword"])
let isTrading = false
let actionId, windowId

function inject(bot) {
    bot.addChatPattern('partychat', partyChatRegex, {parse: true})

    bot.on('windowOpen', (window) => {
        actionId = 0
        windowId = window.id
    })

    bot.on('spawn', () => {
        bot.windowId = 0
    })

    function findValuables(window) {
        const returned = []
        for (const item of window.slots) {
            if (item && valuables.has(item.name)) returned.push(item.slot)
        }
        return returned
    }

    bot.windowClick = (slot, mouseButton = 0) => {
        const window = bot.currentWindow || bot.inventory
        actionId = (actionId === 32767) ? 1 : actionId + 1
        // we send the packet ourselves because clickWindow awaits an update, causing a memory leak
        bot._client.write('window_click', {
            windowId: window.id,
            slot,
            mouseButton,
            action: actionId,
            mode: 0,
            item: Item.toNotch(window.slots[slot])
        })
    }

    async function executeCommand(command) {
        switch (command) {
            case "stop": {
                bot.statemachine.lobby = "stopped"
                bot.chat(`/oof`)
                break;
            }
            case "start": {
                bot.statemachine.lobby = "await_drop"
                break;
            }
            case "inventory": {
                const items = {}
                bot.inventory.items().forEach((item) => {
                    if (item) {
                        if (!items[item.name]) items[item.name] = 0
                        items[item.name] += item.count
                    }
                })
                const itemString = []
                Object.keys(items).forEach((name) => {
                    itemString.push(`${items[name]}x ${name}`)
                })
                bot.chat(`/pc ${itemString.join(", ")}`)
                break;
            }
            case "follow": {
                bot.statemachine.lobby = "follow"
                break;
            }
            case "stop_follow": {
                bot.statemachine.lobby = "stopped"
                break;
            }
            case "trade_all": {
                if (isTrading) return
                if (bot.statemachine.lobby !== "stopped") {
                    await executeCommand("stop")
                }
                await sleep(5000)
                if (findValuables(bot.inventory).length === 0) {
                    bot.chat(`/pc I don't have any valuables to trade`)
                    break;
                }
                console.log(`Trading with ${owner} in ${workerData.index * 10000}ms`)
                await sleep(workerData.index * 10000)
                bot.chat(`/trade ${owner}`)
                isTrading = true
                break;
            }
            case "level_up": {
                if (bot.statemachine.lobby !== "stopped") {
                    executeCommand("stop")
                }
                await sleep(5000)
                log(`Walking to villager`)
                bot.statemachine.lobby = "upgrades"
                break;
            }
            case "prestige": {
                if (bot.statemachine.lobby !== "stopped") {
                    executeCommand("stop")
                }
                await sleep(5000)
                log(`Walking to villager`)
                bot.statemachine.lobby = "prestige"
                break;
            }
        }
    }

    bot.on(`chat:partychat`, async (match) => {
        if (match[0][0] !== "YourUsername") return
        executeCommand(match[0][1])
    })

    parentPort.on('message', ({type, data}) => {
        if (type === "command") {
            executeCommand(data)
        }
    })

    let perkSlot = 1

    bot.on(`windowOpen`, async (window) => {
        const title = JSON.parse(window.title).extra[0].text
        if (title === "Prestige & Renown") {
            bot.windowClick(11)
            await sleep(7500)
            bot.windowClick(11)
        }
        if (title === "You                  Other") {
            const items = findValuables(window)
            for (const slot of items) {
                console.log(`Trading ${window.slots[slot].name} [${slot}]`)
                bot.windowClick(slot)
                await sleep(300)
            }
            bot.once('windowClose', () => {
                isTrading = false
            })
            await sleep(5000)
            bot.windowClick(21)
            bot.statemachine.lobby = "await_drop"
        }
        if (title === "Permanent upgrades") {
            // todo: reduce to loop once it works
            if (window.slots[12].name === "diamond_block") {
                // console.log(`Upgrading perks slots 1`)
                perkSlot = 1
                return bot.windowClick(12)
            }
            if (window.slots[13].name === "diamond_block") {
                // console.log(`Upgrading perks slots 2`)
                perkSlot = 2
                return bot.windowClick(13)
            }
            if (window.slots[14].name === "diamond_block") {
                // console.log(`Upgrading perks slots 3`)
                perkSlot = 3
                return bot.windowClick(14)
            }
            // console.log(`Upgrading perks slots done. Upgrading perks`)
            // more reliable way to do this
            bot.windowClick(28)
            await sleep(2500)
            bot.windowClick(30)
            await sleep(2500)
            bot.windowClick(34)
            await sleep(2500)
            bot.closeWindow(window)
            log(`Upgrading perks done.`)
            bot.statemachine.lobby = "await_drop"
        }
        if (title === "Are you sure?") {
            bot.windowClick(11)
        }
        if (title === "Choose a perk") {
            if (perkSlot === 1) {
                bot.windowClick(10)
                perkSlot = 2
            }
            if (perkSlot === 2) {
                bot.windowClick(14)
                perkSlot = 3
            }
            if (perkSlot === 3) {
                bot.windowClick(13)
                perkSlot = 4
            }
        }
    })

    bot.on(`upgrades`, async () => {
        const upgradesVillager = bot.nearestEntity((entity) => {
            if (entity.position.xzDistanceTo(new Vec3(-1, 114, 12)) <= 2 && entity.name === "Villager") {
                return true
            }
        })
        if (upgradesVillager) {
            await bot.smoothLook.lookAt(upgradesVillager.position.offset(0, 1.6, 0), 500)
            bot.once('windowOpen', () => {
                console.log(`Perks Window Opened`)
                setTimeout(() => {
                    bot.closeWindow(bot.currentWindow)
                    bot.statemachine.lobby = "await_drop"
                }, 30000)
            })
            bot.attack(upgradesVillager)
        }
    })

    bot.on(`prestige`, async () => {
        const prestigeVillager = bot.nearestEntity((entity) => {
            if (entity.position.xzDistanceTo(new Vec3(0, 115, -11)) <= 2 && entity.name === "Villager") {
                return true
            }
        })
        if (prestigeVillager) {
            await bot.smoothLook.lookAt(prestigeVillager.position.offset(0, 1.6, 0), 500)
            bot.once('windowOpen', () => {
                console.log(`Prestige Window Opened`)
            })
            bot.attack(prestigeVillager)
        }
    })
}

module.exports = {
    inject
}
