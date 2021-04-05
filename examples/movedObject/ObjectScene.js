import { Program } from "../../src/og/webgl/Program.js";
import { RenderNode } from "../../src/og/scene/RenderNode.js";
import { Vec3 } from "../../src/og/math/Vec3.js";

export class ObjectScene extends RenderNode {
    constructor() {
        super("ObjectScene");

        this._grad = 0;

        this.neheTexture = null;

        this.vericesBuffer = null;
        this.textureCoordsBuffer = null;
        this.indicesBuffer = null;

        this.translate = new Vec3(0, 0, 0);

        this.scale = 10;

    }

    init() {

        //Initialize shader program
        this.renderer.handler.addProgram(new Program("objectShader", {
            'uniforms': {
                'uMVMatrix': 'mat4',
                'uPMatrix': 'mat4',
                'uTranslate': 'vec3',
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
                    uniform vec3 uScale;
                    
                    varying vec2 vTextureCoord;
                    
                    void main(void) {
                        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition * uScale  + uTranslate, 1.0) ;
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vericesBuffer);
        gl.vertexAttribPointer(p.attributes.aVertexPosition, this.vericesBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordsBuffer);
        gl.vertexAttribPointer(p.attributes.aTextureCoord, this.textureCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        gl.drawElements(gl.TRIANGLES, this.indicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    setTranslate({ x, y, z }) {
        this.translate.x = x;
        this.translate.y = y;
        this.translate.z = z;
    }
}
