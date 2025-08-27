//Dependencies: asset.js

const BODYCOLOR3 = true

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }
  
let BrickColors = {
    1 :"#F2F3F3",
    2 :"#A1A5A2",
    3 :"#F9E999",
    5 :"#D7C59A",
    6 :"#C2DAB8",
    9 :"#E8BAC8",
    11 :"#80BBDB",
    12 :"#CB8442",
    18 :"#CC8E69",
    21 :"#C4281C",
    22 :"#C470A0",
    23 :"#0D69AC",
    24 :"#F5CD30",
    25 :"#624732",
    26 :"#1B2A35",
    27 :"#6D6E6C",
    28 :"#287F47",
    29 :"#A1C48C",
    36 :"#F3CF9B",
    37 :"#4B974B",
    38 :"#A05F35",
    39 :"#C1CADE",
    40 :"#ECECEC",
    41 :"#CD544B",
    42 :"#C1DFF0",
    43 :"#7BB6E8",
    44 :"#F7F18D",
    45 :"#B4D2E4",
    47 :"#D9856C",
    48 :"#84B68D",
    49 :"#F8F184",
    50 :"#ECE8DE",
    100 :"#EEC4B6",
    101 :"#DA867A",
    102 :"#6E99CA",
    103 :"#C7C1B7",
    104 :"#6B327C",
    105 :"#E29B40",
    106 :"#DA8541",
    107 :"#008F9C",
    108 :"#685C43",
    110 :"#435493",
    111 :"#BFB7B1",
    112 :"#6874AC",
    113 :"#E5ADC8",
    115 :"#C7D23C",
    116 :"#55A5AF",
    118 :"#B7D7D5",
    119 :"#A4BD47",
    120 :"#D9E4A7",
    121 :"#E7AC58",
    123 :"#D36F4C",
    124 :"#923978",
    125 :"#EAB892",
    126 :"#A5A5CB",
    127 :"#DCBC81",
    128 :"#AE7A59",
    131 :"#9CA3A8",
    133 :"#D5733D",
    134 :"#D8DD56",
    135 :"#74869D",
    136 :"#877C90",
    137 :"#E09864",
    138 :"#958A73",
    140 :"#203A56",
    141 :"#27462D",
    143 :"#CFE2F7",
    145 :"#7988A1",
    146 :"#958EA3",
    147 :"#938767",
    148 :"#575857",
    149 :"#161D32",
    150 :"#ABADAC",
    151 :"#789082",
    153 :"#957977",
    154 :"#7B2E2F",
    157 :"#FFF67B",
    158 :"#E1A4C2",
    168 :"#756C62",
    176 :"#97695B",
    178 :"#B48455",
    179 :"#898788",
    180 :"#D7A94B",
    190 :"#F9D62E",
    191 :"#E8AB2D",
    192 :"#694028",
    193 :"#CF6024",
    194 :"#A3A2A5",
    195 :"#4667A4",
    196 :"#23478B",
    198 :"#8E4285",
    199 :"#635F62",
    200 :"#828A5D",
    208 :"#E5E4DF",
    209 :"#B08E44",
    210 :"#709578",
    211 :"#79B5B5",
    212 :"#9FC3E9",
    213 :"#6C81B7",
    216 :"#904C2A",
    217 :"#7C5C46",
    218 :"#96709F",
    219 :"#6B629B",
    220 :"#A7A9CE",
    221 :"#CD6298",
    222 :"#E4ADC8",
    223 :"#DC9095",
    224 :"#F0D5A0",
    225 :"#EBB87F",
    226 :"#FDEA8D",
    232 :"#7DBBDD",
    268 :"#342B75",
    301 :"#506D54",
    302 :"#5B5D69",
    303 :"#0010B0",
    304 :"#2C651D",
    305 :"#527CAE",
    306 :"#335882",
    307 :"#102ADC",
    308 :"#3D1585",
    309 :"#348E40",
    310 :"#5B9A4C",
    311 :"#9FA1AC",
    312 :"#592259",
    313 :"#1F801D",
    314 :"#9FADC0",
    315 :"#0989CF",
    316 :"#7B007B",
    317 :"#7C9C6B",
    318 :"#8AAB85",
    319 :"#B9C4B1",
    320 :"#CACBD1",
    321 :"#A75E9B",
    322 :"#7B2F7B",
    323 :"#94BE81",
    324 :"#A8BD99",
    325 :"#DFDFDE",
    327 :"#970000",
    328 :"#B1E5A6",
    329 :"#98C2DB",
    330 :"#FF98DC",
    331 :"#FF5959",
    332 :"#750000",
    333 :"#EFB838",
    334 :"#F8D96D",
    335 :"#E7E7EC",
    336 :"#C7D4E4",
    337 :"#FF9494",
    338 :"#BE6862",
    339 :"#562424",
    340 :"#F1E7C7",
    341 :"#FEF3BB",
    342 :"#E0B2D0",
    343 :"#D490BD",
    344 :"#965555",
    345 :"#8F4C2A",
    346 :"#D3BE96",
    347 :"#E2DCBC",
    348 :"#EDEAEA",
    349 :"#E9DADA",
    350 :"#883E3E",
    351 :"#BC9B5D",
    352 :"#C7AC78",
    353 :"#CABFA3",
    354 :"#BBB3B2",
    355 :"#6C584B",
    356 :"#A0844F",
    357 :"#958988",
    358 :"#ABA89E",
    359 :"#AF9483",
    360 :"#966766",
    361 :"#564236",
    362 :"#7E683F",
    363 :"#69665C",
    364 :"#5A4C42",
    365 :"#6A3909",
    1001 :"#F8F8F8",
    1002 :"#CDCDCD",
    1003 :"#111111",
    1004 :"#FF0000",
    1005 :"#FFB000",
    1006 :"#B480FF",
    1007 :"#A34B4B",
    1008 :"#C1BE42",
    1009 :"#FFFF00",
    1010 :"#0000FF",
    1011 :"#002060",
    1012 :"#2154B9",
    1013 :"#04AFEC",
    1014 :"#AA5500",
    1015 :"#AA00AA",
    1016 :"#FF66CC",
    1017 :"#FFAF00",
    1018 :"#12EED4",
    1019 :"#00FFFF",
    1020 :"#00FF00",
    1021 :"#3A7D15",
    1022 :"#7F8E64",
    1023 :"#8C5B9F",
    1024 :"#AFDDFF",
    1025 :"#FFC9C9",
    1026 :"#B1A7FF",
    1027 :"#9FF3E9",
    1028 :"#CCFFCC",
    1029 :"#FFFFCC",
    1030 :"#FFCC99",
    1031 :"#6225D1",
    1032 :"#FF00BF",
}

