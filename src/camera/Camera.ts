import * as math from "../math";
import {type EventsHandler, createEvents} from "../Events";
import {Frustum} from "./Frustum";
import {Mat3} from "../math/Mat3";
import type {NumberArray9} from "../math/Mat3";
import {Mat4} from "../math/Mat4";
import type {NumberArray16} from "../math/Mat4";
import {Renderer} from "../renderer/Renderer";
import {Vec2} from "../math/Vec2";
import type {NumberArray2} from "../math/Vec2";
import {Vec3} from "../math/Vec3";
import {Vec4} from "../math/Vec4";
import {Sphere} from "../bv/Sphere";
import {Quat} from "../math/Quat";
import {DEGREES_DOUBLE, RADIANS, RADIANS_HALF} from "../math";

type CameraEvents = ["viewchange", "moveend"];

const EVENT_NAMES: CameraEvents = [
    /**
     * When camera has been updated.
     * @event og.Camera#viewchange
     */
    "viewchange",

    /**
     * Camera is stopped.
     * @event og.Camera#moveend
     */
    "moveend"
];

export interface ICameraParams {
    eye?: Vec3;
    viewAngle?: number;
    look?: Vec3;
    up?: Vec3;
    frustums?: NumberArray2[]
    width?: number;
    height?: number;
}

const getHorizontalViewAngleByFov = (fov: number, aspect: number) => DEGREES_DOUBLE * Math.atan(Math.tan(RADIANS_HALF * fov) * aspect);

/**
 * Camera class.
 * @class
 * //@param {Renderer} [renderer] - Renderer uses the camera instance.
 * @param {Object} [options] - Camera options:
 * @param {Object} [options.name] - Camera name.
 * @param {number} [options.viewAngle=47] - Camera angle of view. Default is 47.0
 * @param {number} [options.near=1] - Camera near plane distance. Default is 1.0
 * @param {number} [options.far=og.math.MAX] - Camera far plane distance. Default is og.math.MAX
 * @param {Vec3} [options.eye=[0,0,0]] - Camera eye position. Default (0,0,0)
 * @param {Vec3} [options.look=[0,0,0]] - Camera look position. Default (0,0,0)
 * @param {Vec3} [options.up=[0,1,0]] - Camera eye position. Default (0,1,0)
 *
 * @fires EventsHandler<CameraEvents>#viewchange
 * @fires EventsHandler<CameraEvents>#moveend
 */
class Camera {

    // /**
    //  * Assigned renderer
    //  * @public
    //  * @type {Renderer}
    //  */
    // public renderer: Renderer | null;

    /**
     * Camera events handler
     * @public
     * @type {Events}
     */
    public events: EventsHandler<CameraEvents>;

    /**
     * Camera position.
     * @public
     * @type {Vec3}
     */
    public eye: Vec3;

    /**
     * Camera RTE high position
     * @public
     * @type {Float32Array}
     */
    public eyeHigh: Float32Array;

    /**
     * Camera RTE low position
     * @public
     * @type {Float32Array}
     */
    public eyeLow: Float32Array;

    // /**
    //  * Aspect ratio.
    //  * @protected
    //  * @type {Number}
    //  */
    // protected _aspect: number;

    /**
     * Camera view angle in degrees
     * @protected
     * @type {Number}
     */
    protected _viewAngle: number;

    protected _horizontalViewAngle: number;

    /**
     * Camera view matrix.
     * @protected
     * @type {Mat4}
     */
    protected _viewMatrix: Mat4;
    protected _viewMatrixRTE: Mat4;

    /**
     * Camera normal matrix.
     * @protected
     * @type {Mat3}
     */
    protected _normalMatrix: Mat3;

    /**
     * Camera right vector.
     * @protected
     * @type {Vec3}
     */
    public _r: Vec3;

    /**
     * Camera up vector.
     * @protected
     * @type {Vec3}
     */
    public _u: Vec3;

    /**
     * Camera backward vector.
     * @protected
     * @type {Vec3}
     */
    public _b: Vec3;

    /**
     * Camera forward vector.
     * @protected
     * @type {Vec3}
     */
    public _f: Vec3;

    protected _pr: Vec3;
    protected _pu: Vec3;
    protected _pb: Vec3;
    protected _peye: Vec3;

    public isMoving: boolean;

    protected _tanViewAngle_hrad: number;

