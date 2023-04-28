const fs = require('fs')
const file = fs.readFileSync('./proxies.txt').toString()
const proxies = []

for (let proxy of file.split('\n')) {
    if (!proxy) continue
    proxy = proxy.replace('\r', '')
    const split = proxy.split(":")
    proxies.push({
        ip: split[0],
        port: parseInt(split[1]),
        username: split[2],
        password: split[3]
    })
}

module.exports = {
    proxies
}
