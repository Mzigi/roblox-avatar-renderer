//base link = https://t#.rbxcdn.com/
//avatar 3d thumbnail redirect = https://thumbnails.roblox.com/v1/users/avatar-3d?userId=USERIDHERE
//outfit 3d thumbnail redirect = https://thumbnails.roblox.com/v1/users/outfit-3d?outfitId=OUTFITIDHERE

/* https://avatar.roblox.com/v1/avatar/render */

import * as THREE from '../modules/three.module.js';

import { OrbitControls } from '../modules/OrbitControls.js';

function AlertOff() {
    document.getElementById("alert").classList.remove("alertOn")
}

function get(hash) {
    for (var i = 31, t = 0; t < hash.length; t++)
        i ^= hash[t].charCodeAt(0);
    return `https://t${(i % 8).toString()}.rbxcdn.com/${hash}`;
}

let accessoryId = 73084604667772

let urlParams = new URLSearchParams(window.location.search)
let id = urlParams.get("id")
let userId = urlParams.get("userId")
accessoryId = id || accessoryId

const MeshType = {
    "Brick": 6,
    "Cylinder": 4,
    "FileMesh": 5,
    "Head": 0,
    "Sphere": 3,
    "Torso": 1,
    "Wedge": 2,
}

const HumanoidRigType = {
    "R6": 0,
    "R15": 1,
}

const BodyPart = {
    "Head": 0,
    "Torso": 1,
    "LeftArm": 2,
    "RightArm": 3,
    "LeftLeg": 4,
    "RightLeg": 5,
}

const BodyPartNameToEnum = {
    "Head": BodyPart.Head,
    "Torso": BodyPart.Torso,
    "Left Arm": BodyPart.LeftArm,
    "Right Arm": BodyPart.RightArm,
    "Left Leg": BodyPart.LeftLeg,
    "Right Leg": BodyPart.RightLeg,

    //R15
    "LeftUpperArm": BodyPart.LeftArm,
    "LeftLowerArm": BodyPart.LeftArm,
    "LeftHand": BodyPart.LeftArm,

    "RightUpperArm": BodyPart.RightArm,
    "RightLowerArm": BodyPart.RightArm,
    "RightHand": BodyPart.RightArm,

    "LeftUpperLeg": BodyPart.LeftLeg,
    "LeftLowerLeg": BodyPart.LeftLeg,
    "LeftFoot": BodyPart.LeftLeg,

    "RightUpperLeg": BodyPart.RightLeg,
    "RightLowerLeg": BodyPart.RightLeg,
    "RightFoot": BodyPart.RightLeg,

    "UpperTorso": BodyPart.Torso,
    "LowerTorso": BodyPart.Torso,
}

function addAccessory() {
    fetch("https://assetdelivery.roblox.com/v1/asset?id=" + accessoryId).then((response) => {
        return response.arrayBuffer()
    }).then(buffer => {
        let startTime = performance.now()
        let model = new RBX()
        model.fromBuffer(buffer)
        console.log(`RBX took ${performance.now() - startTime} fromBuffer`)
        let treeTime = performance.now()
        model.generateTree()
        console.log(`RBX took ${performance.now() - treeTime} generateTree`)
        console.log(model)

        let accessory = model.instances[0]
        let handle = accessory.FindFirstChild("Handle")
        let meshIDstr = null
        
        let colorMapIDstr = ""
        let normalMapIDstr = ""
        let roughnessMapIDstr = ""
        let metalnessMapIDstr = ""
        
        console.log(accessory)
        console.log(handle)

        if (handle.className === "MeshPart") {
            meshIDstr = handle.Property("MeshId")

            let surfaceAppearance = handle.FindFirstChildOfClass("SurfaceAppearance")
            if (surfaceAppearance) {
                colorMapIDstr = surfaceAppearance.Property("ColorMap")
                normalMapIDstr = surfaceAppearance.Property("NormalMap")
                roughnessMapIDstr = surfaceAppearance.Property("RoughnessMap")
                metalnessMapIDstr = surfaceAppearance.Property("MetalnessMap")
            } else {
                colorMapIDstr = handle.Property("TextureID")
            }
        } else {
            let specialMesh = handle.FindFirstChildOfClass("SpecialMesh")
            meshIDstr = specialMesh.Property("MeshId")
            colorMapIDstr = specialMesh.Property("TextureId")
        }

        

        let meshId = idFromStr(meshIDstr)

        let meshMaterial = new THREE.MeshStandardMaterial({color: 0xffffff})
        let threeMesh = null

        fetch(`https://assetdelivery.roblox.com/v1/asset?id=${meshId}`).then((response) => {
            return response.arrayBuffer()
        }).then(buffer => {
            let startTime = performance.now()
            let mesh = new FileMesh()
            mesh.fromBuffer(buffer)
            console.log(`Mesh took ${performance.now() - startTime} fromBuffer`)

            let startThreeTime = performance.now()
            const geometry = new THREE.BufferGeometry()

            const verts = new Float32Array(mesh.coreMesh.verts.length * 3)
            for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
                verts[i * 3 + 0] = mesh.coreMesh.verts[i].position[0]
                verts[i * 3 + 1] = mesh.coreMesh.verts[i].position[1]
                verts[i * 3 + 2] = mesh.coreMesh.verts[i].position[2]
            }
            geometry.setAttribute("position", new THREE.BufferAttribute(verts, 3))

            const normals = new Float32Array(mesh.coreMesh.verts.length * 3)
            for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
                normals[i * 3 + 0] = mesh.coreMesh.verts[i].normal[0]
                normals[i * 3 + 1] = mesh.coreMesh.verts[i].normal[1]
                normals[i * 3 + 2] = mesh.coreMesh.verts[i].normal[2]
            }
            geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))

            const uvs = new Float32Array(mesh.coreMesh.verts.length * 2)
            for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
                uvs[i * 2 + 0] = mesh.coreMesh.verts[i].uv[0]
                uvs[i * 2 + 1] = 1 - mesh.coreMesh.verts[i].uv[1]
            }
            geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))

            let facesEnd = mesh.coreMesh.faces.length
            let facesStart = 0
            if (mesh.lods) {
                if (mesh.lods.lodOffsets.length >= 2) {
                    facesStart = mesh.lods.lodOffsets[0]
                    facesEnd = mesh.lods.lodOffsets[1]
                }
            }

            const indices = new Uint16Array((facesEnd - facesStart) * 3)
            for (let i = facesStart; i < facesEnd; i++) {
                indices[i * 3 + 0] = mesh.coreMesh.faces[i].a
                indices[i * 3 + 1] = mesh.coreMesh.faces[i].b
                indices[i * 3 + 2] = mesh.coreMesh.faces[i].c
            }

            geometry.setIndex(new THREE.BufferAttribute(indices, 1))
            console.log(`THREE.Mesh took ${performance.now() - startTime} `)

            threeMesh = new THREE.Mesh(geometry, meshMaterial)
            scene.add(threeMesh)
        })

        for (let mapStr of [[colorMapIDstr, "map"], [normalMapIDstr, "normalMap"], [roughnessMapIDstr, "roughnessMap"], [metalnessMapIDstr, "metalnessMap"]]) {
            let colorMapIDstr = mapStr[0]
            if (colorMapIDstr.length > 0) {
                let colorMapId = idFromStr(colorMapIDstr)

                console.log(`Fetching ${mapStr[1]} from ${`https://assetdelivery.roblox.com/v1/asset?id=${colorMapId}`}`)
                const loader = new THREE.TextureLoader();
                    loader.load(
                        `https://assetdelivery.roblox.com/v1/asset?id=${colorMapId}`, // Replace with the actual path to your PNG
                        function (texture) {
                            meshMaterial[mapStr[1]] = texture
                            texture.needsUpdate = true
                            meshMaterial.needsUpdate = true
                        },
                        undefined, // onProgress callback (optional)
                        function (err) {
                            console.error('An error occurred loading the texture:', err);
                        }
                    );
            }
        }
    })
}