    public _tanViewAngle_hradOneByHeight: number;

    protected _projSizeConst: number;

    public frustums: Frustum[];

    public frustumColors: number[];

    public FARTHEST_FRUSTUM_INDEX: number;

    public currentFrustumIndex: number;

    public frustumColorIndex: number;

    public isFirstPass: boolean;

    public _width: number;

    public _height: number;

    // public dirForwardNED: Vec3;
    // public dirUpNED: Vec3;
    // public dirRightNED: Vec3;

    constructor(options: ICameraParams = {}) {
        //this.renderer = renderer;

        this.events = createEvents<CameraEvents>(EVENT_NAMES, this);

        this._width = options.width || 1;

        this._height = options.height || 1;

        this.eye = options.eye || new Vec3();

        this.eyeHigh = new Float32Array(3);

        this.eyeLow = new Float32Array(3);

        this._viewAngle = options.viewAngle || 47.0;

        this._horizontalViewAngle = 0;

        this._viewMatrix = new Mat4();
        this._viewMatrixRTE = new Mat4();

        this._normalMatrix = new Mat3();

        this._r = new Vec3(1.0, 0.0, 0.0);
        this._u = new Vec3(0.0, 1.0, 0.0);
        this._b = new Vec3(0.0, 0.0, 1.0);
        this._f = this._b.negateTo();

        // Previous frame values
        this._pr = this._r.clone();
        this._pu = this._u.clone();
        this._pb = this._b.clone();
        this._peye = this.eye.clone();
        this.isMoving = false;

        this._tanViewAngle_hrad = 0.0;
        this._tanViewAngle_hradOneByHeight = 0.0;

        this.frustums = [];

        this.frustumColors = [];

        if (options.frustums) {
            for (let i = 0, len = options.frustums.length; i < len; i++) {
                let fi = options.frustums[i];

                let fr = new Frustum({
                    fov: this._viewAngle,
                    aspect: this.getAspectRatio(),//this._aspect,
                    near: fi[0],
                    far: fi[1]
                });

                fr.cameraFrustumIndex = this.frustums.length;
                this.frustums.push(fr);
                //this.frustumColors.push.apply(this.frustumColors, fr._pickingColorU);
                this.frustumColors.push(fr._pickingColorU[0], fr._pickingColorU[1], fr._pickingColorU[2]);
            }
        } else {
            let near = 0.1,
                far = 1000.0;

            let fr = new Frustum({
                fov: this._viewAngle,
                aspect: this.getAspectRatio(),
                near: near,
                far: far
            });

            fr.cameraFrustumIndex = this.frustums.length;
            this.frustums.push(fr);
            //this.frustumColors.push.apply(this.frustumColors, fr._pickingColorU);
            this.frustumColors.push(fr._pickingColorU[0], fr._pickingColorU[1], fr._pickingColorU[2]);
        }

        this.FARTHEST_FRUSTUM_INDEX = this.frustums.length - 1;

        this.currentFrustumIndex = 0;
        this.frustumColorIndex = 0;

        this.isFirstPass = false;

        this._projSizeConst = 0;

        this.set(
            options.eye || new Vec3(0.0, 0.0, 1.0),
            options.look || new Vec3(),
            options.up || new Vec3(0.0, 1.0, 0.0)
        );
    }

    public checkMoveEnd() {
        let r = this._r,
            u = this._u,
            b = this._b,
            eye = this.eye;

        if (this._peye.equal(eye) && this._pr.equal(r) && this._pu.equal(u) && this._pb.equal(b)) {
            if (this.isMoving) {
                this.events.dispatch(this.events.moveend, this);
            }
            this.isMoving = false;
        } else {
            this.isMoving = true;
        }

        this._pr.copy(r);
        this._pu.copy(u);
        this._pb.copy(b);
        this._peye.copy(eye);
    }

    public bindFrustumsPickingColors(renderer: Renderer) {
        for (let i = 0; i < this.frustums.length; i++) {
            renderer.assignPickingColor<Frustum>(this.frustums[i]);
        }
    }

    // public bindRenderer(renderer: Renderer) {
    //     this.renderer = renderer;
    //     for (let i = 0; i < this.frustums.length; i++) {
    //         this.renderer.assignPickingColor<Frustum>(this.frustums[i]);
    //     }
    //     this._aspect = this.renderer.handler.getClientAspect();
    //
    //     this._setProj(this._viewAngle, this._aspect);
    // }

