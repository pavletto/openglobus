import type {EventsHandler} from "../../Events";
import {View} from '../../ui/View';
import type {IViewParams, ViewEventsList} from '../../ui/View';
import {
    SAFE,
    WARNING,
    COLLISION,
    ElevationProfile,
} from './ElevationProfile';

import type {
    ElevationProfileDrawData,
    GroundItem,
    TrackItem
} from './ElevationProfile';

import {distanceFormatExt, binarySearch} from "../../utils/shared";
import type {MouseEventExt} from "../../input/MouseHandler";

const FILL_COLOR = "rgb(63, 63, 63)";
const TRACK_COLOR = "rgb(0, 255, 50)";
const TERRAIN_COLOR = "rgb(198, 198, 198)";
const TERRAIN_FILL_COLOR = "rgb(64, 68, 82)";
const WARNING_COLOR = "rgb(255, 255, 0)";
const COLLISION_COLOR = "rgb(255, 0, 0)";
const LINE_COLORS = [TERRAIN_COLOR, WARNING_COLOR, COLLISION_COLOR];
const TERRAIN_ALPHA = 0.5;
const LINE_WIDTH = 5;

interface IElevationProfileViewParams extends IViewParams {
    fillStyle?: string;
}

type ElevationProfileViewEventsList = ["startdrag", "stopdrag", "pointer", "mouseenter", "mouseleave", "dblclick", "tracklength", "groundlength", "warninglength", "collisionlength"];

const ELEVATIONPROFILEVIEW_EVENTS: ElevationProfileViewEventsList = ["startdrag", "stopdrag", "pointer", "mouseenter", "mouseleave", "dblclick", "tracklength", "groundlength", "warninglength", "collisionlength"];

const TEMPLATE =
    `<div class="og-elevationprofile">
      <div class="og-elevationprofile-loading" style="display: none;">
        <div class="loadingio-spinner-bars-r354qqyl5v">
          <div class="ldio-p0v5a1f6oz">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div> 
      </div>     
    </div>`;


class ElevationProfileView extends View<ElevationProfile> {

    public override events: EventsHandler<ElevationProfileViewEventsList> & EventsHandler<ViewEventsList>;

    public fillStyle: string;

    protected _pixelsInMeter_x: number;
    protected _pixelsInMeter_y: number;
    protected _canvasScale: number;
    public $canvas: HTMLCanvasElement;
    public $pointerCanvas: HTMLCanvasElement;
    protected _ctx: CanvasRenderingContext2D;
    protected _pointerCtx: CanvasRenderingContext2D;
    protected _onResizeObserver_: () => void;
    protected _resizeObserver: ResizeObserver;

    public $loading: HTMLElement | null;

    protected _isMouseOver: boolean;
    protected _isDragging: boolean;

    protected _clickPosX: number;
    protected _clickLeftDistance: number;
    protected _clickRightDistance: number;

    protected _leftDistance: number;
    protected _rightDistance: number;

    protected _customFrame: boolean;

    protected _timeStartHandler: number;

    constructor(options: IElevationProfileViewParams = {}) {
        super({
            template: TEMPLATE,
            model: new ElevationProfile()
        });

        //@ts-ignore
        this.events = this.events.registerNames(ELEVATIONPROFILEVIEW_EVENTS);

        this.fillStyle = options.fillStyle || FILL_COLOR;

        this._customFrame = false;
        this._leftDistance = 0;
        this._rightDistance = 0;
        this._pixelsInMeter_x = 0;
        this._pixelsInMeter_y = 0;
        this._canvasScale = 2;
        this.$canvas = document.createElement("canvas");
        this.$canvas.style.position = "absolute";
        this._ctx = this.$canvas.getContext('2d')!;

        this.$pointerCanvas = document.createElement("canvas");
        this.$pointerCanvas.style.pointerEvents = "none";
        this.$pointerCanvas.style.position = "absolute";
        this._pointerCtx = this.$pointerCanvas.getContext('2d')!;

        this.$loading = null;

        this._isMouseOver = false;
        this._isDragging = false;
        this._clickPosX = 0;
        this._clickLeftDistance = 0;
        this._clickRightDistance = 0;

        this._timeStartHandler = 0;

        this._onResizeObserver_ = this._onResizeObserver.bind(this);
        this._resizeObserver = new ResizeObserver(this._onResizeObserver_);
    }