function deg(radians) {
    return radians * 180 / Math.PI
}

function rad(degrees) {
    return degrees / 180 * Math.PI
}

let clothingToTexture = new Map()
let instanceToMesh = new Map()
let instanceToMeshInfo = new Map()
let meshStrToFileMesh = new Map()

class MeshInfo {
    cframe
    meshIDStr
    newSize = [1,1,1]
    oldSize = null
    colorMapIDstr = ""
    normalMapIDstr = ""
    roughnessMapIDstr = ""
    metalnessMapIDstr = ""

    constructor(cframe, meshIDStr, newSize, oldSize, colorMapIDstr, normalMapIDstr, roughnessMapIDstr, metalnessMapIDstr) {
        this.cframe = cframe
        this.meshIDStr = meshIDStr
        this.newSize = newSize
        this.oldSize = oldSize
        this.colorMapIDstr = colorMapIDstr
        this.normalMapIDstr = normalMapIDstr
        this.roughnessMapIDstr = roughnessMapIDstr
        this.metalnessMapIDstr = metalnessMapIDstr
    }
}

function setTHREEMeshCF(threeMesh, cframe) {
    threeMesh.position.set(cframe.Position[0], cframe.Position[1], cframe.Position[2])
    threeMesh.rotation.order = "YXZ"
    threeMesh.rotation.x = rad(cframe.Orientation[0])
    threeMesh.rotation.y = rad(cframe.Orientation[1])
    threeMesh.rotation.z = rad(cframe.Orientation[2])
}

function mapImg(ctx, img, sX, sY, sW, sH, oX, oY, oW, oH, rotation) {
    ctx.save()
    ctx.translate(oX,oY)
    ctx.rotate(rad(rotation))
    ctx.translate(-oX,-oY)

    ctx.drawImage(img, sX, sY, sW, sH, oX, oY, oW, oH)

    ctx.restore()
}

function loadClothing(clothingStr, callback) {
    let clothingSplit = clothingStr
    
    let shirtTemplate = null
    let pantsTemplate = null
    let tshirtTemplate = null
    let overlayTemplate = null

    for (let clothing of clothingSplit) {
        if (clothing.startsWith("shirt=")) {
            shirtTemplate = clothing.slice(6)
        } else if (clothing.startsWith("pants=")) {
            pantsTemplate = clothing.slice(6)
        } else if (clothing.startsWith("tshirt=")) {
            tshirtTemplate = clothing.slice(7)
        } else if (clothing.startsWith("overlay=")) {
            overlayTemplate = clothing.slice(8)
        }
    }

    //get ready for shirts and pants
    let shirtUrl = null
    let pantsUrl = null
    let tshirtUrl = null
    let overlayUrl = null

    let shirtImg = new Image()
    let pantsImg = new Image()
    let tshirtImg = new Image()
    let overlayImg = new Image()

    let imagesToLoad = 0
    let loadedImages = 0

    if (shirtTemplate) {
        shirtUrl = parseAssetString(shirtTemplate)
        imagesToLoad += 1
    }

    if (pantsTemplate) {
        pantsUrl = parseAssetString(pantsTemplate)
        imagesToLoad += 1
    }

    if (tshirtTemplate) {
        tshirtUrl = parseAssetString(tshirtTemplate)
        imagesToLoad += 1
    }

    if (overlayTemplate) {
        overlayUrl = parseAssetString(overlayTemplate)
        imagesToLoad += 1
    }

    //actually load them
    for (let [url, img] of [[shirtUrl, shirtImg],[pantsUrl,pantsImg],[tshirtUrl,tshirtImg],[overlayUrl,overlayImg]]) {
        if (url) {
            let onload = () => {
                loadedImages += 1
                if (loadedImages >= imagesToLoad) {
                    callback(pantsUrl, pantsImg, shirtUrl, shirtImg, tshirtUrl, tshirtImg, overlayUrl, overlayImg)
                }
            }

            img.addEventListener("load", onload)
            img.addEventListener("error", onload)
            img.crossOrigin = "anonymous"
            img.src = url
        }
    }
}

