import {createEvents, type EventsHandler} from '../../Events';
import {MAX32} from "../../math";
import {Plane} from "../../math/Plane";
import {Planet} from "../../scene/Planet";
import {RenderNode} from '../../scene/RenderNode';
import {Vec2} from '../../math/Vec2';
import {Vec3} from '../../math/Vec3';
import {Quat} from '../../math/Quat';
import type {IMouseState} from "../../renderer/RendererEvents";
import {Ellipsoid} from "../../ellipsoid/Ellipsoid";
import {LonLat} from "../../LonLat";
import {Entity} from "../../entity/Entity";
import {MoveAxisEntity} from "./MoveAxisEntity";
import {MovePlaneEntity} from "./MovePlaneEntity";
import {RotateEntity} from "./RotateEntity";
import {Ray} from "../../math/Ray";
import {Sphere} from "../../bv/Sphere";
import {AxisTrackEntity} from "./AxisTrackEntity";
import {CameraLock} from "../CameraLock";
import {EntityCollection} from "../../entity/EntityCollection";

export interface IGeoObjectEditorSceneParams {
    planet?: Planet;
    name?: string;
}

function dragSimpleRes(unit: Vec3, eye: Vec3, clickDir: Vec3, direction: Vec3, p0: Vec3, res: Vec3) {
    let p1 = p0.add(Vec3.UP),
        p2 = p0.add(unit);

    let px = new Vec3();

    if (new Ray(eye, clickDir).hitPlaneRes(Plane.fromPoints(p0, p1, p2), px) === Ray.INSIDE) {
        let clickCart = Vec3.proj_b_to_a(px, unit);
        if (new Ray(eye, direction).hitPlaneRes(Plane.fromPoints(p0, p1, p2), px) === Ray.INSIDE) {
            let dragCart = Vec3.proj_b_to_a(px, unit);
            let dragVec = dragCart.sub(clickCart);
            res.copy(p0.add(dragVec));
        }
    }
}

type GeoObjectSceneEventsList = [
    "mousemove",
    "mouseenter",
    "mouseleave",
    "lclick",
    "rclick",
    "mclick",
    "ldblclick",
    "rdblclick",
    "mdblclick",
    "lup",
    "rup",
    "mup",
    "ldown",
    "rdown",
    "mdown",
    "lhold",
    "rhold",
    "mhold",
    "mousewheel",
    "touchmove",
    "touchstart",
    "touchend",
    "doubletouch",
    "touchleave",
    "touchenter",
    "select",
    "unselect",
    "change",
    "position",
    "pitch",
    "yaw",
    "roll",
    "scale"
];

class GeoObjectEditorScene extends RenderNode {
    public events: EventsHandler<GeoObjectSceneEventsList>;
    protected _planet: Planet | null;
    protected _startPos: Vec2 | null;
    protected _startClick: Vec2;
    protected _moveLayer: EntityCollection;
    protected _planeLayer: EntityCollection;
    protected _rotateLayer: EntityCollection;
    protected _axisTrackLayer: EntityCollection;

    protected _selectedEntity: Entity | null;
    protected _selectedEntityCart: Vec3;
    protected _selectedEntityPitch: number;
    protected _selectedEntityYaw: number;
    protected _selectedEntityRoll: number;
    protected _clickPos: Vec2;

    protected _axisEntity: MoveAxisEntity;
    protected _planeEntity: MovePlaneEntity;
    protected _rotateEntity: RotateEntity;
    protected _axisTrackEntity: AxisTrackEntity;

    protected _selectedMove: string | null;

    protected _ops: Record<string, (mouseState: IMouseState) => void>;

    protected _axisTrackVisibility: boolean;

