//https://dom.rojo.space/binary.html

//API DUMP
//https://s3.amazonaws.com/setup.roblox.com/versionQTStudio
//https://s3.amazonaws.com/setup.roblox.com/[VERSION_HERE]-API-Dump.json

import * as THREE from '../modules/three.module.js';

function bitsToFloat32(bitString) {
    // Ensure the bit string is exactly 32 bits long
    bitString = bitString.padStart(32, "0").slice(-32);
    
    // Validate that the string contains only '0' or '1'
    for (let i = 0; i < 32; ++i) {
        if (bitString[i] !== '0' && bitString[i] !== '1') {
            throw new Error("A 32-bit string is expected.");
        }
    }
    
    // Create a 4-byte ArrayBuffer
    var buffer = new ArrayBuffer(4);
    // Create a Uint8Array view on the buffer to manipulate each byte
    var uint8View = new Uint8Array(buffer);
    
    // Convert the 32-bit string into bytes and store them in the buffer
    for (let i = 32, byteIndex = 0; i > 0; i -= 8) {
        uint8View[byteIndex++] = parseInt(bitString.substring(i - 8, i), 2);
    }
    
    // Convert the buffer back into a float32
    return new Float32Array(buffer)[0];
}

var saveByteArray = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.setAttribute("style","display: none;")
    return function (data, name) {
        var blob = new Blob(data, {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

class RBXSimpleView {
    view
    viewOffset
    buffer
    locked = false

    constructor (buffer) {
        this.view = new DataView(buffer)
        this.buffer = buffer
        this.viewOffset = 0
    }

    lock() {
        this.locked = true
    }

    unlock() {
        this.locked = false
    }

    lockCheck() {
        if (this.locked) {
            throw new Error("This RBXSimpleView is locked")
        }
    }

    writeUtf8String(value) {
        this.lockCheck()

        let stringBuffer = new TextEncoder().encode(value).buffer
        let stringSimpleView = new SimpleView(stringBuffer)

        this.writeUint32(stringBuffer.byteLength)

        for (let i = 0; i < stringBuffer.byteLength; i++) {
            this.writeUint8(stringSimpleView.readUint8())
        }
    }

    readUtf8String(stringLength) {
        this.lockCheck()

        if (!stringLength) {
            stringLength = this.readUint32()
        }
        let string = new TextDecoder().decode(new Uint8Array(this.view.buffer).subarray(this.viewOffset, this.viewOffset + stringLength))
        
        this.viewOffset += stringLength

        return string
    }

    writeFloat32(value, littleEndian = true) {
        this.lockCheck()

        throw new Error("NOT IMPLEMENTED")
    }

    readFloat32(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getUint32(this.viewOffset, littleEndian)

        //convert from roblox float to actual float
        /*
        //this did the exact opposite of what it was supposed to do
        let bitsValue = value.toString(2).padStart(32, '0')
        console.log(bitsValue)
        let signBit = bitsValue.at(0)
        let newBitsValue = bitsValue.substring(1) + signBit
        console.log(newBitsValue)

        let valueFloat = bitsToFloat32(newBitsValue)
        console.log(valueFloat)
        */
        let bitsValue = value.toString(2).padStart(32, '0')
        let signBit = bitsValue.at(31)
        let newBitsValue = signBit + bitsValue.substring(0,31)

        let valueFloat = bitsToFloat32(newBitsValue)

        this.viewOffset += 4
        
        return valueFloat
    }

    readNormalFloat32(littleEndian = true) {
        let value = this.view.getFloat32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    readFloat64(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getFloat64(this.viewOffset, littleEndian)

        this.viewOffset += 8

        return value
    }

    writeInt32(value, littleEndian = true) {
        this.lockCheck()

        value = Math.max(value, -2147483648)
        value = Math.min(value, 2147483647)

        this.view.setInt32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readInt32(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getInt32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    readInt64(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getBigInt64(this.viewOffset, littleEndian)
        this.viewOffset += 8
        
        return value
    }
    
    readInterleaved32(length, littleEndian = true, readFunc = "readInt32", byteOffset = 4) {
        this.lockCheck()

        length *= byteOffset

        let newBuffer = new ArrayBuffer(length)
        let newView = new RBXSimpleView(newBuffer)
        
        /*
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < length / 4; j++) {
                newView.viewOffset = i + j * 4
                newView.writeUint8(this.readUint8())
            }
        }
        */

        for (let i = 0; i < byteOffset; i++) {
            newView.viewOffset = i
            for (let j = 0; j < length / byteOffset; j++) {
                newView.writeUint8(this.readUint8())
                newView.viewOffset += byteOffset - 1
            }
        }

        newView.viewOffset = 0

        let outputArray = []

        for (let i = 0; i < length / byteOffset; i++) {
            outputArray.push(newView[readFunc](littleEndian))
        }

        return outputArray
    }

    writeUint32(value, littleEndian = true) {
        this.lockCheck()

        value = Math.max(value, 0)
        value = Math.min(value, 4294967295)

        this.view.setUint32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readUint32(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getUint32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    writeInt16(value, littleEndian = true) {
        this.lockCheck()

        value = Math.max(value, -32768)
        value = Math.min(value, 32767)

        this.view.setInt16(this.viewOffset, value, littleEndian)
        this.viewOffset += 2
    }

    readInt16(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getInt16(this.viewOffset, littleEndian)
        this.viewOffset += 2
        
        return value
    }

    writeUint16(value, littleEndian = true) {
        this.lockCheck()

        value = Math.max(value, 0)
        value = Math.min(value, 65535)

        this.view.setUint16(this.viewOffset, value, littleEndian)
        this.viewOffset += 2
    }

    readUint16(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getUint16(this.viewOffset, littleEndian)
        this.viewOffset += 2
        
        return value
    }

    writeInt8(value) {
        this.lockCheck()

        value = Math.max(value, -128)
        value = Math.min(value, 127)

        this.view.setInt8(this.viewOffset, value)
        this.viewOffset += 1
    }

    readInt8() {
        this.lockCheck()

        let value = this.view.getInt8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }

    writeUint8(value) {
        this.lockCheck()

        value = Math.max(value, 0)
        value = Math.min(value, 255)

        this.view.setUint8(this.viewOffset, value)
        this.viewOffset += 1
    }

    readUint8() {
        this.lockCheck()

        let value = this.view.getUint8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }
}

const magic = "<roblox!"
const xmlMagic = "<roblox "

var Buffer = require('buffer').Buffer
var LZ4 = require('lz4')

function convert_byte_array_to_int_array(array) {
     let output_array = [];
     for (byte of array) {
        output_array.push(parseInt(byte, 16));
     }
     return output_array;
}

function untransformInt32(num) {
    if (num % 2 === 0) {
        num /= 2
    } else {
        num = -(num + 1) / 2
    }

    return num
}

function untransformInt64(num) {
    if (num % 2n === 0n) {
        num /= 2n
    } else {
        num = -(num + 1n) / 2n
    }

    return num
}

function readReferents(length, chunkView) {
    let referents = chunkView.readInterleaved32(length, false)
    let lastReferent = 0
    //untransform
    for (let i = 0; i < referents.length; i++) {
        referents[i] = untransformInt32(referents[i])
    }

    //acummalative process
    for (let i = 0; i < referents.length; i++) {
        referents[i] = referents[i] + lastReferent
        lastReferent = referents[i]
    }

    return referents
}

function intToRgb(colorInt) {
  const R = (colorInt >> 16) & 0xFF; // Extract red component
  const G = (colorInt >> 8) & 0xFF;  // Extract green component
  const B = colorInt & 0xFF;         // Extract blue component

  return { R, G, B };
}

function toDegrees(radians) {
    return radians * 180 / Math.PI
}

function toRadians(degrees) {
    return degrees / 180 * Math.PI
}

window.deg = toDegrees
window.rad = toRadians

function rotationMatrixToEulerAnglesOLD(R) { //https://learnopencv.com/rotation-matrix-to-euler-angles/
    sy = Math.sqrt(R[0 + 0*3] * R[0 + 0*3] +  R[1 + 0*3] * R[1 + 0*3])
 
    singular = sy < 1e-6
 
    if (!singular) {
        y = -Math.atan2(R[2 + 1*3] , R[2 + 2*3])
        x = -Math.atan2(-R[2 + 0*3], sy)
        z = Math.atan2(R[1 + 0*3], R[0 + 0*3])
    } else {
        x = Math.atan2(-R[1 + 2*3], R[1 + 1*3])
        y = Math.atan2(-R[2 + 0*3], sy)
        z = 0
    }
 
    return [toDegrees(x), toDegrees(y), toDegrees(z), singular]
}

function specialClamp( value, min, max ) {
    return Math.max( min, Math.min( max, value ) );
}

function rotationMatrixToEulerAngles(te, order = "YXZ") { //from THREE.js
    const clamp = specialClamp;

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    const m11 = te[ 0 ], m12 = te[ 3 ], m13 = te[ 6 ];
    const m21 = te[ 1 ], m22 = te[ 4 ], m23 = te[ 7 ];
    const m31 = te[ 2 ], m32 = te[ 5 ], m33 = te[ 8 ];

    let x = 0
    let y = 0
    let z = 0

    switch ( order ) {

        case 'XYZ':

            y = Math.asin( clamp( m13, - 1, 1 ) );

            if ( Math.abs( m13 ) < 0.9999999 ) {

                x = Math.atan2( - m23, m33 );
                z = Math.atan2( - m12, m11 );

            } else {

                x = Math.atan2( m32, m22 );
                z = 0;

            }

            break;

        case 'YXZ':

            x = Math.asin( - clamp( m23, - 1, 1 ) );

            if ( Math.abs( m23 ) < 0.9999999 ) {

                y = Math.atan2( m13, m33 );
                z = Math.atan2( m21, m22 );

            } else {

                y = Math.atan2( - m31, m11 );
                z = 0;

            }

            break;

        case 'ZXY':

            x = Math.asin( clamp( m32, - 1, 1 ) );

            if ( Math.abs( m32 ) < 0.9999999 ) {

                y = Math.atan2( - m31, m33 );
                z = Math.atan2( - m12, m22 );

            } else {

                y = 0;
                z = Math.atan2( m21, m11 );

            }

            break;

        case 'ZYX':

            y = Math.asin( - clamp( m31, - 1, 1 ) );

            if ( Math.abs( m31 ) < 0.9999999 ) {

                x = Math.atan2( m32, m33 );
                z = Math.atan2( m21, m11 );

            } else {

                x = 0;
                z = Math.atan2( - m12, m22 );

            }

            break;

        case 'YZX':

            z = Math.asin( clamp( m21, - 1, 1 ) );

            if ( Math.abs( m21 ) < 0.9999999 ) {

                x = Math.atan2( - m23, m22 );
                y = Math.atan2( - m31, m11 );

            } else {

                x = 0;
                y = Math.atan2( m13, m33 );

            }

            break;

        case 'XZY':

            z = Math.asin( - clamp( m12, - 1, 1 ) );

            if ( Math.abs( m12 ) < 0.9999999 ) {

                x = Math.atan2( m32, m22 );
                y = Math.atan2( m13, m11 );

            } else {

                x = Math.atan2( - m23, m33 );
                y = 0;

            }

            break;

        default:

            console.warn( 'THREE.Euler: .setFromRotationMatrix() encountered an unknown order: ' + order );

    }

    return [toDegrees(x),toDegrees(y),toDegrees(z)];
}

const DataType = {
    "String": 0x01,
    "Bool": 0x02,
    "Int32": 0x03,
    "Float32": 0x04,
    "Float64": 0x05,
    "UDim": 0x06,
    "UDim2": 0x07,
    "Ray": 0x08,
    "Faces": 0x09, //NOT IMPLEMENTED
    "Axes": 0x0a, //NOT IMPLEMENTED
    "BrickColor": 0x0b,
    "Color3": 0x0c,
    "Vector2": 0x0d, //NOT IMPLEMENTED
    "Vector3": 0x0e,
    "CFrame": 0x10,
    "Enum": 0x12,
    "Referent": 0x13,

    "Color3uint8": 0x1a,
    "Int64": 0x1b,

    "Capabilites": 0x21, //NOT IMPLEMENTED
}

const PropertyTypeInfo = {
    "Pants": {
        "PantsTemplate": "String",
        "Name": "String",
        "archiveable": "Bool"
    },
    "Shirt": {
        "ShirtTemplate": "String",
        "Name": "String",
        "archiveable": "Bool"
    },
    "ShirtGraphic": {
        "Graphic": "String",
        "Name": "String",
        "archiveable": "Bool"
    }
}

//datatype structs
class UDim {
    Scale = 0 //Float32
    Offset = 0 //Int32
}

class UDim2 {
    X = new UDim()
    Y = new UDim()
}

class Ray {
    Origin = [0,0,0]
    Direction = [0,0,0]
}

class Vector3 {
    X = 0
    Y = 0
    Z = 0

    constructor(X,Y,Z) {
        this.X = X
        this.Y = Y
        this.Z = Z
    }

    multiply(vec3) {
        return new Vector3(this.X * vec3.X, this.Y * vec3.Y, this.Z * vec3.Z)
    }

    divide(vec3) {
        return new Vector3(this.X / vec3.X, this.Y / vec3.Y, this.Z / vec3.Z)
    }

    add(vec3) {
        return new Vector3(this.X + vec3.X, this.Y + vec3.Y, this.Z + vec3.Z)
    }

    minus(vec3) {
        return new Vector3(this.X - vec3.X, this.Y - vec3.Y, this.Z - vec3.Z)
    }

    static new(X,Y,Z) {
        return new Vector3(X,Y,Z)
    }
}

class Color3 {
    R = 0
    G = 0
    B = 0
}

class Color3uint8 {
    R = 0
    G = 0
    B = 0
}

class CFrame {
    Position = [0,0,0]
    Orientation = [0,0,0]

    constructor(x = 0, y = 0, z = 0) {
        this.Position = [x,y,z]
    }

    clone() {
        let cloneCF = new CFrame(this.Position[0], this.Position[1], this.Position[2])
        cloneCF.Orientation = [this.Orientation[0], this.Orientation[1], this.Orientation[2]]

        return cloneCF
    }

    getMatrix() {
        let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(this.Orientation[0]), rad(this.Orientation[1]), rad(this.Orientation[2]), "YXZ"))
        let transformMatrix = new THREE.Matrix4().makeTranslation(this.Position[0], this.Position[1], this.Position[2])

        return transformMatrix.multiply(new THREE.Matrix4().makeRotationFromQuaternion(quat)).toArray()
    }

    fromMatrix(m) {
        this.Orientation = rotationMatrixToEulerAngles([
            m[0],m[1],m[2],
            m[4],m[5],m[6],
            m[8],m[9],m[10]
        ])
        this.Position = [m[12],m[13],m[14]]

        return this
    }

    inverse() {
        let thisM = new THREE.Matrix4().fromArray(this.getMatrix())
        let inverse = new THREE.Matrix4()
        inverse.getInverse(thisM)

        return new CFrame().fromMatrix(inverse.elements)
    }

    multiply(cf) {
        let thisM = new THREE.Matrix4().fromArray(this.getMatrix())
        let cfM = new THREE.Matrix4().fromArray(cf.getMatrix())

        let newM = thisM.multiply(cfM)
        
        let newCf = new CFrame().fromMatrix(newM.elements)

        return newCf
    }
}

//hierarchy structs

class Connection {
    Connected = true
    _callback
    _event

    constructor(callback, event) {
        this._callback = callback
        this._event = event
    }

    Disconnect() {
        this.Connected = false
        this._event.Disconnect(this._callback)
    }
}

class Event {
    _callbacks = []

    Connect(callback) {
        this._callbacks.push(callback)
        return new Connection(callback, this)
    }

    Fire(...args) {
        for (let callback of this._callbacks) {
            callback(...args)
        }
    }

    Disconnect(callback) {
        let index = this._callbacks.indexOf(callback)
        if (index !== -1) {
            this._callbacks.splice(index,1)
        }
    }

    Clear() {
        this._callbacks = []
    }
}

class Property {
    name
    typeID
    _value //only to be changed by setProperty() method of Instance

    constructor(name = null, typeID = null) {
        this.name = name
        this.typeID = typeID
    }

    get value() {
        return this._value
    }
}

//scaling data
let originalPositionName = "OriginalPosition"
let originalSizeName = "OriginalSize"
let rigAttachmentName = "RigAttachment"

let stepHeightNarrow = 2.4
let stepHeightWide = 2.7

//Default positions of the attachments related to the Head part
let headAttachmentMap = {
	FaceCenterAttachment: Vector3.new(0, 0, 0),
	FaceFrontAttachment: Vector3.new(0, 0, -0.6),
	HairAttachment: Vector3.new(0, 0.6, 0),
	HatAttachment: Vector3.new(0, 0.6, 0),
	NeckRigAttachment: Vector3.new(0, -0.5, 0)
}

//Default scaling values for character with classic proportions (used in lerp calcuations with desired scaling factor)
let scalingWideValues = {
	LeftLowerArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	LeftFoot: Vector3.new(1.0789999961853, 1.2669999599457, 1.1289999485016),
	Head: Vector3.new(0.94199997186661, 0.94199997186661, 0.94199997186661),
	UpperTorso: Vector3.new(1.0329999923706, 1.3090000152588, 1.1399999856949),
	RightHand: Vector3.new(1.0659999847412, 1.1740000247955, 1.2309999465942),
	LowerTorso: Vector3.new(1.0329999923706, 1.3090000152588, 1.1399999856949),
	LeftUpperLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	LeftUpperArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	RightLowerArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	LeftHand: Vector3.new(1.0659999847412, 1.1740000247955, 1.2309999465942),
	RightUpperArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	RightUpperLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	RightLowerLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	RightFoot: Vector3.new(1.0789999961853, 1.2669999599457, 1.1289999485016),
	LeftLowerLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073)
}

//Default scaling values for character with classic proportions (used in lerp calcuations with desired scaling factor)
let scalingNarrowValues = {
	LeftLowerArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	LowerTorso: Vector3.new(0.9856870174408, 1.0046048164368, 1.0133333206177),
	Head: Vector3.new(0.89628922939301, 0.94199997186661, 0.89628922939301),
	UpperTorso: Vector3.new(0.90534615516663, 1.2042318582535, 1.0133333206177),
	RightHand: Vector3.new(0.94755554199219, 1.1740000247955, 1.0942221879959),
	RightFoot: Vector3.new(1.029580116272, 1.133273601532, 1.0035555362701),
	LeftFoot: Vector3.new(1.029580116272, 1.133273601532, 1.0035555362701),
	LeftUpperArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	RightLowerArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	LeftHand: Vector3.new(0.94755554199219, 1.1740000247955, 1.0942221879959),
	RightUpperLeg: Vector3.new(0.97614508867264, 1.4009301662445, 0.90933334827423),
	RightUpperArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	RightLowerLeg: Vector3.new(0.97614508867264, 1.300518155098, 0.90933334827423),
	LeftUpperLeg: Vector3.new(0.97614508867264, 1.4009301662445, 0.90933334827423),
	LeftLowerLeg: Vector3.new(0.97614508867264, 1.300518155098, 0.90933334827423)
}

//Default scaling values for character with slender or normal proportions
//(used in lerp calcuations with desired scaling factor)
let scalingNativeR15ToWide = {
	LeftLowerArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	LowerTorso: Vector3.new(0.98619323968887, 1.228501200676, 1.0822510719299),
	Head: Vector3.new(0.625, 0.625, 0.625),
	UpperTorso: Vector3.new(0.98619323968887, 1.228501200676, 1.0822510719299),
	RightHand: Vector3.new(0.71942448616028, 1.034126162529, 0.83263945579529),
	RightFoot: Vector3.new(0.71225070953369, 1.0493179559708, 1.0741138458252),
	LeftFoot: Vector3.new(0.71225070953369, 1.0493179559708, 1.0741138458252),
	LeftUpperArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	RightLowerArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	LeftHand: Vector3.new(0.71942448616028, 1.034126162529, 0.83263945579529),
	RightUpperLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	RightUpperArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	RightLowerLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	LeftUpperLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	LeftLowerLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869)
}

//Default scaling values for character with slender or normal proportions
//(used in lerp calcuations with desired scaling factor)
let scalingNativeR15ToNarrow = {
	LeftLowerArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	LowerTorso: Vector3.new(0.94102412462234, 0.94282519817352, 0.96200096607208),
	Head: Vector3.new(0.59467172622681, 0.625, 0.59467172622681),
	UpperTorso: Vector3.new(0.86432361602783, 1.130175948143, 0.96200096607208),
	RightHand: Vector3.new(0.63948839902878, 1.034126162529, 0.74012398719788),
	RightFoot: Vector3.new(0.67962855100632, 0.93856704235077, 0.95476788282394),
	LeftFoot: Vector3.new(0.67962855100632, 0.93856704235077, 0.95476788282394),
	LeftUpperArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	RightLowerArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	LeftHand: Vector3.new(0.63948839902878, 1.034126162529, 0.74012398719788),
	RightUpperLeg: Vector3.new(0.97566312551498, 1.1427917480469, 0.84175086021423),
	RightUpperArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	RightLowerLeg: Vector3.new(0.97566312551498, 1.0608818531036, 0.84175086021423),
	LeftUpperLeg: Vector3.new(0.97566312551498, 1.1427917480469, 0.84175086021423),
	LeftLowerLeg: Vector3.new(0.97566312551498, 1.0608818531036, 0.84175086021423)
}

//Linear interpolation function
function lerp(a,b,t) {
	return a + (b - a) * t
}

function lerpVec3(a,b,t) {
	return a.add((b.minus(a)).multiply(new Vector3(t,t,t)))
}

//Returns an array of the character parts
function GetCharacterParts(rig) {
	let characterParts = []
	for (let item of rig.GetChildren()) {
		if (item.className === "MeshPart" || item.className === "Part") {
		    characterParts.push(item)	
        }
    }
	return characterParts
}

//Returns the matching attachment found on the character
function FindFirstMatchingAttachment(attachmentName, rig) {
	let characterParts = GetCharacterParts(rig)
	for (let part of characterParts) {
		for (let child of part.GetChildren()) {
			if (child.Prop("Name") == attachmentName) {
				return child
            }
        }
    }
	return nil
}

//Returns the character part the accessory is attached to
function GetAttachedPart(accessory, rig) {
	let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	let accessoryWeld = handle.FindFirstChild("AccessoryWeld")
	if (accessoryWeld) {
		let attachedPart
		if (accessoryWeld.Prop("Part0") !== handle) {
			attachedPart = accessoryWeld.Prop("Part0")
        } else {
			attachedPart = accessoryWeld.Prop("Part1")
        }
		return attachedPart
    }

	let accessoryAttachment = handle.FindFirstChildOfClass("Attachment")
	if (accessoryAttachment) {
		let matchingAttachment = FindFirstMatchingAttachment(accessoryAttachment.Prop("Name"), rig)
		if (matchingAttachment && matchingAttachment.parent) {
			return matchingAttachment.parent
        }
    }

	return rig.Child("Head")
}

//Returns the scale of a part with consideration for proportion type
function getPartScale(part, wideToNarrow, anthroPercent, partType, baseType) {
	let scale = new Vector3(1.0,1.0,1.0)
	if (!part) {
		return scale
    }

	let partName = part.Prop("Name")

	let wideScale = scalingWideValues[partName]
	let narrowScale = scalingNarrowValues[partName]

	if (partType === "ProportionsNormal" || partType == "ProportionsSlender") {
		wideScale = scalingNativeR15ToWide[partName]
		narrowScale = scalingNativeR15ToNarrow[partName]
    }

	if (!wideScale) { wideScale = Vector3.new(1.0,1.0,1.0) }
	if (!narrowScale) { narrowScale = Vector3.new(1.0,1.0,1.0) }

	let anthroScale = lerpVec3(wideScale, narrowScale, wideToNarrow)
	scale = lerpVec3(scale, anthroScale, anthroPercent)

	let base = Vector3.new(1.0,1.0,1.0)
	if (baseType == "ProportionsNormal") {
		base = wideScale
    } else if (baseType == "ProportionsSlender") {
		base = narrowScale
    }

	scale = scale.divide(base)
	return scale
}

//Returns the original size of the part or will create one if it cannot find one
function getOriginalSize(part) {
	let originalSize = part.Prop("Size")
	let originalSizeValue = part.FindFirstChild(originalSizeName)
	if (originalSizeValue) {
		originalSize = originalSizeValue.Prop("Value")
    } else {
		let partSizeValue = new Instance("Vector3Value")
        partSizeValue.addProperty(new Property("Name", DataType.String), originalSizeName)
        partSizeValue.addProperty(new Property("Value", DataType.Vector3), part.Prop("Size"))
		partSizeValue.setParent(part)
    }
	return originalSize
}

const MeshType = {
    "Brick": 6,
    "Cylinder": 4,
    "FileMesh": 5,
    "Head": 0,
    "Sphere": 3,
    "Torso": 1,
    "Wedge": 2,
}

//Scales the attachment or special mesh child found on a part
function scaleChildrenOfPart(part, scaleVector) {
	for (let child of part.GetChildren()) {
		if (child.className === "Attachment") {
			let originalPosition = child.Prop("CFrame").Position
            originalPosition = new Vector3(originalPosition[0], originalPosition[1], originalPosition[2])
            originalPosition = originalPosition.multiply(scaleVector)

            let newCF = child.Prop("CFrame").clone()
            newCF.Position = [originalPosition.X, originalPosition.Y, originalPosition.Z]
			child.setProperty("CFrame", newCF)
        } else if (child.className === "SpecialMesh") {
			if (child.Prop("MeshType") !== MeshType.Head) {
				let orignalScale = child.Prop("Scale")
				child.setProperty("Scale", orignalScale.multiply(scaleVector))
            }
        }
    }
}

function ScaleAccessory(accessory, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale, rig) {
	let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	let attachedPart = GetAttachedPart(accessory, rig)

	let newScaleVector = bodyScaleVector
	if (attachedPart.Prop("Name") === "Head") {
		newScaleVector = headScaleVector
    }

	//find appropriate relative scaling with attached part
	if (attachedPart) {
		let scale = new Vector3(1,1,1)

	    let accessoryProportion = "Classic"
		if (accessory.FindFirstChild("AvatarPartScaleType")) {
			accessoryProportion = accessory.Child("AvatarPartScaleType").Prop("Value")
        }

	    if (accessoryProportion !== "Classic") {
	        scale = getPartScale(attachedPart, 0.0, 0.0, accessoryProportion, accessoryProportion);
        }

	    let attachedPartProportion = "Classic"
        let attachedPartScaleType = attachedPart.FindFirstDescendant("AvatarPartScaleType")
		if (attachedPartScaleType) {
			attachedPartProportion = attachedPartScaleType.Prop("Value")
        }

        //Support for how roblox scales R6
        if (!bodyTypeScale) {
            if (attachedPartProportion.startsWith("Proportions")) {
                bodyTypeScale = 1
            } else {
                bodyTypeScale = 0
            }
        }
        if (!bodyProportionScale) {
            if (attachedPartProportion === "ProportionsSlender") {
                bodyProportionScale = 1
            } else {
                bodyProportionScale = 0
            }
        }

		scale = scale.multiply(getPartScale(attachedPart, bodyProportionScale, bodyTypeScale, attachedPartProportion, "Classic"));
		newScaleVector = newScaleVector.multiply(scale)
    }

	let originalSize = getOriginalSize(handle)
	let currentScaleVector = handle.Prop("Size").divide(originalSize)
    let relativeScaleVector = newScaleVector.divide(currentScaleVector);

	//scale accessory and as well as its welds and attachments
    scaleChildrenOfPart(handle, relativeScaleVector)
	handle.setProperty("Size", originalSize.multiply(newScaleVector))
	accessory.AccessoryBuildWeld()
}

//Returns the original mesh scale of the part or will create one if it cannot find one
function getOriginalMeshScale(mesh) {
	let originalScale = mesh.Prop("Scale")
	let originalScaleValue = mesh.FindFirstChild(originalSizeName)
	if (originalScaleValue) {
		originalScale = originalScaleValue.Prop("Value")
    } else {
		let partScaleValue = new Instance("Vector3Value")
        partScaleValue.addProperty(new Property("Name", DataType.String), originalSizeName)
        partScaleValue.addProperty(new Property("Value", DataType.Vector3), mesh.Scale)
		partScaleValue.setParent(mesh)
    }
	return originalScale
}

//Returns the original attachment position or will create one if it cannot find one
function getOriginalAttachmentPosition(attachment) {
	let originalPosition = attachment.FindFirstChild(originalPositionName)
	if (originalPosition) {
		return originalPosition.Prop("Value")
    }

	let position = attachment.Prop("Position")

	let attachmentLocationValue = new Instance("Vector3Value")
    attachmentLocationValue.addProperty(new Property("Name", DataType.String), originalPositionName)
	attachmentLocationValue.addProperty(new Property("Value", DataType.Vector3), position)
	attachmentLocationValue.setParent(attachment)

	return position
}

//Scale character part and any attachments using values found in the configurations folder
function ScaleCharacterPart(part, bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow) {
	let partName = part.Prop("Name")
	let originalSize = getOriginalSize(part)

	let newScaleVector = bodyScaleVector
	if (partName == "Head") {
		newScaleVector = headScaleVector
    }

	//check for native part information on special mesh in the Head Part
	if (part && partName == "Head") {
		let mesh = part.FindFirstChildOfClass("SpecialMesh")
		if (mesh) {
			let nameNative = "AvatarPartScaleType"
			let meshScaleTypeValue = mesh.FindFirstChild(nameNative)
			if (meshScaleTypeValue) {
				let headScaleTypeValue = part.FindFirstChild(nameNative)
				if (!headScaleTypeValue) {
					headScaleTypeValue = new Instance("StringValue")
					if (headScaleTypeValue) {
                        headScaleTypeValue.addProperty(new Property("Value", DataType.String), "")
						headScaleTypeValue.addProperty(new Property("Name", DataType.String), nameNative)
						headScaleTypeValue.setParent(part)
                    }
                }
				if (headScaleTypeValue) {
					headScaleTypeValue.setProperty("Value", meshScaleTypeValue.Prop("Value"))
                }
            } else if (!part.className === "MeshPart") {
				let headScaleTypeValue = part.FindFirstChild(nameNative)
				if (headScaleTypeValue) {
					headScaleTypeValue.Destroy()
                }
            }
        } else if (!part.className === "MeshPart") {
			let nameNative = "AvatarPartScaleType";
			let headScaleTypeValue = part.FindFirstChild(nameNative)
			if (headScaleTypeValue) {
				headScaleTypeValue.Destroy();
            }
        }
    }

	//find the appropriate scale for the part
	let humanoidPropType = "Classic"
	if (part.FindFirstChild("AvatarPartScaleType")) {
		humanoidPropType = part.Child("AvatarPartScaleType").Prop("Value")
    }
	let scale = getPartScale(part, wideToNarrow, anthroPercent, humanoidPropType, humanoidPropType)

	//scale head mesh and attachments
	if (part && partName == "Head") {
		let mesh = part.FindFirstChildOfClass("SpecialMesh")
		if (mesh) {
			let headScale = newScaleVector
			if (mesh.Prop("MeshType") == MeshType.Head) {
				headScale = Vector3.new(1.0,1.0,1.0)
            }
			let originalScale = getOriginalMeshScale(mesh)

			if (mesh.Prop("MeshType") !== MeshType.Head) {
				mesh.setProperty("Scale", originalScale.multiply(scale).multiply(headScale))
            }

			let attachmentNames = ["FaceCenterAttachment", "FaceFrontAttachment", "HairAttachment",
				"HatAttachment", "NeckRigAttachment"]

            for (aname of attachmentNames) {
				let originalPosValue = mesh.FindFirstChild(aname)
				let headAttachment = part.FindFirstChild(aname)
				let originalPosition = headAttachment.FindFirstChild(originalPositionName)
				if (headAttachment && originalPosition) {
					if (originalPosValue) {
						originalPosition.setProperty("Value", originalPosValue)
                    } else {
						originalPosition.setProperty("Value", headAttachmentMap[aname])
                    }
                }
            }
        }
    }

	//scale the part
	part.setProperty("Size", originalSize.multiply(scale).multiply(newScaleVector))

	//scale attachments
    for (let child of part.GetChildren()) {
		if (child.className === "Attachment") {
			let originalAttachment = getOriginalAttachmentPosition(child)
            let ogCF = child.Prop("CFrame").clone()
            let newPos = originalAttachment.multiply(scale).multiply(newScaleVector)
            ogCF.Position = [newPos.X, newPos.Y, newPos.Z]
			child.setProperty("CFrame", ogCF)
        }
    }
}

//Updates the step height
function SetStepHeight(self, value) {
	if (!value) {
		return
    }

	let stepHeight = self.stepHeight

	value = specialClamp(value, -100.0, 100.0)

	if (value !== stepHeight) {
		self.stepHeight = value
    }
}

//Scale accessories using values found in the configurations folder
function ScaleAccessories(bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow, rig) {
    for (let item of rig.GetChildren()) {
		if (item.className === "Accessory") {
			ScaleAccessory(item,bodyScaleVector,headScaleVector,anthroPercent,wideToNarrow, rig)
        }
    }
}

//Adjusts any rig attachments as needed
function AdjustRootRigAttachmentPosition(self, rootPart, matchingPart, rootAttachment, matchingAttachment) {
	let rightHipAttachment = matchingPart.FindFirstChild("RightHipAttachment")
	let leftHipAttachment = matchingPart.FindFirstChild("LeftHipAttachment")

	if (leftHipAttachment || rightHipAttachment) {
		let rightHipDistance = 9999999999
		let leftHipDistance = 9999999999
		if (rightHipAttachment) {
			rightHipDistance = rightHipAttachment.Prop("Position").Y
        }
		if (leftHipAttachment) {
			leftHipDistance = leftHipAttachment.Prop("Position").Y
        }

		let hipDistance = Math.min(leftHipDistance, rightHipDistance)

		let rootAttachmentToHipDistance = matchingAttachment.Prop("Position").Y - hipDistance
		let halfRootPartHeight = rootPart.Prop("Size").Y / 2.0

		let currentPivot = rootAttachment.Prop("Position")
		let newYPivot = rootAttachmentToHipDistance - halfRootPartHeight

        let ogCF = rootAttachment.Prop("CFrame").clone()
        ogCF.Position = [currentPivot.X, newYPivot, currentPivot.Z]
		rootAttachment.setProperty("CFrame", ogCF)
    }
}

//Creates a joint between two attachments
function createJoint(jointName,att0,att1) {
	let part0 = att0.parent
    let part1 = att1.parent
	let newMotor = part1.FindFirstChild(jointName)

	if (!(newMotor && newMotor.className === "Motor6D")) {
		newMotor = new Instance("Motor6D")
    }

    newMotor.addProperty(new Property("Name", DataType.String), jointName)
    newMotor.addProperty(new Property("Archivable", DataType.Bool), true)
    newMotor.addProperty(new Property("C1", DataType.CFrame), att1.Prop("CFrame"))
    newMotor.addProperty(new Property("C0", DataType.CFrame), att0.Prop("CFrame"))
    newMotor.addProperty(new Property("Part1", DataType.Referent), part1)
    newMotor.addProperty(new Property("Part0", DataType.Referent), part0)
    newMotor.addProperty(new Property("Active", DataType.Bool), true)
    newMotor.addProperty(new Property("Enabled", DataType.Bool), true)

	newMotor.setParent(part1)
}

//Updates the cumulative step heights with any new scaling
function UpdateCumulativeStepHeight(self, part) {
	if (!part) {
		return
    }

	let partName = part.Prop("Name")

	if (partName == "HumanoidRootPart") {
		let rigAttach = part.FindFirstChild("RootRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y;
        }
		self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - (part.Prop("Size").Y / 2.0)
		self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - (part.Prop("Size").Y / 2.0)

    } else if (partName == "LowerTorso") {
		let rigAttach = part.FindFirstChild("RootRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
        }

    } else if (partName == "LeftUpperLeg") {
		let rigAttach = part.FindFirstChild("LeftHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft - rigAttach.Prop("Position").Y
        }
    } else if (partName == "LeftLowerLeg") {
		let rigAttach = part.FindFirstChild("LeftKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft - rigAttach.Prop("Position").Y
        }

    } else if (partName == "LeftFoot") {
		let rigAttach = part.FindFirstChild("LeftAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + (part.Prop("Size").Y / 2.0)
		self.cumulativeLegLeft = self.cumulativeLegLeft + (part.Prop("Size").Y / 2.0)

    } else if (partName == "RightUpperLeg") {
		let rigAttach = part.FindFirstChild("RightHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight - rigAttach.Prop("Position").Y
        }

    } else if (partName == "RightLowerLeg") {
		let rigAttach = part.FindFirstChild("RightKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight - rigAttach.Prop("Position").Y
        }
    } else if (partName == "RightFoot") {
		let rigAttach = part.FindFirstChild("RightAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + (part.Prop("Size").Y / 2.0);
		self.cumulativeLegRight = self.cumulativeLegRight + (part.Prop("Size").Y / 2.0);
    }
}

//Traverses joints between parts by using the attachments on the character and updates or creates joints accordingly
function TraverseRigFromAttachmentsInternal(self, part, characterParts, buildJoints) {
	if (!part) {
        console.log("nevermind!")
		return
    }

	// first, loop thru all of the part's children to find attachments
	for (let attachment of part.GetChildren()) {
		if (attachment.className === "Attachment") {
			// only do joint build from "RigAttachments"
			let attachmentName = attachment.Prop("Name")
			let findPos = attachmentName.indexOf(rigAttachmentName)

			if (findPos) {
				// also don't make double joints (there is the same named
                // rigattachment under two parts)
				let jointName = attachmentName.substring(0,findPos)
				let joint = part.FindFirstChild(jointName)
				if (!joint || joint.className !== "Motor6D") {

					// try to find other part with same rig attachment name
					for (let characterPart of characterParts) {
						if (part !== characterPart) {
							let matchingAttachment = characterPart.FindFirstChild(attachmentName)
							if (matchingAttachment && matchingAttachment.className === "Attachment") {
								AdjustRootRigAttachmentPosition(self, part, characterPart, attachment, matchingAttachment)
								if (buildJoints) {
									createJoint(jointName,attachment,matchingAttachment)
                                }
								TraverseRigFromAttachmentsInternal(self, characterPart, characterParts, buildJoints)
								break
                            }
                        }
                    }
                }
            }
        }
    }

	UpdateCumulativeStepHeight(self, part)
}

//Builds the joints from the attachment and scales accordingly
//This function also adjusts for assymetrical legs
function BuildJointsFromAttachments(self, rootPart, characterParts) {

	// rig the character to get initial leg parts
	TraverseRigFromAttachmentsInternal(self, rootPart, characterParts, true)

	if (self.cumulativeLegLeft > 0.1 && self.cumulativeLegRight > 0.1) {
		let legParts = []

		//Find which leg and which part require scaling
		let yScale = self.cumulativeLegRight / self.cumulativeLegLeft;

		if (self.cumulativeLegLeft > self.cumulativeLegRight) {
			yScale = self.cumulativeLegLeft / self.cumulativeLegRight
			legParts = []
			for (let part of characterParts) {
				if (part.Prop("Name") == "RightUpperLeg" || part.Prop("Name") == "RightLowerLeg" || part.Prop("Name") == "RightFoot") {
					legParts.push(part)
                }
            }
        } else {
			for (let part of characterParts) {
				if (part.Prop("Name") == "LeftUpperLeg" || part.Prop("Name") == "LeftLowerLeg" || part.Prop("Name") == "LeftFoot") {
					legParts.push(part)
                }
            }
        }

		//scale parts
		let adjustScale = Vector3.new(1.0, yScale, 1.0)
		for (let part of legParts) {
			let originalSize = getOriginalSize(part)
			let currentScale = part.Prop("Size").divide(originalSize)
			let totalScale = currentScale.multiply(adjustScale)
			part.setProperty("Size", originalSize.multiply(totalScale))

			//scale attachments
			for (let child of part.GetChildren()) {
				let attachment = child.FindFirstChildOfClass("Attachment")
				if (attachment) {
					let originalPosition = attachment.FindFirstChild(originalPositionName)
					if (originalPosition) {
						let originalP = originalPosition.Prop("Value")

                        let ogCF = attachment.Prop("CFrame").clone()
                        let newPos = originalP.multiply(totalScale)
                        ogCF.Position = [newPos.X, newPos.Y, newPos.Z]
						attachment.setProperty("CFrame", ogCF)
                    }
                }
            }
        }
    }

	self.cumulativeStepHeightLeft = 0.0
	self.cumulativeStepHeightRight = 0.0
	self.cumulativeLegLeft = 0.0
	self.cumulativeLegRight = 0.0

	//build the character joints after scaling
	TraverseRigFromAttachmentsInternal(self, rootPart, characterParts, true)

	let stepHeight = Math.max(self.cumulativeStepHeightLeft, self.cumulativeStepHeightRight)
	if (Math.abs(self.cumulativeStepHeightLeft - self.cumulativeStepHeightRight) < stepHeight) {
		stepHeight = Math.min(self.cumulativeStepHeightLeft, self.cumulativeStepHeightRight)
    }
	if (stepHeight < 0.0) {
		stepHeight = (rootPart.Prop("Size").Y / 2)
    }
	SetStepHeight(self, stepHeight)
}

//Builds the joints on a character
function BuildJoints(self) {
	let character = self.rig
	let characterParts = GetCharacterParts(character)

	BuildJointsFromAttachments(self, character.Child("HumanoidRootPart"), characterParts)
}

//Scales the character including any accessories and attachments
//NOTE: Scaling is supported only for R15 Characters
function ScaleCharacter(rig, outfit) {
	if (outfit.playerAvatarType === AvatarType.R6) {
		return
	}

	//scale parts
	let bodyScaleVector = Vector3.new(
        outfit.scale.width,
		outfit.scale.height,
		outfit.scale.depth
    )
	let headScaleVector = Vector3.new(outfit.scale.head,outfit.scale.head,outfit.scale.head)
	let anthroPercent = outfit.scale.bodyType
	let wideToNarrow = outfit.scale.proportion
	let characterParts = GetCharacterParts(rig)

	for (let part of characterParts) {
		if (part) {
			ScaleCharacterPart(part, bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow)
        }
    }

	//scale step height
	let stepHeight = lerp(stepHeightWide, stepHeightNarrow, wideToNarrow)
	let newStepHeight = lerp(2.0, stepHeight, anthroPercent)

    let self = {
        "outfit": outfit,
        "rig": rig,
    }

    self.cumulativeStepHeightLeft = 0.0
    self.cumulativeStepHeightRight = 0.0
    self.cumulativeLegLeft = 0.0
    self.cumulativeLegRight = 0.0

	SetStepHeight(self, newStepHeight * bodyScaleVector.Y)

	//scale accessories
	ScaleAccessories(bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow, rig)

	self.bodyScale = bodyScaleVector
	self.headScale = headScaleVector.X

	//build up joints
	BuildJoints(self)

    return self
}

function pivot_rgb(n) {
	if (n > 0.04045) {
		n = Math.pow((n + 0.055) / 1.055, 2.4)
    } else {
		n = n / 12.92
    }
	return n * 100
}

function deg2Rad(deg) {
	return deg * Math.PI / 180.0;
}

function rgb_to_xyz(c) {
	let var_R = pivot_rgb(c.r)
	let var_G = pivot_rgb(c.g)
	let var_B = pivot_rgb(c.b)

	// For Observer = 2 degrees, Illuminant = D65
	let xyz = {}
	xyz.x = var_R * 0.4124 + var_G * 0.3576 + var_B * 0.1805
	xyz.y = var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722
	xyz.z = var_R * 0.0193 + var_G * 0.1192 + var_B * 0.9505

	return xyz
}

function pivot_xyz(n) {
	if (n > 0.008856) {
		n = Math.pow(n, 1.0/3.0)
    } else {
		n = (7.787 * n) + (16.0 / 116.0)
    }
	return n
}

function xyz_to_Lab(xyz) {
	let ReferenceX = 95.047
	let ReferenceY = 100.0
	let ReferenceZ = 108.883

	let var_X = pivot_xyz(xyz.x / ReferenceX)
	let var_Y = pivot_xyz(xyz.y / ReferenceY)
	let var_Z = pivot_xyz(xyz.z / ReferenceZ)

	let CIELab = {}
	CIELab.L = Math.max(0, ( 116 * var_Y ) - 16)
	CIELab.a = 500 * ( var_X - var_Y )
	CIELab.b = 200 * ( var_Y - var_Z )

	return CIELab
}

function rgb_to_Lab(c) {
	let xyz = rgb_to_xyz(c)
	let Lab = xyz_to_Lab(xyz)
	return Lab
}

function delta_CIEDE2000(c1, c2) { //Source: https://github.com/Roblox/avatar/blob/main/InGameAvatarEditor/src/ServerScriptService/AvatarEditorInGameSetup/AvatarEditorInGame/Modules/AvatarExperience/AvatarEditor/Utils.lua#L184
    console.log(c1)
    let lab1 = rgb_to_Lab(c1)
	let lab2 = rgb_to_Lab(c2)
    console.log(lab1)

	let k_L = 1.0 // lightness
	let k_C = 1.0 // chroma
	let k_H = 1.0 // hue
	let deg360InRad = deg2Rad(360.0)
	let deg180InRad = deg2Rad(180.0)
	let pow25To7 = 6103515625.0 // ; /* pow(25, 7) */

	// Step 1
	// /* Equation 2 */
	let C1 = Math.sqrt((lab1.a * lab1.a) + (lab1.b * lab1.b))
	let C2 = Math.sqrt((lab2.a * lab2.a) + (lab2.b * lab2.b))
	// /* Equation 3 */
	let barC = (C1 + C2) / 2.0
	// /* Equation 4 */
	let G = 0.5 * (1 - Math.sqrt(Math.pow(barC, 7) / (Math.pow(barC, 7) + pow25To7)))
	// /* Equation 5 */
	let a1Prime = (1.0 + G) * lab1.a
	let a2Prime = (1.0 + G) * lab2.a
	// /* Equation 6 */
	let CPrime1 = Math.sqrt((a1Prime * a1Prime) + (lab1.b * lab1.b))
	let CPrime2 = Math.sqrt((a2Prime * a2Prime) + (lab2.b * lab2.b))
	// /* Equation 7 */
	let hPrime1
	if (lab1.b == 0 && a1Prime == 0) {
		hPrime1 = 0.0
    } else {
		hPrime1 = Math.atan2(lab1.b, a1Prime)
		///*
		 //* This must be converted to a hue angle in degrees between 0
		 //* and 360 by addition of 2􏰏 to negative hue angles.
		 //*/
		if (hPrime1 < 0) {
			hPrime1 = hPrime1 + deg360InRad
        }
    }

	let hPrime2
	if (lab2.b == 0 && a2Prime == 0) {
		hPrime2 = 0.0
    } else {
		hPrime2 = Math.atan2(lab2.b, a2Prime)
		///*
		 //* This must be converted to a hue angle in degrees between 0
		 //* and 360 by addition of 2􏰏 to negative hue angles.
		 //*/
		if (hPrime2 < 0) {
			hPrime2 = hPrime2 + deg360InRad
        }
    }

	 // * Step 2
	// /* Equation 8 */
	let deltaLPrime = lab2.L - lab1.L
	// /* Equation 9 */
	let deltaCPrime = CPrime2 - CPrime1
	// /* Equation 10 */
	let deltahPrime
	let CPrimeProduct = CPrime1 * CPrime2
	if (CPrimeProduct == 0) {
		deltahPrime = 0
    } else {
		///* Avoid the fabs() call */
		deltahPrime = hPrime2 - hPrime1
		if (deltahPrime < -deg180InRad) {
			deltahPrime = deltahPrime + deg360InRad
        } else if (deltahPrime > deg180InRad) {
			deltahPrime = deltahPrime - deg360InRad
        }
    }

	///* Equation 11 */
	let deltaHPrime = 2.0 * Math.sqrt(CPrimeProduct) * Math.sin(deltahPrime / 2.0)

	 // * Step 3
	// /* Equation 12 */
	let barLPrime = (lab1.L + lab2.L) / 2.0
	// /* Equation 13 */
	let barCPrime = (CPrime1 + CPrime2) / 2.0
	// /* Equation 14 */
	let barhPrime
	let hPrimeSum = hPrime1 + hPrime2
	if (CPrime1 * CPrime2 == 0) {
		barhPrime = hPrimeSum
    } else {
		if (Math.abs(hPrime1 - hPrime2) <= deg180InRad) {
			barhPrime = hPrimeSum / 2.0
        } else {
			if (hPrimeSum < deg360InRad) {
				barhPrime = (hPrimeSum + deg360InRad) / 2.0
            } else {
				barhPrime = (hPrimeSum - deg360InRad) / 2.0
            }
        }
    }

	// /* Equation 15 */
	let T = 1.0 - (0.17 * Math.cos(barhPrime - deg2Rad(30.0))) +
		(0.24 * Math.cos(2.0 * barhPrime)) +
		(0.32 * Math.cos((3.0 * barhPrime) + deg2Rad(6.0))) -
		(0.20 * Math.cos((4.0 * barhPrime) - deg2Rad(63.0)))
	// /* Equation 16 */
	let deltaTheta = deg2Rad(30.0) *
		Math.exp(-Math.pow((barhPrime - deg2Rad(275.0)) / deg2Rad(25.0), 2.0))
	// /* Equation 17 */
	let R_C = 2.0 * Math.sqrt(Math.pow(barCPrime, 7.0) /
		(Math.pow(barCPrime, 7.0) + pow25To7))
	// /* Equation 18 */
	let S_L = 1 + ((0.015 * Math.pow(barLPrime - 50.0, 2.0)) /
		Math.sqrt(20 + Math.pow(barLPrime - 50.0, 2.0)))
	// /* Equation 19 */
	let S_C = 1 + (0.045 * barCPrime)
	// /* Equation 20 */
	let S_H = 1 + (0.015 * barCPrime * T)
	// /* Equation 21 */
	let R_T = (-Math.sin(2.0 * deltaTheta)) * R_C

	// /* Equation 22 */
	let deltaE = Math.sqrt(
		Math.pow(deltaLPrime / (k_L * S_L), 2.0) +
		Math.pow(deltaCPrime / (k_C * S_C), 2.0) +
		Math.pow(deltaHPrime / (k_H * S_H), 2.0) +
		(R_T * (deltaCPrime / (k_C * S_C)) * (deltaHPrime / (k_H * S_H))))

	return deltaE
}


class Instance {
    name //USED TO MAKE VIEWING EASIER
    className
    _properties = new Map()
    _referencedBy = []
    _connectionReferences = []
    children = []
    parent = null
    destroyed = false

    classID //dont use this to identify instance class, it is only used during file loading
    objectFormat //same as above

    ChildAdded = new Event()
    Destroying = new Event()
    Changed = new Event()

    constructor(className) {
        if (!className) {
            throw new Error("Instance was not provided a className")
        }

        this.className = className

        //Setup class logic
        switch(this.className) {
            case "Motor6D":
            case "Weld":
                {
                    let part0ChangedConnection = null
                    let part1ChangedConnection = null

                    function update(self, affectedPart = 1) { //TODO: part1 is not always the part that should be affected, but its difficult to fix without creating an infinite loop
                        //variables/properties
                        if (!self.HasProperty("Part0") || !self.HasProperty("Part1")) return

                        let part0 = null
                        if (self.HasProperty("Part0")) {
                            part0 = self.Property("Part0")
                            if (part0) {
                                if (part0ChangedConnection) {
                                    part0ChangedConnection.Disconnect()
                                    self.removeConnectionReference(part0ChangedConnection)
                                }
                            }
                        }

                        let part1 = null
                        if (self.HasProperty("Part1")) {
                            part1 = self.Property("Part1")
                            if (part1) {
                                if (part1ChangedConnection) {
                                    part1ChangedConnection.Disconnect()
                                    self.removeConnectionReference(part1ChangedConnection)
                                }
                            }
                        }

                        if (!self.HasProperty("C0") || !self.HasProperty("C1")) {
                            return
                        }

                        let C0 = self.Property("C0")
                        let C1 = self.Property("C1")
                        if (!C0 || !C1) {
                            return
                        }

                        let transform = new CFrame()
                        if (self.HasProperty("Transform")) {
                            transform = self.Property("Transform")
                        }

                        //actual calculation
                        if (self.HasProperty("Enabled") && self.Prop("Enabled")) {
                            if (self.parent) {
                                    if (affectedPart === 1) {
                                        if (part0 && part0.HasProperty("CFrame")) {
                                            let part0Cf = part0.Property("CFrame")

                                            let offset1 = C1.multiply(transform).inverse()
                                            let finalCF = part0Cf.multiply(C0).multiply(offset1)

                                            //update part1 position
                                            part1.setProperty("CFrame", finalCF)
                                        } 
                                    } else {
                                        if (part1 && part1.HasProperty("CFrame")) {
                                            let part1Cf = part1.Property("CFrame")

                                            let offset0 = C0.multiply(transform).inverse()
                                            let finalCF = part1Cf.multiply(C1).multiply(offset0)

                                            //update part0 position
                                            part0.setProperty("CFrame", finalCF)
                                        }
                                    }
                                
                            } else {
                                console.warn("Potential memory leak with Motor6D/Weld")
                            }
                        }

                        if (part0) {
                            part0ChangedConnection = part0.Changed.Connect((propertyName) => {
                                if (propertyName === "CFrame") {
                                    update(self, 1)
                                }
                            })
                            self.addConnectionReference(part0ChangedConnection)
                        }

                        /*if (part1) {
                            part1ChangedConnection = part1.Changed.Connect((propertyName) => {
                                if (propertyName === "CFrame") {
                                    update(self, 0)
                                }
                            })
                            self.addConnectionReference(part1ChangedConnection)
                        }*/
                    }

                    function setup() {
                        //console.log(this)
                        if (this.className === "Motor6D") {
                            //create transform property
                            let transformProperty = new Property()
                            transformProperty.name = "Transform"
                            transformProperty.typeID = DataType.CFrame
                            
                            this.addProperty(transformProperty)
                            this.setProperty(transformProperty.name, new CFrame())
                        }

                        //add connections
                        let self = this

                        let changedConnection = this.Changed.Connect(() => {
                            update(self)
                        })
                        this.addConnectionReference(changedConnection)
                    }

                    setup.bind(this)()

                    break
                }
        }
    }

    addConnectionReference(connection) {
        if (!this._connectionReferences.includes(connection)) {
            this._connectionReferences.push(connection)
        }
    }

    removeConnectionReference(connection) {
        let index = this._connectionReferences.indexOf(connection)
        if (index !== -1) {
            this._connectionReferences.splice(index,1)
        }
    }

    addReferencedBy(instance) {
        if (!this._referencedBy.includes(instance)) {
            this._referencedBy.push(instance)
        }
    }

    removeReferencedBy(instance) {
        let index = this._referencedBy.indexOf(instance)
        if (index !== -1) {
            let isReferenced = false
            let properties = instance.getPropertyNames()
            for (let prop of properties) {
                if (instance.Prop(prop) === this) {
                    isReferenced = true
                }
            }
            if (!isReferenced) {
                this._referencedBy.splice(index,1)
            }
        }
    }

    addProperty(property, value) {
        if (!this._properties.get(property.name)) {
            this._properties.set(property.name, property)
        }

        if (value) {
            this.setProperty(property.name, value)
        }
    }

    fixPropertyName(name) {
        switch (name) {
            case "Size": {
                name = "size"
                break
            }
            case "Shape": {
                name = "shape"
                break
            }
            case "Health": {
                name = "Health_XML"
                break
            }
            case "Color": {
                name = "Color3uint8"
                break
            }
        }

        return name
    }

    setProperty(name, value) {
        name = this.fixPropertyName(name)

        let property = this._properties.get(name)
        if (property) {
            //special stuff
            if (property.typeID === DataType.Referent && property.value) {
                property.value.removeReferencedBy(this)
            } else if (property.typeID === DataType.CFrame && property.value && value) {
                if (isNaN(value.Position[0]) || isNaN(value.Position[1]) || isNaN(value.Position[2])) {
                    console.log(value)
                    throw new Error("CFrame position can't contain NaN value")
                }
                if (isNaN(value.Orientation[0]) || isNaN(value.Orientation[1]) || isNaN(value.Orientation[2])) {
                    console.log(value)
                    throw new Error("CFrame orientation can't contain NaN value")
                }
            }
            if (property.name === "Name") {
                this.name = value
            }

            property._value = value

            //special stuff
            if (property.typeID === DataType.Referent && property.value) {
                property.value.addReferencedBy(this)
            }
            this.Changed.Fire(name)
        } else {
            console.warn(`Property with name ${name} was not found in ${this.GetFullName()}`)
        }
    }

    HasProperty(name) {
        name = this.fixPropertyName(name)

        return !!(this._properties.get(name))
    }

    Property(name) {
        name = this.fixPropertyName(name)

        if (name == "Position") {
            let cf = this.Prop("CFrame")
            let pos = cf.Position
            return new Vector3(pos[0], pos[1], pos[2])
        }

        if (!this._properties.get(name)) {
            console.log(this)
            throw new Error(`Property: ${name} does not exist`)
        }

        return this._properties.get(name)?.value
    }

    Prop(name) {
        return this.Property(name)
    }

    getPropertyNames() {
        return Array.from(this._properties.keys())
    }

    setParent(instance) {
        if (this.parent) {
            let index = this.parent.children.indexOf(this)
            if (index !== -1) {
                this.parent.children.splice(index, 1)
            }
        }

        this.parent = instance

        //special logic
        if (this.parent) {
            this.AccessoryBuildWeld()
        }

        //finalize
        if (instance) {
            instance.children.push(this)
            instance.ChildAdded.Fire(this)
        }
    }

    Destroy() {
        //disconnect all connections created by instance
        for (let connection of this._connectionReferences) {
            connection.Disconnect()
        }
        this._connectionReferences = []

        //destroy all children
        for (let child of this.GetChildren()) {
            child.Destroy()
        }

        this.Destroying.Fire(this)

        this.ChildAdded.Clear()
        this.Destroying.Clear()
        this.Changed.Clear()

        this.setParent(null)

        //set all properties to null
        for (let property of this.getPropertyNames()) {
            this.setProperty(property, null)
        }

        //remove all references to instance
        for (let instance of this._referencedBy) {
            for (let propertyName of instance.getPropertyNames()) {
                if (instance.Property(propertyName) === this) {
                    instance.setProperty(propertyName, null)
                }
            }
        }
        this._referencedBy = []

        this.destroyed = true
    }

    GetFullName() {
        if (this.parent && this.parent.className !== "DataModel") {
            return this.parent.GetFullName() + "." + this.name
        } else {
            return this.name
        }
    }

    GetChildren() { //It is done like this so setting parents doesnt mess up the list
        let childrenList = []

        for (let child of this.children) {
            childrenList.push(child)
        }

        return childrenList
    }

    GetDescendants() {
        let descendants = this.children

        for (let child of this.children) {
            descendants = descendants.concat(child.GetDescendants())
        }

        return descendants
    }

    FindFirstChild(name) {
        for (let child of this.GetChildren()) {
            if (child.Property("Name") == name) {
                return child
            }
        }
    }

    FindFirstDescendant(name) {
        for (let child of this.GetDescendants()) {
            if (child.Property("Name") == name) {
                return child
            }
        }
    }

    Child(name) {
        return this.FindFirstChild(name)
    }

    FindFirstChildOfClass(className) {
        for (let child of this.children) {
            if (child.className == className) {
                return child
            }
        }
    }

    AccessoryBuildWeld() {
        if (this.className === "Accessory") { //create accessory weld TODO: making the part0/C0 and part1/C1 accurate (0 = hat, 1 = body) would be good, probably
            let humanoid = this.parent.FindFirstChildOfClass("Humanoid")

            if (humanoid) {
                let handle = this.FindFirstChild("Handle")
                if (handle) {
                    let accessoryAttachment = handle.FindFirstChildOfClass("Attachment")
                    let bodyAttachment = null
                    let bodyDescendants = this.parent.GetDescendants()
                    for (let child of bodyDescendants) {
                        if (child.className === "Attachment" && child.Property("Name") === accessoryAttachment.Property("Name") && child.parent && child.parent.parent === this.parent) {
                            bodyAttachment = child
                        }
                    }

                    if (handle.FindFirstChild("AccessoryWeld")) {
                        handle.Child("AccessoryWeld").Destroy()
                    }

                    let weld = new Instance("Weld")

                    weld.addProperty(new Property("Name", DataType.String), "AccessoryWeld")
                    weld.addProperty(new Property("Archivable", DataType.Bool), true)
                    weld.addProperty(new Property("C1", DataType.CFrame), accessoryAttachment.Property("CFrame").clone())
                    weld.addProperty(new Property("C0", DataType.CFrame), bodyAttachment.Property("CFrame").clone())
                    weld.addProperty(new Property("Part1", DataType.Referent), accessoryAttachment.parent)
                    weld.addProperty(new Property("Part0", DataType.Referent), bodyAttachment.parent)
                    weld.addProperty(new Property("Active", DataType.Bool), true)
                    weld.addProperty(new Property("Enabled", DataType.Bool), false)

                    weld.setParent(handle)

                    weld.setProperty("Enabled", true)
                }
            }
        }
    }
}

class INST {
    classID //u32
    className //string
    objectFormat //u8
    instanceCount //u32
    referents //i32[]
}

class PROP {
    classID //u32
    propertyName //string
    typeID //u8
    values = []
}

class PRNT {
    instanceCount = 0
    childReferents = []
    parentReferents = []
}

class RBX {

    classCount = 0 //i32
    instanceCount = 0 //i32

    meta = new Map() //Map<string,string>
    sstr = new Map() //Map<MD5,string>
    instArray = [] //INST[]
    propArray = [] //PROP[]
    prnt = new PRNT() //PRNT

    //not based on file format
    classIDtoINST = new Map()
    dataModel = new Instance("DataModel")
    treeGenerated = false

    get instances() {
        return this.dataModel.children
    }

    constructor() {
        this.reset()
    }

    reset() {
        this.classCount = 0
        this.instanceCount = 0

        this.meta = new Map()
        this.sstr = new Map()
        this.instArray = []
        this.propArray = []
        this.prnt = new PRNT()

        this.classCount = new Map()

        this.classIDtoINST = new Map()

        this.dataModel = new Instance("DataModel")
        this.dataModel.name = "root"
        this.dataModel.classID = -1 //TODO: is this true? a bit hard to test
        this.dataModel.objectFormat = 0
    }

    async fromOutfit(outfit) {
        let outfitStartTime = performance.now()

        let response = await fetch(`assets/Rig${outfit.playerAvatarType}.rbxm`)
        let buffer = await response.arrayBuffer()

        this.fromBuffer(buffer)
        this.generateTree()
        console.log(this)

        let rig = this.dataModel.FindFirstChildOfClass("Model")
        rig.setProperty("Name", outfit.name)

        //assets
        let assetPromises = []

        for (let asset of outfit.assets) {
            let assetTypeName = asset.assetType.name
            assetPromises.push(new Promise(async (resolve, reject) => {
                switch (assetTypeName) {
                    case "TShirt":
                    case "Shirt":
                    case "Pants":
                    case "Hat":
                    case "HairAccessory":
                    case "FaceAccessory":
                    case "NeckAccessory":
                    case "ShoulderAccessory":
                    case "FrontAccessory":
                    case "BackAccessory":
                    case "WaistAccessory":
                    case "Face":
                        {
                            let response = await fetch("https://assetdelivery.roproxy.com/v1/asset?id=" + asset.id)
                            if (response.status !== 200) {
                                break
                            }
                            let buffer = await response.arrayBuffer()

                            let clothingRBX = new RBX()
                            clothingRBX.fromBuffer(buffer)
                            clothingRBX.generateTree()

                            let assetInstance = clothingRBX.dataModel.GetChildren()[0]
                            if (assetInstance.className === "Decal") {
                                let rigHead = rig.FindFirstChild("Head")
                                if (rigHead) {
                                    let rigFace = rigHead.FindFirstChildOfClass("Decal")
                                    if (rigFace) {
                                        rigFace.Destroy()
                                    }

                                    assetInstance.setParent(rigHead)
                                }
                            } else {
                                assetInstance.setParent(rig)
                            }

                            break
                        }
                    case "Torso":
                    case "LeftLeg":
                    case "RightLeg":
                    case "LeftArm":
                    case "RightArm":
                        {
                            let response = await fetch("https://assetdelivery.roproxy.com/v1/asset?id=" + asset.id)
                            let buffer = await response.arrayBuffer()

                            let bodyPartRBX = new RBX()
                            bodyPartRBX.fromBuffer(buffer)
                            bodyPartRBX.generateTree()

                            if (outfit.playerAvatarType === AvatarType.R6) {
                                let R6Folder = bodyPartRBX.dataModel.FindFirstChild("R6")
                                if (R6Folder) {
                                    let characterMesh = R6Folder.FindFirstChildOfClass("CharacterMesh")
                                    if (characterMesh) {
                                        characterMesh.setParent(rig)
                                    }
                                }
                            } else {
                                //TODO: R15 body parts
                                let R15Folder = bodyPartRBX.dataModel.FindFirstChild("R15ArtistIntent")
                                if (!R15Folder || R15Folder.GetChildren().length === 0) {
                                    R15Folder = bodyPartRBX.dataModel.FindFirstChild("R15Fixed")
                                }

                                if (R15Folder) { //TODO: make this more reliable (is this still a TODO? pretty sure i fixed it...)
                                    let children = R15Folder.GetChildren()
                                    for (let child of children) {
                                        let childName = child.Prop("Name")
                                        let oldBodyPart = rig.FindFirstChild(childName)
                                        if (oldBodyPart) {
                                            let motor6ds = rig.GetDescendants()
                                            for (let motor of motor6ds) {
                                                if (motor.className === "Motor6D" || motor.className === "Weld") {
                                                    let part0 = motor.Prop("Part0")
                                                    let part1 = motor.Prop("Part1")
                                                    if (part0 && oldBodyPart === part0) {
                                                        motor.setProperty("Part0", child)
                                                    }
                                                    if (part1 && oldBodyPart === part1) {
                                                        motor.setProperty("Part1", child)
                                                    }
                                                }
                                            }

                                            let oldMotor6ds = oldBodyPart.GetChildren()
                                            for (let motor of oldMotor6ds) {
                                                if (motor.className === "Motor6D") {
                                                    let motorName = motor.Prop("Name")

                                                    let selfMotor = child.FindFirstChild(motorName)
                                                    if (selfMotor) {
                                                        //if (!selfMotor.Prop("Part0")) {
                                                        //    selfMotor.setProperty("Part0", motor.Prop("Part0"))
                                                        //}
                                                    }
                                                }
                                            }
                                            
                                            oldBodyPart.Destroy()
                                        }
                                        child.setParent(rig)
                                    }
                                }
                            }

                            break
                        }
                    case "Head":
                    case "DynamicHead":
                        {
                            let response = await fetch("https://assetdelivery.roproxy.com/v1/asset?id=" + asset.id)
                            let buffer = await response.arrayBuffer()

                            let headRBX = new RBX()
                            headRBX.fromBuffer(buffer)
                            headRBX.generateTree()

                            let headMesh = headRBX.dataModel.FindFirstChildOfClass("SpecialMesh")
                            if (headMesh) {
                                /*
                                let headMeshChildren = headMesh.GetChildren()
                                for (let child of headMeshChildren) {
                                    if (child.className === "Vector3Value") {
                                        let bodyAttachment = null
                                        let bodyDescendants = rig.GetDescendants()
                                        for (let child2 of bodyDescendants) {
                                            if (child2.className === "Attachment" && child2.Property("Name") === child.Property("Name") && child2.parent && child2.parent.parent === rig) {
                                                bodyAttachment = child2
                                            }
                                        }

                                        if (bodyAttachment) {
                                            let baCF = bodyAttachment.Property("CFrame").clone()
                                            let pos = child.Property("Value")
                                            baCF.Position = [pos.X, pos.Y, pos.Z]
                                            bodyAttachment.setProperty("CFrame", baCF)
                                        }
                                    }
                                }
                                */
                                if (outfit.playerAvatarType === AvatarType.R6) {
                                    let bodyHeadMesh = rig.FindFirstChild("Head").FindFirstChildOfClass("SpecialMesh")
                                    if (bodyHeadMesh) {
                                        bodyHeadMesh.Destroy()
                                    }

                                    headMesh.setParent(rig.FindFirstChild("Head"))
                                } else {
                                    //TODO: make sizing accurate
                                    let head = rig.FindFirstChild("Head")
                                    head.setProperty("MeshId", headMesh.Prop("MeshId"))
                                    head.setProperty("TextureID", headMesh.Prop("TextureId"))

                                    console.log(head.Prop("MeshId"))
                                    let fetchStr = parseAssetString(head.Prop("MeshId"))

                                    let response = await fetch(fetchStr)
                                    let buffer = await response.arrayBuffer()
                                    let mesh = new FileMesh()
                                    mesh.fromBuffer(buffer)

                                    let meshSize = new Vector3(mesh.size[0], mesh.size[1], mesh.size[2])
                                    let originalSize = head.FindFirstChild("OriginalSize")
                                    if (originalSize) {
                                        originalSize.setProperty("Value", meshSize)
                                    }
                                    head.setProperty("Size", meshSize)

                                    let scaleType = headMesh.FindFirstChild("AvatarPartScaleType")
                                    if (scaleType) {
                                        let oldScaleType = head.FindFirstChild("AvatarPartScaleType")
                                        if (oldScaleType) {
                                            oldScaleType.Destroy()
                                        }
                                        scaleType.setParent(head)
                                    }

                                    for (let child of headMesh.GetChildren()) {
                                        if (child.Prop("Name").endsWith("Attachment")) {
                                            console.log(child)
                                            let realChild = rig.Child("Head").FindFirstChild(child.Prop("Name"))
                                            let ogCF = realChild.Prop("CFrame").clone()
                                            let pos = child.Prop("Value")
                                            ogCF.Position = [pos.X, pos.Y, pos.Z]
                                            realChild.setProperty("CFrame", ogCF)

                                            let originalPosition = realChild.FindFirstChild("OriginalPosition")
                                            if (originalPosition) {
                                                originalPosition.setProperty("Value", new Vector3(pos.X, pos.Y, pos.Z))
                                            }
                                        }
                                    }
                                }
                            }
                            
                            break
                        }
                    default:
                        {
                            console.warn("Unsupported assetType: " + assetTypeName)
                            break
                        }
                }

                resolve()
            }))
        }

        await Promise.all(assetPromises)

        //body colors
        let bodyColors = outfit.bodyColors
        if (bodyColors.colorType === "BrickColor") {
            bodyColors = bodyColors.toColor3()
        }

        //TODO: also change humanoid description and bodycolors instance
        let limbs = [["headColor3","Head"],["torsoColor3","Torso"],["rightArmColor3","Right Arm"],["leftArmColor3", "Left Arm"],["rightLegColor3", "Right Leg"],["leftLegColor3", "Left Leg"]]
        if (outfit.playerAvatarType === AvatarType.R15) {
            limbs = [
                ["headColor3","Head"],
                ["torsoColor3","UpperTorso"],["torsoColor3","LowerTorso"],
                ["rightArmColor3","RightUpperArm"],["rightArmColor3","RightLowerArm"],["rightArmColor3","RightHand"],
                ["leftArmColor3","LeftUpperArm"],["leftArmColor3","LeftLowerArm"],["leftArmColor3","LeftHand"],
                ["rightLegColor3", "RightUpperLeg"],["rightLegColor3", "RightLowerLeg"],["rightLegColor3", "RightFoot"],
                ["leftLegColor3", "LeftUpperLeg"],["leftLegColor3", "LeftLowerLeg"],["leftLegColor3", "LeftFoot"],
            ]
        }
        for (let limbData of limbs) {
            let colorName = limbData[0]
            let limbName = limbData[1]

            let colorRGB = hexToRgb(bodyColors[colorName])
            let color3uint8 = new Color3uint8()
            color3uint8.R = colorRGB.r * 255
            color3uint8.G = colorRGB.g * 255
            color3uint8.B = colorRGB.b * 255

            let limb = rig.FindFirstChild(limbName)
            if (limb) {
                limb.setProperty("Color", color3uint8)
            }
        }

        //default clothing
        if (!rig.FindFirstChildOfClass("Pants")) {
            let minimumDeltaEBodyColorDifference = 11.4

            let torsoColor = hexToRgb(bodyColors.torsoColor3)
            let leftLegColor = hexToRgb(bodyColors.leftLegColor3)
            let rightLegColor = hexToRgb(bodyColors.rightLegColor3)

            let minDeltaE = Math.min(delta_CIEDE2000(torsoColor, leftLegColor), delta_CIEDE2000(torsoColor, rightLegColor))

            console.log(minDeltaE)

            if (minDeltaE <= minimumDeltaEBodyColorDifference) { //apply default clothing
                let defaultShirtAssetIds = [
                    855776101,
                    855759986,
                    855766170,
                    855777285,
                    855768337,
                    855779322,
                    855773572,
                    855778082
                ]
                let defaultPantAssetIds = [
                    867813066,
                    867818313,
                    867822311,
                    867826313,
                    867830078,
                    867833254,
                    867838635,
                    867842477
                ]

                let defaultClothesIndex = Number(outfit.creatorId || 1) % defaultShirtAssetIds.length

                //create default pants
                let pants = new Instance("Pants")
                pants.addProperty(new Property("Name", DataType.String), "Pants")
                pants.addProperty(new Property("PantsTemplate", DataType.String), "rbxassetid://" + defaultPantAssetIds[defaultClothesIndex])
                pants.setParent(rig)

                //create default shirt
                if (!rig.FindFirstChildOfClass("Shirt")) {
                    let shirt = new Instance("Shirt")
                    shirt.addProperty(new Property("Name", DataType.String), "Shirt")
                    shirt.addProperty(new Property("ShirtTemplate", DataType.String), "rbxassetid://" + defaultShirtAssetIds[defaultClothesIndex])
                    shirt.setParent(rig)
                }
            }
        }

        //apply scale
        let scaleInfo = null

        if (outfit.playerAvatarType === AvatarType.R15) {
            scaleInfo = ScaleCharacter(rig, outfit)
        } else {
            let children = rig.GetChildren()
            for (let child of children) {
                if (child.className === "Accessory") {
                    //BUG: Roblox scales accessories even in R6, it's also inconsistent and sometimes some accessories may not be scaled
                    ScaleAccessory(child, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig)
                }
            }
        }

        //align feet with ground
        if (scaleInfo) {
            let hrp = rig.FindFirstChild("HumanoidRootPart")
            let cf = hrp.Prop("CFrame").clone()
            cf.Position[1] = scaleInfo.stepHeight + hrp.Prop("Size").Y / 2
            hrp.setProperty("CFrame", cf)
        }

        //recalculate motor6ds
        for (let child of rig.GetDescendants()) {
            if (child.className === "Motor6D" || child.className === "Weld") {
                child.setProperty("C1", child.Prop("C1"))
            }
        }

        console.log(`Loaded outfit after ${performance.now() - outfitStartTime}`)
        console.log(this)
        return this
    }

    readMETA(chunkView) {
        let entriesCount = chunkView.readUint32()
        for (let i = 0; i < entriesCount; i++) {
            let metaKey = chunkView.readUtf8String()
            let metaValue = chunkView.readUtf8String()

            this.meta.set(metaKey, metaValue)
        }
    }

    readSSTR(chunkView) {
        let version = chunkView.readUint32() //always 0
        if (version !== 0) {
            throw new Error("Unexpected SSTR version")
        }

        let sharedStringCount = chunkView.readUint32()
        for (let i = 0; i < sharedStringCount; i++) {
            let md5 = [chunkView.readUint32(), chunkView.readUint32(), chunkView.readUint32(), chunkView.readUint32()]
            let str = chunkView.readUtf8String()

            this.sstr.set(md5, str)
        }
    }

    readINST(chunkView) {
        let inst = new INST()

        inst.classID = chunkView.readUint32()
        inst.className = chunkView.readUtf8String()
        inst.objectFormat = chunkView.readUint8()
        inst.instanceCount = chunkView.readUint32()
        let referents = readReferents(inst.instanceCount, chunkView)
        inst.referents = referents
        //servicemarkes could be read here but is useless and a waste of time

        this.instArray.push(inst)
        this.classIDtoINST.set(inst.classID, inst)
    }

    readPROP(chunkView) {
        let prop = new PROP()
        prop.classID = chunkView.readUint32()
        prop.propertyName = chunkView.readUtf8String()
        prop.typeID = chunkView.readUint8()

        //read values
        let valuesLength = this.classIDtoINST.get(prop.classID).instanceCount

        switch (prop.typeID) {
            case DataType.String:
                {
                    let totalRead = 0
                    while (totalRead < valuesLength) {
                        prop.values.push(chunkView.readUtf8String())
                        totalRead++
                    }
                    break
                }
            case DataType.Bool:
                {
                    for (let i = 0; i < valuesLength; i++) {
                        prop.values.push(chunkView.readUint8() > 0)
                    }
                    break
                }
            case DataType.Int32:
                {
                    let nums = chunkView.readInterleaved32(valuesLength, false)
                    //untransform
                    for (let i = 0; i < nums.length; i++) {
                        nums[i] = untransformInt32(nums[i])
                        prop.values.push(nums[i])
                    }
                    
                    break
                }
            case DataType.Float32:
                {
                    let nums = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    
                    for (let i = 0; i < nums.length; i++) {
                        prop.values.push(nums[i])
                    }

                    break
                }
            case DataType.Float64:
                {
                    for (let i = 0; i < valuesLength; i++) {
                        prop.values.push(chunkView.readFloat64())
                    }
                    break
                }
            case DataType.UDim:
                {
                    let scales = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let offsets = chunkView.readInterleaved32(valuesLength, false)

                    for (let i = 0; i < valuesLength; i++) {
                        let udim = new UDim()
                        udim.Scale = scales[i]
                        udim.Offset = untransformInt32(offsets[i])
                        prop.values.push(udim)
                    }

                    break
                }
            case DataType.UDim2:
                {
                    let scalesX = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let scalesY = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let offsetsX = chunkView.readInterleaved32(valuesLength, false)
                    let offsetsY = chunkView.readInterleaved32(valuesLength, false)

                    for (let i = 0; i < valuesLength; i++) {
                        let udim = new UDim2()
                        udim.X.Scale = scalesX[i]
                        udim.Y.Scale = scalesY[i]
                        udim.X.Offset = untransformInt32(offsetsX[i])
                        udim.Y.Offset = untransformInt32(offsetsY[i])
                        prop.values.push(udim)
                    }

                    break
                }
            case DataType.Ray: //TODO: NOT TESTED
                {
                    for (let i = 0; i < valuesLength; i++) {
                        let ray = new Ray()
                        ray.Origin = [chunkView.readNormalFloat32(), chunkView.readNormalFloat32(), chunkView.readNormalFloat32()]
                        ray.Direction = [chunkView.readNormalFloat32(), chunkView.readNormalFloat32(), chunkView.readNormalFloat32()]
                        prop.values.push(ray)
                    }
                    break
                }
            case DataType.BrickColor:
                {
                    let values = chunkView.readInterleaved32(valuesLength, false, "readUint32")
                    for (let value of values) {
                        prop.values.push(value)
                    }
                    break
                }
            case DataType.Color3: //TODO: NOT TESTED
                {
                    let xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")

                    for (let i = 0; i < valuesLength; i++) {
                        let vector3 = new Color3()
                        vector3.R = xValues[i]
                        vector3.G = yValues[i]
                        vector3.B = zValues[i]
                        prop.values.push(vector3)
                    }
                    break
                }
            case DataType.Vector3:
                {
                    let xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")

                    for (let i = 0; i < valuesLength; i++) {
                        let vector3 = new Vector3()
                        vector3.X = xValues[i]
                        vector3.Y = yValues[i]
                        vector3.Z = zValues[i]
                        prop.values.push(vector3)
                    }
                    break
                }
            case DataType.CFrame:
                {
                    let cframes = []

                    for (let i = 0; i < valuesLength; i++) { //rotation array
                        let cframe = new CFrame()

                        let id = chunkView.readUint8()
                        if (id === 0) {
                            let matrix = new Array(9)
                            for (let x = 0; x < 3; x++) {
                                for (let y = 0; y < 3; y++) {
                                    matrix[x + y*3] = chunkView.readNormalFloat32()
                                }
                            }

                            cframe.Orientation = rotationMatrixToEulerAngles(matrix)
                            //cframe.Orientation[3] = matrix
                        } else {
                            cframe.Orientation = { //TODO: double check this
                                0x02: [0, 0, 0],
                                0x14: [0, 180, 0],
                                0x03: [90, 0, 0],
                                0x15: [-90, -180, 0],
                                0x05: [0, 180, 180],
                                0x17: [0, 0, 180],
                                0x06: [-90, 0, 0],
                                0x18: [90, 180, 0],
                                0x07: [0, 180, 90],
                                0x19: [0, 0, -90],
                                0x09: [0, 90, 90],
                                0x1b: [0, -90, -90],
                                0x0a: [0, 0, 90],
                                0x1c: [0, -180, -9],
                                0x0c: [0, -90, 90],
                                0x1e: [0, 90, -90],
                                0x0d: [-90, -90, 0],
                                0x1f: [90, 90, 0],
                                0x0e: [0, -90, 0],
                                0x20: [0, 90, 0],
                                0x10: [90, -90, 0],
                                0x22: [-90, 90, 0],
                                0x11: [0, 90, 180],
                                0x23: [0, -90, 180],
                            }[id]
                        }

                        cframes.push(cframe)
                    }

                    let xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")

                    for (let i = 0; i < valuesLength; i++) {
                        cframes[i].Position = [xValues[i], yValues[i], zValues[i]]
                        prop.values.push(cframes[i])
                    }
                    break
                }
            case DataType.Enum: //TODO: NOT TESTED
                {
                    let values = chunkView.readInterleaved32(valuesLength, false, "readUint32")

                    for (let val of values) {
                        prop.values.push(val)
                    }
                    break
                }
            case DataType.Referent: //Note: Referents become native references when tree is generated
                {
                    let referents = readReferents(valuesLength, chunkView)

                    for (let referent of referents) {
                        prop.values.push(referent)
                    }
                    break
                }
            case DataType.Color3uint8: //TODO: NOT TESTED
                {
                    let rs = []
                    let gs = []

                    for (let i = 0; i < valuesLength; i++) {
                        rs.push(chunkView.readUint8())
                    }
                    for (let i = 0; i < valuesLength; i++) {
                        gs.push(chunkView.readUint8())
                    }
                    for (let i = 0; i < valuesLength; i++) {
                        let color = new Color3uint8()
                        color.R = rs[i]
                        color.G = gs[i]
                        color.B = chunkView.readUint8()

                        prop.values.push(color)
                    }
                    break
                }
            case DataType.Int64:
                {
                    let nums = chunkView.readInterleaved32(valuesLength, false, "readInt64", 8)
                    //untransform
                    for (let i = 0; i < nums.length; i++) {
                        nums[i] = untransformInt64(nums[i])
                        prop.values.push(nums[i])
                    }

                    break
                }
            default:
                console.warn(`Unknown property type ${prop.typeID} in property ${prop.propertyName}`)
        }

        //if (prop.values.length > 0) {
            this.propArray.push(prop)
        //}
    }

    readPRNT(chunkView) {
        let version = chunkView.readUint8()
        if (version !== 0) {
            throw new Error("Unexpected PRNT version")
        }

        let prnt = new PRNT()

        prnt.instanceCount = chunkView.readUint32()
        prnt.childReferents = readReferents(prnt.instanceCount, chunkView)
        prnt.parentReferents = readReferents(prnt.instanceCount, chunkView)
        this.prnt = prnt
    }

    getChunkBuffer(view, compressedLength, uncompressedLength) {
        //compressed
        if (compressedLength !== 0) {
            let isZSTD = view.readUint32() == 4247762216
            view.viewOffset -= 4
            let isLZ4 = !isZSTD

            if (isZSTD) { //ZSTD
                throw new Error("Compressed data is ZSTD") //TODO: implement
            } else if (isLZ4) { //LZ4
                let uncompressed = Buffer.alloc(uncompressedLength)

                let compressedByteArray = view.buffer.slice(view.viewOffset, view.viewOffset + compressedLength)
                let compressedIntArray = new Uint8Array(compressedByteArray)

                let uncompressedSize = LZ4.decodeBlock(compressedIntArray, uncompressed)
                
                return uncompressed.buffer
            }
        }

        //uncompressed
        return view.buffer.slice(view.viewOffset, view.viewOffset + uncompressedLength)
    }

    addItem(item, itemParent) {
        let instance = new Instance(item.getAttribute("class"))

        let properties = item.querySelectorAll(":scope > Properties > *")
        for (let propertyNode of properties) {
            switch (propertyNode.nodeName) {
                case "Content":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.String

                        instance.addProperty(property)

                        let childElement = propertyNode.querySelector(":scope > *")

                        if (childElement.nodeName === "null") {
                            instance.setProperty(property.name, "")
                        } else {
                            instance.setProperty(property.name, childElement.textContent)
                        }
                        break
                    }
                case "string":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.String

                        instance.addProperty(property)
                        instance.setProperty(property.name, propertyNode.textContent)
                        break
                    }
                case "bool":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.String

                        instance.addProperty(property)
                        instance.setProperty(property.name, propertyNode.textContent.toLowerCase() === "true")
                        break
                    }
                case "CoordinateFrame":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.CFrame

                        instance.addProperty(property)

                        let cframeDesc = {}

                        let childElements = propertyNode.querySelectorAll(":scope > *")

                        let cframe = new CFrame()
                        for (let element of childElements) {
                            cframeDesc[element.nodeName] = Number(element.textContent)
                        }

                        let matrix = new Array(9)
                        let i = 0
                        for (let x = 0; x < 3; x++) {
                            for (let y = 0; y < 3; y++) {
                                matrix[x + y*3] = [
                                    cframeDesc.R00,
                                    cframeDesc.R01,
                                    cframeDesc.R02,
                                    cframeDesc.R10,
                                    cframeDesc.R11,
                                    cframeDesc.R12,
                                    cframeDesc.R20,
                                    cframeDesc.R21,
                                    cframeDesc.R22,
                                ][i]
                                i++
                            }
                        }

                        cframe.Orientation = rotationMatrixToEulerAngles(matrix)
                        cframe.Position = [cframeDesc.X, cframeDesc.Y, cframeDesc.Z]

                        instance.setProperty(property.name, cframe)

                        break
                    }
                case "Vector3":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.Vector3

                        instance.addProperty(property)

                        let childElements = propertyNode.querySelectorAll(":scope > *")

                        let position = new Vector3()
                        for (let element of childElements) {
                            position[element.nodeName] = Number(element.textContent)
                        }

                        instance.setProperty(property.name, position)

                        break
                    }
                case "token":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.Enum

                        instance.addProperty(property)
                        instance.setProperty(property.name, Number(propertyNode.textContent))

                        break
                    }
                case "Color3uint8":
                    {
                        let color3uint8 = new Color3uint8()

                        let intColor = Number(propertyNode.textContent)
                        let colorRGB = intToRgb(intColor)
                        color3uint8.R = colorRGB.R
                        color3uint8.G = colorRGB.G
                        color3uint8.B = colorRGB.B

                        instance.addProperty(new Property(propertyNode.getAttribute("name"), DataType.Color3uint8), color3uint8)
                        break
                    }
            }
        }

        if (itemParent) {
            instance.setParent(itemParent)
        } else {
            instance.setParent(this.dataModel)
        }

        return instance
    }

    fromXML(xml) { //TODO: figure out how to do this accurately https://dom.rojo.space/xml.html
        console.warn("Parsing RBX xml file, the result may not be accurate")
        //console.log(xml)

        let currentItems = xml.querySelectorAll(":scope > Item")
        while (currentItems.length > 0) {
            let newCurrentItems = []

            for (let item of currentItems) {
                let instance = this.addItem(item, item.itemParent)
                let itemChildren = item.querySelectorAll(":scope > Item")
                for (let itemChild of itemChildren) {
                    itemChild.itemParent = instance
                    newCurrentItems.push(itemChild)
                }
            }

            currentItems = newCurrentItems
        }

        this.treeGenerated = true
    }

    fromBuffer(buffer) {
        this.reset()

        let view = new RBXSimpleView(buffer)

        // FILE HEADER

        //verify magic
        let readMagic = view.readUtf8String(magic.length)
        if (readMagic !== magic) {
            if (readMagic === xmlMagic) {
                let xmlString = new TextDecoder("utf-8").decode(buffer)
                let xml = new DOMParser().parseFromString(xmlString, "text/xml")
                this.fromXML(xml)
                return
            } else {
                console.log(buffer)
                throw new Error("Not a valid file, missing magic")
            }
        }

        //skip signature
        view.viewOffset += 6

        //skip version (always 0, u16)
        view.viewOffset += 2

        this.classCount = view.readInt32()
        this.instanceCount = view.readInt32()

        //skip padding
        view.viewOffset += 8

        console.log(`FILESIZE: ${buffer.byteLength}, CLASSCOUNT: ${this.classCount}, INSTCOUNT: ${this.instanceCount}`)

        //CHUNKS
        let timeout = 0
        let foundEnd = false
        while (!foundEnd) {
            let chunkName = view.readUtf8String(4)
            let compressedLength = view.readUint32()
            let uncompressedLength = view.readUint32()

            view.viewOffset += 4 //skip unused

            let chunkBuffer = this.getChunkBuffer(view, compressedLength, uncompressedLength)

            view.lock()

            let chunkView = new RBXSimpleView(chunkBuffer)

            //console.log(`CHUNK: ${chunkName}, USIZE: ${uncompressedLength}, CSIZE: ${compressedLength}`)
            //console.log(chunkBuffer)

            /*
            if (chunkName == "PRNT") {
                saveByteArray([chunkBuffer], `${chunkName}.dat`)
            }
            */

            switch (chunkName) {
                case "META":
                    {
                        this.readMETA(chunkView)
                        break
                    }
                case "SSTR":
                    {
                        this.readSSTR(chunkView)
                        break
                    }
                case "INST":
                    {
                        this.readINST(chunkView)
                        break
                    }
                case "PROP":
                    {
                        this.readPROP(chunkView)
                        break
                    }
                case "PRNT":
                    {
                        this.readPRNT(chunkView)
                        break
                    }
                case "END\0":
                    foundEnd = true    
                    break
                default:
                    console.warn("Unknown chunk found: " + chunkName)
                    break
            }

            view.unlock()

            view.viewOffset += compressedLength || uncompressedLength

            timeout++
            if (timeout > 10000 && !foundEnd) {
                throw new Error("Max retry count reached")
            }
        }
    }

    async fromAssetId(id) { //Return: dataModel | null
        let response = await fetch("https://assetdelivery.roproxy.com/v1/asset?id=" + id)
        if (response.status === 200) {
            let buffer = await response.arrayBuffer()

            this.fromBuffer(buffer)
            this.generateTree()

            return this.dataModel
        }
        return null
    }

    generateTree() {
        if (this.treeGenerated) {
            console.warn("Tree already generated")
            return
        }

        let referentToInstance = new Map() //<referent,instance>

        //instances
        for (let inst of this.instArray) {
            for (let i = 0; i < inst.instanceCount; i++) {
                let instance = new Instance(inst.className)
                instance.classID = inst.classID
                instance.objectFormat = inst.objectFormat

                if (referentToInstance.get(inst.referents[i])) {
                    throw new Error(`Duplicate referent ${inst.referents[i]}`)
                }
                referentToInstance.set(inst.referents[i], instance)
            }
        }

        //properties
        for (let prop of this.propArray) {
            let inst = this.classIDtoINST.get(prop.classID)
            for (let i = 0; i < inst.referents.length; i++) {
                let referent = inst.referents[i]
                let instance = referentToInstance.get(referent)

                let property = new Property()
                property.name = prop.propertyName
                property.typeID = prop.typeID
                
                instance.addProperty(property)
                switch (property.typeID) {
                    case DataType.Referent:
                        {
                            let referenced = referentToInstance.get(prop.values[i])
                            instance.setProperty(property.name, referenced)
                            break
                        }
                    default:
                        {
                            instance.setProperty(property.name, prop.values[i])
                            break
                        }
                }

                //if (property.typeID == DataType.BrickColor) {
                //    console.log(instance.GetFullName())
                //    console.log(property.name)
                //}
            }
        }

        //hierarchy
        for (let i = 0; i < this.prnt.instanceCount; i++) {
            let childReferent = this.prnt.childReferents[i]
            let parentReferent = this.prnt.parentReferents[i]

            let child = referentToInstance.get(childReferent)
            let parent = referentToInstance.get(parentReferent)

            if (!child) {
                console.warn(`Child with referent ${childReferent} does not exist`)
                continue;
            }

            if (!parent && parentReferent !== -1) {
                console.warn(`Parent with referent ${parentReferent} does not exist`)
                continue;
            }

            if (parentReferent !== -1) {
                child.setParent(parent)
            } else {
                child.setParent(this.dataModel)
            }
        }

        this.treeGenerated = true
        return this.dataModel
    }
}

window.RBX = RBX
window.CFrame = CFrame
window.ScaleAccessoryForRig = (accessory, rig, outfit) => {
    let scale = outfit.scale

    if (outfit.playerAvatarType === AvatarType.R6) {
        console.log("SCALING FOR R6")
		ScaleAccessory(accessory, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig)
	} else {
        console.log("SCALING FOR R15")
        //scale parts
        let bodyScaleVector = Vector3.new(
            scale.width,
            scale.height,
            scale.depth
        )
        let headScaleVector = Vector3.new(scale.head, scale.head, scale.head)

        //scale accessories
        ScaleAccessory(accessory, bodyScaleVector, headScaleVector, scale.bodyType, scale.proportion, rig)
    }
}