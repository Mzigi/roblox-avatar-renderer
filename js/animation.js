import * as THREE from '../modules/three.module.js';

//ENUMS
const AnimationPriority = {
    "Idle": 0,
    "Movement": 1,
    "Action": 2,
    "Action2": 3,
    "Action3": 4,
    "Action4": 5,
    "Core": 1000
}

const EasingDirection = {
    "In": 0,
    "Out": 1,
    "InOut": 2,
}

const PoseEasingStyle = {
    "Linear": 0,
    "Constant": 1,
    "Elastic": 2,
    "Cubic": 3,
    "Bounce": 4,
    "CubicV2": 5,
}

//FUNCTIONS FOR EASING (https://easings.net/)
//linear
function easeLinear(x) {
    return x
}

//constant
function easeConstant(x) {
    return 0
}

//elastic
function easeInElastic(x) {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
    ? 0
    : x === 1
    ? 1
    : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

function easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeInOutElastic(x) {
    const c5 = (2 * Math.PI) / 4.5;

    return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

//cubic
function easeInCubic(x) {
    return x * x * x;
}

function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

//bounce
function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

function easeInBounce(x) {
    return 1 - easeOutBounce(1 - x);
}

function easeInOutBounce(x) {
    return x < 0.5
    ? (1 - easeOutBounce(1 - 2 * x)) / 2
    : (1 + easeOutBounce(2 * x - 1)) / 2;
}

//map for easing function
const EasingFunctionMap = {
    [EasingDirection.In]: {
        [PoseEasingStyle.Linear]: easeLinear,
        [PoseEasingStyle.Constant]: easeConstant,
        [PoseEasingStyle.Elastic]: easeInElastic,
        [PoseEasingStyle.Cubic]: easeInCubic,
        [PoseEasingStyle.Bounce]: easeInBounce,
        [PoseEasingStyle.CubicV2]: easeInCubic,
    },
    [EasingDirection.Out]: {
        [PoseEasingStyle.Linear]: easeLinear,
        [PoseEasingStyle.Constant]: easeConstant,
        [PoseEasingStyle.Elastic]: easeOutElastic,
        [PoseEasingStyle.Cubic]: easeOutCubic,
        [PoseEasingStyle.Bounce]: easeOutBounce,
        [PoseEasingStyle.CubicV2]: easeOutCubic,
    },
    [EasingDirection.InOut]: {
        [PoseEasingStyle.Linear]: easeLinear,
        [PoseEasingStyle.Constant]: easeConstant,
        [PoseEasingStyle.Elastic]: easeInOutElastic,
        [PoseEasingStyle.Cubic]: easeInOutCubic,
        [PoseEasingStyle.Bounce]: easeInOutBounce,
        [PoseEasingStyle.CubicV2]: easeInOutCubic,
    }
}

//HELPER FUNCTIONS
function rad(degrees) {
    return degrees / 180 * Math.PI
}

function deg(radians) {
    return radians * 180 / Math.PI
}

function lerp(a,b,t) {
	return a + (b - a) * t
}

function getEasingFunction(easingDirection, easingStyle) {
    let func = EasingFunctionMap[easingDirection][easingStyle]
    if (!func) {
        throw new Error(`No function equivalent for easingStyle: ${easingStyle}`)
    }

    return func
}

function animPriorityToNum(animationPriority) { //larger number has larger priority, unlike the enums
    if (animationPriority === 1000) {
        return -1
    }

    return animationPriority
}

function lerpCFrame(oldCFrame, newCFrame, easedTime) {
    let oldPos = oldCFrame.Position
    let oldRot = oldCFrame.Orientation

    let newPos = newCFrame.Position
    let newRot = newCFrame.Orientation

    let oldEuler = new THREE.Euler(rad(oldRot[0]), rad(oldRot[1]), rad(oldRot[2]), "YXZ")
    let oldQuat = new THREE.Quaternion().setFromEuler(oldEuler)

    let newEuler = new THREE.Euler(rad(newRot[0]), rad(newRot[1]), rad(newRot[2]), "YXZ")
    let newQuat = new THREE.Quaternion().setFromEuler(newEuler)
    
    let resultQuat = oldQuat.slerp(newQuat, easedTime)
    let resultEuler = new THREE.Euler().setFromQuaternion(resultQuat, "YXZ")
    let resultOrientation = [deg(resultEuler.x), deg(resultEuler.y), deg(resultEuler.z)]

    let resultX = lerp(oldPos[0], newPos[0], easedTime)
    let resultY = lerp(oldPos[1], newPos[1], easedTime)
    let resultZ = lerp(oldPos[2], newPos[2], easedTime)

    let resultCFrame = new CFrame(resultX, resultY, resultZ)
    resultCFrame.Orientation = resultOrientation

    return resultCFrame
}

function weightCFrame(cf, weight) {
    cf = cf.clone()
    cf.Position = [cf.Position[0] * weight, cf.Position[1] * weight, cf.Position[2] * weight]
    cf.Orientation = [cf.Orientation[0] * weight, cf.Orientation[1] * weight, cf.Orientation[2] * weight]

    return cf
}

class PartKeyframe {
    time
    cframe
    easingDirection = EasingDirection.In
    easingStyle = PoseEasingStyle.Linear
}

class PartKeyframeGroup {
    motorParent = "LowerTorso"
    motorName = "Root"

    keyframes = []

    getLowerKeyframe(time) {
        let resultKeyframe = null

        for (let keyframe of this.keyframes) {
            if (keyframe.time <= time) {
                resultKeyframe = keyframe
            } else {
                break
            }
        }

        return resultKeyframe
    }

    getHigherKeyframe(time) {
        for (let keyframe of this.keyframes) {
            if (keyframe.time > time) {
                return keyframe
            }
        }

        return null
    }
}

class AnimationTrack {
    //data
    keyframeGroups = [] //one group per motor6D
    
    //playing info
    isPlaying = false
    speed = 1
    timePosition = 0
    weight = 1
    finished = true

    //static info
    rig = null
    length = 0
    looped = false
    priority = AnimationPriority.Core

    getNamedMotor(motorName, parentName) {
        let parent = this.rig.FindFirstChild(parentName)
        if (parent) {
            return parent.FindFirstChild(motorName)
        }

        return null
    }

    findMotor6D(part0, part1) {
        let descendants = this.rig.GetDescendants()

        for (let child of descendants) {
            if (child.className === "Motor6D") {
                if (child.Prop("Part0") === part0 && child.Prop("Part1") === part1) {
                    return child
                }
            }
        }

        return null
    }

    findKeyframeGroup(motor) {
        for (let group of this.keyframeGroups) {
            if (group.motorParent === motor.parent.Prop("Name") && group.motorName === motor.Prop("Name")) {
                return group
            }
        }

        return null
    }

    addPartKeyframe(motor, keyframe) {
        if (!motor || !keyframe) {
            return
        }

        let group = this.findKeyframeGroup(motor)
        if (!group) {
            group = new PartKeyframeGroup()
            group.motorParent = motor.parent.Prop("Name")
            group.motorName = motor.Prop("Name")
            this.keyframeGroups.push(group)
        }

        group.keyframes.push(keyframe)
    }

    createPartKeyframe(keyframe, pose) {
        let part0Name = pose.parent.Prop("Name")
        let part1Name = pose.Prop("Name")

        let part0 = this.rig.FindFirstChild(part0Name)
        let part1 = this.rig.FindFirstChild(part1Name)

        let motor = null
        let partKeyframe = null

        if (part0 && part1) {
            motor = this.findMotor6D(part0, part1)

            partKeyframe = new PartKeyframe()
            partKeyframe.time = keyframe.Prop("Time")
            partKeyframe.cframe = pose.Prop("CFrame")
            if (pose.HasProperty("EasingDirection")) {
                partKeyframe.easingDirection = pose.Prop("EasingDirection")
            }
            if (pose.HasProperty("EasingStyle")) {
                partKeyframe.easingStyle = pose.Prop("EasingStyle")
            }
        } else {
            console.warn(`Missing either part0 or part1 with names: ${part0Name} ${part1Name}`)
        }

        return [motor, partKeyframe]
    }

    addKeyframe(keyframe) {
        //traverse keyframe tree
        let children = keyframe.GetChildren()

        while (children.length > 0) {
            let validChildren = []

            for (let child of children) {
                if (child.className === "Pose") { //its a valid keyframe
                    validChildren.push(child)

                    if (child.Prop("Weight") >= 0.999) {//if this is actually a keyframe that affects the current part
                        let [motor, partKeyframe] = this.createPartKeyframe(keyframe, child)
                        this.addPartKeyframe(motor, partKeyframe)
                    }
                } else {
                    console.warn(`Unknown animation child with className: ${child.className}`, child)
                }
            }

            //update list of children
            let newChildren = []
            for (let child of validChildren) {
                newChildren = newChildren.concat(child.GetChildren())
            }
            children = newChildren
        }
    }

    loadAnimation(rig, animation) {
        if (animation.className !== "KeyframeSequence") {
            throw new Error("Animation is not a KeyframeSequence")
        }

        //set animation details
        this.looped = animation.Prop("Loop")
        this.priority = animation.Prop("Priority")
        this.length = 0
        this.rig = rig

        //sort keyframes based on time
        let keyframeInstances = []

        let animationChildren = animation.GetChildren()
        for (let child of animationChildren) {
            if (child.className === "Keyframe") {
                if (child.GetChildren().length > 0) {
                    this.length = Math.max(this.length, child.Prop("Time"))
                    keyframeInstances.push(child)
                }
            }
        }

        keyframeInstances.sort((a, b) => {
            return a.Prop("Time") - b.Prop("Time")
        })

        //add keyframes
        for (let child of keyframeInstances) {
            this.addKeyframe(child)
        }

        return this
    }

    resetMotorTransforms() {
        let descendants = this.rig.GetDescendants()

        for (let motor of descendants) {
            if (motor.className === "Motor6D") {
                motor.setProperty("Transform", new CFrame(0,0,0))
            }
        }
    }

    renderPose() {
        let time = this.timePosition

        for (let group of this.keyframeGroups) {
            let motor = this.getNamedMotor(group.motorName, group.motorParent)
            if (motor) {
                let lowerKeyframe = group.getLowerKeyframe(time)
                let higherKeyframe = group.getHigherKeyframe(time)

                if (lowerKeyframe && higherKeyframe) {
                    let higherTime = higherKeyframe.time - lowerKeyframe.time
                    let fromLowerTime = time - lowerKeyframe.time
                    let keyframeTime = fromLowerTime / higherTime

                    let easedTime = getEasingFunction(lowerKeyframe.easingDirection, lowerKeyframe.easingStyle)(keyframeTime)

                    let oldTransformCF = motor.Prop("Transform").clone()
                    let transformCF = lerpCFrame(oldTransformCF, lerpCFrame(lowerKeyframe.cframe, higherKeyframe.cframe, easedTime).inverse(), this.weight)
                    motor.setProperty("Transform", transformCF)
                }
            }
        }
    }

    setTime(time) {
        if (this.looped) {
            time = time % this.length
        }

        this.timePosition = time
        this.finished = time >= this.length

        this.renderPose()
    }
}

window.AnimationTrack = AnimationTrack