    constructor(options: IGeoObjectEditorSceneParams = {}) {
        super(options.name || 'GeoObjectEditorScene');

        this.events = createEvents(GEOOBJECTEDITORCENE_EVENTS);

        this._planet = options.planet || null;

        this._startPos = null;
        this._startClick = new Vec2();

        this._axisEntity = new MoveAxisEntity();
        this._planeEntity = new MovePlaneEntity();
        this._rotateEntity = new RotateEntity();
        this._axisTrackEntity = new AxisTrackEntity();

        this._moveLayer = new EntityCollection({
            scaleByDistance: [0.1, MAX32, 0.1],
            useLighting: false,
            pickingScale: [5, 1.1, 5],
            visibility: false,
            depthOrder: 1000,
        });

        this._planeLayer = new EntityCollection({
            scaleByDistance: [0.1, MAX32, 0.1],
            useLighting: false,
            visibility: false,
            depthOrder: 1000,
        });

        this._rotateLayer = new EntityCollection({
            useLighting: false,
            visibility: false,
            depthOrder: 1000,
            pickingScale: 5,
        });

        this._selectedEntity = null;
        this._clickPos = new Vec2();
        this._selectedEntityCart = new Vec3();
        this._selectedEntityPitch = 0;
        this._selectedEntityYaw = 0;
        this._selectedEntityRoll = 0;
        this._selectedMove = null;

        this._axisTrackVisibility = false;

        this._axisTrackLayer = new EntityCollection({
            useLighting: false,
            visibility: false,
            pickingScale: 5,
            pickingEnabled: false,
            opacity: 0.6
        });

        this._ops = {
            move_x: this._moveX,
            move_y: this._moveY,
            move_z: this._moveZ,
            move_xz: this._moveXZ,
            move_xy: this._moveXY,
            move_zy: this._moveZY,
            rotate_pitch: this._rotatePitch,
            rotate_yaw: this._rotateYaw,
            rotate_roll: this._rotateRoll,
            scale: this._scale,
            scale_x: this._scaleX,
            scale_y: this._scaleY,
            scale_z: this._scaleZ,
        }
    }

    get ellipsoid(): Ellipsoid | undefined {
        if (this._planet) {
            return this._planet.ellipsoid;
        }
    }

    get planet(): Planet | null {
        return this._planet;
    }

    public bindPlanet(planet: Planet) {
        this._planet = planet;
    }

    public override init() {
        this.activate();
    }

    public override onremove() {
        this.deactivate();
    }

    protected _addAxisLayers() {
        this._moveLayer.addTo(this);
        this._planeLayer.addTo(this);
        this._rotateLayer.addTo(this);
        this._axisTrackLayer.addTo(this);

        this._moveLayer.add(this._axisEntity);
        this._moveLayer.events.on("mouseenter", this._onAxisLayerMouseEnter);
        this._moveLayer.events.on("mouseleave", this._onAxisLayerMouseLeave);
        this._moveLayer.events.on("lup", this._onAxisLayerLUp);
        this._moveLayer.events.on("ldown", this._onAxisLayerLDown);

        this._planeLayer.add(this._planeEntity);
        this._planeLayer.events.on("mouseenter", this._onPlaneLayerMouseEnter);
        this._planeLayer.events.on("mouseleave", this._onPlaneLayerMouseLeave);
        this._planeLayer.events.on("lup", this._onPlaneLayerLUp);
        this._planeLayer.events.on("ldown", this._onPlaneLayerLDown);

        this._rotateLayer.add(this._rotateEntity);
        this._rotateLayer.events.on("mouseenter", this._onRotateLayerMouseEnter);
        this._rotateLayer.events.on("mouseleave", this._onRotateLayerMouseLeave);
        this._rotateLayer.events.on("lup", this._onRotateLayerLUp);
        this._rotateLayer.events.on("ldown", this._onRotateLayerLDown);

        this._axisTrackLayer.add(this._axisTrackEntity);
    }

    protected _onAxisLayerMouseEnter = (e: IMouseState) => {
        this.renderer!.handler!.canvas!.style.cursor = "pointer";
        e.pickingObject.setColorHTML(e.pickingObject.properties.style.selectColor);
    }

