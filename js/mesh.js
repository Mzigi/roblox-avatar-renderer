//https://devforum.roblox.com/t/roblox-filemesh-format-specification/326114

class SimpleView {
    view
    viewOffset
    buffer

    constructor (buffer) {
        this.view = new DataView(buffer)
        this.buffer = buffer
        this.viewOffset = 0
    }

    writeUtf8String(value) {
        let stringBuffer = new TextEncoder().encode(value).buffer
        let stringSimpleView = new SimpleView(stringBuffer)

        this.writeUint32(stringBuffer.byteLength)

        for (let i = 0; i < stringBuffer.byteLength; i++) {
            this.writeUint8(stringSimpleView.readUint8())
        }
    }

    readUtf8String(stringLength) {
        if (!stringLength) {
            stringLength = this.readUint32()
        }
        let string = new TextDecoder().decode(new Uint8Array(this.view.buffer).subarray(this.viewOffset, this.viewOffset + stringLength))
        
        this.viewOffset += stringLength

        return string
    }

    writeFloat32(value, littleEndian = true) {
        value = Math.max(value, -340282346638528859811704183484516925440.0)
        value = Math.min(value, 340282346638528859811704183484516925440.0)

        this.view.setFloat32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readFloat32(littleEndian = true) {
        let value = this.view.getFloat32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    writeInt32(value, littleEndian = true) {
        value = Math.max(value, -2147483648)
        value = Math.min(value, 2147483647)

        this.view.setInt32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readInt32(littleEndian = true) {
        let value = this.view.getInt32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    writeUint32(value, littleEndian = true) {
        value = Math.max(value, 0)
        value = Math.min(value, 4294967295)

        this.view.setUint32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readUint32(littleEndian = true) {
        let value = this.view.getUint32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    writeInt16(value, littleEndian = true) {
        value = Math.max(value, -32768)
        value = Math.min(value, 32767)

        this.view.setInt16(this.viewOffset, value, littleEndian)
        this.viewOffset += 2
    }

    readInt16(littleEndian = true) {
        let value = this.view.getInt16(this.viewOffset, littleEndian)
        this.viewOffset += 2
        
        return value
    }

    writeUint16(value, littleEndian = true) {
        value = Math.max(value, 0)
        value = Math.min(value, 65535)

        this.view.setUint16(this.viewOffset, value, littleEndian)
        this.viewOffset += 2
    }

    readUint16(littleEndian = true) {
        let value = this.view.getUint16(this.viewOffset, littleEndian)
        this.viewOffset += 2
        
        return value
    }

    writeInt8(value) {
        value = Math.max(value, -128)
        value = Math.min(value, 127)

        this.view.setInt8(this.viewOffset, value)
        this.viewOffset += 1
    }

    readInt8() {
        let value = this.view.getInt8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }

    writeUint8(value) {
        value = Math.max(value, 0)
        value = Math.min(value, 255)

        this.view.setUint8(this.viewOffset, value)
        this.viewOffset += 1
    }

    readUint8() {
        let value = this.view.getUint8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }
}

class FileMeshVertex {
    position //Vector3<float>
    normal //Vector3<float>
    uv //Vector2<float>

    tangent //Vector4<sbyte>

    color //Vector4<byte>

    constructor(position = [0,0,0], normal = [0,0,0], uv = [0,0], tangent = [0,0,0,0], color = [255,255,255,255]) {
        this.position = position
        this.normal = normal
        this.uv = uv
        this.tangent = tangent
        this.color = color
    }
}

class FileMeshFace {
    a //uint
    b //uint
    c //uint

    constructor(a,b,c) {
        this.a = a
        this.b = b
        this.c = c
    }
}

class COREMESH {
    numverts = 0 //uint
    verts = [] //FileMeshVertex[]

    numfaces = 0 //uint
    faces = [] //FileMeshFace[]
}

const LodType = {
    "None": 0,
    "Unknown": 1,
    "RbxSimplifier": 2,
    "ZeuxMeshOptimizer": 3,
}

class LODS {
    lodType = LodType.Unknown //ushort, 0 = None, 1 = Unknown, 2 = RbxSimplifier, 3 = ZeuxMeshOptimizer
    numHighQualityLODs = 0 //byte

    numLodOffsets = 0 //uint
    lodOffsets = [] //uint
}

class FileMeshBone {
    boneNameIndex = 0 //uint

    parentIndex = 0 //ushort
    lodParentIndex = 0 //ushort

    culling = 0 //float

    rotationMatrix = [] //3x3, world space, y up, -z forward

    position = []
}

class FileMeshSubset {
    facesBegin = 0 //uint
    facesLength = 0 //uint

    vertsBegin = 0 //uint
    vertsLength = 0 //uint

    numBoneIndices = 0 //uint
    boneIndices = [] //ushort[26]
}

class FileMeshSkinning {
    subsetIndices = [] //byte[4]
    boneWeights = [] //byte[4]
}

class SKINNING {
    numSkinnings = 0 //uint (same as numVerts)
    skinnings = [] //TODO: check if its actually here in the chunk format, im assuming MaximumADHD forgot to note it down because its not always present OR it was merged with vertices

    numBones = 0 //uint
    bones = [] //FileMeshBone[]

    nameTableSize = 0 //uint
    nameTable = [] //string[]

    numSubsets = 0 //uint
    subsets = [] //FileMeshSubset[]
}

function readSubset(view) {
    let subset = new FileMeshSubset()

    subset.facesBegin = view.readUint32()
    subset.facesLength = view.readUint32()

    subset.vertsBegin = view.readUint32()
    subset.vertsLength = view.readUint32()

    subset.numBoneIndices = view.readUint32()
    for (let i = 0; i < 26; i++) subset.boneIndices.push(view.readUint16());

    return subset
}

function readBone(view) {
    let bone = new FileMeshBone()

    bone.boneNameIndex = view.readUint32()

    bone.parentIndex = view.readUint16()
    bone.lodParentIndex = view.readUint16()

    bone.culling = view.readFloat32()

    for (let i = 0; i < 9; i++) bone.rotationMatrix.push(view.readFloat32());

    bone.position = [view.readFloat32(), view.readFloat32(), view.readFloat32()]

    return bone
}

function readSkinning(view) {
    let skinning = new FileMeshSkinning()

    for (let i = 0; i < 4; i++)  skinning.subsetIndices.push(view.readUint8());
    for (let i = 0; i < 4; i++)  skinning.boneWeights.push(view.readUint8());

    return skinning
}

function readVert(view, sizeOf_vert = 40) {
    let position = [view.readFloat32(), view.readFloat32(), view.readFloat32()]
    let normal = [view.readFloat32(), view.readFloat32(), view.readFloat32()]
    let uv = [view.readFloat32(), view.readFloat32()]

    let tangent = [view.readInt8(), view.readInt8(), view.readInt8(), view.readInt8()]

    let color = [255,255,255,255]
    if (sizeOf_vert == 40) {
        color = [view.readUint8(),view.readUint8(),view.readUint8(),view.readUint8()]
    }

    return new FileMeshVertex(position, normal, uv, tangent, color)
}

function readFace(view) {
    let a = view.readUint32()
    let b = view.readUint32()
    let c = view.readUint32()

    return new FileMeshFace(a,b,c)
}

class FileMesh {
    version //version (at start of file, including \n)
    
    coreMesh //COREMESH
    lods //LODS
    skinning //SKINNING

    _size = null

    get size() {
        if (!this._size) {
            //max mesh size is 2048 i think? so this should be enough
            let minX = 999999
            let maxX = -999999

            let minY = 999999
            let maxY = -999999

            let minZ = 999999
            let maxZ = -999999

            for (let vert of this.coreMesh.verts) {
                let pos = vert.position

                minX = Math.min(minX, pos[0])
                maxX = Math.max(maxX, pos[0])

                minY = Math.min(minY, pos[1])
                maxY = Math.max(maxY, pos[1])

                minZ = Math.min(minZ, pos[2])
                maxZ = Math.max(maxZ, pos[2])
            }

            this._size = [maxX - minX, maxY - minY, maxZ - minZ]
        }

        return this._size
    }

    reset() {
        this.version = "version 1.0.0\n"
        this.coreMesh = new COREMESH()
        this.lods = new LODS()
        this.skinning = new SKINNING()
    }

    fromBuffer(buffer) {
        this.reset()

        let view = new SimpleView(buffer)
        let version = view.readUtf8String(13)

        this.version = version

        switch (version) {
            case "version 1.00\r":
            case "version 1.00\n":
            case "version 1.01\r":
            case "version 1.01\n":
                {
                let bufferAsLines = new TextDecoder().decode(buffer).split("\n")
                this.coreMesh.numfaces = Number(bufferAsLines[1])
                this.coreMesh.numverts = this.coreMesh.numfaces * 3

                let vertData = bufferAsLines[2].replaceAll("[","").split("]")
                vertData.pop()

                for (let i = 0; i < this.coreMesh.numfaces; i++) {
                    for (let j = 0; j < 3; j++) {
                        let positionString = vertData[i*9 + j*3]
                        let normalString = vertData[i*9 + j*3 + 1]
                        let uvString = vertData[i*9 + j*3 + 2]

                        let position = positionString.split(",").map((val) => {return Number(val)})
                        if (version.startsWith("version 1.00")) {
                            position[0] *= 0.5
                            position[1] *= 0.5
                            position[2] *= 0.5
                        }
                        let normal = normalString.split(",").map((val) => {return Number(val)})
                        let uv = uvString.split(",").map((val) => {return Number(val)})
                        uv.pop()
                        uv[1] = 1 - uv[1]

                        let vert = new FileMeshVertex(position, normal, uv)
                        this.coreMesh.verts.push(vert)
                        
                    }

                    this.coreMesh.faces.push(new FileMeshFace(i*3 + 0, i*3 + 1, i*3 + 2))
                }

                break
                }
            case "version 2.00\n":
            case "version 3.00\n":
            case "version 3.01\n":
                {
                let sizeOf_header = view.readUint16()
                let sizeOf_vert = view.readUint8() //important, 36 or 40 (without or with color)
                let sizeOf_face = view.readUint8()

                let sizeOf_LodOffset = 0
                let numLodOffsets = 0

                if (!version.startsWith("version 2")) { //has LODs
                    sizeOf_LodOffset = view.readUint16()
                    numLodOffsets = view.readUint16()
                    this.lods.numLodOffsets = numLodOffsets
                }

                this.coreMesh.numverts = view.readUint32()
                this.coreMesh.numfaces = view.readUint32()

                //verts
                for (let i = 0; i < this.coreMesh.numverts; i++) {
                    this.coreMesh.verts.push(readVert(view, sizeOf_vert))
                }

                //faces
                for (let i = 0; i < this.coreMesh.numfaces; i++) {
                    this.coreMesh.faces.push(readFace(view))
                }

                //lodOffsets
                for (let i = 0; i < numLodOffsets; i++) {
                    this.lods.lodOffsets.push(view.readUint32())
                }
                
                break
                }
            case "version 4.00\n":
            case "version 4.01\n":
            case "version 5.00\n": //TODO: actually properly parse v5
                {
                //header
                let sizeOf_header = view.readUint16()
                this.lods.lodType = view.readUint16()

                this.coreMesh.numverts = view.readUint32()
                this.coreMesh.numfaces = view.readUint32()

                this.lods.numLodOffsets = view.readUint16()
                this.skinning.numBones = view.readUint16()

                this.skinning.nameTableSize = view.readUint32()
                this.skinning.numSubsets = view.readUint16()

                this.lods.numHighQualityLODs = view.readInt8()
                let unused = view.readInt8() //padding?

                if (version === "version 5.00\n") {
                    view.viewOffset += 8
                }
                
                //verts
                for (let i = 0; i < this.coreMesh.numverts; i++) {
                    this.coreMesh.verts.push(readVert(view))
                }

                //bones
                if (this.skinning.numBones > 0) {
                    for (let i = 0; i < this.coreMesh.numverts; i++) {
                        this.skinning.skinnings.push(readSkinning(view))
                    }
                }

                //faces
                for (let i = 0; i < this.coreMesh.numfaces; i++) {
                    this.coreMesh.faces.push(readFace(view))
                }

                //lodOffsets
                for (let i = 0; i < this.lods.numLodOffsets; i++) {
                    this.lods.lodOffsets.push(view.readUint32())
                }

                //bones
                for (let i = 0; i < this.skinning.numBones; i++) {
                    this.skinning.bones.push(readBone(view))
                }

                //bone names
                let lastString = ""
                for (let i = 0; i < this.skinning.nameTableSize; i++) {
                    if (view.readUint8() !== 0) {
                        view.viewOffset--;
                        lastString += view.readUtf8String(1)
                    } else {
                        this.skinning.nameTable.push(lastString)
                        lastString = ""
                    }
                }

                //subsets
                for (let i = 0; i < this.skinning.numSubsets; i++) {
                    this.skinning.subsets.push(readSubset(view))
                }

                break
                }
            default:
                console.warn(`Failed to read mesh, unknown version: ${version}`)
        }

        console.log(`Bytes left: ${view.view.byteLength - view.viewOffset}`)
    }

    constructor() {
        this.reset()
    }
}