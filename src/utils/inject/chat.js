const {log} = require("../log");

function inject(bot) {
    bot.on(`message`, (message, position) => {
        if (position === "game_info") return
        log(message.toAnsi())
    })
}

module.exports = {
    inject
}
