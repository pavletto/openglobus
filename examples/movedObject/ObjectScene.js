import { Program } from "../../src/og/webgl/Program.js";
import { RenderNode } from "../../src/og/scene/RenderNode.js";
import { Vec3 } from "../../src/og/math/Vec3.js";
import { input } from "../../src/og/input/input.js";

export class ObjectScene extends RenderNode {
    constructor() {
        super("ObjectScene");

        this._grad = 0;

        this.neheTexture = null;

        this.vericesBuffer = null;
        this.textureCoordsBuffer = null;
        this.indicesBuffer = null;

        this.translate = new Vec3(0, 0, 0);
        this.rotate = new Vec3(0, 0, 0);

        this.scale = 10;

    }

    init() {

        //Initialize shader program
        this.renderer.handler.addProgram(new Program("objectShader", {
            'uniforms': {
                'uMVMatrix': 'mat4',
                'uPMatrix': 'mat4',
                'uTranslate': 'vec3',
                'pitchRollYaw': 'vec3',
                'uSampler': 'sampler2d',
                'uScale': 'vec3'
            },
            'attributes': {
                'aVertexPosition': 'vec3',
                'aTextureCoord': 'vec2'
            },
            'vertexShader':
                `attribute vec3 aVertexPosition;
                    attribute vec2 aTextureCoord;
                    
                    uniform mat4 uMVMatrix;
                    uniform mat4 uPMatrix;
                    uniform vec3 uTranslate;
                    uniform vec3 pitchRollYaw;
                    uniform vec3 uScale;
                    
                    varying vec2 vTextureCoord;
                    
                    const float RADIANS = 3.141592653589793 / 180.0;
                    
                    void main(void) {
                        vec3 scaledPosition = aVertexPosition * uScale;
                       
                        float roll = pitchRollYaw.y * RADIANS;
                        mat3 rotZ = mat3(
                             vec3(cos(roll), -sin(roll), 0.0),
                             vec3(sin(roll), cos(roll), 0.0), 
                             vec3(0.0, 0.0, 1.0) 
                        );
                      
                        float yaw = pitchRollYaw.z * RADIANS;
                        mat3 rotY = mat3(
                            vec3(cos(yaw), 0.0, -sin(yaw)),
                            vec3(0.0, 1.0, 0.0), 
                            vec3(sin(yaw), 0.0, cos(yaw)) 
                       );
        
                        float pitch = pitchRollYaw.x * RADIANS;
                        mat3 rotX = mat3(
                            vec3(1.0, 0.0, 0.0),
                            vec3(0.0, cos(pitch), -sin(pitch)), 
                            vec3(0.0, sin(pitch), cos(pitch)) 
                       );
                       
                        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition * uScale * rotX * rotY * rotZ + uTranslate, 1.0) ;
                        vTextureCoord = aTextureCoord;
                    }`,
            'fragmentShader':
                `precision mediump float;
                    varying vec2 vTextureCoord;
                    uniform sampler2D uSampler;
                    
                    void main(void) {
                        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
                    }`
        }));

        //Load texture
        this.neheTexture = null;
        const image = new Image(),
            that = this;
        image.onload = function () {
            that.neheTexture = that.renderer.handler.createTexture_mm(this);
        };
        image.src = "swiborg.png";

        //Create buffers
        const vertices = [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0
        ];

        this.vericesBuffer = this.renderer.handler.createArrayBuffer(new Float32Array(vertices), 3, vertices.length / 3);

        const textureCoords = [
            // Front face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Back face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Top face
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,

            // Bottom face
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,

            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];

        this.textureCoordsBuffer = this.renderer.handler.createArrayBuffer(new Float32Array(textureCoords), 2, textureCoords.length / 2);

        const cubeVertexIndices = [
            0, 1, 2, 0, 2, 3,    // Front face
            4, 5, 6, 4, 6, 7,    // Back face
            8, 9, 10, 8, 10, 11,  // Top face
            12, 13, 14, 12, 14, 15, // Bottom face
            16, 17, 18, 16, 18, 19, // Right face
            20, 21, 22, 20, 22, 23  // Left face
        ];

        this.indicesBuffer = this.renderer.handler.createElementArrayBuffer(new Uint16Array(cubeVertexIndices), 1, cubeVertexIndices.length);

        this.initEvents();
    }

