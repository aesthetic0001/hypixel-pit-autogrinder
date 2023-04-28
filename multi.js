const {Worker} = require('worker_threads')
const {emails} = require('./src/constants/emails')
const {proxies} = require('./src/constants/proxies')
const {initHook} = require("./src/utils/webhook");
const usernames = [""]
const emailsPerProxy = 1
const workers = []
const hook = initHook("")

function createWorker(email, proxyCounter) {
    const worker = new Worker('./src/index.js', {workerData: {email, proxy: proxies[proxyCounter], index: emails.indexOf(email)}})
    worker.on('exit', (code) => {
        // restart worker
        console.log(`Worker ${email} exited with code ${code}. Restarting...`)
        workers.splice(workers.indexOf(worker), 1)
        createWorker(email, proxyCounter)
    })
    workers.push(worker)
    worker.on('message', ({type, data}) => {
        switch (type) {
            case "CPacketLogin": {
                usernames.push(data)
                workers.forEach((worker) => {
                    worker.postMessage({type: "SPacketWhitelistUpdate", data: usernames})
                })
                break;
            }
        }
    })
}

async function main() {
    let proxyCounter = -1
    for (const email of emails) {
        if (emails.indexOf(email) % emailsPerProxy === 0) proxyCounter++
        createWorker(email, proxyCounter)
        await new Promise((resolve) => setTimeout(resolve, 2500))
    }
    process.stdin.on("data", data => {
        data = data.toString().trim()
        workers.forEach((worker) => {
            worker.postMessage({
                type: `command`,
                data
            })
        })
    })

    hook.sendEmbedded(`Pit Bots Started`, `Party command: \`/p${usernames.join(' ')}\``, "#ef8d8d")
    console.log(`Initiated ${workers.length} workers. Party command: /p ${usernames.join(' ')}`)
}

main()