    protected _onAxisLayerMouseLeave = (e: IMouseState) => {
        this.renderer!.handler!.canvas!.style.cursor = "default";
        e.pickingObject.setColorHTML(e.pickingObject.properties.style.color);
    }

    protected _navActivate() {
        if (this.renderer) {
            if (this.renderer.controls.mouseNavigation) {
                this.renderer.controls.mouseNavigation.activate();
            }
            if (this.renderer.controls.SimpleNavigation) {
                this.renderer.controls.SimpleNavigation.activate();
            }
        }
    }

    protected _navDeactivate() {
        if (this.renderer) {
            if (this.renderer.controls.mouseNavigation) {
                this.renderer.controls.mouseNavigation.deactivate();
            }
            if (this.renderer.controls.SimpleNavigation) {
                this.renderer.controls.SimpleNavigation.deactivate();
            }
        }
    }

    protected _onAxisLayerLUp = (e: IMouseState) => {
        this._selectedMove = null;
        this._navActivate();
        this._setAxisTrackVisibility(false);
    }

    protected _onAxisLayerLDown = (e: IMouseState) => {
        this._clickPos = e.pos.clone();

        if (this._selectedEntity) {
            this._selectedEntityCart = this._selectedEntity.getAbsoluteCartesian();
            this._setAxisTrackVisibility(true);
        }

        this._selectedMove = e.pickingObject.properties.opName;
        this._navDeactivate();
    }

    protected _onPlaneLayerMouseEnter = (e: IMouseState) => {
        this.renderer!.handler!.canvas!.style.cursor = "pointer";
        e.pickingObject.geoObject.setColorHTML(e.pickingObject.properties.style.selectColor);
    }

    protected _onPlaneLayerMouseLeave = (e: IMouseState) => {
        this.renderer!.handler!.canvas!.style.cursor = "default";
        e.pickingObject.geoObject.setColorHTML(e.pickingObject.properties.style.color);
    }

    protected _onPlaneLayerLUp = (e: IMouseState) => {
        this._selectedMove = null;
        this._navActivate();
        this._setAxisTrackVisibility(false);
    }

    protected _onPlaneLayerLDown = (e: IMouseState) => {
        this._clickPos = e.pos.clone();

        if (this._selectedEntity) {
            this._selectedEntityCart = this._selectedEntity.getAbsoluteCartesian();
            this._setAxisTrackVisibility(true);
        }

        this._selectedMove = e.pickingObject.properties.opName;
        this._navDeactivate();
    }

    protected _onRotateLayerMouseEnter = (e: IMouseState) => {
        this.renderer!.handler!.canvas!.style.cursor = "pointer";
        e.pickingObject.polyline!.setColorHTML(e.pickingObject.properties.style.selectColor);
    }

    protected _onRotateLayerMouseLeave = (e: IMouseState) => {
        this.renderer!.handler!.canvas!.style.cursor = "default";
        e.pickingObject.polyline!.setColorHTML(e.pickingObject.properties.style.color);
    }

    protected _onRotateLayerLUp = (e: IMouseState) => {
        this._selectedMove = null;
        this._navActivate();
    }

    protected _onRotateLayerLDown = (e: IMouseState) => {
        this._clickPos = e.pos.clone();

        if (this._selectedEntity) {
            this._selectedEntityCart = this._selectedEntity.getAbsoluteCartesian();
            if (this._selectedEntity) {
                this._selectedEntityPitch = this._selectedEntity.getAbsolutePitch();
                this._selectedEntityYaw = this._selectedEntity.getAbsoluteYaw();
                this._selectedEntityRoll = this._selectedEntity.getAbsoluteRoll();
            }
        }

        this._selectedMove = e.pickingObject.properties.opName;
        this._navDeactivate();
    }

