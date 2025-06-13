import {Events} from "../Events";
import type {EventsHandler, EventCallback} from "../Events";
import {input} from "../input/input";
import {KeyboardHandler} from "../input/KeyboardHandler";
import {MouseHandler} from "../input/MouseHandler";
import type {MouseHandlerEvent, MouseEventExt} from "../input/MouseHandler";
import {Renderer} from "./Renderer";
import {TouchHandler} from "../input/TouchHandler";
import type {TouchEventExt} from "../input/TouchHandler";
import {Vec2} from "../math/Vec2";
import {Vec3} from "../math/Vec3";
import type {NumberArray3} from "../math/Vec3";

export type RendererEventsHandler = RendererEvents & EventsHandler<RendererEventsType>;

export function createRendererEvents(renderer: Renderer) {
    return new RendererEvents(renderer);
}

export type RendererEventsType = [
    "changerelativecenter",
    "draw",
    "drawtransparent",
    "postdraw",
    "resize",
    "resizeend",
    "mouseenter",
    "mouseleave",
    "mousemove",
    "mousestop",
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
    "touchstart",
    "touchend",
    "touchcancel",
    "touchmove",
    "doubletouch",
    "touchleave",
    "touchenter"
];

export interface IBaseInputState {
    /** Current screen mouse X position. */
    clientX: number;
    /** Current screen mouse Y position. */
    clientY: number;
    /** Current screen mouse position. */
    pos: Vec2;
    /** Current touch X - coordinate. */
    x: number;
    /** Current touch Y - coordinate. */
    y: number;
    /** Current touch X - coordinate from 0 to 1 */
    nx: number;
    /** Current touch Y - coordinate from 0 to 1 */
    ny: number;
    /** Previous touch X coordinate. */
    prev_x: number;
    /** Previous touch Y coordinate. */
    prev_y: number,
    /** Screen touch position world direction. */
    direction: Vec3;
    /** Current touched(picking) object. */
    pickingObject: any | null;
    /** Renderer instance. */
    renderer: Renderer;
    /** Touching is moving now. */
    moving: boolean;
}

export interface IMouseState extends IBaseInputState {
    /** Left mouse button has stopped pushing down right now.*/
    leftButtonUp: boolean;
    /** Right mouse button has stopped pushing down right now.*/
    rightButtonUp: boolean;
    /** Middle mouse button has stopped pushing down right now.*/
    middleButtonUp: boolean;
    /** Left mouse button has pushed now.*/
    leftButtonDown: boolean;
    /** Right mouse button has pushed now.*/
    rightButtonDown: boolean;
    /** Middle mouse button has pushed now.*/
    middleButtonDown: boolean;
    /** Left mouse button is pushing.*/
    leftButtonHold: boolean;
    /** Right mouse button is pushing.*/
    rightButtonHold: boolean;
    /** Middle mouse button is pushing.*/
    middleButtonHold: boolean;
    /** Left mouse button has clicked twice now.*/
    leftButtonDoubleClick: boolean;
    /** Right mouse button has clicked twice now.*/
    rightButtonDoubleClick: boolean;
    /** Middle mouse button has clicked twice now.*/
    middleButtonDoubleClick: boolean;
    /** Left mouse button has clicked now. */
    leftButtonClick: boolean;
    /** Right mouse button has clicked now. */
    rightButtonClick: boolean;
    /** Middle mouse button has clicked now. */
    middleButtonClick: boolean;
    /** Mouse has just stopped now. */
    justStopped: boolean;
    /** Mose double click delay response time.*/
    doubleClickDelay: number;
    /** Mose click delay response time.*/
    clickDelay: number;
    /** Mouse wheel. */
    wheelDelta: number;
    /** JavaScript mouse system event message. */
    sys: MouseEvent | null;
    isTouchPad: boolean;
}

export interface ITouchState extends IBaseInputState {
    /** Touch has ended right now.*/
    touchEnd: boolean;
    /** Touch has started right now.*/
    touchStart: boolean;
    /** Touch canceled.*/
    touchCancel: boolean;
    /** Touched twice.*/
    doubleTouch: boolean;
    /** Double touching responce delay.*/
    doubleTouchDelay: number;
    /** Double touching responce radius in screen pixels.*/
    doubleTouchRadius: number;
    /** JavaScript mouse system event message. */
    sys: TouchEventExt | null;
}

