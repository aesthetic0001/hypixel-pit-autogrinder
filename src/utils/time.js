/***
 * @param {number} ms
 * @returns {Promise<VoidFunction>}
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
    sleep
}