    protected _onMouseMove = (e: IMouseState) => {
        if (this._selectedEntity && this._selectedMove && this._ops[this._selectedMove]) {
            this._ops[this._selectedMove](e);
        }
    }

    protected _removeAxisLayers() {
        this._moveLayer.remove();
        this._planeLayer.remove();
        this._rotateLayer.remove()
    }

    public activate() {
        this.renderer!.events.on("lclick", this._onLclick);
        this.renderer!.events.on("mousemove", this._onMouseMove);
        this._addAxisLayers();
    }

    protected deactivate() {
        this.renderer!.events.off("lclick", this._onLclick);
        this.renderer!.events.off("mousemove", this._onMouseMove);
        this._removeAxisLayers();
        this.clear();
    }

    protected _setAxisTrackVisibility(visibility: boolean) {
        if (visibility !== this._axisTrackVisibility) {
            this._axisTrackVisibility = visibility;
            this._axisTrackLayer.setVisibility(visibility);
        }
    }

    public setVisibility(visibility: boolean) {
        this._moveLayer.setVisibility(visibility);
        this._planeLayer.setVisibility(visibility);
        this._rotateLayer.setVisibility(visibility);
        this.unlockView();
    }

    public readyToEdit(entity: Entity): boolean {
        return !entity.properties || !entity.properties.noEdit
    }

    public select(entity: Entity) {
        if ((!this._selectedEntity || this._selectedEntity && !entity.isEqual(this._selectedEntity)) && this.readyToEdit(entity)) {
            if (this._selectedEntity) {
                this.unselect();
            }
            this._selectedEntity = entity;

            this.renderer && this.renderer.setRelativeCenter();

            this.setVisibility(true);
            this.events.dispatch(this.events.select, this._selectedEntity);
        }
    }

    public unselect() {
        this.setVisibility(false);
        let selectedEntity = this._selectedEntity;
        this._selectedEntity = null;
        this.events.dispatch(this.events.unselect, selectedEntity);
    }

    protected _onLclick = (e: IMouseState) => {
        if (e.pickingObject && (e.pickingObject instanceof Entity)) {
            this.select(e.pickingObject);
        }
    }

    public clear() {
        this.removeEntityCollection(this._moveLayer);
        this.removeEntityCollection(this._planeLayer);
        this.removeEntityCollection(this._rotateLayer);
    }

    public override frame() {
        if (this._selectedEntity) {
            let cart = this._selectedEntity.getAbsoluteCartesian();
            this._axisEntity.setCartesian3v(cart);
            this._planeEntity.setCartesian3v(cart);
            this._rotateEntity.setCartesian3v(cart, this._selectedEntity.getAbsoluteYaw());
            this._axisTrackEntity.setCartesian3v(cart);
        }
    }

    protected get _ellipsoid(): Ellipsoid | null {
        return this._planet ? this._planet.ellipsoid : null;
    }

    protected _moveX = (e: IMouseState) => {
        if (!this._selectedEntity) return;

        let cam = this.renderer!.activeCamera;
        let p0 = this._selectedEntityCart;

        let clickDir = cam.unproject(this._clickPos.x, this._clickPos.y);

        let px = new Vec3();

        if (this.planet) {
            let clickCart = new Ray(cam.eye, clickDir).hitSphere(new Sphere(p0.length(), new Vec3()))!;
            let currCart = new Ray(cam.eye, e.direction).hitSphere(new Sphere(p0.length(), new Vec3()))!;

            if (!currCart) return;

            let rot = Quat.getRotationBetweenVectors(
                clickCart.normal(),
                currCart.normal()
            );

            px = rot.mulVec3(p0);

            if (this._ellipsoid) {
                let p0_lonLat = this._ellipsoid.cartesianToLonLat(p0)!;
                let px_lonLat = this._ellipsoid.cartesianToLonLat(px)!;

                this._ellipsoid.lonLatToCartesianRes(new LonLat(px_lonLat.lon, p0_lonLat.lat, p0_lonLat.height), px);
            }
        } else {
            dragSimpleRes(Vec3.UNIT_X, cam.eye, clickDir, e.direction, p0, px);
        }

        this._selectedEntity.setAbsoluteCartesian3v(px);

        this.events.dispatch(this.events.position, px, this._selectedEntity);
        this.events.dispatch(this.events.change, this._selectedEntity);
    }

