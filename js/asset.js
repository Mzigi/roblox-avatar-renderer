let AssetTypes = [
    "",
    "Image",
    "TShirt",
    "Audio",
    "Mesh",
    "Lua",
    "",
    "",
    "Hat",
    "Place",
    "Model",
    "Shirt",
    "Pants",
    "Decal",
    "",
    "",
    "",
    "Head",
    "Face",
    "Gear",
    "",
    "Badge",
    "",
    "",
    "Animation",
    "",
    "",
    "Torso",
    "RightArm",
    "LeftArm",
    "LeftLeg",
    "RightLeg",
    "Package",
    "",
    "GamePass",
    "",
    "",
    "",
    "Plugin",
    "",
    "MeshPart",
    "HairAccessory",
    "FaceAccessory",
    "NeckAccessory",
    "ShoulderAccessory",
    "FrontAccessory",
    "BackAccessory",
    "WaistAccessory",
    "ClimbAnimation",
    "DeathAnimation",
    "FallAnimation",
    "IdleAnimation",
    "JumpAnimation",
    "RunAnimation",
    "SwimAnimation",
    "WalkAnimation",
    "PoseAnimation",
    "EarAccessory",
    "EyeAccessory",
    "",
    "",
    "EmoteAnimation",
    "Video",
    "",
    "TShirtAccessory",
    "ShirtAccessory",
    "PantsAccessory",
    "JacketAccessory",
    "SweaterAccessory",
    "ShortsAccessory",
    "LeftShoeAccessory",
    "RightShoeAccessory",
    "DressSkirtAccessory",
    "FontFamily",
    "",
    "",
    "EyebrowAccessory",
    "EyelashAccessory",
    "MoodAnimation",
    "DynamicHead",
]

class AssetType {
    _id //67
    name //JacketAccessory

    toJson() {
        return {
            "id": this.id,
            "name": this.name,
        }
    }

    fromJson(assetTypeJson) {
        this.id = assetTypeJson.id
        if (assetTypeJson.name)
            this.name = assetTypeJson.name
    }

    set id(newId) {
        this._id = newId
        this.name = AssetTypes[Number(newId)]
    }

    get id() {
        return this._id
    }
}

class AssetMeta {
    order
    version
    puffiness

    position
    rotation
    scale

    toJson() {
        let toReturn = {
            "position": this.position,
            "rotation": this.rotation,
            "scale": this.scale
        }

        if (this.order || this.order == 0) {
            toReturn["order"] = this.order
        }
        if (this.version || this.version == 0) {
            toReturn["version"] = this.version
        }
        if (this.puffiness || this.puffiness == 0) {
            toReturn["puffiness"] = this.puffiness
        }

        return toReturn
    }

    fromJson(assetMetaJson) {
        this.order = assetMetaJson.order
        this.version = assetMetaJson.version
        this.puffiness = assetMetaJson.puffiness

        this.position = assetMetaJson.position
        this.rotation = assetMetaJson.rotation
        this.scale = assetMetaJson.scale
    }
}

class Asset {
    id
    name

    assetType
    currentVersionId

    meta //only present on layered clothing

    toJson() {
        let toReturn = {
            "id": this.id,
            "name": this.name,
            "assetType": this.assetType.toJson(),
            "currentVersionId": this.currentVersionId,
        }

        if (this.meta) {
            toReturn["meta"] = this.meta.toJson()
        }

        return toReturn
    }

    fromJson(assetJson) {
        this.id = Number(assetJson.id)
        this.name = assetJson.name

        this.assetType = new AssetType()
        this.assetType.fromJson(assetJson.assetType)

        this.currentVersionId = assetJson.currentVersionId
        
        if (assetJson.meta) {
            this.meta = new AssetMeta()
            this.meta.fromJson(assetJson.meta)
        }
    }
}