function drawSkinColor(clothingSplit, ctx, canvas) {
    let colorR = 0
    let colorG = 0
    let colorB = 0

    for (let clothing of clothingSplit) {
        if (clothing.startsWith("color=")) {
            let toSplit = clothing.slice(6)
            let colorStrs = toSplit.split(",")
            colorR = Number(colorStrs[0])
            colorG = Number(colorStrs[1])
            colorB = Number(colorStrs[2])
        }
    }

    //draw skin
    ctx.fillStyle = `rgb(${colorR},${colorG},${colorB})`
    ctx.fillRect(0,0,canvas.width,canvas.height)
}

function drawOverlay(clothingSplit, ctx, canvas, overlayUrl, overlayImg) {
    if (overlayUrl) {
        ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height)
    }
}

function destroyMesh(instance) {
    let threeMesh = instanceToMesh.get(instance)
    if (threeMesh) {
        console.log(`Destroying mesh for ${instance.GetFullName()}`)
        instanceToMesh.delete(instance)
        instanceToMeshInfo.delete(instance)
        threeMesh.geometry.dispose()
        threeMesh.material.dispose()
        scene.remove(threeMesh)
    }
}

function meshExists(instance) {
    return !!instanceToMesh.get(instance)
}

function addMesh(instance, cframe, meshIDStr, newSize = [1,1,1], oldSize = null, colorMapIDstr = "", normalMapIDstr = "", roughnessMapIDstr = "", metalnessMapIDstr = "") {
    let threeMesh = instanceToMesh.get(instance)
    let lastMeshInfo = instanceToMeshInfo.get(instance)
    instanceToMeshInfo.set(instance, new MeshInfo(cframe, meshIDStr, newSize, oldSize, colorMapIDstr, normalMapIDstr, roughnessMapIDstr, metalnessMapIDstr))

    let fetchStr = parseAssetString(meshIDStr)

    //update mesh based on new parameters if it already exists
    if (threeMesh) { //TODO: make this more modular and refreshable
        if (lastMeshInfo.newSize !== newSize || lastMeshInfo.oldSize !== oldSize) {
            let resizeFunc = async () => {
                if (!oldSize) {
                    let fileMeshPromise = meshStrToFileMesh.get(fetchStr)
                    if (fileMeshPromise) {
                        let fileMesh = await fileMeshPromise
                        oldSize = fileMesh.size
                    } else {
                        throw new Error("Mesh is not loading this should be done now...")
                        oldSize = [1,1,1]
                    }
                }

                let meshScale = [
                    newSize[0] / oldSize[0],
                    newSize[1] / oldSize[1],
                    newSize[2] / oldSize[2],
                ]
                threeMesh.scale.set(meshScale[0], meshScale[1], meshScale[2])
            }
            resizeFunc()
        }

        if (threeMesh.skeleton) {
            threeMesh.position.set(0,0,0)
            threeMesh.rotation.set(0,0,0)
            threeMesh.rotation.order = "YXZ"

            const bones = threeMesh.skeleton.bones
            for (let bone of bones) {
                let partEquivalent = instance.parent.FindFirstChild(bone.name)
                if (partEquivalent) {
                    /*let motor = null

                    for (let child of instance.parent.GetDescendants()) {
                        if (child.className === "Motor6D" && child.Prop("Part1") === partEquivalent) {
                            motor = child
                            break
                        }
                    }*/

                    //if (motor) {
                        /*let C0 = motor.Prop("C0")
                        let C1 = motor.Prop("C1")
                        let transform = motor.Prop("Transform")

                        let offset1 = C1.multiply(transform).inverse()
                        let finalCF = C0.multiply(offset1)*/

                        let cf = partEquivalent.Prop("CFrame").clone()
                        let pos = cf.Position
                        let rot = cf.Orientation

                        bone.position.set(pos[0],pos[1],pos[2])
                        bone.rotation.set(rad(rot[0]),rad(rot[1]),rad(rot[2]))
                    //}
                } else {
                    bone.position.set(0,0,0)
                    bone.rotation.set(0,0,0)
                }
            }

            threeMesh.skeleton.update()
        } else {
            if (lastMeshInfo.cframe !== cframe) {
                threeMesh.position.set(cframe.Position[0], cframe.Position[1], cframe.Position[2])
                threeMesh.rotation.order = "YXZ"
                threeMesh.rotation.x = rad(cframe.Orientation[0])
                threeMesh.rotation.y = rad(cframe.Orientation[1])
                threeMesh.rotation.z = rad(cframe.Orientation[2])
            }
        }
        
        return
    }

    console.log(`Adding mesh for ${instance.GetFullName()}`)

    let color = new THREE.Color(1,1,1)

    let affectedByPartColor = true //!(instance.className === "MeshPart" && colorMapIDstr.startsWith("clothing://"))
    let partColor = null

    if (instance.HasProperty("Color")) {
        partColor = instance.Property("Color")
        if (partColor && !colorMapIDstr) {
            color = new THREE.Color(partColor.R / 255, partColor.G / 255, partColor.B / 255)
        }
    }

    //create mesh material
    let meshMaterialDescription = {color: color/*, transparent: true, opacity: 0.5*/}
    if (instance.HasProperty("Transparency")) {
        let transparency = instance.Prop("Transparency")
        if (transparency > 0.01) {
            if (transparency <= 0.99) {
                meshMaterialDescription.transparent = true
                meshMaterialDescription.opacity = 1 - transparency
            } else {
                meshMaterialDescription.visible = false
            }
        }
    }
    console.log(meshMaterialDescription)

    let meshMaterial = new THREE.MeshStandardMaterial(meshMaterialDescription)
    threeMesh = new THREE.Mesh()
    threeMesh.castShadow = true
    threeMesh.receiveShadow = true

    instanceToMesh.set(instance, threeMesh)

    function onMeshLoaded(mesh) {
        if (!meshExists(instance)) return
        
        console.log(`Loaded mesh for ${instance.GetFullName()}`, mesh)

        if (!oldSize) {
            oldSize = mesh.size
        }

        const geometry = new THREE.BufferGeometry()

        //position
        const verts = new Float32Array(mesh.coreMesh.verts.length * 3)
        for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
            verts[i * 3 + 0] = mesh.coreMesh.verts[i].position[0]
            verts[i * 3 + 1] = mesh.coreMesh.verts[i].position[1]
            verts[i * 3 + 2] = mesh.coreMesh.verts[i].position[2]
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(verts, 3))

        //normal
        const normals = new Float32Array(mesh.coreMesh.verts.length * 3)
        for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
            normals[i * 3 + 0] = mesh.coreMesh.verts[i].normal[0]
            normals[i * 3 + 1] = mesh.coreMesh.verts[i].normal[1]
            normals[i * 3 + 2] = mesh.coreMesh.verts[i].normal[2]
        }
        geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))

        //uv
        const uvs = new Float32Array(mesh.coreMesh.verts.length * 2)
        for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
            uvs[i * 2 + 0] = mesh.coreMesh.verts[i].uv[0]
            uvs[i * 2 + 1] = 1 - mesh.coreMesh.verts[i].uv[1]
        }
        geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))

        //faces
        let facesEnd = mesh.coreMesh.faces.length
        let facesStart = 0
        if (mesh.lods) {
            if (mesh.lods.lodOffsets.length > 2) {
                facesStart = mesh.lods.lodOffsets[0]
                facesEnd = mesh.lods.lodOffsets[1]
            }
        }

        //indices
        const indices = new Uint16Array((facesEnd - facesStart) * 3)
        for (let i = facesStart; i < facesEnd; i++) {
            indices[i * 3 + 0] = mesh.coreMesh.faces[i].a
            indices[i * 3 + 1] = mesh.coreMesh.faces[i].b
            indices[i * 3 + 2] = mesh.coreMesh.faces[i].c
        }
        geometry.setIndex(new THREE.BufferAttribute(indices, 1))

        //create and add mesh to scene
        threeMesh.geometry = geometry
        threeMesh.material = meshMaterial
        setTHREEMeshCF(threeMesh, cframe)
        if (instance.Prop("Name") === "UpperTorso") {
            controls.target.set(cframe.Position[0],cframe.Position[1],cframe.Position[2])
            camera.position.set(cframe.Position[0],cframe.Position[1],cframe.Position[2] - 5)
        }

        let meshScale = [
            newSize[0] / oldSize[0],
            newSize[1] / oldSize[1],
            newSize[2] / oldSize[2],
        ]
        threeMesh.scale.set(meshScale[0], meshScale[1], meshScale[2])

        scene.add(threeMesh)
    }

    let cachedFileMesh = meshStrToFileMesh.get(fetchStr)
    if (cachedFileMesh) {
        cachedFileMesh.then((mesh) => {
            onMeshLoaded(mesh)
        })
    } else {
        let fileMeshPromise = new Promise((resolve, reject) => {
            fetch(fetchStr).then((response) => {
                console.log(`Fetching mesh for ${instance.GetFullName()} from ${fetchStr}`)
                return response.arrayBuffer()
            }).then(buffer => {
                let mesh = new FileMesh()
                mesh.fromBuffer(buffer)
                resolve(mesh)

                onMeshLoaded(mesh)
            })
        })

        meshStrToFileMesh.set(fetchStr, fileMeshPromise)
    }

    for (let mapStr of [[colorMapIDstr, "map"], [normalMapIDstr, "normalMap"], [roughnessMapIDstr, "roughnessMap"], [metalnessMapIDstr, "metalnessMap"]]) {
        let colorMapIDstr = mapStr[0]
        if (colorMapIDstr.length > 0) {
            if (!colorMapIDstr.includes("clothing")) {
                let colorMapId = parseAssetString(colorMapIDstr)

                console.log(`Fetching ${mapStr[1]} from ${`${colorMapId}`}`)
                if (!affectedByPartColor) { //TODO: make sure there is no transparency by stretching the colors or something?
                    const loader = new THREE.TextureLoader();
                        loader.load(
                            `${colorMapId}`, // Replace with the actual path to your PNG
                            function (texture) {
                                if (!meshExists(instance)) return
                                meshMaterial[mapStr[1]] = texture
                                texture.needsUpdate = true
                                meshMaterial.needsUpdate = true
                            },
                            undefined, // onProgress callback (optional)
                            function (err) {
                                console.error('An error occurred loading the texture:', err);
                            }
                        );
                } else {
                    let colorMap = new Image()
                    colorMap.addEventListener("load", () => {
                        if (!meshExists(instance)) return
                        let canvas = document.createElement("canvas")
                        let ctx = canvas.getContext("2d")
                        
                        canvas.width = colorMap.width
                        canvas.height = colorMap.height

                        if (partColor) {
                            ctx.fillStyle = `rgb(${partColor.R},${partColor.G},${partColor.B})`
                        } else {
                            ctx.fillStyle = "#ffffffff"
                        }

                        ctx.fillRect(0,0,canvas.width,canvas.height)
                        ctx.drawImage(colorMap,0,0)

                        let texture = new THREE.CanvasTexture(canvas)
                        meshMaterial[mapStr[1]] = texture
                        meshMaterial.needsUpdate = true
                    })
                    colorMap.crossOrigin = "anonymous"
                    colorMap.src = colorMapId
                }
            } else { //TODO: also care about body part texture
                let clothingTexture = clothingToTexture.get(colorMapIDstr)

                if (!clothingTexture) { //render clothing texture
                    let canvas = document.createElement("canvas")
                    let ctx = canvas.getContext("2d")

                    if (colorMapIDstr.startsWith("clothingR15")) { //R15
                        console.log(colorMapIDstr)

                        let limbId = Number(colorMapIDstr.at(12))
                        if (limbId === BodyPart.Torso) {
                            canvas.width = 388
                            canvas.height = 272
                        } else {
                            canvas.width = 264
                            canvas.height = 284
                        }

                        let clothingSplit = colorMapIDstr.slice(16).split(" & ")
                        
                        //create texture
                        clothingTexture = new THREE.CanvasTexture(canvas)
                        drawSkinColor(clothingSplit, ctx, canvas)
                        clothingToTexture.set(colorMapIDstr, clothingTexture)

                        function renderClothingToCanvasR15(pantsUrl, pantsImg, shirtUrl, shirtImg, tshirtUrl, tshirtImg, overlayUrl, overlayImg) {
                            if (!meshExists(instance)) return
                            let isArm = limbId === BodyPart.LeftArm || limbId === BodyPart.RightArm

                            //limbs
                            if (limbId !== BodyPart.Torso) {
                                let isLeft = limbId === BodyPart.LeftArm || limbId === BodyPart.LeftLeg

                                let url = isArm ? shirtImg : pantsImg
                                if (url) {
                                    let img = isArm ? shirtImg : pantsImg

                                    let startX = isLeft ? 308 : 217
                                    let i = isLeft ? 1 : -3

                                    //top
                                    mapImg(ctx, img, startX, 289, 64, 64, 2, 66, 64, 64, -90)

                                    //bottom
                                    mapImg(ctx, img, startX, 485, 64, 64, 198, 218, 64, 64, 0)

                                    //front
                                    mapImg(ctx, img, startX + 66*0, 355, 64, 114, 66 + 64*0, 66, 64, 114, 0)
                                    mapImg(ctx, img, startX + 66*0, 469, 64, 14, 66 + 64*0, 216, 64, 18, 0)
                                        //in betweens (TODO: make this more accurate)
                                        mapImg(ctx, img, startX + 66*0, 417, 64, 3, 0, 198, 36, 18, 0) //top of lower leg
                                        mapImg(ctx, img, startX + 66*0, 465, 64, 3, 160, 254, 36, 18, 0) //top of feet
                                        mapImg(ctx, img, startX + 66*0, 417, 64, 3, 103, 45, 36, 18, 180) //bottom of upper leg
                                        mapImg(ctx, img, startX + 66*0, 465, 64, 3, 71, 197, 36, 18, 180) //bottom of lower leg

                                    //left
                                    mapImg(ctx, img, startX + 66*i, 355, 64, 114, 66 + 64*1, 66, 64, 114, 0)
                                    mapImg(ctx, img, startX + 66*i, 469, 64, 14, 66 + 64*1, 216, 64, 18, 0)
                                    i++

                                    //back
                                    mapImg(ctx, img, startX + 66*i, 355, 64, 114, 66 + 64*2, 66, 64, 114, 0)
                                    mapImg(ctx, img, startX + 66*i, 469, 64, 14, 2, 236, 64, 18, 0)
                                    //in betweens (TODO: make this more accurate)
                                        mapImg(ctx, img, startX + 66*i, 417, 64, 3, 35, 197, 36, 18, 180) //top of lower leg
                                        mapImg(ctx, img, startX + 66*i, 465, 64, 3, 195, 253, 36, 18, 180) //top of feet
                                        mapImg(ctx, img, startX + 66*i, 417, 64, 3, 68, 46, 36, 18, 0) //bottom of upper leg
                                        mapImg(ctx, img, startX + 66*i, 465, 64, 3, 36, 198, 36, 18, 0) //bottom of lower leg
                                    i++

                                    //right
                                    mapImg(ctx, img, startX + 66*i, 355, 64, 114, 66 + 64*-1, 66, 64, 114, 0)
                                    mapImg(ctx, img, startX + 66*i, 469, 64, 14, 66 + 64*-1, 216, 64, 18, 0)
                                    i++
                                }
                            } else { //torso
                                //shirt and pants
                                let imgs = []
                                if (pantsUrl) {
                                    imgs.push(pantsImg)
                                }
                                if (shirtUrl) {
                                    imgs.push(shirtImg)
                                }

                                for (let img of imgs) {
                                    //front
                                    mapImg(ctx, img, 231, 74, 128, 128, 2, 74, 128, 128, 0)

                                    //left
                                    mapImg(ctx, img, 361, 74, 64, 128, 130, 74, 64, 128, 0)

                                    //back
                                    mapImg(ctx, img, 427, 74, 128, 128, 194, 74, 128, 128, 0)

                                    //right
                                    mapImg(ctx, img, 165, 74, 64, 128, 322, 74, 64, 128, 0)

                                    //top
                                    mapImg(ctx, img, 231, 8, 128, 64, 2, 10, 128, 64, 0)

                                    //bottom
                                    mapImg(ctx, img, 231, 204, 128, 64, 2, 202, 128, 64, 0)

                                    //cheap cover for top of lower torso TODO: make this more accurate
                                    mapImg(ctx, img, 231, 169, 128, 2, 134, 222, 64, 16, 0)
                                    mapImg(ctx, img, 427, 169, 128, 2, 134, 206, 64, 16, 0)

                                    //cheap cover for bottom of upper torso TODO: also make this more accurate
                                    mapImg(ctx, img, 231, 170, 128, 2, 134, 38, 64, 16, 0)
                                    mapImg(ctx, img, 427, 170, 128, 2, 134, 54, 64, 16, 0)
                                }

                                if (tshirtUrl) {
                                    //tshirt
                                    mapImg(ctx, tshirtImg, 0, 0, tshirtImg.width, tshirtImg.height, 2, 74, 128, 128, 0)
                                }
                            }

                            drawOverlay(clothingSplit, ctx, canvas, overlayUrl, overlayImg)

                            clothingTexture.needsUpdate = true
                        }

                        loadClothing(clothingSplit, renderClothingToCanvasR15)
                    } else { //R6
                        canvas.width = 768
                        canvas.height = 512

                        //ctx.clearRect(0,0,canvas.width,canvas.height)

                        let clothingSplit = colorMapIDstr.slice(11).split(" & ")

                        //create texture
                        clothingTexture = new THREE.CanvasTexture(canvas)
                        drawSkinColor(clothingSplit, ctx, canvas)
                        clothingToTexture.set(colorMapIDstr, clothingTexture)

                        function renderClothingToCanvasR6(pantsUrl, pantsImg, shirtUrl, shirtImg, tshirtUrl, tshirtImg, overlayUrl, overlayImg) {
                            if (!meshExists(instance)) return
                            for (let cloth of [[pantsUrl, pantsImg],[shirtUrl, shirtImg]]) {
                                let url = cloth[0]
                                let img = cloth[1]

                                if (url) {
                                    //front
                                    mapImg(ctx, img, 231, 74, 128, 128, 122, 64, 128, 100, 90)
                                    
                                    //back
                                    mapImg(ctx, img, 427, 74, 128, 128, 122, 256, 128, 100, 90)

                                    //left
                                    mapImg(ctx, img, 361, 74, 64, 128, 122, 192, 64, 100, 90)

                                    //right (why did they make 2 spots??, one of them barely even covers anything)
                                    mapImg(ctx, img, 165, 74, 64, 128, 122, 0, 64, 100, 90)
                                    mapImg(ctx, img, 165, 74, 64, 128, 122, 384, 64, 100, 90)

                                    //top
                                    mapImg(ctx, img, 231, 8, 128, 64, 150, 328, 96, 64, 0)
                                
                                    //bottom
                                    mapImg(ctx, img, 231, 204, 128, 64, 252, 328, 96, 64, 0)
                                }
                            }

                            if (pantsUrl) { //render pants
                                //right leg
                                    //front
                                    mapImg(ctx, pantsImg, 217, 355, 64, 128, 272 + 300, 192, 64, 100, 90)

                                    //right
                                    mapImg(ctx, pantsImg, 151, 355, 64, 128, 272 + 300, 128, 64, 100, 90)

                                    //back
                                    mapImg(ctx, pantsImg, 85, 355, 64, 128, 272 + 300, 64, 64, 100, 90)

                                    //left
                                    mapImg(ctx, pantsImg, 19, 355, 64, 128, 272 + 300, 256, 64, 100, 90)
                                    mapImg(ctx, pantsImg, 19, 355, 64, 128, 272 + 300, 0, 64, 100, 90)

                                    //top
                                    mapImg(ctx, pantsImg, 217, 289, 64, 64, 354, 328, 48, 64, 0)

                                    //bottom
                                    mapImg(ctx, pantsImg, 217, 485, 64, 64, 462, 328, 48, 64, 0)
                                //left leg
                                    //front
                                    mapImg(ctx, pantsImg, 308, 355, 64, 128, 422 + 300, 64, 64, 100, 90)

                                    //right
                                    mapImg(ctx, pantsImg, 506, 355, 64, 128, 422 + 300, 0, 64, 100, 90)
                                    mapImg(ctx, pantsImg, 506, 355, 64, 128, 422 + 300, 256, 64, 100, 90)

                                    //back
                                    mapImg(ctx, pantsImg, 440, 355, 64, 128, 422 + 300, 192, 64, 100, 90)

                                    //left
                                    mapImg(ctx, pantsImg, 374, 355, 64, 128, 422 + 300, 128, 64, 100, 90)

                                    //top
                                    mapImg(ctx, pantsImg, 308, 289, 64, 64, 408, 328, 48, 64, 0)

                                    //bottom
                                    mapImg(ctx, pantsImg, 308, 485, 64, 64, 516, 328, 48, 64, 0)
                            }
                            if (shirtUrl) { //render shirt
                                //right arm
                                    //front
                                    mapImg(ctx, shirtImg, 217, 355, 64, 128, 272, 192, 64, 100, 90)

                                    //right
                                    mapImg(ctx, shirtImg, 151, 355, 64, 128, 272, 128, 64, 100, 90)

                                    //back
                                    mapImg(ctx, shirtImg, 85, 355, 64, 128, 272, 64, 64, 100, 90)

                                    //left
                                    mapImg(ctx, shirtImg, 19, 355, 64, 128, 272, 256, 64, 100, 90)
                                    mapImg(ctx, shirtImg, 19, 355, 64, 128, 272, 0, 64, 100, 90)

                                    //top
                                    mapImg(ctx, shirtImg, 217, 289, 64, 64, 678, 328, 48, 64, 0)

                                    //bottom
                                    mapImg(ctx, shirtImg, 217, 485, 64, 64, 570, 328, 48, 64, 0)
                                //left arm
                                    //front
                                    mapImg(ctx, shirtImg, 308, 355, 64, 128, 422, 64, 64, 100, 90)

                                    //right
                                    mapImg(ctx, shirtImg, 506, 355, 64, 128, 422, 0, 64, 100, 90)
                                    mapImg(ctx, shirtImg, 506, 355, 64, 128, 422, 256, 64, 100, 90)

                                    //back
                                    mapImg(ctx, shirtImg, 440, 355, 64, 128, 422, 192, 64, 100, 90)

                                    //left
                                    mapImg(ctx, shirtImg, 374, 355, 64, 128, 422, 128, 64, 100, 90)

                                    //top
                                    mapImg(ctx, shirtImg, 308, 289, 64, 64, 150, 400, 48, 65, 0) //seam fix
                                    mapImg(ctx, shirtImg, 308, 289, 64, 64, 150, 400, 48, 64, 0)

                                    //bottom
                                    mapImg(ctx, shirtImg, 308, 485, 64, 64, 624, 328, 48, 64, 0)
                                    
                            }
                            if (tshirtUrl) {
                                mapImg(ctx, tshirtImg, 0, 0, tshirtImg.width, tshirtImg.height, 120, 64, 128, 96, 90)
                            }

                            drawOverlay(clothingSplit, ctx, canvas, overlayUrl, overlayImg)
                            clothingTexture.needsUpdate = true
                        }

                        loadClothing(clothingSplit, renderClothingToCanvasR6)
                    }
                }

                if (!meshExists(instance)) return

                meshMaterial[mapStr[1]] = clothingTexture
                meshMaterial.needsUpdate = true
            }
        }
    }
}