    protected _moveY = (e: IMouseState) => {

        if (!this._selectedEntity) return;

        let cam = this.renderer!.activeCamera;
        let p0 = this._selectedEntityCart;
        let groundNormal = Vec3.UP;
        if (this.planet) {
            groundNormal = this._axisEntity.getY();
        }
        let p1 = p0.add(groundNormal);
        let p2 = p0.add(cam.getRight());
        let px = new Vec3();

        let clickDir = cam.unproject(this._clickPos.x, this._clickPos.y);

        if (new Ray(cam.eye, clickDir).hitPlaneRes(Plane.fromPoints(p0, p1, p2), px) === Ray.INSIDE) {
            let clickCart = Vec3.proj_b_to_a(px, groundNormal);
            if (new Ray(cam.eye, e.direction).hitPlaneRes(Plane.fromPoints(p0, p1, p2), px) === Ray.INSIDE) {
                let dragCart = Vec3.proj_b_to_a(px, groundNormal);
                let dragVec = dragCart.sub(clickCart);
                let pos = this._selectedEntityCart.add(dragVec);
                this._selectedEntity.setAbsoluteCartesian3v(pos);
                this.events.dispatch(this.events.position, px, this._selectedEntity);
                this.events.dispatch(this.events.change, this._selectedEntity);
            }
        }
    }

    protected _moveZ = (e: IMouseState) => {
        if (!this._selectedEntity) return;

        let cam = this.renderer!.activeCamera;
        let p0 = this._selectedEntityCart;

        let clickDir = cam.unproject(this._clickPos.x, this._clickPos.y);

        let px = new Vec3();

        if (this.planet) {

            let clickCart = new Ray(cam.eye, clickDir).hitSphere(new Sphere(p0.length(), new Vec3()))!;
            let currCart = new Ray(cam.eye, e.direction).hitSphere(new Sphere(p0.length(), new Vec3()))!;

            if (!currCart) return;

            let rot = Quat.getRotationBetweenVectors(
                clickCart.normal(),
                currCart.normal()
            );

            px = rot.mulVec3(p0);

            if (this._ellipsoid) {
                let p0_lonLat = this._ellipsoid.cartesianToLonLat(p0)!;
                let px_lonLat = this._ellipsoid.cartesianToLonLat(px)!;

                this._ellipsoid.lonLatToCartesianRes(new LonLat(p0_lonLat.lon, px_lonLat.lat, p0_lonLat.height), px);
            }
        } else {
            dragSimpleRes(Vec3.UNIT_Z, cam.eye, clickDir, e.direction, p0, px);
        }

        this._selectedEntity.setAbsoluteCartesian3v(px);

        this.events.dispatch(this.events.position, px, this._selectedEntity);
        this.events.dispatch(this.events.change, this._selectedEntity);
    }

