import * as math from "../math";
import {Control} from "./Control";
import type {IControlParams} from "./Control";
import {input} from "../input/input";
import {Key} from "../Lock";
import {LonLat} from "../LonLat";
import {Mat4} from "../math/Mat4";
import {Quat} from "../math/Quat";
import {Ray} from "../math/Ray";
import {Sphere} from "../bv/Sphere";
import {Vec3} from "../math/Vec3";
import {Vec2} from "../math/Vec2";
import {Planet} from "../scene/Planet";
import {PlanetCamera} from "../camera/PlanetCamera";
import type {IMouseState} from "../renderer/RendererEvents";
import {Plane} from "../math/Plane";

export interface IStepForward {
    eye: Vec3;
    v: Vec3;
    u: Vec3;
    n: Vec3;
}

interface IMouseNavigationParams extends IControlParams {
    minSlope?: number;
}

/**
 * Mouse planet camera dragging control.
 */
export class OldMouseNavigation extends Control {
    protected grabbedPoint: Vec3;
    protected _eye0: Vec3;
    protected pointOnEarth: Vec3;
    protected earthUp: Vec3;
    public inertia: number;
    protected grabbedSpheroid: Sphere;
    protected qRot: Quat;
    protected scaleRot: number;
    protected distDiff: number;
    protected stepsCount: number;
    protected stepsForward: IStepForward[] | null;
    protected stepIndex: number;
    protected _lmbDoubleClickActive: boolean;
    public minSlope: number;
    protected _wheelDirection: number;
    protected _keyLock: Key;
    protected _deactivate = false;
    protected _shiftBusy = false;

    constructor(options: IMouseNavigationParams = {}) {
        super(options);

        this._name = "mouseNavigation";

        this.grabbedPoint = new Vec3();
        this._eye0 = new Vec3();
        this.pointOnEarth = new Vec3();
        this.earthUp = new Vec3();
        this.inertia = 0.007;
        this.grabbedSpheroid = new Sphere();
        this.qRot = new Quat();
        this.scaleRot = 0.0;

        this.distDiff = 0.3;
        this.stepsCount = 8;
        this.stepsForward = null;
        this.stepIndex = 0;

        this._lmbDoubleClickActive = true;

        this.minSlope = options.minSlope || 0.1;

        this._wheelDirection = +1;

        this._keyLock = new Key();
    }

    static getMovePointsFromPixelTerrain(cam: PlanetCamera, planet: Planet, stepsCount: number, delta: number, point: Vec2, forward: boolean, dir?: Vec3 | null): IStepForward[] | undefined {
        const steps: IStepForward[] = [];

        let eye = cam.eye.clone(),
            n = cam.getBackward(),
            u = cam.getRight(),
            v = cam.getUp();

        let a = planet.getCartesianFromPixelTerrain(point);

        if (!a) {
            a = planet.getCartesianFromPixelTerrain(planet.renderer!.handler.getCenter());
        }

        if (a) {
            if (!dir) {
                dir = Vec3.sub(a, cam.eye).normalize();
            }

            let d = (delta * cam.eye.distance(a)) / stepsCount;

            if (forward) {
                d = -1.25 * d;
            } else {
                d *= 2;
            }

            const scaled_n = n.scaleTo(d);

            const slope = dir.dot(cam.eye.normal().negate());

            if (slope >= 0.1) {
                const grabbedSpheroid = new Sphere();
                grabbedSpheroid.radius = a.length();

                let rotArr = [],
                    eyeArr = [];

                let breaked = false;
                for (let i = 0; i < stepsCount; i++) {
                    eye.addA(scaled_n);
                    const b = new Ray(eye, dir).hitSphere(grabbedSpheroid);
                    eyeArr[i] = eye.clone();
                    if (b) {
                        rotArr[i] = new Mat4().rotateBetweenVectors(a.normal(), b.normal());
                    } else {
                        breaked = true;
                        break;
                    }
                }

                if (!breaked) {
                    for (let i = 0; i < stepsCount; i++) {
                        let rot = rotArr[i];
                        steps[i] = {
                            eye: rot.mulVec3(eyeArr[i]),
                            v: rot.mulVec3(v),
                            u: rot.mulVec3(u),
                            n: rot.mulVec3(n)
                        };
                    }
                } else {
                    eye = cam.eye.clone();
                    for (let i = 0; i < stepsCount; i++) {
                        steps[i] = {
                            eye: eye.addA(scaled_n).clone(),
                            v: v,
                            u: u,
                            n: n,
                        };
                    }
                }
            } else {
                for (let i = 0; i < stepsCount; i++) {
                    steps[i] = {
                        eye: eye.addA(dir.scaleTo(-d)).clone(),
                        v: v,
                        u: u,
                        n: n,
                    };
                }
            }

            return steps;
        }
    }

