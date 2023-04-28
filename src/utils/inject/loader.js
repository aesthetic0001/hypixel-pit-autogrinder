const fs = require("fs");

async function injector(object) {
    const path = __dirname + (process.platform === "win32" ? "\\" : "/")
    const {inject} = require(`${path}statemachine.js`);
    inject(object)
    const files = fs.readdirSync(path)
    files.forEach((file) => {
        if (!file.endsWith(".js") || file === "loader.js" || file === "statemachine.js") return;
        const {inject} = require(`${path}${file}`);
        inject(object)
        delete require.cache[require.resolve(`${path}${file}`)];
    });
}

module.exports = {
    injector
}