const LB_M = 0b0001;
const RB_M = 0b0010;
const MB_M = 0b0100;

const ISBLACK = (c: NumberArray3 | Uint8Array): boolean => !(c[0] || c[1] || c[2]);
const NOTBLACK = (c: NumberArray3 | Uint8Array): boolean => !!(c[0] || c[1] || c[2]);

/**
 * Stores current picking rgb color.
 * @type {Array.<number>}
 */
let _currPickingColor = new Uint8Array(4);
let _tempCurrPickingColor = new Uint8Array(4);

/**
 * Stores previous picked rgb color.
 * @type {Array.<number>}
 */
let _prevPickingColor = new Uint8Array(4);

/**
 * Renderer events handler.
 * @class
 * @param {Renderer} renderer - Renderer object, events that works for.
 */
class RendererEvents extends Events<RendererEventsType> implements RendererEventsHandler {
    /**
     * Assigned renderer.
     * @public
     * @type {Renderer}
     */
    public renderer: Renderer;

    /**
     * Low level touch events handler.
     * @protected
     * @type {TouchHandler}
     */
    protected _touchHandler: TouchHandler;

    /**
     * Low level mouse events handler.
     * @protected
     * @type {MouseHandler}
     */
    protected _mouseHandler: MouseHandler;

    /**
     * Low level keyboard events handler.
     * @protected
     * @type {KeyboardHandler}
     */
    protected _keyboardHandler: KeyboardHandler;

    protected _active: boolean;

    public clickRadius: number;

    /**
     * Current mouse state.
     * @public
     * @type {IMouseState}
     */
    public mouseState: IMouseState;

    /**
     * Current touch state.
     * @public
     * @type {ITouchState}
     */
    public touchState: ITouchState;

    protected _dblTchCoords: Vec2;
    protected _oneTouchStart: boolean;
    protected _dblTchBegins: number;
    protected _mousestopThread: any | null;
    protected _ldblClkBegins: number;
    protected _rdblClkBegins: number;
    protected _mdblClkBegins: number;
    protected _lClkBegins: number;
    protected _rClkBegins: number;
    protected _mClkBegins: number;
    protected _lclickX: number;
    protected _lclickY: number;
    protected _rclickX: number;
    protected _rclickY: number;
    protected _mclickX: number;
    protected _mclickY: number;

    protected _isMouseInside: boolean;
    protected _entityPickingEventsActive: boolean;

    constructor(renderer: Renderer) {

        super(RENDERER_EVENTS);

        this.renderer = renderer;

        this._touchHandler = new TouchHandler(renderer.handler.canvas!);

        this._mouseHandler = new MouseHandler(renderer.handler.canvas!);

        this._keyboardHandler = new KeyboardHandler();

        this._active = true;

        this.clickRadius = 15;

        this.mouseState = {
            clientX: 0,
            clientY: 0,
            pos: new Vec2(),
            x: 0,
            y: 0,
            nx: 0,
            ny: 0,
            prev_x: 0,
            prev_y: 0,
            direction: new Vec3(),
            leftButtonUp: false,
            rightButtonUp: false,
            middleButtonUp: false,
            leftButtonDown: false,
            rightButtonDown: false,
            middleButtonDown: false,
            leftButtonHold: false,
            rightButtonHold: false,
            middleButtonHold: false,
            leftButtonDoubleClick: false,
            rightButtonDoubleClick: false,
            middleButtonDoubleClick: false,
            leftButtonClick: false,
            rightButtonClick: false,
            middleButtonClick: false,
            moving: false,
            justStopped: false,
            doubleClickDelay: 500,
            clickDelay: 200,
            wheelDelta: 0,
            sys: null,
            pickingObject: null,
            renderer: renderer,
            isTouchPad: false
        };

        this.touchState = {
            moving: false,
            touchEnd: false,
            touchStart: false,
            touchCancel: false,
            doubleTouch: false,
            doubleTouchDelay: 550,
            doubleTouchRadius: 10,
            clientX: 0,
            clientY: 0,
            pos: new Vec2(),
            x: 0,
            y: 0,
            nx: 0,
            ny: 0,
            prev_x: 0,
            prev_y: 0,
            direction: new Vec3(),
            sys: null,
            pickingObject: null,
            renderer: renderer
        };

        this._isMouseInside = true;
        this._entityPickingEventsActive = true;

        this._dblTchCoords = new Vec2();
        this._oneTouchStart = false;
        this._dblTchBegins = 0;
        this._mousestopThread = null;
        this._ldblClkBegins = 0;
        this._rdblClkBegins = 0;
        this._mdblClkBegins = 0;
        this._lClkBegins = 0;
        this._rClkBegins = 0;
        this._mClkBegins = 0;
        this._lclickX = 0;
        this._lclickY = 0;
        this._rclickX = 0;
        this._rclickY = 0;
        this._mclickX = 0;
        this._mclickY = 0;
    }