    public override onactivate() {
        if (this.renderer) {
            this.renderer.events.on("mousewheel", this.onMouseWheel, this);
            this.renderer.events.on("lhold", this.onMouseLeftButtonDown, this);
            this.renderer.events.on("rhold", this.onMouseRightButtonDown, this);
            this.renderer.events.on("ldown", this.onMouseLeftButtonClick, this);
            this.renderer.events.on("lup", this.onMouseLeftButtonUp, this);
            this.renderer.events.on("rdown", this.onMouseRightButtonClick, this);
            this.renderer.events.on("draw", this.onDraw, this, -1000);
            this.renderer.events.on("mousemove", this.onMouseMove, this);
            this.renderer.events.on("mouseleave", this.onMouseLeave, this);
            this.renderer.events.on("mouseenter", this.onMouseEnter, this);

            if (this._lmbDoubleClickActive) {
                this.renderer.events.on("ldblclick", this.onMouseLeftButtonDoubleClick, this);
            }
        }
    }

    public override ondeactivate() {
        if (this.renderer) {
            this.renderer.events.off("mousewheel", this.onMouseWheel);
            this.renderer.events.off("lhold", this.onMouseLeftButtonDown);
            this.renderer.events.off("rhold", this.onMouseRightButtonDown);
            this.renderer.events.off("ldown", this.onMouseLeftButtonClick);
            this.renderer.events.off("lup", this.onMouseLeftButtonUp);
            this.renderer.events.off("rdown", this.onMouseRightButtonClick);
            this.renderer.events.off("draw", this.onDraw);
            this.renderer.events.off("ldblclick", this.onMouseLeftButtonDoubleClick);
            this.renderer.events.off("mouseleave", this.onMouseLeave);
            this.renderer.events.off("mouseenter", this.onMouseEnter);
        }
    }

    public activateDoubleClickZoom() {
        if (!this._lmbDoubleClickActive) {
            this._lmbDoubleClickActive = true;
            this.renderer && this.renderer.events.on("ldblclick", this.onMouseLeftButtonDoubleClick, this);
        }
    }

    public deactivateDoubleClickZoom() {
        if (this._lmbDoubleClickActive) {
            this._lmbDoubleClickActive = false;
            this.renderer && this.renderer.events.off("ldblclick", this.onMouseLeftButtonDoubleClick);
        }
    }

    protected onMouseEnter(e: IMouseState) {
        const renderEvents = this.renderer!.events;
        if (renderEvents.isKeyPressed(input.KEY_ALT)) {
            renderEvents.releaseKeys();
        }

        renderEvents.updateButtonsStates(e.sys!.buttons);
        if (renderEvents.mouseState.leftButtonDown) {
            this.renderer!.handler.canvas!.classList.add("ogGrabbingPoiner");
        } else {
            this.renderer!.handler.canvas!.classList.remove("ogGrabbingPoiner");
        }
    }

    protected onMouseLeave() {
        if (this.renderer!.events.mouseState.leftButtonDown) {
            this.scaleRot = 0;
        }
        this.renderer!.handler.canvas!.classList.remove("ogGrabbingPoiner");
    }

