const conv = require('mineflayer/lib/conversions')
const {Vec3} = require("vec3");
const {RaycastIterator} = require("prismarine-world/src/iterators");
const raycast = true
const hitboxAmplification = 2

function inject(bot) {
    const PI = Math.PI
    const PI_2 = Math.PI * 2

    bot.vecToRoll = (point) => {
        const delta = point.minus(bot.entity.position.offset(0, bot.entity.height, 0))
        const yaw = Math.atan2(-delta.x, -delta.z)
        const groundDistance = Math.sqrt(delta.x * delta.x + delta.z * delta.z)
        const pitch = Math.atan2(delta.y, groundDistance)
        const sensitivity = conv.fromNotchianPitch(0.15) // this is equal to 100% sensitivity in vanilla
        const yawChange = Math.round((yaw - bot.entity.yaw) / sensitivity) * sensitivity
        const pitchChange = Math.round((pitch - bot.entity.pitch) / sensitivity) * sensitivity
        return {
            yaw: yawChange,
            pitch: pitchChange
        }
    }

    bot.deltaYaw = (yaw1, yaw2) => {
        let dYaw = (yaw1 - yaw2) % PI_2
        if (dYaw < -PI) dYaw += PI_2
        else if (dYaw > PI) dYaw -= PI_2

        return dYaw
    }

    bot.trueDistance = (startPos = bot.entity.position, targetPos, height = 1.62, width = 0.3) => {
        const {x, y, z} = startPos.offset(0, 1.62, 0)
        const aabb = bot.getEntityAABB({
            position: targetPos,
            height: height,
            width: width
        });
        let dx = Math.max(aabb.minX - x, 0, x - aabb.maxX);
        let dy = Math.max(aabb.minY - y, 0, y - aabb.maxY);
        let dz = Math.max(aabb.minZ - z, 0, z - aabb.maxZ);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    bot.canAttack = (target, maxDist = 4) => {
        if (raycast) {
            if (!target.position) {
                return false
            }
            const dir = new Vec3(-Math.sin(bot.entity.yaw) * Math.cos(bot.entity.pitch), Math.sin(bot.entity.pitch), -Math.cos(bot.entity.yaw) * Math.cos(bot.entity.pitch))
            const iterator = new RaycastIterator(bot.entity.position.offset(0, 1.62, 0), dir.normalize(), 6)
            const shapes = [[-0.3 * hitboxAmplification, 0, -0.3 * hitboxAmplification, 0.3 * hitboxAmplification, 1.62, 0.3 * hitboxAmplification]]
            const intersect = iterator.intersect(shapes, target.position)
            const entityDir = bot.target.position.minus(bot.entity.position)

            if (intersect) {
                const sign = Math.sign(entityDir.dot(dir))
                if (sign !== -1) {
                    const dist = bot.trueDistance(bot.entity.position, target.position)
                    if (dist <= maxDist) {
                        return true
                    }
                }
            }
            return false
        }
        return bot.trueDistance(bot.entity.position, target.position) <= maxDist
    }
}

module.exports = {
    inject
}