var OutfitOrigin = {
    "WebAvatar": "WebAvatar",
    "WebOutfit": "WebOutfit",
    "Other": "Other",
    "Look": "Look",
}

var AvatarType = {
    "R15": "R15",
    "R6": "R6",
}

class Scale {
    height //1
    width //1
    head //0.95
    depth //1
    proportion //0.5
    bodyType //0

    reset() {
        this.height = 1
        this.width = 1
        this.head = 0.95
        this.depth = 1
        this.proportion = 0.5
        this.bodyType = 0
    }

    fromJson(scaleJson) {
        this.height = scaleJson.height
        this.width = scaleJson.width
        this.head = scaleJson.head
        this.depth = scaleJson.depth
        this.proportion = scaleJson.proportion
        this.bodyType = scaleJson.bodyType
    }
}

class BodyColor3s {
    colorType //Color3

    headColor3 // FFFFFF

    torsoColor3

    rightArmColor3
    leftArmColor3

    rightLegColor3
    leftLegColor3

    constructor() {
        this.colorType = "Color3"
    }


    fromJson(bodyColorsJson) {
        this.headColor3 = bodyColorsJson.headColor3
        this.torsoColor3 = bodyColorsJson.torsoColor3

        this.rightArmColor3 = bodyColorsJson.rightArmColor3
        this.leftArmColor3 = bodyColorsJson.leftArmColor3

        this.rightLegColor3 = bodyColorsJson.rightLegColor3
        this.leftLegColor3 = bodyColorsJson.leftLegColor3
    }
}