    protected onMouseWheel(e: IMouseState) {
        if (this.stepIndex) {
            return;
        }

        this.planet!.stopFlying();

        this.stopRotation();

        this._deactivate = true;

        this.lockPlanet(true);

        this.stepsForward = OldMouseNavigation.getMovePointsFromPixelTerrain(
            this.planet!.camera,
            this.planet!,
            this.stepsCount,
            this.distDiff,
            e.pos,
            e.wheelDelta > 0,
            e.direction
        ) || null;

        this._wheelDirection = e.wheelDelta;

        if (this.stepsForward) {
            this.stepIndex = this.stepsCount;
        }
    }

    public override oninit() {
        this.activate();
        if (this.renderer) {
            this.renderer.events.on("keyfree", input.KEY_ALT, this.onShiftFree, this);
            this.renderer.events.on("keyfree", input.KEY_PRINTSCREEN, this.onShiftFree, this);
        }
    }

    protected onMouseLeftButtonDoubleClick(e: IMouseState) {
        this.planet!.stopFlying();
        this.stopRotation();
        const p = this.planet!.getCartesianFromPixelTerrain(e.pos);
        if (p) {
            const cam = this.planet!.camera;
            let maxAlt = cam.maxAltitude + this.planet!.ellipsoid.polarSize;
            let minAlt = cam.minAltitude + this.planet!.ellipsoid.polarSize;
            const camAlt = cam.eye.length();
            const g = this.planet!.ellipsoid.cartesianToLonLat(p);
            if (camAlt > maxAlt || camAlt < minAlt) {
                this.planet!.flyLonLat(new LonLat(g.lon, g.lat))
                return;
            }

            if (this.renderer!.events.isKeyPressed(input.KEY_ALT)) {
                this.planet!.flyLonLat(
                    new LonLat(g.lon, g.lat, cam.eye.distance(p) * 2.0)
                );
            } else {
                this.planet!.flyLonLat(
                    new LonLat(g.lon, g.lat, cam.eye.distance(p) * 0.57)
                );
            }
        }
    }

    protected onMouseLeftButtonClick() {
        if (this._active) {
            this.renderer!.handler.canvas!.classList.add("ogGrabbingPoiner");
            this.grabbedPoint = this.planet!.getCartesianFromMouseTerrain()!;
            if (this.grabbedPoint) {
                this._eye0.copy(this.planet!.camera.eye);
                this.grabbedSpheroid.radius = this.grabbedPoint.length();
                this.stopRotation();
            }
        }
    }

    public stopRotation() {
        this.qRot.clear();
        this.freePlanet();
    }

    protected onMouseLeftButtonUp(e: IMouseState) {
        this.renderer!.handler.canvas!.classList.remove("ogGrabbingPoiner");
        if (e.x === e.prev_x && e.y === e.prev_y) {
            this.scaleRot = 0.0;
        }
    }

    protected onMouseLeftButtonDown(e: IMouseState) {
        if (this._active) {
            if (!this.grabbedPoint) {
                return;
            }

            this.planet!.stopFlying();

            if (e.moving) {
                let cam = this.planet!.camera;

                if (cam.slope > 0.2) {
                    const targetPoint = new Ray(cam.eye, e.direction).hitSphere(this.grabbedSpheroid);
                    if (targetPoint) {
                        this.scaleRot = 1.0;
                        this.qRot = Quat.getRotationBetweenVectors(
                            targetPoint.normal(),
                            this.grabbedPoint.normal()
                        );
                        let rot = this.qRot;
                        cam.eye = rot.mulVec3(cam.eye);
                        cam.rotate(rot);
                        // cam._u = rot.mulVec3(cam._u);
                        // cam._r = rot.mulVec3(cam._r);
                        // cam._b = rot.mulVec3(cam._b);
                        // cam._f.set(-cam._b.x, -cam._b.y, -cam._b.z);
                    }
                } else {
                    let p0 = this.grabbedPoint,
                        p1 = Vec3.add(p0, cam.getRight()),
                        p2 = Vec3.add(p0, p0.normal());

                    let px = new Vec3();
                    if (new Ray(cam.eye, e.direction).hitPlaneRes(Plane.fromPoints(p0, p1, p2), px) === Ray.INSIDE) {
                        cam.eye = this._eye0.addA(px.subA(p0).negate());
                    }
                }
            }
        }
    }