    public pointerEvent(): boolean {
        let ms = this.mouseState,
            ts = this.touchState;
        return (
            ms.moving ||
            ms.justStopped ||
            ts.moving ||
            ts.touchStart ||
            ts.touchEnd ||
            ms.wheelDelta !== 0
        )
    }

    public get active(): boolean {
        return this._active;
    }

    public set active(isActive: boolean) {
        this._active = isActive;
        this._keyboardHandler.setActivity(isActive);
    }

    /**
     * Used in render node frame.
     * @public
     */
    public handleEvents() {
        if (this._active) {
            this.mouseState.direction = this.renderer.activeCamera!.unproject(
                this.mouseState.x,
                this.mouseState.y
            );
            //
            // TODO: Replace in some other place with a thought that we do
            // not need to make unproject when we do not make touching
            this.touchState.direction = this.renderer.activeCamera!.unproject(
                this.touchState.x,
                this.touchState.y
            );

            this._keyboardHandler.handleEvents();
            this.handleMouseEvents();
            this.handleTouchEvents();
            this.entityPickingEvents();
        }
    }

    public override on(name: string, p0: EventCallback | number, p1?: number | EventCallback, p2?: any, keyPriority?: number) {
        if (name === "keypress" || name === "charkeypress" || name === "keyfree") {
            this._keyboardHandler.addEvent(name, p0 as number, p1 as EventCallback, p2, keyPriority);
        } else {
            super.on(name, p0 as EventCallback, p1, p2);
        }
    }

    public override off(name: string, p1?: EventCallback | number | null, p2?: EventCallback) {
        if (name === "keypress" || name === "charkeypress" || name === "keyfree") {
            this._keyboardHandler.removeEvent(name, p1 as number, p2 as EventCallback);
        } else {
            super.off(name, p1 as EventCallback);
        }
    }

    /**
     * Check key is pressed.
     * @public
     * @param {number} keyCode - Key code
     * @return {boolean}
     */
    public isKeyPressed(keyCode: number): boolean {
        return this._keyboardHandler.isKeyPressed(keyCode);
    }

    public releaseKeys() {
        this._keyboardHandler.releaseKeys();
    }

    /**
     * Renderer events initialization.
     * @public
     */
    public initialize() {
        this._mouseHandler.setEvent("mouseup", this, this.onMouseUp);
        this._mouseHandler.setEvent("mousemove", this, this.onMouseMove);
        this._mouseHandler.setEvent("mousedown", this, this.onMouseDown);
        this._mouseHandler.setEvent("mousewheel", this, this.onMouseWheel);
        this._mouseHandler.setEvent("mouseleave", this, this.onMouseLeave);
        this._mouseHandler.setEvent("mouseenter", this, this.onMouseEnter);

        this._touchHandler.setEvent("touchstart", this, this.onTouchStart);
        this._touchHandler.setEvent("touchend", this, this.onTouchEnd);
        this._touchHandler.setEvent("touchcancel", this, this.onTouchCancel);
        this._touchHandler.setEvent("touchmove", this, this.onTouchMove);
    }

    /**
     * @protected
     */
    protected onMouseWheel(event: MouseEventExt) {
        this.mouseState.isTouchPad = event.isTouchPad || false;
        this.mouseState.sys = event;
        this.mouseState.wheelDelta = event.wheelDelta || 0;
    }