    protected _onResizeObserver() {
        this.resize();
    }

    public get canvasScale(): number {
        return this._canvasScale;
    }

    public set canvasScale(scale: number) {
        if (scale !== this._canvasScale) {
            this._canvasScale = scale;
            this.resize();
        }
    }

    public resize() {
        this._resize();
        this.draw();
    }

    public override render(): this {
        super.render();

        this._resizeObserver.observe(this.el!);

        this.el!.appendChild(this.$canvas);
        this.el!.appendChild(this.$pointerCanvas);

        this.model.events.on("profilecollected", (data: ElevationProfileDrawData) => {
            this._hideLoading();
            this.clearPointerCanvas();
            this.draw();
        });

        this.model.events.on("startcollecting", () => {
            clearTimeout(this._timeStartHandler);
            //@ts-ignore
            this._timeStartHandler = setTimeout(() => {
                this._showLoading();
            }, 450);
        });

        this.model.events.on("clear", () => {
            this._customFrame = false;
            this._leftDistance = 0;
            this.clearCanvas();
            this.clearPointerCanvas();
        });

        this.$loading = this.select(".og-elevationprofile-loading");

        this.$canvas.addEventListener("mouseenter", this._onMouseEnter);
        this.$canvas.addEventListener("mouseout", this._onMouseOut);
        this.$canvas.addEventListener("dblclick", this._onMouseDblClick);

        this.$canvas.addEventListener("mousemove", this._onCanvasMouseMove);
        document.body.addEventListener("mousemove", this._onMouseMove);
        document.body.addEventListener("mousedown", this._onMouseDown);
        document.body.addEventListener("mouseup", this._onMouseUp);
        document.body.addEventListener("wheel", this._onMouseWheelFF);

        return this;
    }

    protected _hideLoading() {
        clearTimeout(this._timeStartHandler);
        this.$loading!.style.display = "none";
    }

    protected _showLoading() {
        this.$loading!.style.display = "flex";
    }

    protected _onMouseDblClick = (e: MouseEvent) => {
        //
        // @todo: The same code as in the pointer mouse move
        //
        let rect = this.$canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;

        let pointerDistance = this._leftDistance + (this._rightDistance - this._leftDistance) * x / this.clientWidth;
        let groundData = this.model.drawData[1];
        let trackData = this.model.drawData[0];

        let groundPoiIndex;

        if (pointerDistance < 0) {
            groundPoiIndex = 1;
            pointerDistance = 0;
            x = (0 - this._leftDistance) * this.clientWidth / (this._rightDistance - this._leftDistance);
        } else if (pointerDistance > this.model.planeDistance) {
            groundPoiIndex = groundData.length - 1;
            pointerDistance = this.model.planeDistance;
            x = (pointerDistance - this._leftDistance) * this.clientWidth / (this._rightDistance - this._leftDistance);
        } else {
            groundPoiIndex = -1 - binarySearch(groundData, pointerDistance, (a: number, b: GroundItem) => {
                return a - b[0];
            });
        }

        // Ground point
        let gp0 = groundData[groundPoiIndex - 1],
            gp1 = groundData[groundPoiIndex];
        let d = (pointerDistance - gp0[0]) / (gp1[0] - gp0[0]);
        let groundElv = gp0[1] + d * (gp1[1] - gp0[1]);

        // track point
        let trackPoiIndex = gp0[4];
        let tp0 = trackData[trackPoiIndex],
            tp1 = trackData[trackPoiIndex + 1];
        d = (pointerDistance - tp0[0]) / (tp1[0] - tp0[0]);
        let trackElv = tp0[1] + d * (tp1[1] - tp0[1]);

        this.events.dispatch(this.events.dblclick, pointerDistance, tp0, tp1, gp0, gp1, trackPoiIndex, groundPoiIndex - 1, trackElv - groundElv);
    }

    protected _onMouseEnter = (e: MouseEvent) => {
        this._isMouseOver = true;
        this.events.dispatch(this.events.mouseenter, e);
    }

