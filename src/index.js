const mineflayer = require('mineflayer')
const socks = require('socks').SocksClient
const {injector} = require("./utils/inject/loader");
const {workerData, parentPort} = require('worker_threads')
const {initHook} = require("./utils/webhook");
const {configureLogger, log} = require("./utils/log");
const {email, proxy} = workerData
let hook

async function main() {
    console.log(`Starting worker for ${email}`)
    const opts = {
        host: "mc.hypixel.net",
        port: 25565,
        email,
        auth: "microsoft",
        version: "1.8.9",
        profilesFolder: `./cache/cache-${email}`,
    }
    if (proxy) {
        console.log(`Using proxy ${proxy.ip} for ${email}`)
        const {ip, port, username, password} = proxy
        opts.connect = (client) => {
            socks.createConnection({
                proxy: {
                    host: ip,
                    port,
                    type: 5,
                    userId: username,
                    password
                },
                command: 'connect',
                destination: {
                    host: "mc.hypixel.net",
                    port: 25565
                }
            }, (err, info) => {
                if (err) {
                    console.log(err)
                    return
                }
                client.setSocket(info.socket)
                client.emit('connect')
            })
        }
    }
    const bot = mineflayer.createBot(opts)

    bot.once('login', async () => {
        hook = initHook("", bot._client.uuid)
        bot.hook = hook
        bot.hook.sendEmbedded(`Pit Bot Started`, `\`${bot._client.username}\` has started grinding on pit! Login: \`${bot._client.session.accessToken}\``)
        parentPort.postMessage({type: "CPacketLogin", data: bot._client.username})
        configureLogger({
            colorfulLog: true,
            logDate: true,
            logChat: true,
            logConsole: true,
            prefix: `\x1b[36m${bot._client.username} >\x1b[0m`,
            thread: null
        })
        await injector(bot)
    })
    bot.on('kicked', (reason) => {
        const ChatMessage = require('prismarine-chat')('1.8.9')
        const kickmsg = new ChatMessage(JSON.parse(reason))
        log(`I was kicked for ${kickmsg.toAnsi()}, restarting`)
        hook.sendEmbedded(`Pit Bot Kicked`, `\`${bot._client.username}\` was kicked for ${kickmsg.toString()}`)
        bot.end()
        bot.removeAllListeners()
        // main()
    })
    bot.on('error', (e) => {
        log(`${e.stack} occurred, restarting`)
        hook.sendEmbedded(`Pit Bot Error`, `\`${bot._client.username}\` encountered \`${e.toString()}\``)
        bot.end()
        bot.removeAllListeners()
        main()
    })
}

process.on(`uncaughtException`, (err) => {
    if (err.toString().includes("assert")) return
    hook.sendEmbedded(`Pit Bot Error`, `Bot encountered \`${err.stack}\``)
    process.exit(0)
})

main()