class BodyColors {
    colorType //BrickColor

    headColorId //1001 - Institutional White

    torsoColorId

    rightArmColorId
    leftArmColorId

    rightLegColorId
    leftLegColorId

    constructor() {
        this.colorType = "BrickColor"
    }

    fromJson(bodyColorsJson) {
        this.headColorId = bodyColorsJson.headColorId
        this.torsoColorId = bodyColorsJson.torsoColorId

        this.rightArmColorId = bodyColorsJson.rightArmColorId
        this.leftArmColorId = bodyColorsJson.leftArmColorId

        this.rightLegColorId = bodyColorsJson.rightLegColorId
        this.leftLegColorId = bodyColorsJson.leftLegColorId
    }

    toColor3() {
        let newBodyColor3s = new BodyColor3s()

        newBodyColor3s.headColor3 = BrickColors[this.headColorId].replace("#","")
        newBodyColor3s.torsoColor3 = BrickColors[this.torsoColorId].replace("#","")

        newBodyColor3s.rightArmColor3 = BrickColors[this.rightArmColorId].replace("#","")
        newBodyColor3s.leftArmColor3 = BrickColors[this.leftArmColorId].replace("#","")

        newBodyColor3s.rightLegColor3 = BrickColors[this.rightLegColorId].replace("#","")
        newBodyColor3s.leftLegColor3 = BrickColors[this.leftLegColorId].replace("#","")

        return newBodyColor3s
    }
}

class Outfit {
    scale
    bodyColors
    playerAvatarType

    assets

    //outfits only
    name
    _id

    //class only
    origin
    _creatorId
    creationDate
    cachedImage //outfits saved to computer
    editable
    collections //collections this outfit is stored in

    /**
     * @param {number} newId
     */
    set id (newId) {
        this._id = Number(newId)
    }

    get id() {
        return this._id
    }

    /**
     * @param {number} newId
     */
    set creatorId (newId) {
        this._creatorId = Number(newId)
    }

    get creatorId() {
        return this._creatorId
    }

    constructor() {
        this.creationDate = Date.now()
    }

    fromJson(outfitJson) {
        //scale
        this.scale = new Scale()
        if (outfitJson.scale) {
            this.scale.fromJson(outfitJson.scale)
        } else if (outfitJson.scales) {
            this.scale.fromJson(outfitJson.scales)
        }

        //bodycolors
        if (outfitJson.bodyColors && !outfitJson.bodyColors.headColor3) {
            let oldBodyColors = new BodyColors()
            oldBodyColors.fromJson(outfitJson.bodyColors)

            if (BODYCOLOR3) {
                this.bodyColors = oldBodyColors.toColor3()
            } else {
                this.bodyColors = oldBodyColors
            }
        } else if (outfitJson.bodyColor3s) {
            if (!BODYCOLOR3) {
                console.error("Creating BodyColor3s while they are disabled!")
            }

            this.bodyColors = new BodyColor3s()
            this.bodyColors.fromJson(outfitJson.bodyColor3s)
        } else if (outfitJson.bodyColors) {
            this.bodyColors = new BodyColor3s()
            this.bodyColors.fromJson(outfitJson.bodyColors)
        }

        //playerAvatarType
        this.playerAvatarType = outfitJson.playerAvatarType

        //assets
        this.assets = []
        for (let i = 0; i < outfitJson.assets.length; i++) {
            let asset = new Asset()
            asset.fromJson(outfitJson.assets[i])
            this.assets.push(asset)
        }

        //name
        if (outfitJson.name) {
            this.name = outfitJson.name
        } else {
            this.name = "Avatar"
        }

        //id
        if (outfitJson.id || outfitJson.outfitId) {
            this.id = outfitJson.id || outfitJson.outfitId
        }

        //creatorId
        if (outfitJson.creatorId) {
            this.creatorId = outfitJson.creatorId
        }

        //collections
        if (outfitJson.collections) {
            this.collections = outfitJson.collections
        }

        //creationDate
        if (outfitJson.creationDate) {
            this.creationDate = outfitJson.creationDate
        }
    }
}