    public updateButtonsStates(buttons: number) {
        let ms = this.mouseState;
        if ((buttons & LB_M) && ms.leftButtonDown) {
            ms.leftButtonDown = true;
        } else {
            ms.leftButtonHold = false;
            ms.leftButtonDown = false;
        }

        if ((buttons & RB_M) && ms.rightButtonDown) {
            ms.rightButtonDown = true;
        } else {
            ms.rightButtonHold = false;
            ms.rightButtonDown = false;
        }

        if ((buttons & MB_M) && ms.middleButtonDown) {
            ms.middleButtonDown = true;
        } else {
            ms.middleButtonHold = false;
            ms.middleButtonDown = false;
        }
    }

    protected onMouseMove(sys: MouseEvent, event?: MouseHandlerEvent) {

        let ms = this.mouseState;
        this.updateButtonsStates(sys.buttons);
        ms.sys = sys;

        let ex = event!.clientX,
            ey = event!.clientY,
            r = this.clickRadius;

        if (Math.abs(this._lclickX - ex) >= r && Math.abs(this._lclickY - ey) >= r) {
            this._ldblClkBegins = 0;
            this._lClkBegins = 0;
        }

        if (Math.abs(this._rclickX - ex) >= r && Math.abs(this._rclickY - ey) >= r) {
            this._rdblClkBegins = 0;
            this._rClkBegins = 0;
        }

        if (Math.abs(this._mclickX - ex) >= r && Math.abs(this._mclickY - ey) >= r) {
            this._mdblClkBegins = 0;
            this._mClkBegins = 0;
        }

        if (ms.clientX === event!.clientX && ms.clientY === event!.clientY) {
            return;
        }

        ms.clientX = event!.clientX;
        ms.clientY = event!.clientY;

        let h = this.renderer.handler;

        ms.pos.x = ms.x = event!.clientX * h.pixelRatio;
        ms.pos.y = ms.y = event!.clientY * h.pixelRatio;

        ms.nx = ms.x / h.canvas!.width;
        ms.ny = ms.y / h.canvas!.height;

        ms.moving = true;

        //dispatch stop mouse event
        clearTimeout(this._mousestopThread);
        this._mousestopThread = setTimeout(function () {
            ms.justStopped = true;
        }, 100);
    }

    protected onMouseLeave(sys: MouseEvent) {
        this._isMouseInside = false;
        this.mouseState.sys = sys;
        this.dispatch((this as RendererEventsHandler).mouseleave, this.mouseState);
    }

    protected onMouseEnter(sys: MouseEvent) {
        this._isMouseInside = true;
        this.mouseState.sys = sys;
        this.dispatch((this as RendererEventsHandler).mouseenter, this.mouseState);
    }

    protected onMouseDown(sys: MouseEvent, event?: MouseHandlerEvent) {
        if (event!.button === input.MB_LEFT) {
            this._lClkBegins = window.performance.now();
            this._lclickX = event!.clientX;
            this._lclickY = event!.clientY;
            this.mouseState.sys = sys;
            this.mouseState.leftButtonDown = true;
        } else if (event!.button === input.MB_RIGHT) {
            this._rClkBegins = window.performance.now();
            this._rclickX = event!.clientX;
            this._rclickY = event!.clientY;
            this.mouseState.sys = sys;
            this.mouseState.rightButtonDown = true;
        } else if (event!.button === input.MB_MIDDLE) {
            this._mClkBegins = window.performance.now();
            this._mclickX = event!.clientX;
            this._mclickY = event!.clientY;
            this.mouseState.sys = sys;
            this.mouseState.middleButtonDown = true;
        }
    }