    /**
     * Camera initialization.
     * @public
     * @param {Object} [options] - Camera options:
     * @param {number} [options.viewAngle] - Camera angle of view.
     * @param {number} [options.near] - Camera near plane distance. Default is 1.0
     * @param {number} [options.far] - Camera far plane distance. Default is math.MAX
     * @param {Vec3} [options.eye] - Camera eye position. Default (0,0,0)
     * @param {Vec3} [options.look] - Camera look position. Default (0,0,0)
     * @param {Vec3} [options.up] - Camera eye position. Default (0,1,0)
     */
    protected _init(options: ICameraParams) {

        this._setProj(this._viewAngle, this.getAspectRatio());

        this.set(
            options.eye || new Vec3(0.0, 0.0, 1.0),
            options.look || new Vec3(),
            options.up || new Vec3(0.0, 1.0, 0.0)
        );
    }

    public getUp(): Vec3 {
        return this._u.clone();
    }

    public getDown(): Vec3 {
        return this._u.negateTo();
    }

    public getRight(): Vec3 {
        return this._r.clone();
    }

    public getLeft(): Vec3 {
        return this._r.negateTo();
    }

    public getForward(): Vec3 {
        return this._f.clone();
    }

    public getBackward(): Vec3 {
        return this._b.clone();
    }

    /**
     * Updates camera view space
     * @public
     * @virtual
     */
    public update() {
        let u = this._r,
            v = this._u,
            n = this._b,
            eye = this.eye;

        Vec3.doubleToTwoFloat32Array(eye, this.eyeHigh, this.eyeLow);

        this._viewMatrix.set([
            u.x, v.x, n.x, 0.0,
            u.y, v.y, n.y, 0.0,
            u.z, v.z, n.z, 0.0,
            -eye.dot(u), -eye.dot(v), -eye.dot(n), 1.0
        ]);

        this._viewMatrixRTE.set([
            u.x, v.x, n.x, 0.0,
            u.y, v.y, n.y, 0.0,
            u.z, v.z, n.z, 0.0,
            0, 0, 0, 1.0
        ]);

        // do not clean up, someday it will be using
        //this._normalMatrix = this._viewMatrix.toMatrix3(); // this._viewMatrix.toInverseMatrix3().transposeTo();

        for (let i = 0, len = this.frustums.length; i < len; i++) {
            this.frustums[i].setViewMatrix(this._viewMatrix);
            this.frustums[i].setProjectionViewRTEMatrix(this._viewMatrixRTE);
        }

        this.events.dispatch(this.events.viewchange, this);
    }

    /**
     * Refresh camera matrices
     * @public
     */
    public refresh() {
        this._setProj(this._viewAngle, this.getAspectRatio());
        this.update();
    }

    // /**
    //  * Sets aspect ratio
    //  * @public
    //  * @param {Number} aspect - Camera aspect ratio
    //  */
    // public setAspectRatio(aspect: number) {
    //     this._aspect = aspect;
    //     this.refresh();
    // }

    public get width(): number {
        return this._width;
    }

    public get height(): number {
        return this._height;
    }

    public setViewportSize(width: number, height: number) {
        this._width = width;
        this._height = height;
        this.refresh();
    }

    /**
     * Returns aspect ratio
     * @public
     * @returns {number} - Aspect ratio
     */
    public getAspectRatio(): number {
        return this._width / this._height;
    }

    /**
     * Sets up camera projection
     * @public
     * @param {number} angle - Camera view angle
     * @param {number} aspect - Screen aspect ratio
     */
    protected _setProj(angle: number, aspect: number) {
        this._viewAngle = angle;
        for (let i = 0, len = this.frustums.length; i < len; i++) {
            this.frustums[i].setProjectionMatrix(
                angle,
                aspect,
                this.frustums[i].near,
                this.frustums[i].far
            );
        }

        this._horizontalViewAngle = getHorizontalViewAngleByFov(angle, aspect);

        this._updateViewportParameters();
    }

    protected _updateViewportParameters() {
        this._tanViewAngle_hrad = Math.tan(this._viewAngle * math.RADIANS_HALF);
        this._tanViewAngle_hradOneByHeight = this._tanViewAngle_hrad * (1.0 / this._height);
        this._projSizeConst = Math.min(this._width < 512 ? 512 : this._width, this._height < 512 ? 512 : this._height) / (this._viewAngle * RADIANS);
    }

