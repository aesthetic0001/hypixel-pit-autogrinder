const {RaycastIterator} = require('prismarine-world').iterators
const {Vec3} = require("vec3");
const AABB = require("prismarine-physics/lib/aabb")
const {loader} = require("@nxg-org/mineflayer-smooth-look");
const TWEEN = require("@tweenjs/tween.js");
const Item = require('prismarine-item')("1.8.9")

function inject(bot) {
    bot.loadPlugin(loader);
    bot.smoothLook.setEasing(TWEEN.Easing.Quartic.Out)
    bot.getEntityAABB = (entity) => {
        const w = entity.width ?? entity.height / 2;
        const {x, y, z} = entity.position;
        return new AABB(-w, 0, -w, w, entity.height, w).offset(x, y, z);
    }

    bot.entityAtCursor = (maxDistance = 3.4) => {
        // const block = bot.blockAtCursor(maxDistance)
        // maxDistance = block?.intersect.distanceTo(bot.entity.position) ?? maxDistance

        const entities = Object.values(bot.entities)
            .filter(entity => entity.type !== 'object' && entity.username !== bot.username && entity.position.distanceTo(bot.entity.position) <= maxDistance && entity?.username === bot.target.username && !entity.dead)

        const dir = new Vec3(-Math.sin(bot.entity.yaw) * Math.cos(bot.entity.pitch), Math.sin(bot.entity.pitch), -Math.cos(bot.entity.yaw) * Math.cos(bot.entity.pitch))
        const iterator = new RaycastIterator(bot.entity.position.offset(0, bot.entity.height, 0), dir.normalize(), maxDistance)

        let targetEntity = null
        let targetDist = maxDistance

        if (!entities) return

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]
            const w = entity.width / 2

            const shapes = [[-w, 0, -w, w, entity.height + (entity.type === 'player' ? 0.18 : 0), w]]
            const intersect = iterator.intersect(shapes, entity.position)
            if (intersect) {
                const entityDir = entity.position.minus(bot.entity.position) // Can be combined into 1 line
                const sign = Math.sign(entityDir.dot(dir))
                if (sign !== -1) {
                    const dist = bot.trueDistance(bot.entity.position, entity.position, entity.height + (entity.type === 'player' ? 0.18 : 0), w)
                    if (dist < targetDist) {
                        targetEntity = entity
                        targetDist = dist
                    }
                }
            }
        }
        return targetEntity
    }

    bot.rightClick = (mode = "on") => {
        switch (mode) {
            case "on": {
                bot._client.write('block_place', {
                    location: new Vec3(-1, -1, -1),
                    direction: -1,
                    heldItem: Item.toNotch(bot.heldItem),
                    cursorX: 0,
                    cursorY: 0,
                    cursorZ: 0
                })
                break;
            }
            case "off": {
                bot._client.write("block_dig", {
                    status: 5,
                    location: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    face: 0
                })
            }
        }

    }
}

module.exports = {
    inject
}
