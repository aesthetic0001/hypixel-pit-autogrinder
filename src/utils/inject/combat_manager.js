const {performance} = require('perf_hooks')
const botWalkSpeed = 0.98
const botSprintSpeed = 1.3

let lastSwing = performance.now()
let lastHeal = performance.now()

function inject(bot) {
    bot.on(`physicsTick`, async () => {
        if (!bot.target) return
        const goldenHead = bot.inventory.items().find(item => item.name.includes('skull') || item.type === 397)
        bot.statemachine.pvp = bot.health <= 12 && goldenHead && performance.now() - lastHeal > 150 ? "heal" : "melee"
        switch (bot.statemachine.pvp) {
            case "heal": {
                lastHeal = performance.now()
                bot.setQuickBarSlot(goldenHead?.slot - 36)
                bot.rightClick()
                break;
            }
            case "melee": {
                // find sword
                const sword = bot.inventory.items().find(item => item.name.includes('sword') && item.slot >= 36)
                bot.setQuickBarSlot(sword?.slot - 36)
                if (bot.canAttack(bot.target)) {
                    bot.physics.sprintSpeed = botWalkSpeed
                    bot.attack(bot.target)
                } else {
                    bot.physics.walkSpeed = botSprintSpeed
                    if (bot.entity.position.distanceTo(bot.target.position) <= 8 && performance.now() - lastSwing >= 100 + Math.floor(Math.random() * 200)) {
                        bot.swingArm('left')
                        lastSwing = performance.now()
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