    /**
     * Sets camera view angle in degrees
     * @public
     * @param {number} angle - View angle
     */
    public setViewAngle(angle: number) {
        this._viewAngle = angle;
        this.refresh();
    }

    /**
     * Gets camera view angle in degrees
     * @public
     * @returns {number} angle -
     */
    public getViewAngle(): number {
        return this._viewAngle;
    }

    public get viewAngle(): number {
        return this._viewAngle;
    }

    public get verticalViewAngle(): number {
        return this._viewAngle;
    }

    public get horizontalViewAngle(): number {
        return this._horizontalViewAngle;
    }

    /**
     * Sets camera to eye position
     * @public
     * @param {Vec3} eye - Camera position
     * @param {Vec3} look - Look point
     * @param {Vec3} up - Camera up vector
     * @returns {Camera} - This camera
     */
    public set(eye: Vec3, look?: Vec3, up?: Vec3): this {
        this.eye.x = eye.x;
        this.eye.y = eye.y;
        this.eye.z = eye.z;
        look = look || this._b;
        up = up || this._u;
        this._b.x = eye.x - look.x;
        this._b.y = eye.y - look.y;
        this._b.z = eye.z - look.z;
        this._r.copy(up.cross(this._b));
        this._b.normalize();
        this._r.normalize();
        this._u.copy(this._b.cross(this._r));
        this._f.set(-this._b.x, -this._b.y, -this._b.z);
        return this;
    }

    /**
     * Sets camera look point
     * @public
     * @param {Vec3} look - Look point
     * @param {Vec3} [up] - Camera up vector otherwise camera current up vector(this._u)
     */
    public look(look: Vec3, up?: Vec3) {
        this._b.set(this.eye.x - look.x, this.eye.y - look.y, this.eye.z - look.z);
        this._r.copy((up || this._u).cross(this._b));
        this._b.normalize();
        this._f.set(-this._b.x, -this._b.y, -this._b.z);
        this._r.normalize();
        this._u.copy(this._b.cross(this._r));
    }

    /**
     * Slides camera to vector d - (du, dv, dn)
     * @public
     * @param {number} du - delta X
     * @param {number} dv - delta Y
     * @param {number} dn - delta Z
     */
    public slide(du: number, dv: number, dn: number) {
        this.eye.x += du * this._r.x + dv * this._u.x + dn * this._b.x;
        this.eye.y += du * this._r.y + dv * this._u.y + dn * this._b.y;
        this.eye.z += du * this._r.z + dv * this._u.z + dn * this._b.z;
    }

    /**
     * Roll the camera to the angle in radians
     * @public
     * @param {number} angle - Delta roll angle in radians
     */
    public setRoll(angle: number) {
        let cs = Math.cos(angle);
        let sn = Math.sin(angle);
        let t = this._r.clone();
        this._r.set(
            cs * t.x - sn * this._u.x,
            cs * t.y - sn * this._u.y,
            cs * t.z - sn * this._u.z
        );
        this._u.set(
            sn * t.x + cs * this._u.x,
            sn * t.y + cs * this._u.y,
            sn * t.z + cs * this._u.z
        );
    }

    /**
     * Pitch the camera to the angle in radians
     * @public
     * @param {number} angle - Delta pitch angle in radians
     */
    public setPitch(angle: number) {
        let cs = Math.cos(angle);
        let sn = Math.sin(angle);
        let t = this._b;
        this._b.set(
            cs * t.x - sn * this._u.x,
            cs * t.y - sn * this._u.y,
            cs * t.z - sn * this._u.z
        );
        this._u.set(
            sn * t.x + cs * this._u.x,
            sn * t.y + cs * this._u.y,
            sn * t.z + cs * this._u.z
        );
    }

    /**
     * Yaw the camera to the angle in radians
     * @public
     * @param {number} angle - Delta yaw angle in radians
     */
    public setYaw(angle: number) {
        let cs = Math.cos(angle);
        let sn = Math.sin(angle);
        let t = this._r;
        this._r.set(
            cs * t.x - sn * this._b.x,
            cs * t.y - sn * this._b.y,
            cs * t.z - sn * this._b.z
        );
        this._b.set(
            sn * t.x + cs * this._b.x,
            sn * t.y + cs * this._b.y,
            sn * t.z + cs * this._b.z
        );
    }