    protected onMouseUp(sys: MouseEvent, event?: MouseHandlerEvent) {
        let ms = this.mouseState;
        ms.sys = sys;
        let t = window.performance.now();

        if (event!.button === input.MB_LEFT) {
            ms.leftButtonDown = false;
            ms.leftButtonUp = true;

            if (
                Math.abs(this._lclickX - event!.clientX) < this.clickRadius &&
                Math.abs(this._lclickY - event!.clientY) < this.clickRadius &&
                t - this._lClkBegins <= ms.clickDelay
            ) {
                if (this._ldblClkBegins) {
                    let deltatime = window.performance.now() - this._ldblClkBegins;
                    if (deltatime <= ms.doubleClickDelay) {
                        ms.leftButtonDoubleClick = true;
                    }
                    this._ldblClkBegins = 0;
                } else {
                    this._ldblClkBegins = window.performance.now();
                }

                ms.leftButtonClick = true;
                this._lClkBegins = 0;
            }
        } else if (event!.button === input.MB_RIGHT) {
            ms.rightButtonDown = false;
            ms.rightButtonUp = true;

            if (
                Math.abs(this._rclickX - event!.clientX) < this.clickRadius &&
                Math.abs(this._rclickY - event!.clientY) < this.clickRadius &&
                t - this._rClkBegins <= ms.clickDelay
            ) {
                if (this._rdblClkBegins) {
                    let deltatime = window.performance.now() - this._rdblClkBegins;
                    if (deltatime <= ms.doubleClickDelay) {
                        ms.rightButtonDoubleClick = true;
                    }
                    this._rdblClkBegins = 0;
                } else {
                    this._rdblClkBegins = window.performance.now();
                }

                ms.rightButtonClick = true;
                this._rClkBegins = 0;
            }
        } else if (event!.button === input.MB_MIDDLE) {
            ms.middleButtonDown = false;
            ms.middleButtonUp = true;

            if (
                Math.abs(this._mclickX - event!.clientX) < this.clickRadius &&
                Math.abs(this._mclickY - event!.clientY) < this.clickRadius &&
                t - this._mClkBegins <= ms.clickDelay
            ) {
                if (this._mdblClkBegins) {
                    let deltatime = window.performance.now() - this._mdblClkBegins;
                    if (deltatime <= ms.doubleClickDelay) {
                        ms.middleButtonDoubleClick = true;
                    }
                    this._mdblClkBegins = 0;
                } else {
                    this._mdblClkBegins = window.performance.now();
                }

                ms.middleButtonClick = true;
                this._mClkBegins = 0;
            }
        }
    }

    protected onTouchStart(event: TouchEventExt) {
        let ts = this.touchState;
        ts.sys = event;

        ts.clientX = event.touches.item(0)!.clientX - event.offsetLeft;
        ts.clientY = event.touches.item(0)!.clientY - event.offsetTop;

        let h = this.renderer.handler;

        ts.pos.x = ts.x = ts.clientX * h.pixelRatio;
        ts.pos.y = ts.y = ts.clientY * h.pixelRatio;

        ts.nx = ts.x / h.canvas!.width;
        ts.ny = ts.y / h.canvas!.height;
        ts.prev_x = ts.x;
        ts.prev_y = ts.y;
        ts.touchStart = true;

        if (event.touches.length === 1) {
            this._dblTchCoords.x = ts.x;
            this._dblTchCoords.y = ts.y;
            this._oneTouchStart = true;
        } else {
            this._oneTouchStart = false;
        }
    }

    /**
     * @protected
     */
    protected onTouchEnd(event: TouchEventExt) {
        let ts = this.touchState;
        ts.sys = event;
        ts.touchEnd = true;

        if (event.touches.length === 0) {
            ts.prev_x = ts.x;
            ts.prev_y = ts.y;

            if (this._oneTouchStart) {
                if (this._dblTchBegins) {
                    let deltatime = window.performance.now() - this._dblTchBegins;
                    if (deltatime <= ts.doubleTouchDelay) {
                        ts.doubleTouch = true;
                    }
                    this._dblTchBegins = 0;
                }
                this._dblTchBegins = window.performance.now();
                this._oneTouchStart = false;
            }
        }
    }

    protected onTouchCancel(event: TouchEventExt) {
        let ts = this.touchState;
        ts.sys = event;
        ts.touchCancel = true;
    }

    protected onTouchMove(event: TouchEventExt) {
        let ts = this.touchState;

        ts.clientX = event.touches.item(0)!.clientX - event.offsetLeft;
        ts.clientY = event.touches.item(0)!.clientY - event.offsetTop;

        let h = this.renderer.handler;

        ts.x = ts.clientX * h.pixelRatio;
        ts.y = ts.clientY * h.pixelRatio;

        ts.nx = ts.x / h.canvas!.width;
        ts.ny = ts.y / h.canvas!.height;

        ts.sys = event;
        ts.moving = true;

        let dX = ts.x - ts.prev_x
        let dY = ts.y - ts.prev_y
        if (Math.abs(dX) > 9 || Math.abs(dY) > 9) {
            this._dblTchBegins = 0;
            this._oneTouchStart = false;
        }
    }