    initEvents() {
        this.renderer.events.on("keypress", input.KEY_W, this.onPressW, this);
        this.renderer.events.on("keypress", input.KEY_S, this.onPressS, this);
        this.renderer.events.on("keypress", input.KEY_A, this.onPressD, this);
        this.renderer.events.on("keypress", input.KEY_D, this.onPressA, this);
        this.renderer.events.on("keypress", input.KEY_Q, this.onPressQ, this);
        this.renderer.events.on("keypress", input.KEY_E, this.onPressE, this);
        this.renderer.events.on("keypress", input.KEY_UP, this.onPressUp, this);
        this.renderer.events.on("keypress", input.KEY_DOWN, this.onPressDown, this);
        this.renderer.events.on("keypress", input.KEY_LEFT, this.onPressLeft, this);
        this.renderer.events.on("keypress", input.KEY_RIGHT, this.onPressRight, this);

    }

    frame() {

        const r = this.renderer,
            sh = r.handler.programs.objectShader,
            p = sh._program,
            gl = r.handler.gl;

        sh.activate();

        const modelViewMat = r.activeCamera._viewMatrix;

        //Sets shader's data
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.neheTexture);
        gl.uniform1i(p.uniforms.uSampler, 0);

        gl.uniformMatrix4fv(p.uniforms.uMVMatrix, false, modelViewMat._m);
        gl.uniformMatrix4fv(p.uniforms.uPMatrix, false, r.activeCamera.getProjectionMatrix());
        gl.uniform3fv(p.uniforms.uTranslate, new Float32Array([this.translate.x, this.translate.y, this.translate.z]));
        gl.uniform3fv(p.uniforms.uScale, new Float32Array([this.scale, this.scale, this.scale]));
        gl.uniform3fv(p.uniforms.pitchRollYaw, new Float32Array([this.rotate.x, this.rotate.y, this.rotate.z]));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vericesBuffer);
        gl.vertexAttribPointer(p.attributes.aVertexPosition, this.vericesBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordsBuffer);
        gl.vertexAttribPointer(p.attributes.aTextureCoord, this.textureCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        gl.drawElements(gl.TRIANGLES, this.indicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    setTranslate({
                     x = 0,
                     y = 0,
                     z = 0
                 }) {
        this.translate.x = x;
        this.translate.y = y;
        this.translate.z = z;
    }

    incTranslate({
                     x = 0,
                     y = 0,
                     z = 0
                 }) {
        this.translate.x += x;
        this.translate.y += y;
        this.translate.z += z;
    }

    decTranslate({
                     x = 0,
                     y = 0,
                     z = 0
                 }) {
        this.translate.x -= x;
        this.translate.y -= y;
        this.translate.z -= z;
    }

    incRotate({
                  x = 0,
                  y = 0,
                  z = 0
              }) {
        this.rotate.addA({
            x,
            y,
            z
        });
    }

    decRotate({
                  x = 0,
                  y = 0,
                  z = 0
              }) {
        this.rotate.subA({
            x,
            y,
            z
        });
    }

    onPressW() {
        this.rotate.x += 5;
    }

    onPressS() {
        this.rotate.x -= 5;
    }

    onPressA() {
        this.rotate.y -= 5;
    }

    onPressD() {
        this.rotate.y += 5;
    }

    onPressQ() {
        this.rotate.z -= 5;
    }

    onPressE() {
        this.rotate.z += 5;
    }

    onPressUp() {
        this.translate.x += 10;
    }

    onPressDown() {

        this.translate.x -= 10;
    }

    onPressLeft() {

        this.translate.y -= 10;
    }

    onPressRight() {
        this.translate.y += 10;
    }
}
