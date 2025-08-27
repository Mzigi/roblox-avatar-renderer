let auth = undefined
let userInfo = undefined

let urlParams = new URLSearchParams(window.location.search)
let id = urlParams.get("id")
let userId = urlParams.get("userId")
let outfitId = urlParams.get("outfitId")

function addOutfit(outfit) {
    let rbx = new RBX()
    rbx.fromOutfit(outfit).then(() => {
        let avatarRBX = rbx

        let rig = avatarRBX.dataModel.FindFirstChildOfClass("Model")

        let currentAnimationIndex = 0

        let animationIds = [
            507766388, //idle long
            913376220, //run
            507772104, //dance
        ]

        if (outfit.playerAvatarType === AvatarType.R6) {
            animationIds = [
                180435571, //idle long
                180426354, //run
                182435998, //dance1[0] (gangnam style)
            ]
        }

        let animationTracks = []

        let animationPromises = []

        for (let id of animationIds) {
            animationPromises.push(new Promise((resolve, reject) => {
                fetch("https://assetdelivery.roproxy.com/v1/asset?id=" + id).then((response) => {
                    if (response.status === 200) {
                        return response.arrayBuffer()
                    } else {
                        return null
                    }
                }).then(buffer => {
                    if (buffer) {
                        let rbx = new RBX()
                        rbx.fromBuffer(buffer)
                        console.log(rbx.generateTree())

                        let animationTrack = new AnimationTrack()
                        animationTrack.loadAnimation(rig, rbx.dataModel.GetChildren()[0])
                        animationTrack.looped = true
                        animationTracks.push(animationTrack)
                        
                        console.log(animationTrack)

                        resolve()
                    }
                })
            }))
        }

        let animationTotalTime = 5
        let animationTransitionTime = 0.5

        Promise.all(animationPromises).then(() => {
            function updateTrack(startTime, lastAnimationSwitch) {
                let nextAnimationIndex = (currentAnimationIndex + 1) % animationIds.length

                let animationTrack = animationTracks[currentAnimationIndex]
                let nextAnimationTrack = animationTracks[nextAnimationIndex]

                let newTime = performance.now() / 1000

                let playedTime = newTime - lastAnimationSwitch
                let firstHalfTime = animationTotalTime - animationTransitionTime

                nextAnimationTrack.weight = Math.max(0, playedTime - firstHalfTime) / animationTransitionTime
                animationTrack.weight = 1 - nextAnimationTrack.weight
                nextAnimationTrack.weight *= 1
                animationTrack.weight *= 1
                
                //console.log("----")
                //console.log(animationTrack.weight)
                animationTrack.resetMotorTransforms()
                animationTrack.setTime((newTime - startTime))
                nextAnimationTrack.setTime((newTime - startTime))

                //recalculate motor6ds
                for (let child of rig.GetDescendants()) {
                    if (child.className === "Motor6D") {
                        child.setProperty("Transform", child.Prop("Transform"))
                    } else if (child.className === "Weld") {
                        child.setProperty("C0", child.Prop("C0"))
                    }
                }

                if (newTime - lastAnimationSwitch > animationTotalTime) {
                    currentAnimationIndex++
                    currentAnimationIndex = currentAnimationIndex % animationIds.length
                    animationTotalTime = 5 + Math.random() * 5
                    lastAnimationSwitch = performance.now() / 1000
                }

                setTimeout(() => {
                    updateTrack(startTime, lastAnimationSwitch)
                }, 1000 / 60 - 1)
            }

            let lastAnimationSwitch = performance.now() / 1000
            animationTotalTime = animationTracks[currentAnimationIndex].length
            updateTrack(performance.now() / 1000, lastAnimationSwitch)
        })
        addRBX(avatarRBX)
    })
}

if (userId && !outfitId) {
    GetAvatarDetails(auth, Number(userId)).then(outfit => {
        addOutfit(outfit)
    })
}
if (outfitId) {
    GetOutfitDetails(auth, Number(outfitId), Number(userId)).then(outfit => {
        addOutfit(outfit)
    })
}