function isAffectedByHumanoid(child) {
    let parent = child.parent
    if (!parent) {
        return false
    }
    if (BodyPartNameToEnum[child.Property("Name")] && child.name !== "Head") { //check if part is one of the parts inside an R6 rig affected by humanoids
        if (parent) {
            let humanoid = parent.FindFirstChildOfClass("Humanoid")
            if (humanoid) {
                return true
            }
        }
    }

    return false
}

function getClothingStr(rig, child) {
    let parent = rig

    let colorMapStr = ""

    let shirt = parent.FindFirstChildOfClass("Shirt")
    let pants = parent.FindFirstChildOfClass("Pants")
    let tshirt = parent.FindFirstChildOfClass("ShirtGraphic")

    let shirtTemplate = null
    let pantsTemplate = null
    let tshirtTemplate = null

    if (shirt) {
        shirtTemplate = "shirt=" + shirt.Property("ShirtTemplate")
    }

    if (pants) {
        pantsTemplate = "pants=" + pants.Property("PantsTemplate")
    }

    if (tshirt) {
        tshirtTemplate = "tshirt=" + tshirt.Property("Graphic")
    }

    let skinColor = child.Property("Color")

    if (shirtTemplate || pantsTemplate) {
        colorMapStr = "clothing://" + `color=${skinColor.R},${skinColor.G},${skinColor.B}`
        for (let template of [pantsTemplate, shirtTemplate, tshirtTemplate])  {
            if (template) {
                colorMapStr += " & " + template
            }
        }
    }

    return colorMapStr
}