    protected _moveXZ = (e: IMouseState) => {
        if (!this._selectedEntity) return;

        let cam = this.renderer!.activeCamera;
        let p0 = this._selectedEntityCart;

        let clickDir = cam.unproject(this._clickPos.x, this._clickPos.y);

        let px = new Vec3();

        if (this.planet) {

            let clickCart = new Ray(cam.eye, clickDir).hitSphere(new Sphere(p0.length(), new Vec3()))!;
            let currCart = new Ray(cam.eye, e.direction).hitSphere(new Sphere(p0.length(), new Vec3()))!;

            if (!currCart) return;

            let rot = Quat.getRotationBetweenVectors(
                clickCart.normal(),
                currCart.normal()
            );

            px = rot.mulVec3(p0);

            if (this._ellipsoid) {
                let lonLat = this._ellipsoid.cartesianToLonLat(px)!;
                let height = this._selectedEntity.getLonLat().height;

                this._ellipsoid.lonLatToCartesianRes(new LonLat(lonLat.lon, lonLat.lat, height), px);
            }
        } else {
            let p1 = p0.add(Vec3.UNIT_X),
                p2 = p0.add(Vec3.UNIT_Z);
            let clickCart = new Vec3(),
                dragCart = new Vec3();
            if (new Ray(cam.eye, clickDir).hitPlaneRes(Plane.fromPoints(p0, p1, p2), clickCart) === Ray.INSIDE) {
                if (new Ray(cam.eye, e.direction).hitPlaneRes(Plane.fromPoints(p0, p1, p2), dragCart) === Ray.INSIDE) {
                    let dragVec = dragCart.sub(clickCart);
                    px = p0.add(dragVec);
                }
            }
        }

        this._selectedEntity.setAbsoluteCartesian3v(px);

        this.events.dispatch(this.events.position, px, this._selectedEntity);
        this.events.dispatch(this.events.change, this._selectedEntity);
    }

    protected _moveXY = (e: IMouseState) => {
        console.log("moveXY");
    }

    protected _moveZY = (e: IMouseState) => {
        console.log("moveZY");
    }

    public override getFrameRotation(cartesian: Vec3): Quat {
        return this._planet ? this._planet.getFrameRotation(cartesian) : super.getFrameRotation(cartesian);
    }

    protected _rotatePitch = (e: IMouseState) => {
        if (!this._selectedEntity) return;

        let cam = this.renderer!.activeCamera;
        let p0 = this._selectedEntityCart;

        let qp = Quat.xRotation(0);
        let qy = Quat.yRotation(this._selectedEntity.getYaw());
        let qr = Quat.zRotation(0);

        let qRot = qr.mul(qp).mul(qy).mul(this.getFrameRotation(p0)).conjugate();

        //let norm = qNorthFrame.mulVec3(new Vec3(1, 0, 0)).normalize();
        let norm = qRot.mulVec3(new Vec3(1, 0, 0)).normalize();

        let clickDir = cam.unproject(this._clickPos.x, this._clickPos.y);

        let pl = new Plane(p0, norm);

        let clickCart = new Vec3(),
            dragCart = new Vec3();

        if (new Ray(cam.eye, clickDir).hitPlaneRes(pl, clickCart) === Ray.INSIDE) {
            if (new Ray(cam.eye, e.direction).hitPlaneRes(pl, dragCart) === Ray.INSIDE) {

                let c0 = clickCart.sub(p0).normalize(),
                    c1 = dragCart.sub(p0).normalize();

                let sig = Math.sign(c0.cross(c1).dot(norm));
                let angle = Math.acos(c0.dot(c1));
                let deg = this._selectedEntityPitch + sig * angle;
                this._selectedEntity.setAbsolutePitch(deg);

                this.events.dispatch(this.events.pitch, deg, this._selectedEntity);
                this.events.dispatch(this.events.change, this._selectedEntity);
            }
        }
    }

    protected _rotateYaw = (e: IMouseState) => {
        if (!this._selectedEntity) return;

        let cam = this.renderer!.activeCamera;
        let p0 = this._selectedEntityCart;
        let qNorthFrame = this.getFrameRotation(p0).conjugate();
        let norm = qNorthFrame.mulVec3(new Vec3(0, 1, 0)).normalize();

        let clickDir = cam.unproject(this._clickPos.x, this._clickPos.y);

        let pl = new Plane(p0, norm);

        let clickCart = new Vec3(),
            dragCart = new Vec3();

        if (new Ray(cam.eye, clickDir).hitPlaneRes(pl, clickCart) === Ray.INSIDE) {
            if (new Ray(cam.eye, e.direction).hitPlaneRes(pl, dragCart) === Ray.INSIDE) {

                let c0 = clickCart.sub(p0).normalize(),
                    c1 = dragCart.sub(p0).normalize();

                let sig = Math.sign(c1.cross(c0).dot(norm));
                let angle = Math.acos(c0.dot(c1));
                let deg = this._selectedEntityYaw + sig * angle;
                this._selectedEntity.setAbsoluteYaw(deg);

                this.events.dispatch(this.events.yaw, deg, this._selectedEntity);
                this.events.dispatch(this.events.change, this._selectedEntity);
            }
        }
    }