    protected entityPickingEvents() {
        let ts = this.touchState,
            ms = this.mouseState;

        // Triggers mouseleave when mouse goes outside the viewport
        if (this._isMouseInside !== this._entityPickingEventsActive) {
            this._entityPickingEventsActive = this._isMouseInside;
            if (!this._entityPickingEventsActive) {
                let r = this.renderer;
                let c = _currPickingColor;
                let co = r.getPickingObjectArr<any>(c);
                if (co) {
                    let pe = co.rendererEvents;
                    ms.pickingObject = co;
                    pe && pe.dispatch(pe.mouseleave, ms);
                    ts.pickingObject = co;
                    pe && pe.dispatch(pe.touchleave, ts);
                }
                _currPickingColor[0] = _currPickingColor[1] = _currPickingColor[2] = _currPickingColor[3] =
                    _prevPickingColor[0] = _prevPickingColor[1] = _prevPickingColor[2] = _prevPickingColor[3] =
                        _tempCurrPickingColor[0] = _tempCurrPickingColor[1] = _tempCurrPickingColor[2] = _tempCurrPickingColor[3] = 0.0;
            }
        }

        if (this._isMouseInside && !(ms.leftButtonHold || ms.rightButtonHold || ms.middleButtonHold)) {

            let r = this.renderer;
            let c = _currPickingColor,
                p = _prevPickingColor,
                t = _tempCurrPickingColor;

            if (ts.x || ts.y) {
                r.readPickingColor(ts.nx, 1 - ts.ny, t);
            } else {
                r.readPickingColor(ms.nx, 1 - ms.ny, t);
            }

            p[0] = c[0];
            p[1] = c[1];
            p[2] = c[2];

            c[0] = t[0];
            c[1] = t[1];
            c[2] = t[2];

            ms.pickingObject = null;
            ts.pickingObject = null;

            let co = r.getPickingObjectArr<any>(c);

            ms.pickingObject = co;
            ts.pickingObject = co;

            //object is changed
            if (c[0] !== p[0] || c[1] !== p[1] || c[2] !== p[2]) {

                //current is black
                if (ISBLACK(c)) {
                    let po = r.getPickingObjectArr<any>(p);
                    if (po) {
                        let pe = po.rendererEvents;
                        ms.pickingObject = po;
                        pe && pe.dispatch(pe.mouseleave, ms);
                        ts.pickingObject = po;
                        pe && pe.dispatch(pe.touchleave, ts);
                    }
                } else {
                    //current ia not black

                    //previous is not black
                    if (NOTBLACK(p)) {
                        let po = r.getPickingObjectArr<any>(p);
                        if (po) {
                            let pe = po.rendererEvents;
                            ms.pickingObject = po;
                            pe && pe.dispatch(pe.mouseleave, ms);
                            ts.pickingObject = po;
                            pe && pe.dispatch(pe.touchleave, ts);
                        }
                    }

                    if (co) {
                        let ce = co.rendererEvents;
                        ms.pickingObject = co;
                        ce && ce.dispatch(ce.mouseenter, ms);
                        ts.pickingObject = co;
                        ce && ce.dispatch(ce.touchenter, ts);
                    }
                }
            }
        }
    }