    public setPitchYawRoll(pitch: number, yaw: number, roll: number) {
        let qRot = new Quat();
        qRot.setPitchYawRoll(pitch, yaw, roll);
        this.setRotation(qRot);
    }

    public getPitch(): number {
        return this.getRotation().getPitch();
    }

    public getYaw(): number {
        return this.getRotation().getYaw();
    }

    public getRoll(): number {
        return this.getRotation().getRoll();
    }

    /**
     * Returns camera quaternion
     */
    public getRotation(): Quat {
        return Quat.getLookRotation(this._f, this._u).conjugate();
    }

    public setRotation(rot: Quat, up?: Vec3, right?: Vec3, back?: Vec3) {
        rot.mulVec3Res(up || new Vec3(0, 1, 0), this._u);
        rot.mulVec3Res(right || new Vec3(1, 0, 0), this._r);
        rot.mulVec3Res(back || new Vec3(0, 0, 1), this._b);
        this._f.set(-this._b.x, -this._b.y, -this._b.z);
    }

    public rotate(rot: Quat) {
        rot.mulVec3Res(this._u, this._u);
        rot.mulVec3Res(this._r, this._r);
        rot.mulVec3Res(this._b, this._b);
        this._f.set(-this._b.x, -this._b.y, -this._b.z);
    }

    /**
     * Returns normal vector direction to the unprojected screen point from camera eye
     * @public
     * @param {Vec2} pos - Screen X coordinate
     * @returns {Vec3} - Direction vector
     */
    public unproject2v(pos: Vec2) {
        return this.unproject(pos.x, pos.y);
    }

    /**
     * Returns normal vector direction to the unprojected screen point from camera eye
     * @public
     * @param {number} x - Screen X coordinate
     * @param {number} y - Screen Y coordinate
     * @returns {Vec3} - Direction vector
     */
    public unproject(x: number, y: number) {
        // let c = this.renderer!.handler.canvas!,
        //     w = c.width * 0.5,
        //     h = c.height * 0.5;

        let w = this._width * 0.5,
            h = this._height * 0.5;

        let px = (x - w) / w,
            py = -(y - h) / h;

        let world1 = this.frustums[0].inverseProjectionViewMatrix.mulVec4(new Vec4(px, py, -1.0, 1.0)).affinity(),
            world2 = this.frustums[0].inverseProjectionViewMatrix.mulVec4(new Vec4(px, py, 0.0, 1.0)).affinity();

        return world2.subA(world1).toVec3().normalize();
    }

    /**
     * Gets projected 3d point to the 2d screen coordinates
     * @public
     * @param {Vec3} v - Cartesian 3d coordinates
     * @returns {Vec2} - Screen point coordinates
     */
    public project3v(v: Vec3): Vec2 {
        return this.project(v.x, v.y, v.z);
    }

    /**
     * Gets projected 3d point to the 2d screen coordinates
     * @public
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     * @returns {Vec2} - Screen point coordinates
     */
    public project(x: number, y: number, z: number): Vec2 {
        let r = this.frustums[0].projectionViewMatrix.mulVec4(new Vec4(x, y, z, 1.0));
        return new Vec2((1 + r.x / r.w) * this._width * 0.5, (1 - r.y / r.w) * this._height * 0.5);
    }

    /**
     * Rotates camera around center point
     * @public
     * @param {number} angle - Rotation angle in radians
     * @param {boolean} [isArc] - If true camera up vector gets from current up vector every frame,
     * otherwise up is always input parameter.
     * @param {Vec3} [center] - Point that the camera rotates around
     * @param {Vec3} [up] - Camera up vector
     */
    public rotateAround(angle: number, isArc: boolean = false, center: Vec3 = Vec3.ZERO, up: Vec3 = Vec3.UP) {
        up = isArc ? this._u : up;
        let rot = Mat4.getRotation(angle, up);
        let trm = Mat4.getRotationAroundPoint(angle, center, up);
        this.eye = trm.mulVec3(this.eye);
        this._u = rot.mulVec3(this._u).normalize();
        this._r = rot.mulVec3(this._r).normalize();
        this._b = rot.mulVec3(this._b).normalize();
        this._f.set(-this._b.x, -this._b.y, -this._b.z);
    }