function toMesh(child) {
    if (!["Part", "MeshPart"].includes(child.className)) {
        return
    }

    let cframe = child.Property("CFrame")

    switch (child.className) {
        case "Part": {
            let specialMesh = child.FindFirstChildOfClass("SpecialMesh")
            if (specialMesh) {
                let partSize = child.Property("Size")

                let v3S = specialMesh.Property("Scale")
                let scale = [v3S.X, v3S.Y, v3S.Z]
                
                let meshIDStr = ""
                let colorMapIDstr = ""

                switch (specialMesh.Property("MeshType")) {
                    case MeshType.FileMesh: {
                        meshIDStr = specialMesh.Property("MeshId")
                        colorMapIDstr = specialMesh.Property("TextureId")
                        break
                    }
                    case MeshType.Head: {
                        meshIDStr = "rbxasset://avatar/heads/head.mesh"
                        scale[0] *= 0.8
                        scale[1] *= 0.8
                        scale[2] *= 0.8
                        break
                    } //TODO: add the rest of the mesh types
                    default: {
                        console.warn(`MeshType ${specialMesh.Property("MeshType")} is not supported`)
                        break
                    }
                }

                if (colorMapIDstr.length === 0) { //prioritize mesh texture over decal
                    let decal = child.FindFirstChildOfClass("Decal")
                    if (decal) {
                        colorMapIDstr = decal.Property("Texture")
                    }
                }

                if (meshIDStr.length > 0) {
                    addMesh(child, cframe, meshIDStr, scale, [1,1,1], colorMapIDstr)
                }
                
            } else {
                let affectedByHumanoid = isAffectedByHumanoid(child)
                if (affectedByHumanoid) { //clothing and stuff
                    let parent = child.parent
                    let humanoid = parent.FindFirstChildOfClass("Humanoid")

                    if (humanoid.Property("RigType") === HumanoidRigType.R6) {
                        //get mesh of body part based on CharacterMesh
                        let characterMeshStr = null
                        let overlayTextureId = 0
                        let children2 = parent.GetChildren()
                        for (let child2 of children2) {
                            if (child2.className === "CharacterMesh") {
                                if (BodyPartNameToEnum[child.Property("Name")] === child2.Property("BodyPart")) {
                                    //TODO: check if the other properties are important
                                    characterMeshStr = child2.Property("MeshId")
                                    overlayTextureId = child2.Property("OverlayTextureId")
                                }
                            }
                        }

                        if (!characterMeshStr) { //use default blocky meshes
                            characterMeshStr = `rbxasset://avatar/meshes/${["","torso","leftarm","rightarm","leftleg","rightleg"][BodyPartNameToEnum[child.Property("Name")]]}.mesh`
                        }

                        let colorMapStr = getClothingStr(parent, child)

                        if (overlayTextureId && overlayTextureId > 0) {
                            colorMapStr += " & overlay=" + parseAssetString(overlayTextureId)
                        }

                        addMesh(child, cframe, characterMeshStr, [1,1,1], [1,1,1], colorMapStr)
                    } else { //TODO: R15, clothing

                    }
                } else { //TODO: render as regular part (cube, cylinder, sphere, etc.)

                }
            }

            break
        }
        case "MeshPart": {
            let newSizeVec3 = child.Property("Size")
            let newSize = [newSizeVec3.X, newSizeVec3.Y, newSizeVec3.Z]
            let meshIDStr = child.Property("MeshId")

            let colorStr = ""
            let normalStr = ""
            let roughnessStr = ""
            let metalnessStr = ""
            
            let affectedByHumanoid = isAffectedByHumanoid(child)

            let surfaceAppearance = child.FindFirstChild("SurfaceAppearance")
            if (surfaceAppearance) { //TODO: do something with AlphaMode property to stop rthro characters from looking like flesh
                colorStr = surfaceAppearance.Property("ColorMap")
                normalStr = surfaceAppearance.Property("NormalMap")
                roughnessStr = surfaceAppearance.Property("RoughnessMap")
                metalnessStr = surfaceAppearance.Property("MetalnessMap")
                affectedByHumanoid = false
            } else {
                colorStr = child.Property("TextureID")
            }

            if (colorStr.length === 0) { //prioritize mesh texture over decal
                let decal = child.FindFirstChildOfClass("Decal")
                if (decal) {
                    colorStr = decal.Property("Texture")
                }
            }

            if (affectedByHumanoid) {
                let oldColorStr = colorStr
                colorStr = getClothingStr(child.parent, child).replace("clothing://", `clothingR15_${BodyPartNameToEnum[child.Prop("Name")]}://`)
                if (oldColorStr && oldColorStr.length > 0) {
                    colorStr += " & overlay=" + oldColorStr
                }
            }

            addMesh(child, cframe, meshIDStr, newSize, undefined, colorStr, normalStr, roughnessStr, metalnessStr)
            
            break
        }
    }
}