    protected _onMouseOut = (e: MouseEvent) => {
        this._isMouseOver = false;
        this.events.dispatch(this.events.mouseleave, e);
    }

    protected _onMouseDown = (e: MouseEvent) => {
        if (this._isMouseOver) {
            this._isDragging = true;
            document.body.classList.add("og-timeline-unselectable");

            this._clickPosX = e.clientX;

            if (!this._customFrame) {
                this._leftDistance = this.model.minX;
                this._rightDistance = this.model.maxX;
            }

            this._clickLeftDistance = this._leftDistance;
            this._clickRightDistance = this._rightDistance;

            this.events.dispatch(this.events.startdrag, e);
        }
    }

    protected _onMouseUp = (e: MouseEvent) => {
        if (this._isDragging) {
            this._isDragging = false;
            document.body.classList.remove("og-timeline-unselectable");
            this.events.dispatch(this.events.stopdrag, e);
        }
    }

    protected _onCanvasMouseMove = (e: MouseEvent) => {
        if (this.model.pointsReady) {
            if (!this._isDragging) {

                if (!this._customFrame) {
                    this._leftDistance = this.model.minX;
                    this._rightDistance = this.model.maxX;
                }

                let rect = this.$pointerCanvas.getBoundingClientRect();
                let x = e.clientX - rect.left;
                this.redrawPointerCanvas(x);
            } else {
                this.clearPointerCanvas();
            }
        }
    }