    protected _rotateRoll = (e: IMouseState) => {
        if (!this._selectedEntity) return;

        let cam = this.renderer!.activeCamera;
        let p0 = this._selectedEntityCart;
        let qNorthFrame = this.getFrameRotation(p0).conjugate();

        let qp = Quat.xRotation(0);
        let qy = Quat.yRotation(this._selectedEntity.getYaw());
        let qr = Quat.zRotation(0);

        let qRot = qr.mul(qp).mul(qy).mul(this.getFrameRotation(p0)).conjugate();

        //let norm = qNorthFrame.mulVec3(new Vec3(0, 0, 1)).normalize();
        let norm = qRot.mulVec3(new Vec3(0, 0, 1)).normalize();

        let clickDir = cam.unproject(this._clickPos.x, this._clickPos.y);

        let pl = new Plane(p0, norm);

        let clickCart = new Vec3(),
            dragCart = new Vec3();

        if (new Ray(cam.eye, clickDir).hitPlaneRes(pl, clickCart) === Ray.INSIDE) {
            if (new Ray(cam.eye, e.direction).hitPlaneRes(pl, dragCart) === Ray.INSIDE) {

                let c0 = clickCart.sub(p0).normalize(),
                    c1 = dragCart.sub(p0).normalize();

                let sig = Math.sign(c0.cross(c1).dot(norm));
                let angle = Math.acos(c0.dot(c1));
                let deg = this._selectedEntityRoll + sig * angle;
                this._selectedEntity.setAbsoluteRoll(deg);

                this.events.dispatch(this.events.roll, deg, this._selectedEntity);
                this.events.dispatch(this.events.change, this._selectedEntity);
            }
        }
    }

    protected _scale = (e: IMouseState) => {
        let scale = 1;
        this.events.dispatch(this.events.scale, scale, this._selectedEntity);
        this.events.dispatch(this.events.change, this._selectedEntity);
    }

    protected _scaleX = (e: IMouseState) => {
    }

    protected _scaleY = (e: IMouseState) => {
    }

    protected _scaleZ = (e: IMouseState) => {
    }

    public getSelectedEntity(): Entity | null {
        return this._selectedEntity;
    }

    public lockView() {
        if (this.renderer && this._selectedEntity) {
            let camLock = this.renderer.controls.CameraLock as CameraLock;
            camLock.lockView(this._selectedEntity);
        }
    }

    public unlockView() {
        if (this.renderer && this._selectedEntity) {
            let camLock = this.renderer.controls.CameraLock as CameraLock;
            if (camLock) {
                camLock.unlockView();
            }
        }
    }
}

const GEOOBJECTEDITORCENE_EVENTS: GeoObjectSceneEventsList = [
    "mousemove",
    "mouseenter",
    "mouseleave",
    "lclick",
    "rclick",
    "mclick",
    "ldblclick",
    "rdblclick",
    "mdblclick",
    "lup",
    "rup",
    "mup",
    "ldown",
    "rdown",
    "mdown",
    "lhold",
    "rhold",
    "mhold",
    "mousewheel",
    "touchmove",
    "touchstart",
    "touchend",
    "doubletouch",
    "touchleave",
    "touchenter",
    "select",
    "unselect",
    "change",
    "position",
    "pitch",
    "yaw",
    "roll",
    "scale"
];

export {GeoObjectEditorScene};
