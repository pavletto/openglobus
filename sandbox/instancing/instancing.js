'use strict';

import { Handler } from '../../src/og/webgl/Handler.js';
import { Renderer } from '../../src/og/renderer/Renderer.js';
import { SimpleNavigation } from '../../src/og/control/SimpleNavigation.js';
import { Axes } from '../../src/og/scene/Axes.js';
import { Vec3 } from '../../src/og/math/Vec3.js';
import { Vec4 } from '../../src/og/math/Vec4.js';
import { RenderNode } from '../../src/og/scene/RenderNode.js';
import { Program } from '../../src/og/webgl/Program.js';

export function instancing() {
    return new Program("instancing", {
        uniforms: {
        },
        attributes: {
        },
        vertexShader:
            `precision highp float;
            `,
        fragmentShader:
            `precision highp float;
            `
    });
}


let handler = new Handler("frame", { 'autoActivate': true });
let renderer = new Renderer(handler, {
    'controls': [new SimpleNavigation()],
    'autoActivate': true
});

class MyScene extends RenderNode {
    constructor() {
        super("MyScene");
    }

    init() {
        this.renderer.handler.addProgram(instancing());
        var h = this.renderer.handler;
    }

    frame() {
        var r = this.renderer;
        var h = r.handler;
        h.programs.ray.activate();
        var sh = h.programs.instancing._program;
        var sha = sh.attributes,
            shu = sh.uniforms;

        var gl = h.gl;

    }
};

let myScene = new MyScene();

renderer.addNodes([new Axes(), myScene]);

window.Vec3 = Vec3;
window.renderer = renderer;