    public redrawPointerCanvas(x: number) {
        this.clearPointerCanvas();

        let pointerDistance = this._leftDistance + (this._rightDistance - this._leftDistance) * x / this.clientWidth;
        let groundData = this.model.drawData[1];
        let trackData = this.model.drawData[0];

        let groundPoiIndex;

        if (pointerDistance < 0) {
            groundPoiIndex = 1;
            pointerDistance = 0;
            x = (0 - this._leftDistance) * this.clientWidth / (this._rightDistance - this._leftDistance);
        } else if (pointerDistance > this.model.planeDistance) {
            groundPoiIndex = groundData.length - 1;
            pointerDistance = this.model.planeDistance;
            x = (pointerDistance - this._leftDistance) * this.clientWidth / (this._rightDistance - this._leftDistance);
        } else {
            groundPoiIndex = -1 - binarySearch(groundData, pointerDistance, (a: number, b: GroundItem) => {
                return a - b[0];
            });
        }

        // Ground point
        let gp0 = groundData[groundPoiIndex - 1],
            gp1 = groundData[groundPoiIndex];
        let d = (pointerDistance - gp0[0]) / (gp1[0] - gp0[0]);
        let groundElv = gp0[1] + d * (gp1[1] - gp0[1]);

        // track point
        let trackPoiIndex = gp0[4];
        let tp0 = trackData[trackPoiIndex],
            tp1 = trackData[trackPoiIndex + 1];
        d = (pointerDistance - tp0[0]) / (tp1[0] - tp0[0]);
        let trackElv = tp0[1] + d * (tp1[1] - tp0[1]);

        let trackY = (this.model.maxY - trackElv) * this._pixelsInMeter_y;
        let groundY = (this.model.maxY - groundElv) * this._pixelsInMeter_y;

        this.events.dispatch(this.events.pointer, pointerDistance, tp0, tp1, gp0, gp1, trackPoiIndex, groundPoiIndex - 1, trackElv - groundElv);

        let ctx = this._pointerCtx;

        // Vertical grey line
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(64,64,64,0.6)";
        ctx.beginPath();
        ctx.moveTo(x * this._canvasScale, 0);
        ctx.lineTo(x * this._canvasScale, this.clientHeight * this._canvasScale);
        ctx.stroke();

        // Ground point
        ctx.beginPath();
        ctx.arc(x * this._canvasScale, groundY, 4, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#FFB277';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFB277';
        ctx.stroke();

        // Track point
        ctx.beginPath();
        ctx.arc(x * this._canvasScale, trackY, 4, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#FFB277';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFB277';
        ctx.stroke();

        // Vertical white line
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#FFB277";
        ctx.beginPath();
        ctx.moveTo(x * this._canvasScale, groundY);
        ctx.lineTo(x * this._canvasScale, trackY);
        ctx.stroke();

        // Altitude label
        ctx.fillStyle = "white";
        ctx.font = `${28 / devicePixelRatio}px Arial`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(`${Math.round(trackElv - groundElv).toString()} m`, (x + 5) * this._canvasScale, groundY + (trackY - groundY) * 0.5);

        // distance from the begining label
        ctx.fillStyle = "white";
        ctx.font = `${28 / devicePixelRatio}px Arial`;
        ctx.textAlign = "right";
        let distStr = distanceFormatExt(pointerDistance);
        ctx.fillText(`${distStr[0]} ${distStr[1]}`, (x - 5) * this._canvasScale, (this.clientHeight - 7) * this._canvasScale);
    }

    protected _onMouseMove = (e: MouseEvent) => {
        if (this._isDragging && this.model.pointsReady) {
            let offset = (this._clickPosX - e.clientX);
            let distanceOffset = offset * this._canvasScale / this._pixelsInMeter_x;
            this.setFrame(this._clickLeftDistance + distanceOffset, this._clickRightDistance + distanceOffset);
        }
    }

    protected _onMouseWheelFF = (e: MouseEventExt) => {
        this._onMouseWheel(e);
    }
    protected _onMouseWheel = (e: MouseEventExt) => {
        if (this._isMouseOver && this.model.pointsReady) {

            if (!this._customFrame) {
                this._leftDistance = this.model.minX;
                this._rightDistance = this.model.maxX;
            }

            this._customFrame = true;

            let padDist = Math.sign(e.wheelDelta!) * (this._rightDistance - this._leftDistance) / 20;

            let rect = this.$canvas.getBoundingClientRect();
            let pointerPosX = e.clientX - rect.left,
                pointerCenterOffsetX = pointerPosX - this.$canvas.clientWidth * 0.5;
            let distanceCenterOffsetX = pointerCenterOffsetX * this._canvasScale / this._pixelsInMeter_x;

            // Move distance under pointer to a screen center
            let leftDistance = distanceCenterOffsetX + this._leftDistance + padDist;
            let rightDistance = distanceCenterOffsetX + this._rightDistance - padDist;

            // move center back to the mouse pointer
            distanceCenterOffsetX = -pointerCenterOffsetX * (rightDistance - leftDistance) / this.clientWidth;

            this.setFrame(leftDistance + distanceCenterOffsetX, rightDistance + distanceCenterOffsetX);

            this.redrawPointerCanvas(pointerPosX);
        }
    }


    public get clientWidth(): number {
        return this.$canvas ? this.$canvas.width / this._canvasScale : 0;
    }

    public get clientHeight(): number {
        return this.$canvas ? this.$canvas.height / this._canvasScale : 0;
    }

    protected _resize() {
        if (this.el) {
            this.$canvas.width = this.el.clientWidth * this._canvasScale;
            this.$canvas.height = this.el.clientHeight * this._canvasScale;
            this.$canvas.style.width = `${this.el.clientWidth}px`;
            this.$canvas.style.height = `${this.el.clientHeight}px`;

            this.$pointerCanvas.width = this.el.clientWidth * this._canvasScale;
            this.$pointerCanvas.height = this.el.clientHeight * this._canvasScale;
            this.$pointerCanvas.style.width = `${this.el.clientWidth}px`;
            this.$pointerCanvas.style.height = `${this.el.clientHeight}px`;

            if (this._customFrame) {
                this._pixelsInMeter_x = this._canvasScale * this.clientWidth / (this._rightDistance - this._leftDistance);
            }
        }
    }

    public clearPointerCanvas() {
        this._pointerCtx.fillStyle = "rgba(0,0,0,0)";
        this._pointerCtx.clearRect(0, 0, this.clientWidth * this._canvasScale, this.clientHeight * this._canvasScale);
    }

    public clearCanvas() {
        const grd = this._ctx.createLinearGradient(0, 0, 0, this.clientHeight * this._canvasScale);
        grd.addColorStop(0, "black");
        grd.addColorStop(1, this.fillStyle);

        this._ctx.fillStyle = grd;
        this._ctx.fillRect(0, 0, this.clientWidth * this._canvasScale, this.clientHeight * this._canvasScale);
    }

    public setFrame(leftDistance: number, rightDistance: number) {
        this._leftDistance = leftDistance;
        this._rightDistance = rightDistance;
        this._customFrame = true;
        this._pixelsInMeter_x = this._canvasScale * this.clientWidth / (this._rightDistance - this._leftDistance);
        this.model.setRange(leftDistance, rightDistance);
        this.draw();
    }

    public _updateUnits() {
        if (!this._customFrame) {
            this._pixelsInMeter_x = this._canvasScale * this.clientWidth / (this.model.maxX - this.model.minX);
        }
        this._pixelsInMeter_y = this._canvasScale * this.clientHeight / (this.model.maxY - this.model.minY);
    }

    public clear() {
        this.model.clear();
        this.clearCanvas();
    }

    public draw() {
        let trackCoords = this.model.drawData[0];
        if (trackCoords.length > 1) {

            this._updateUnits();

            this.clearCanvas();

            let groundCoords = this.model.drawData[1];

            this._drawTrack(trackCoords, groundCoords);
            this._drawTerrain(groundCoords);
            this._drawWarningAndCollision(groundCoords);
            this._drawLabels(trackCoords, groundCoords);

        } else {
            this.clearCanvas();
        }
    }

    protected _drawLabels(coords: TrackItem[], groundCoords: GroundItem[]) {
        let ctx = this._ctx;
        if (ctx) {
            let p0 = coords[0];
            const maxY = this.model.maxY;
            let x = (-this._leftDistance + p0[0]) * this._pixelsInMeter_x,
                yt = (maxY - p0[1]) * this._pixelsInMeter_y,
                yg = (maxY - groundCoords[p0[2]][1]) * this._pixelsInMeter_y;

            // Track points
            ctx.beginPath();
            ctx.fillStyle = '#F7F718';
            ctx.fillRect(x - 4, yt - 4, 8, 8);
            ctx.stroke();

            // Alt label
            ctx.fillStyle = "white";
            ctx.font = `${26 / devicePixelRatio}px Arial`;
            ctx.textBaseline = "bottom";
            ctx.textAlign = "left";
            ctx.fillText(`${Math.round(p0[1] - groundCoords[p0[2]][1]).toString()} m`, x + 1, yt - 10);
            ctx.stroke();

            for (let i = 1, len = coords.length; i < len; i++) {
                let pi = coords[i];
                x = (-this._leftDistance + pi[0]) * this._pixelsInMeter_x;
                yt = (maxY - pi[1]) * this._pixelsInMeter_y;
                yg = (maxY - groundCoords[pi[2]][1]) * this._pixelsInMeter_y;

                // Track points
                ctx.beginPath();
                ctx.fillStyle = '#F7F718';
                ctx.fillRect(x - 4, yt - 4, 8, 8);
                ctx.stroke();

                // Alt label
                ctx.fillStyle = "white";
                ctx.fillText(`${Math.round(pi[1] - groundCoords[pi[2]][1]).toString()} m`, x + 1, yt - 10);
                ctx.stroke();
            }
        }
    }

    protected _drawTrack(coords: TrackItem[], groundCoords: GroundItem[]) {
        let p0 = coords[0];
        let ctx = this._ctx;
        if (ctx) {
            const maxY = this.model.maxY;
            ctx.lineWidth = LINE_WIDTH;
            ctx.strokeStyle = TRACK_COLOR;
            ctx.beginPath();
            ctx.moveTo((-this._leftDistance + p0[0]) * this._pixelsInMeter_x, (maxY - p0[1]) * this._pixelsInMeter_y);
            let trackLength = 0;
            for (let i = 1, len = coords.length; i < len; i++) {
                let pi = coords[i];
                ctx.lineTo((-this._leftDistance + pi[0]) * this._pixelsInMeter_x, (maxY - pi[1]) * this._pixelsInMeter_y);
                let prevP = coords[i - 1];
                let a = pi[0] - prevP[0],
                    b = pi[1] - prevP[1],
                    aa = a * a,
                    bb = b * b;
                trackLength += Math.sqrt(aa + bb);
            }
            ctx.stroke();

            // Track points lines
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255,255,255,0.7)";
            ctx.beginPath();
            let x = (-this._leftDistance + p0[0]) * this._pixelsInMeter_x,
                yt = (maxY - p0[1]) * this._pixelsInMeter_y,
                yg = (maxY - groundCoords[p0[2]][1]) * this._pixelsInMeter_y;
            ctx.moveTo(x, yt);
            ctx.lineTo(x, yg);

            for (let i = 1, len = coords.length; i < len; i++) {
                let pi = coords[i];
                x = (-this._leftDistance + pi[0]) * this._pixelsInMeter_x;
                yt = (maxY - pi[1]) * this._pixelsInMeter_y;
                yg = (maxY - groundCoords[pi[2]][1]) * this._pixelsInMeter_y;
                ctx.strokeStyle = "rgba(255,255,255,0.7)";
                ctx.moveTo(x, yt);
                ctx.lineTo(x, yg);
            }

            ctx.stroke();

            this.events.dispatch(this.events.tracklength, trackLength);
        }
    }

    protected _drawTerrain(coords: number[][]) {
        let p0 = coords[0];
        let ctx = this._ctx;
        if (ctx) {
            const maxY = this.model.maxY;
            ctx.lineWidth = LINE_WIDTH;
            ctx.strokeStyle = TERRAIN_COLOR;
            ctx.beginPath();
            ctx.moveTo((-this._leftDistance + p0[0]) * this._pixelsInMeter_x, this.$canvas.height);
            ctx.lineTo((-this._leftDistance + p0[0]) * this._pixelsInMeter_x, (maxY - p0[1]) * this._pixelsInMeter_y);
            let groundLength = 0;
            for (let i = 1, len = coords.length; i < len; i++) {
                let pi = coords[i];
                ctx.lineTo((-this._leftDistance + pi[0]) * this._pixelsInMeter_x, (maxY - pi[1]) * this._pixelsInMeter_y);
                let prevP = coords[i - 1];
                let a = pi[0] - prevP[0],
                    b = pi[1] - prevP[1],
                    aa = a * a,
                    bb = b * b;
                groundLength += Math.sqrt(aa + bb);
            }

            ctx.lineTo((-this._leftDistance + coords[coords.length - 1][0]) * this._pixelsInMeter_x, this.$canvas.height);
            ctx.closePath();
            ctx.stroke();
            ctx.save();
            ctx.fillStyle = TERRAIN_FILL_COLOR;
            ctx.globalAlpha = TERRAIN_ALPHA;
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1;

            this.events.dispatch(this.events.groundlength, groundLength);
        }
    }

    protected _drawWarningAndCollision(coords: number[][]) {
        let ctx = this._ctx;
        if (ctx && coords.length > 1) {
            let maxY = this.model.maxY;
            ctx.lineWidth = LINE_WIDTH;
            ctx.beginPath();

            let warningLength = 0,
                collisionLength = 0;

            for (let i = 0, len = coords.length - 1; i < len; i++) {

                let pi0 = coords[i],
                    pi1 = coords[i + 1];

                if (pi0[2] !== SAFE && pi1[2] !== SAFE) {

                    let a = pi1[0] - pi0[0],
                        b = pi1[1] - pi0[1],
                        aa = a * a,
                        bb = b * b;

                    if (pi0[2] === COLLISION) {
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.strokeStyle = LINE_COLORS[COLLISION];
                        collisionLength += Math.sqrt(aa + bb);
                    } else if (pi0[2] === WARNING) {
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.strokeStyle = LINE_COLORS[WARNING];
                        warningLength += Math.sqrt(aa + bb);
                    }

                    ctx.moveTo((-this._leftDistance + pi0[0]) * this._pixelsInMeter_x, (maxY - pi0[1]) * this._pixelsInMeter_y);
                    ctx.lineTo((-this._leftDistance + pi1[0]) * this._pixelsInMeter_x, (maxY - pi1[1]) * this._pixelsInMeter_y);
                }
            }
            ctx.stroke();

            this.events.dispatch(this.events.warninglength, warningLength);

            this.events.dispatch(this.events.collisionlength, collisionLength);
        }
    }
}

export {ElevationProfileView};