    protected handleMouseEvents() {
        let _this = this as RendererEventsHandler;
        let ms = this.mouseState;
        let po = ms.pickingObject,
            pe = null;

        if (ms.leftButtonClick) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.lclick, ms);
            }
            this.dispatch(_this.lclick, ms);
            ms.leftButtonClick = false;
        }

        if (ms.rightButtonClick) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.rclick, ms);
            }
            this.dispatch(_this.rclick, ms);
            ms.rightButtonClick = false;
        }

        if (ms.middleButtonClick) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.mclick, ms);
            }
            this.dispatch(_this.mclick, ms);
            ms.middleButtonClick = false;
        }

        if (ms.leftButtonDown) {
            if (ms.leftButtonHold) {
                if (po) {
                    pe = po.rendererEvents;
                    pe && pe.dispatch(pe.lhold, ms);
                }
                this.dispatch(_this.lhold, ms);
            } else {
                ms.leftButtonHold = true;
                if (po) {
                    pe = po.rendererEvents;
                    pe && pe.dispatch(pe.ldown, ms);
                }
                this.dispatch(_this.ldown, ms);
            }
        }

        if (ms.rightButtonDown) {
            if (ms.rightButtonHold) {
                if (po) {
                    pe = po.rendererEvents;
                    pe && pe.dispatch(pe.rhold, ms);
                }
                this.dispatch(_this.rhold, ms);
            } else {
                ms.rightButtonHold = true;
                if (po) {
                    pe = po.rendererEvents;
                    pe && pe.dispatch(pe.rdown, ms);
                }
                this.dispatch(_this.rdown, ms);
            }
        }

        if (ms.middleButtonDown) {
            if (ms.middleButtonHold) {
                if (po) {
                    pe = po.rendererEvents;
                    pe && pe.dispatch(pe.mhold, ms);
                }
                this.dispatch(_this.mhold, ms);
            } else {
                ms.middleButtonHold = true;
                if (po) {
                    pe = po.rendererEvents;
                    pe && pe.dispatch(pe.mdown, ms);
                }
                this.dispatch(_this.mdown, ms);
            }
        }

        if (ms.leftButtonUp) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.lup, ms);
            }
            this.dispatch(_this.lup, ms);
            ms.leftButtonUp = false;
            ms.leftButtonHold = false;
        }

        if (ms.rightButtonUp) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.rup, ms);
            }
            this.dispatch(_this.rup, ms);
            ms.rightButtonUp = false;
            ms.rightButtonHold = false;
        }

        if (ms.middleButtonUp) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.mup, ms);
            }
            this.dispatch(_this.mup, ms);
            ms.middleButtonUp = false;
            ms.middleButtonHold = false;
        }

        if (ms.leftButtonDoubleClick) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.ldblclick, ms);
            }
            this.dispatch(_this.ldblclick, ms);
            ms.leftButtonDoubleClick = false;
        }

        if (ms.rightButtonDoubleClick) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.rdblclick, ms);
            }
            this.dispatch(_this.rdblclick, ms);
            ms.rightButtonDoubleClick = false;
        }

        if (ms.middleButtonDoubleClick) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.mdblclick, ms);
            }
            this.dispatch(_this.mdblclick, ms);
            ms.middleButtonDoubleClick = false;
        }

        if (ms.wheelDelta) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.mousewheel, ms);
            }
            this.dispatch(_this.mousewheel, ms);
        }

        if (ms.moving) {
            if (po) {
                pe = po.rendererEvents;
                pe && pe.dispatch(pe.mousemove, ms);
            }
            this.dispatch(_this.mousemove, ms);
            ms.prev_x = ms.x;
            ms.prev_y = ms.y;
        }

        if (ms.justStopped) {
            this.dispatch(_this.mousestop, ms);
        }
    }

    /**
     * @protected
     */
    protected handleTouchEvents() {
        let _this = this as RendererEventsHandler;

        let ts = this.touchState;

        let tpo = ts.pickingObject,
            tpe = null;

        if (ts.touchCancel) {
            this.dispatch(_this.touchcancel, ts);
            ts.touchCancel = false;
        }

        if (ts.touchStart) {
            let r = this.renderer;

            r.readPickingColor(ts.nx, 1 - ts.ny, _currPickingColor);

            let co = r.getPickingObjectArr<any>(_currPickingColor);
            tpo = ts.pickingObject = co;
            if (tpo) {
                tpe = tpo.rendererEvents;
                tpe && tpe.dispatch(tpe.touchstart, ts);
            }
            this.dispatch(_this.touchstart, ts);
            ts.touchStart = false;
        }

        if (ts.doubleTouch) {
            if (tpo) {
                tpe = tpo.rendererEvents;
                tpe && tpe.dispatch(tpe.doubletouch, ts);
            }
            this.dispatch(_this.doubletouch, ts);
            ts.doubleTouch = false;
        }

        if (ts.touchEnd) {
            if (tpo) {
                tpe = tpo.rendererEvents;
                tpe && tpe.dispatch(tpe.touchend, ts);
            }
            this.dispatch(_this.touchend, ts);
            ts.x = 0;
            ts.y = 0;
            ts.touchEnd = false;
        }

        if (ts.moving) {
            if (tpo) {
                tpe = tpo.rendererEvents;
                tpe && tpe.dispatch(tpe.touchmove, ts);
            }
            this.dispatch(_this.touchmove, ts);
            ts.prev_x = ts.x;
            ts.prev_y = ts.y;
        }
    }
}

