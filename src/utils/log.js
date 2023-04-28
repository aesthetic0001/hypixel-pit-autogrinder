let configuration = {
    colorfulLog: true,
    logDate: true,
    logChat: true,
    logConsole: true,
    prefix: "\x1b[36m[G-SKIP]\x1b[0m",
    thread: null
}

const map = {
    express: "cyan",
    warning: "yellow",
    success: "green",
    error: "red",
    info: "blue"
}

const colors = {
    cyan: "\x1b[36m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    red: "\x1b[31m"
}

/***
 * @param data {Object}
 */
function log(data) {
    const {colorfulLog, logDate, logChat, logConsole, prefix, thread} = configuration
    if (typeof data === "string") data = new LogData(data)
    const {text, type, sender} = data
    let base = ''
    if (logDate) {
        const currentDate = new Date()
        base += `<${currentDate.getHours().toString().length === 1 ? `0${currentDate.getHours().toString()}` : currentDate.getHours().toString()}:${currentDate.getMinutes().toString().length === 1 ? `0${currentDate.getMinutes().toString()}` : currentDate.getMinutes().toString()}> `
    }
    if (prefix) {
        base += prefix + " "
    }
    if (colorfulLog && type) {
        base += colors[map[type]]
    }
    base += text + "\x1b[0m"
    if (thread) thread.postMessage({type: "logger", data: base})
    if ((logConsole && sender === "console") || (logChat && sender === "chat")) return console.log(base)
}

function configureLogger(options) {
    configuration = options
}

/***
 * @param text {String}
 * @param sender {String}
 * @param type {String}
 * @constructor
 */
function LogData(text, type = 'info', sender = 'console') {
    this.text = text
    this.sender = sender
    this.type = type
}

module.exports = {
    log,
    configureLogger,
    LogData
}