    protected onMouseRightButtonClick(e: IMouseState) {
        this.stopRotation();
        this.planet!.stopFlying();
        this.pointOnEarth = this.planet!.getCartesianFromPixelTerrain(e.pos)!;
        if (this.pointOnEarth) {
            this.earthUp = this.pointOnEarth.normal();
        }
    }

    protected onMouseRightButtonDown(e: IMouseState) {
        const cam = this.planet!.camera;

        if (this.pointOnEarth && e.moving) {
            this.renderer!.controlsBag.scaleRot = 1.0;
            let l = (0.5 / cam.eye.distance(this.pointOnEarth)) * cam._lonLat.height * math.RADIANS;
            if (l > 0.007) {
                l = 0.007;
            } else if (l < 0.003) {
                l = 0.003;
            }
            cam.rotateHorizontal(l * (e.x - e.prev_x), false, this.pointOnEarth, this.earthUp);
            cam.rotateVertical(l * (e.y - e.prev_y), this.pointOnEarth, this.minSlope);
        }
    }

    public onShiftFree() {
        this._shiftBusy = false;
    }

    protected onMouseMove(e: IMouseState) {
        if (this._active && this.renderer!.events.isKeyPressed(input.KEY_ALT)) {
            if (!this._shiftBusy) {
                this._shiftBusy = true;
                this.onMouseRightButtonClick(e);
            }

            this.onMouseRightButtonDown(e);
        }
    }

    protected onDraw() {
        if (this._active) {
            const r = this.renderer!;
            const cam = this.planet!.camera;
            let prevEye = cam.eye.clone();

            if (this.stepIndex) {
                r.controlsBag.scaleRot = 1.0;
                const sf = this.stepsForward![this.stepsCount - this.stepIndex--];
                cam.eye = sf.eye;
                //@ts-ignore
                cam._u = sf.v;
                //@ts-ignore
                cam._r = sf.u;
                //@ts-ignore
                cam._b = sf.n;
                //@ts-ignore
                cam._f.set(-cam._b.x, -cam._b.y, -cam._b.z);
            } else {
                if (this._deactivate) {
                    this._deactivate = false;
                    this.freePlanet();
                }
            }

            if (r.events.mouseState.leftButtonDown || !this.scaleRot) {
                return;
            }

            this.scaleRot -= this.inertia;
            if (this.scaleRot <= 0.0) {
                this.scaleRot = 0.0;
            } else {
                r.controlsBag.scaleRot = this.scaleRot;
                let rot = this.qRot
                    .slerp(Quat.IDENTITY, 1.0 - this.scaleRot * this.scaleRot * this.scaleRot)
                    .normalize();
                if (!(rot.x || rot.y || rot.z)) {
                    this.scaleRot = 0.0;
                }
                cam.eye = rot.mulVec3(cam.eye);
                cam.rotate(rot);
                // cam._u = rot.mulVec3(cam._u);
                // cam._r = rot.mulVec3(cam._r);
                // cam._b = rot.mulVec3(cam._b);
                // cam._f.set(-cam._b.x, -cam._b.y, -cam._b.z);
            }

            if (cam.eye.distance(prevEye) / cam.getAltitude() > 0.01) {
                this.lockPlanet();
            } else {
                this.freePlanet();
            }
        }
    }

    public lockPlanet(skipTerrain?: boolean) {
        this.planet!.layerLock.lock(this._keyLock);
        !skipTerrain && this.planet!.terrainLock.lock(this._keyLock);
        this.planet!._normalMapCreator.lock(this._keyLock);
    }

    public freePlanet() {
        this.planet!.layerLock.free(this._keyLock);
        this.planet!.terrainLock.free(this._keyLock);
        this.planet!._normalMapCreator.free(this._keyLock);
    }
}
