//REQUEST FUNCTIONS
async function RBLXGet(url, auth) {
    let robloxSecurityCookie = undefined

    if (auth) {
        robloxSecurityCookie = ".ROBLOSECURITY=" + auth.getROBLOSECURITY()
    }

    return new Promise((resolve, reject) => {
        let fetchHeaders = new Headers({
            "Content-Type": "application/json",
            "Cookie": robloxSecurityCookie,
        })

        try {
            fetch(url, {
                headers: fetchHeaders,
            }).then(response => {
                resolve(response)
            })
        } catch (error) {
            console.warn(error)
            resolve(new Response(JSON.stringify({"error": error}), {status: 500}))
        }
    })
}

//AVATAR
let CachedOutfits = {}

async function GetOutfitDetails(auth, outfitId, userId) {
    let outfitString = `Outfit${outfitId}`
    let currentTime = Math.floor(Date.now() / 1000)

    if (CachedOutfits[outfitString] && CachedOutfits[outfitString].timestamp >= currentTime - 10) {
        return CachedOutfits[outfitString].outfit
    }

    let requestUrl = "https://avatar.roproxy.com/v1/outfits/"

    if (BODYCOLOR3) {
        requestUrl = "https://avatar.roproxy.com/v3/outfits/"
    }

    let response = await RBLXGet(requestUrl + outfitId + "/details", auth)

    if (response.status == 200) {
        let responseJson = await response.json()

        let outfit = new Outfit()
        outfit.fromJson(responseJson)
        outfit.origin = OutfitOrigin.WebOutfit
        outfit.creatorId = userId

        CachedOutfits[outfitString] = {
            "timestamp": Math.floor(Date.now() / 1000),
            "outfit": outfit
        }

        return outfit
    } else {
        return null
    }
}

async function GetAvatarDetails(auth, userId) {
    let requestUrl = "https://avatar.roproxy.com/v1/users/"
    
    if (BODYCOLOR3) {
        requestUrl = "https://avatar.roproxy.com/v2/avatar/users/"
    }

    let response = await RBLXGet(requestUrl + userId + "/avatar")

    if (response.status == 200) {
        let responseBody = await response.json()

        let outfit = new Outfit()
        outfit.fromJson(responseBody)
        outfit.id = userId
        outfit.creatorId = userId
        outfit.origin = OutfitOrigin.WebAvatar

        return outfit
    } else {
        return null
    }
}

async function GetLookDetails(auth, lookId, query) {
    let lookData = await GetLook(auth, lookId)
    let outfit = await LookToOutfit(auth, lookData.look, query)

    return outfit
}

function idFromStr(str) {
    let numStrs = str.match(/\d+(\.\d+)?/g)
    return Number(numStrs[numStrs.length - 1])
}

function parseAssetString(str) {
    if (!isNaN(Number(str))) {
        return `https://assetdelivery.roproxy.com/v1/asset?id=${str}`
    } else if (str.startsWith("rbxassetid://")) {
        return `https://assetdelivery.roproxy.com/v1/asset?id=${str.slice(13)}`
    } else if (str.startsWith("rbxasset://")) {
        str = str.replaceAll("\\","/")
        return "/assets/rbxasset/" + str.slice(11)
    } else if (str.includes("roblox.com/asset")) { //i am tired of the 1 million variants of https://www.roblox.com/asset/?id=
        return `https://assetdelivery.roproxy.com/v1/asset?id=${idFromStr(str)}`
    } else if (str.startsWith("https://assetdelivery.roblox.com/v1/asset/?id=")) {
        return `https://assetdelivery.roproxy.com/v1/asset?id=${str.slice(46)}`
    } else if (str.includes("assetdelivery.roblox.com")) {
        return `https://assetdelivery.roproxy.com/v1/asset?id=${idFromStr(str)}`
    } else {
        console.warn(`Failed to parse path of ${str}`)
    }
}

//https://assetdelivery.roblox.com/v1/asset?id=
//https://assetdelivery.roblox.com/v2/asset?id=