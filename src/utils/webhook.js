const axios = require('axios')

function initHook(url, uuid) {
    let hook = {
        sendEmbedded: () => {return}
    }
    if (url) {
        hook.sendEmbedded = async (title, description, color = `#ff8787`) => {
            axios.post(url, {
                username: `Buy BinMaster :D`,
                avatar_url: `https://cataas.com/cat?dc=${Math.floor(Date.now() / 300000)}`,
                embeds: [
                    {
                        title,
                        color: parseInt(color.replace("#", ""), 16),
                        timestamp: new Date(),
                        thumbnail: {
                            url: `https://mc-heads.net/head/${(uuid ?? "f78a4d8dd51b4b3998a3230f2de0c670").replace(/-/g, '').trim()}.png`
                        },
                        description,
                        footer: {
                            text: `Pit Bot`,
                            icon_url: `https://cataas.com/cat/says/binmaster-bot.sellix.io?dc=${Math.floor(Date.now() / 300000)}`
                        }
                    }
                ]
            }).catch((e) => {
                console.log(`Exception while posting to webhook!`)
            })
        }
    }
    return hook
}

module.exports = {
    initHook
}