    /**
     * Rotates camera around center point by horizontal.
     * @public
     * @param {number} angle - Rotation angle in radians.
     * @param {boolean} [isArc] - If true camera up vector gets from current up vector every frame,
     * otherwise up is always input parameter.
     * @param {Vec3} [center] - Point that the camera rotates around.
     * @param {Vec3} [up] - Camera up vector.
     */
    public rotateHorizontal(angle: number, isArc?: boolean, center?: Vec3, up?: Vec3) {
        this.rotateAround(angle, isArc, center, up);
    }

    /**
     * Rotates camera around center point by vertical.
     * @param {number} angle - Rotation angle in radians.
     * @param {Vec3} [center] - Point that the camera rotates around.
     */
    public rotateVertical(angle: number, center?: Vec3) {
        this.rotateAround(angle, false, center, this._r);
    }

    /**
     * Gets 3d size factor. Uses in LOD distance calculation.
     * @public
     * @param {Vec3} p - Far point.
     * @param {Vec3} r - Far point.
     * @returns {number} - Size factor.
     */
    public projectedSize(p: Vec3, r: number): number {
        return Math.atan(r / this.eye.distance(p)) * this._projSizeConst;
    }

    /**
     * Returns model matrix.
     * @public
     * @returns {NumberArray16} - View matrix.
     */
    public getViewMatrix(): NumberArray16 {
        return this._viewMatrix._m;
    }

    /**
     * Returns normal matrix.
     * @public
     * @returns {NumberArray9} - Normal matrix.
     */
    public getNormalMatrix(): NumberArray9 {
        return this._normalMatrix._m;
    }

    public setCurrentFrustum(k: number) {
        this.currentFrustumIndex = k;
        this.frustumColorIndex = (k + 1) * 10.0 / 255.0;
        this.isFirstPass = k === this.FARTHEST_FRUSTUM_INDEX;
    }

    public getCurrentFrustum(): number {
        return this.currentFrustumIndex;
    }

    public containsSphere(sphere: Sphere): boolean {
        for (let i = 0; i < this.frustums.length; i++) {
            if (this.frustums[i].containsSphere(sphere)) {
                return true;
            }
        }
        return false;
    }

    public get frustum(): Frustum {
        return this.frustums[this.currentFrustumIndex];
    }

    /**
     * Returns projection matrix.
     * @public
     * @returns {Mat4} - Projection matrix.
     */
    public getProjectionMatrix(): NumberArray16 {
        return this.frustum.projectionMatrix._m;
    }

    /**
     * Returns projection and model matrix product.
     * @public
     * @return {Mat4} - Projection-view matrix.
     */
    public getProjectionViewMatrix(): NumberArray16 {
        return this.frustum.projectionViewMatrix._m;
    }

    /**
     * Returns projection and model RTE matrix product.
     * @public
     * @return {Mat4} - Projection-view matrix.
     */
    public getProjectionViewRTEMatrix(): NumberArray16 {
        return this.frustum.projectionViewRTEMatrix._m;
    }

    /**
     * Returns inverse projection and model matrix product.
     * @public
     * @returns {Mat4} - Inverse projection-view matrix.
     */
    public getInverseProjectionViewMatrix(): NumberArray16 {
        return this.frustum.inverseProjectionViewMatrix._m;
    }

    /**
     * Returns inverse projection matrix.
     * @public
     * @returns {Mat4} - Inverse projection-view matrix.
     */
    public getInverseProjectionMatrix(): NumberArray16 {
        return this.frustum.inverseProjectionMatrix._m;
    }

    public viewDistance(cartesian: Vec3, distance: number = 10000.0) {
        let p0 = this.eye.add(this.getForward().scaleTo(distance));
        let _rot = Quat.getRotationBetweenVectors(p0.getNormal(), cartesian.getNormal());
        let newPos = cartesian.add(this.getBackward().scaleTo(distance));
        this.set(newPos, cartesian);
        this.update();
    }

    public copy(cam: Camera) {
        this.eye.copy(cam.eye);
        this._r.copy(cam._r);
        this._u.copy(cam._u);
        this._b.copy(cam._b);
        this._f.copy(cam._f);
        this._width = cam.width;
        this._height = cam.height;
        this.setViewAngle(cam.viewAngle);
        this.update();
    }

    public getAltitude(): number {
        return this.eye.y;
    }
}

export {Camera};