const RENDERER_EVENTS: RendererEventsType = [
    "changerelativecenter",

    /**
     * Triggered before scene frame is rendered(before render nodes).
     * @event og.RendererEvents#draw
     */
    "draw",

    /**
     * Triggered after all transparent object are drawn
     * @event og.RendererEvents#drawtransparent
     */
    "drawtransparent",

    /**
     * Triggered after scene frame is rendered(after render nodes).
     * @event og.RendererEvents#postdraw
     */
    "postdraw",

    /**
     * Triggered when screen is resized.
     * @event og.RendererEvents#resize
     */
    "resize",

    /**
     * Triggered when screen is resized.
     * @event og.RendererEvents#resizeend
     */
    "resizeend",

    /**
     * Mouse enters the work screen
     * @event og.RendererEvents#mouseenter
     */
    "mouseenter",

    /**
     * Mouse leaves the work screen
     * @event og.RendererEvents#mouseleave
     */
    "mouseleave",

    /**
     * Mouse is moving.
     * @event og.RendererEvents#mousemove
     */
    "mousemove",

    /**
     * Mouse is just stopped.
     * @event og.RendererEvents#mousestop
     */
    "mousestop",

    /**
     * Mouse left button clicked.
     * @event og.RendererEvents#lclick
     */
    "lclick",

    /**
     * Mouse right button clicked.
     * @event og.RendererEvents#rclick
     */
    "rclick",

    /**
     * Mouse middle button clicked.
     * @event og.RendererEvents#mclick
     */
    "mclick",

    /**
     * Mouse left button double click.
     * @event og.RendererEvents#ldblclick
     */
    "ldblclick",

    /**
     * Mouse right button double click.
     * @event og.RendererEvents#rdblclick
     */
    "rdblclick",

    /**
     * Mouse middle button double click.
     * @event og.RendererEvents#mdblclick
     */
    "mdblclick",

    /**
     * Mouse left button up(stop pressing).
     * @event og.RendererEvents#lup
     */
    "lup",

    /**
     * Mouse right button up(stop pressing).
     * @event og.RendererEvents#rup
     */
    "rup",

    /**
     * Mouse middle button up(stop pressing).
     * @event og.RendererEvents#mup
     */
    "mup",

    /**
     * Mouse left button is just pressed down(start pressing).
     * @event og.RendererEvents#ldown
     */
    "ldown",

    /**
     * Mouse right button is just pressed down(start pressing).
     * @event og.RendererEvents#rdown
     */
    "rdown",

    /**
     * Mouse middle button is just pressed down(start pressing).
     * @event og.RendererEvents#mdown
     */
    "mdown",

    /**
     * Mouse left button is pressing.
     * @event og.RendererEvents#lhold
     */
    "lhold",

    /**
     * Mouse right button is pressing.
     * @event og.RendererEvents#rhold
     */
    "rhold",

    /**
     * Mouse middle button is pressing.
     * @event og.RendererEvents#mhold
     */
    "mhold",

    /**
     * Mouse wheel is rotated.
     * @event og.RendererEvents#mousewheel
     */
    "mousewheel",

    /**
     * Triggered when touching starts.
     * @event og.RendererEvents#touchstart
     */
    "touchstart",

    /**
     * Triggered when touching ends.
     * @event og.RendererEvents#touchend
     */
    "touchend",

    /**
     * Triggered when touching cancel.
     * @event og.RendererEvents#touchcancel
     */
    "touchcancel",

    /**
     * Triggered when touch is move.
     * @event og.RendererEvents#touchmove
     */
    "touchmove",

    /**
     * Triggered when double touch.
     * @event og.RendererEvents#doubletouch
     */
    "doubletouch",

    /**
     * Triggered when touch leaves picked object.
     * @event og.RendererEvents#touchleave
     */
    "touchleave",

    /**
     * Triggered when touch enter picking object.
     * @event og.RendererEvents#touchenter
     */
    "touchenter"
];

export {RendererEvents};