let instanceToConnectionsMap = new Map()

function removeRBXChild(child) {
    destroyMesh(child)

    if (instanceToConnectionsMap.get(child)) {
        for (let connection of instanceToConnectionsMap.get(child)) {
            connection.Disconnect()
        }
        instanceToConnectionsMap.delete(child)
    }
}

function removeRBX(rbx) {
    console.log("removing rbx")

    if (!rbx.treeGenerated) {
        rbx.generateTree()
    }

    let descendants = rbx.dataModel.GetDescendants()
    console.log(rbx.dataModel)
    console.log(descendants)
    for (let child of descendants) {
        removeRBXChild(child)
    }
}

function addRBXChild(child) {
    toMesh(child)

    let connections = []

    if (instanceToConnectionsMap.get(child)) {
        for (let connection of instanceToConnectionsMap.get(child)) {
            connection.Disconnect()
        }
    }

    connections.push(child.Changed.Connect(() => {
        toMesh(child)
    }))
    connections.push(child.Destroying.Connect(() => {
        removeRBXChild(child)
    }))
    connections.push(child.ChildAdded.Connect((newChild) => {
        for (let child of newChild.GetDescendants()) {
            addRBXChild(child)
        }
    }))

    instanceToConnectionsMap.set(child, connections)
}

function addRBX(rbx) {
    console.log("adding rbx")

    if (!rbx.treeGenerated) {
        rbx.generateTree()
    }

    let descendants = rbx.dataModel.GetDescendants()
    console.log(rbx.dataModel)
    console.log(descendants)
    for (let child of descendants) {
        addRBXChild(child)
    }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, 1 / 1, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias:true, antialiasing:true});
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(window.devicePixelRatio * 1)
renderer.setSize( 420, 420 );
renderer.domElement.setAttribute("style","width: 420px; height: 420; border-radius: 0px;")

