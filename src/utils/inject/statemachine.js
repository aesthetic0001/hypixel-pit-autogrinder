function inject(bot) {
    bot.statemachine = {}
    const {statemachine} = bot
    statemachine.lobby = "awaiting_locraw"
    statemachine.pvp = null
}

module.exports = {
    inject
}