renderer.domElement.setAttribute("id","OutfitInfo-outfit-image-3d")

scene.background = new THREE.Color( 0x2C2E31 );

const ambientLight = new THREE.AmbientLight( 0x7a7a7a );
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.7 );
//directionalLight.position.set(new THREE.Vector3(1.2,1,1.2))
directionalLight.position.set(-5,15,-8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 200;
directionalLight.target.position.set(0,0,0)
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.2 );
//directionalLight.position.set(new THREE.Vector3(1.2,1,1.2))
directionalLight2.position.set(5,-7,5)
directionalLight2.target.position.set(0,0,0)
scene.add( directionalLight2 );

const planeGeometry = new THREE.PlaneGeometry( 20, 20, 32, 32 );
const planeShadowMaterial = new THREE.ShadowMaterial({opacity: 0.5});
const shadowPlane = new THREE.Mesh( planeGeometry, planeShadowMaterial );
shadowPlane.rotation.set(rad(-90),0,0)
shadowPlane.position.set(0,0,0)
shadowPlane.receiveShadow = true;
scene.add( shadowPlane );

const planeSolidColorMaterial = new THREE.MeshBasicMaterial({color: 0x2c2e31})
const plane = new THREE.Mesh( planeGeometry, planeSolidColorMaterial );
plane.rotation.set(rad(-90),0,0)
plane.position.set(0,0,0)
plane.receiveShadow = false;
scene.add( plane );

//orbit controls
var controls = new OrbitControls(camera, renderer.domElement)
controls.maxDistance = 25
controls.zoomSpeed = 2
controls.target.set(0,3,0)
console.log(controls.target)
controls.update()

camera.position.set(0,3,-5)
camera.lookAt(new THREE.Vector3(0,3,0))

function animate() {
    renderer.render( scene, camera );

    requestAnimationFrame( () => {
        animate()
    } );
};

if (document.getElementById("accessory-render-container")) {
    document.getElementById("accessory-render-container").appendChild(renderer.domElement)
}

animate()

//addAccessory()
window.removeRBX = removeRBX
window.addRBX = addRBX

window.setRendererSize = (width, height) => {
    renderer.setSize(width, height)
}
window.getRendererDom = () => {
    return renderer.domElement
}

window.getRendererCamera = () => {
    return camera
}

window.getRendererControls = () => {
    return controls
}