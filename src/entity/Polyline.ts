import {Entity} from "./Entity";
import {Extent} from "../Extent";
import {LonLat} from "../LonLat";
import {Vec3} from "../math/Vec3";
import type {NumberArray3} from "../math/Vec3";
import type {NumberArray2} from "../math/Vec2";
import type {NumberArray4} from "../math/Vec4";
import {Planet} from "../scene/Planet";
import {PolylineHandler} from "./PolylineHandler";
import {RenderNode} from "../scene/RenderNode";
import type {WebGLBufferExt} from "../webgl/Handler";
import {
    cloneArray,
    createVector3,
    htmlColorToFloat32Array,
    htmlColorToRgba,
    makeArray,
    makeArrayTyped
} from "../utils/shared";
import type {TypedArray} from "../utils/shared";
import {Ellipsoid} from "../ellipsoid/Ellipsoid";

const VERTICES_BUFFER = 0;
const INDEX_BUFFER = 1;
const COLORS_BUFFER = 2;

const DEFAULT_COLOR = "#0000FF";

const R = 0;
const G = 1;
const B = 2;
const A = 3;

export type Geodetic = LonLat | NumberArray2 | NumberArray3
export type Cartesian = Vec3 | NumberArray3;

export type SegmentPath3vExt = Cartesian[];
export type SegmentPathLonLatExt = Geodetic[];

export type SegmentPathColor = NumberArray4[];

export type SegmentPath3v = Vec3[];
export type SegmentPathLonLat = LonLat[];


export interface IPolylineParams {
    altitude?: number;
    thickness?: number;
    opacity?: number;
    color?: string;
    visibility?: boolean;
    isClosed?: boolean;
    pathColors?: SegmentPathColor[];
    path3v?: SegmentPath3vExt[];
    pathLonLat?: SegmentPathLonLatExt[];
    visibleSpherePosition?: Cartesian,
    visibleSphereRadius?: number
}

/**
 * Polyline object.
 * @class
 * @param {Object} [options] - Polyline options:
 * @param {number} [options.thickness] - Thickness in screen pixels 1.5 is default.
 * @param {Number} [options.altitude] - Relative to ground layers altitude value.
 * @param {Vec4} [options.color] - RGBA color.
 * @param {Boolean} [options.opacity] - Line opacity.
 * @param {Boolean} [options.visibility] - Polyline visibility. True default.
 * @param {Boolean} [options.isClosed] - Closed geometry type identification.
 * @param {SegmentPathLonLatExt[]} [options.pathLonLat] - Polyline geodetic coordinates array. [[[0,0,0], [1,1,1],...]]
 * @param {SegmentPath3vExt[]} [options.path3v] - LinesString cartesian coordinates array. [[[0,0,0], [1,1,1],...]]
 * @param {SegmentPathColor[]} [options.pathColors] - Coordinates color. [[[1,0,0,1], [0,1,0,1],...]] for right and green colors.
 */
class Polyline {
    static __counter__: number = 0;

    /**
     * Object uniq identifier.
     * @protected
     * @type {number}
     */
    protected __id: number;

    public altitude: number;

    /**
     * Polyline thickness in screen pixels.
     * @public
     * @type {number}
     */
    public thickness: number;

    protected _opacity: number;

    /**
     * Polyline RGBA color.
     * @protected
     * @type {Float32Array}
     */
    protected _defaultColor: Float32Array | NumberArray4;

    /**
     * Polyline visibility.
     * @public
     * @type {boolean}
     */
    public visibility: boolean;

    /**
     * Polyline geometry ring type identification.
     * @protected
     * @type {Boolean}
     */
    protected _closedLine: boolean;

    /**
     * Polyline cartesian coordinates.
     * @public
     * @type {Array.<Vec3>}
     */
    public _path3v: SegmentPath3vExt[];

    protected _pathLengths: number[];

    /**
     * Polyline geodetic degrees coordinates.
     * @private
     * @type {Array.<LonLat>}
     */
    protected _pathLonLat: SegmentPathLonLatExt[];

    /**
     * Polyline geodetic mercator coordinates.
     * @public
     * @type {Array.<LonLat>}
     */
    public _pathLonLatMerc: LonLat[][];

    protected _pathColors: SegmentPathColor[];

    /**
     * Polyline geodetic extent.
     * @protected
     * @type {Extent}
     */
    public _extent: Extent;
    protected _verticesHigh: TypedArray | number[];
    protected _verticesLow: TypedArray | number[];
    protected _orders: TypedArray | number[];
    protected _indexes: TypedArray | number[];
    protected _colors: TypedArray | number[];

    protected _verticesHighBuffer: WebGLBufferExt | null;
    protected _verticesLowBuffer: WebGLBufferExt | null;
    protected _ordersBuffer: WebGLBufferExt | null;
    protected _indexesBuffer: WebGLBufferExt | null;
    protected _colorsBuffer: WebGLBufferExt | null;

    protected _pickingColor: NumberArray3;

    protected _renderNode: RenderNode | null;

    /**
     * Entity instance that holds this Polyline.
     * @public
     * @type {Entity}
     */
    public _entity: Entity | null;

    /**
     * Handler that stores and renders this Polyline object.
     * @public
     * @type {PolylineHandler | null}
     */
    public _handler: PolylineHandler | null;
    public _handlerIndex: number;
    protected _buffersUpdateCallbacks: Function[];
    protected _changedBuffers: boolean[];

    protected _visibleSphere: Float32Array;

    public __doubleToTwoFloats: (pos: Vec3, highPos: Vec3, lowPos: Vec3) => void;

    constructor(options: IPolylineParams = {}) {

        this.__id = Polyline.__counter__++;

        this.__doubleToTwoFloats = Vec3.doubleToTwoFloats;

        this.altitude = options.altitude || 0.0;

        this.thickness = options.thickness || 1.5;

        this._opacity = options.opacity != undefined ? options.opacity : 1.0;

        this._defaultColor = htmlColorToFloat32Array(
            options.color || DEFAULT_COLOR,
            options.opacity
        );

        this.visibility = options.visibility != undefined ? options.visibility : true;

        this._closedLine = options.isClosed || false;

        this._path3v = [];

        this._pathLengths = [];

        this._pathLonLat = [];

        this._pathLonLatMerc = [];

        this._pathColors = options.pathColors ? cloneArray(options.pathColors) : [];

        this._extent = new Extent();

        this._verticesHigh = [];
        this._verticesLow = [];
        this._orders = [];
        this._indexes = [];
        this._colors = [];

        this._verticesHighBuffer = null;
        this._verticesLowBuffer = null;
        this._ordersBuffer = null;
        this._indexesBuffer = null;
        this._colorsBuffer = null;

        this._pickingColor = [0, 0, 0];

        this._renderNode = null;

        this._entity = null;


        this._handler = null;
        this._handlerIndex = -1;

        this._buffersUpdateCallbacks = [];
        this._buffersUpdateCallbacks[VERTICES_BUFFER] = this._createVerticesBuffer;
        this._buffersUpdateCallbacks[INDEX_BUFFER] = this._createIndexBuffer;
        this._buffersUpdateCallbacks[COLORS_BUFFER] = this._createColorsBuffer;

        this._changedBuffers = new Array(this._buffersUpdateCallbacks.length);

        let c = createVector3(options.visibleSpherePosition).toArray();
        let r = options.visibleSphereRadius || 0;
        this._visibleSphere = new Float32Array([...c, r]);

        // create path
        if (options.pathLonLat) {
            this.setPathLonLat(options.pathLonLat);
        } else if (options.path3v) {
            this.setPath3v(options.path3v);
        }

        this._refresh();
    }

    /**
     * Appends to the line array new cartesian coordinates line data.
     */
    protected __appendLineData3v(
        path3v: SegmentPath3vExt[],
        pathColors: SegmentPathColor[],
        defaultColor: NumberArray4,
        isClosed: boolean,
        outVerticesHigh: number[],
        outVerticesLow: number[],
        outOrders: number[],
        outIndexes: number[],
        ellipsoid: Ellipsoid,
        outTransformedPathLonLat: SegmentPathLonLatExt[],
        outPath3v: SegmentPath3vExt[],
        outTransformedPathMerc: LonLat[][],
        outExtent: Extent,
        outColors: number[]
    ) {
        var index = 0;

        var v_high = new Vec3(),
            v_low = new Vec3();

        if (outExtent) {
            outExtent.southWest.set(180.0, 90.0);
            outExtent.northEast.set(-180.0, -90.0);
        }

        if (outIndexes.length > 0) {
            index = outIndexes[outIndexes.length - 5] + 9;
            outIndexes.push(index, index);
        } else {
            outIndexes.push(0, 0);
        }

        for (let j = 0, len = path3v.length; j < len; j++) {
            var path = path3v[j],
                pathColors_j = pathColors[j];

            outTransformedPathLonLat[j] = [];
            outTransformedPathMerc[j] = [];
            outPath3v[j] = [];

            if (path.length === 0) {
                continue;
            }

            var startIndex = index;

            var last;

            if (isClosed) {
                last = path[path.length - 1];
                if (last instanceof Array) {
                    last = new Vec3(last[0], last[1], last[2]);
                }
            } else {
                var p0 = path[0],
                    p1 = path[1] || p0;
                if (p0 instanceof Array) {
                    p0 = new Vec3(p0[0], p0[1], p0[2]);
                }
                if (p1 instanceof Array) {
                    p1 = new Vec3(p1[0], p1[1], p1[2]);
                }

                p0 = p0 as Vec3;
                p1 = p1 as Vec3;

                last = new Vec3(p0.x + p0.x - p1.x, p0.y + p0.y - p1.y, p0.z + p0.z - p1.z);
            }

            let color = defaultColor;

            if (pathColors_j && pathColors_j[0]) {
                color = pathColors_j[0];
            }

            this.__doubleToTwoFloats(last as Vec3, v_high, v_low);
            outVerticesHigh.push(
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z
            );
            outVerticesLow.push(
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z
            );

            let r = color[R],
                g = color[G],
                b = color[B],
                a = color[A] != undefined ? color[A] : 1.0;

            if (j > 0) {
                outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);
            }

            outOrders.push(1, -1, 2, -2);

            for (let i = 0, len = path.length; i < len; i++) {
                var cur = path[i];

                if (cur instanceof Array) {
                    cur = new Vec3(cur[0], cur[1], cur[2]);
                }

                outPath3v[j].push(cur as Vec3);

                if (ellipsoid) {
                    var lonLat = ellipsoid.cartesianToLonLat(cur as Vec3);
                    outTransformedPathLonLat[j].push(lonLat);
                    outTransformedPathMerc[j].push(lonLat.forwardMercator());

                    if (lonLat.lon < outExtent.southWest.lon) {
                        outExtent.southWest.lon = lonLat.lon;
                    }
                    if (lonLat.lat < outExtent.southWest.lat) {
                        outExtent.southWest.lat = lonLat.lat;
                    }
                    if (lonLat.lon > outExtent.northEast.lon) {
                        outExtent.northEast.lon = lonLat.lon;
                    }
                    if (lonLat.lat > outExtent.northEast.lat) {
                        outExtent.northEast.lat = lonLat.lat;
                    }
                }

                if (pathColors_j && pathColors_j[i]) {
                    color = pathColors_j[i];
                }

                r = color[R];
                g = color[G];
                b = color[B];
                a = color[A] != undefined ? color[A] : 1.0;

                this.__doubleToTwoFloats(cur as Vec3, v_high, v_low);
                outVerticesHigh.push(
                    v_high.x, v_high.y, v_high.z,
                    v_high.x, v_high.y, v_high.z,
                    v_high.x, v_high.y, v_high.z,
                    v_high.x, v_high.y, v_high.z
                );
                outVerticesLow.push(
                    v_low.x, v_low.y, v_low.z,
                    v_low.x, v_low.y, v_low.z,
                    v_low.x, v_low.y, v_low.z,
                    v_low.x, v_low.y, v_low.z
                );

                outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);

                outOrders.push(1, -1, 2, -2);
                outIndexes.push(index++, index++, index++, index++);
            }

            var first;
            if (isClosed) {
                first = path[0];
                if (first instanceof Array) {
                    first = new Vec3(first[0], first[1], first[2]);
                }
                outIndexes.push(startIndex, startIndex + 1, startIndex + 1, startIndex + 1);
            } else {
                let p0 = path[path.length - 1],
                    p1 = path[path.length - 2] || p0;

                if (p0 instanceof Array) {
                    p0 = new Vec3(p0[0], p0[1], p0[2]);
                } else {
                    p0 = p0 as Vec3;
                }

                if (p1 instanceof Array) {
                    p1 = new Vec3(p1[0], p1[1], p1[2]);
                } else {
                    p1 = p1 as Vec3;
                }

                first = new Vec3(p0.x + p0.x - p1.x, p0.y + p0.y - p1.y, p0.z + p0.z - p1.z);
                outIndexes.push(index - 1, index - 1, index - 1, index - 1);
            }

            if (pathColors_j && pathColors_j[path.length - 1]) {
                color = pathColors_j[path.length - 1];
            }

            r = color[R];
            g = color[G];
            b = color[B];
            a = color[A] != undefined ? color[A] : 1.0;

            this.__doubleToTwoFloats(first as Vec3, v_high, v_low);
            outVerticesHigh.push(
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z
            );
            outVerticesLow.push(
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z
            );

            outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);

            outOrders.push(1, -1, 2, -2);

            if (j < path3v.length - 1 && path3v[j + 1].length !== 0) {
                index += 8;
                outIndexes.push(index, index);
            }
        }
    }

    /**
     * Appends to the line new cartesian coordinates point data.
     */
    protected __appendPoint3v(
        path3v: SegmentPath3vExt[],
        point3v: Vec3,
        pathColors: SegmentPathColor[],
        color: NumberArray4,
        isClosed: boolean,
        outVerticesHigh: number[],
        outVerticesLow: number[],
        outColors: number[],
        outOrders: number[],
        outIndexes: number[],
        ellipsoid: Ellipsoid | null,
        outTransformedPathLonLat: SegmentPathLonLatExt[],
        outTransformedPathMerc: LonLat[][],
        outExtent: Extent
    ) {
        var v_high = new Vec3(),
            v_low = new Vec3();

        var ii = outIndexes.length - 4,
            index = outIndexes[ii - 1] + 1;

        if (path3v.length === 0) {
            path3v.push([]);
            if (!pathColors[0]) {
                pathColors[0] = [];
            }
        } else if (!pathColors[path3v.length - 1]) {
            pathColors[path3v.length - 1] = [];
        }

        var path = path3v[path3v.length - 1],
            len = path.length;

        path.push(point3v);

        let r = color[R],
            g = color[G],
            b = color[B],
            a = color[A] != undefined ? color[A] : 1.0,
            pathColors_last = pathColors[path3v.length - 1];

        if (pathColors_last[len]) {
            pathColors_last[len][R] = r;
            pathColors_last[len][G] = g;
            pathColors_last[len][B] = b;
            pathColors_last[len][A] = a;
        } else {
            pathColors_last.push(color);
        }

        if (len === 1) {
            var last;
            if (isClosed) {
                last = path[len - 1];
                if (last instanceof Array) {
                    last = new Vec3(last[0], last[1], last[2]);
                }
            } else {
                let p0 = path[0],
                    p1 = path[1] || p0;

                if (p0 instanceof Array) {
                    p0 = new Vec3(p0[0], p0[1], p0[2]);
                } else {
                    p0 = p0 as Vec3;
                }

                if (p1 instanceof Array) {
                    p1 = new Vec3(p1[0], p1[1], p1[2]);
                } else {
                    p1 = p1 as Vec3;
                }

                last = new Vec3(p0.x + p0.x - p1.x, p0.y + p0.y - p1.y, p0.z + p0.z - p1.z);
            }

            this.__doubleToTwoFloats(last as Vec3, v_high, v_low);

            let vi = outVerticesHigh.length - 3 * 12;

            outVerticesHigh[vi] = v_high.x;
            outVerticesHigh[vi + 1] = v_high.y;
            outVerticesHigh[vi + 2] = v_high.z;
            outVerticesHigh[vi + 3] = v_high.x;
            outVerticesHigh[vi + 4] = v_high.y;
            outVerticesHigh[vi + 5] = v_high.z;
            outVerticesHigh[vi + 6] = v_high.x;
            outVerticesHigh[vi + 7] = v_high.y;
            outVerticesHigh[vi + 8] = v_high.z;
            outVerticesHigh[vi + 9] = v_high.x;
            outVerticesHigh[vi + 10] = v_high.y;
            outVerticesHigh[vi + 11] = v_high.z;

            outVerticesLow[vi] = v_low.x;
            outVerticesLow[vi + 1] = v_low.y;
            outVerticesLow[vi + 2] = v_low.z;
            outVerticesLow[vi + 3] = v_low.x;
            outVerticesLow[vi + 4] = v_low.y;
            outVerticesLow[vi + 5] = v_low.z;
            outVerticesLow[vi + 6] = v_low.x;
            outVerticesLow[vi + 7] = v_low.y;
            outVerticesLow[vi + 8] = v_low.z;
            outVerticesLow[vi + 9] = v_low.x;
            outVerticesLow[vi + 10] = v_low.y;
            outVerticesLow[vi + 11] = v_low.z;
        }

        var startIndex = index;

        if (ellipsoid) {
            if (outTransformedPathLonLat.length === 0) {
                outTransformedPathLonLat.push([]);
            }

            if (outTransformedPathMerc.length === 0) {
                outTransformedPathMerc.push([]);
            }

            var transformedPathLonLat = outTransformedPathLonLat[outTransformedPathLonLat.length - 1],
                transformedPathMerc = outTransformedPathMerc[outTransformedPathMerc.length - 1];

            let lonLat = ellipsoid.cartesianToLonLat(point3v);
            transformedPathLonLat.push(lonLat);
            transformedPathMerc.push(lonLat.forwardMercator());

            if (lonLat.lon < outExtent.southWest.lon) {
                outExtent.southWest.lon = lonLat.lon;
            }
            if (lonLat.lat < outExtent.southWest.lat) {
                outExtent.southWest.lat = lonLat.lat;
            }
            if (lonLat.lon > outExtent.northEast.lon) {
                outExtent.northEast.lon = lonLat.lon;
            }
            if (lonLat.lat > outExtent.northEast.lat) {
                outExtent.northEast.lat = lonLat.lat;
            }
        }

        this.__doubleToTwoFloats(point3v, v_high, v_low);

        let vi = outVerticesHigh.length - 12;

        outVerticesHigh[vi] = v_high.x;
        outVerticesHigh[vi + 1] = v_high.y;
        outVerticesHigh[vi + 2] = v_high.z;
        outVerticesHigh[vi + 3] = v_high.x;
        outVerticesHigh[vi + 4] = v_high.y;
        outVerticesHigh[vi + 5] = v_high.z;
        outVerticesHigh[vi + 6] = v_high.x;
        outVerticesHigh[vi + 7] = v_high.y;
        outVerticesHigh[vi + 8] = v_high.z;
        outVerticesHigh[vi + 9] = v_high.x;
        outVerticesHigh[vi + 10] = v_high.y;
        outVerticesHigh[vi + 11] = v_high.z;

        outVerticesLow[vi] = v_low.x;
        outVerticesLow[vi + 1] = v_low.y;
        outVerticesLow[vi + 2] = v_low.z;
        outVerticesLow[vi + 3] = v_low.x;
        outVerticesLow[vi + 4] = v_low.y;
        outVerticesLow[vi + 5] = v_low.z;
        outVerticesLow[vi + 6] = v_low.x;
        outVerticesLow[vi + 7] = v_low.y;
        outVerticesLow[vi + 8] = v_low.z;
        outVerticesLow[vi + 9] = v_low.x;
        outVerticesLow[vi + 10] = v_low.y;
        outVerticesLow[vi + 11] = v_low.z;

        let ci = outColors.length - 16;

        outColors[ci] = r;
        outColors[ci + 1] = g;
        outColors[ci + 2] = b;
        outColors[ci + 3] = a;
        outColors[ci + 4] = r;
        outColors[ci + 5] = g;
        outColors[ci + 6] = b;
        outColors[ci + 7] = a;
        outColors[ci + 8] = r;
        outColors[ci + 9] = g;
        outColors[ci + 10] = b;
        outColors[ci + 11] = a;
        outColors[ci + 12] = r;
        outColors[ci + 13] = g;
        outColors[ci + 14] = b;
        outColors[ci + 15] = a;

        outIndexes[ii] = index++;
        outIndexes[ii + 1] = index++;
        outIndexes[ii + 2] = index++;
        outIndexes[ii + 3] = index++;

        //
        // Close path
        //
        var first;
        if (isClosed) {
            first = path[0] as Vec3;
            outIndexes.push(startIndex, startIndex + 1, startIndex + 1, startIndex + 1);
        } else {
            let p0 = path[path.length - 1] as Vec3,
                p1 = path[path.length - 2] as Vec3 || p0;

            first = new Vec3(p0.x + p0.x - p1.x, p0.y + p0.y - p1.y, p0.z + p0.z - p1.z);
            outIndexes.push(index - 1, index - 1, index - 1, index - 1);
        }

        this.__doubleToTwoFloats(first, v_high, v_low);
        outVerticesHigh.push(
            v_high.x, v_high.y, v_high.z,
            v_high.x, v_high.y, v_high.z,
            v_high.x, v_high.y, v_high.z,
            v_high.x, v_high.y, v_high.z
        );
        outVerticesLow.push(
            v_low.x, v_low.y, v_low.z,
            v_low.x, v_low.y, v_low.z,
            v_low.x, v_low.y, v_low.z,
            v_low.x, v_low.y, v_low.z
        );

        outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);

        outOrders.push(1, -1, 2, -2);
    }

    static setPathColors(
        pathLonLat: SegmentPathLonLatExt[],
        pathColors: SegmentPathColor[],
        defaultColor: NumberArray4,
        outColors: number[]
    ) {
        for (let j = 0, len = pathLonLat.length; j < len; j++) {
            var path = pathLonLat[j],
                pathColors_j = pathColors[j];

            if (path.length === 0) {
                continue;
            }

            let color = defaultColor;
            if (pathColors_j && pathColors_j[0]) {
                color = pathColors_j[0];
            }

            let r = color[R],
                g = color[G],
                b = color[B],
                a = color[A] != undefined ? color[A] : 1.0;

            if (j > 0) {
                outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);
            }

            for (let i = 0, len = path.length; i < len; i++) {
                var cur = path[i];

                if (cur instanceof Array) {
                    cur = new LonLat(cur[0], cur[1], cur[2]);
                }

                if (pathColors_j && pathColors_j[i]) {
                    color = pathColors_j[i];
                }

                r = color[R];
                g = color[G];
                b = color[B];
                a = color[A] != undefined ? color[A] : 1.0;

                outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);

            }

            if (pathColors_j && pathColors_j[path.length - 1]) {
                color = pathColors_j[path.length - 1];
            }

            r = color[R];
            g = color[G];
            b = color[B];
            a = color[A] != undefined ? color[A] : 1.0;

            outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);
        }
    }

    /**
     * Appends to the line array new geodetic coordinates line data.
     * @static
     */
    protected __appendLineDataLonLat(
        pathLonLat: SegmentPathLonLatExt[],
        pathColors: SegmentPathColor[],
        defaultColor: NumberArray4,
        isClosed: boolean,
        outVerticesHigh: number[],
        outVerticesLow: number[],
        outOrders: number[],
        outIndexes: number[],
        ellipsoid: Ellipsoid,
        outTransformedPathCartesian: SegmentPath3vExt[],
        outPathLonLat: SegmentPathLonLatExt[],
        outTransformedPathMerc: LonLat[][],
        outExtent: Extent,
        outColors: number[]
    ) {
        var index = 0;

        var v_high = new Vec3(),
            v_low = new Vec3();

        if (outExtent) {
            outExtent.southWest.set(180.0, 90.0);
            outExtent.northEast.set(-180.0, -90.0);
        }

        if (outIndexes.length > 0) {
            index = outIndexes[outIndexes.length - 5] + 9;
            outIndexes.push(index);
        } else {
            outIndexes.push(0);
        }

        for (let j = 0, len = pathLonLat.length; j < len; j++) {
            var path = pathLonLat[j],
                pathColors_j = pathColors[j];

            outTransformedPathCartesian[j] = [];
            outTransformedPathMerc[j] = [];
            outPathLonLat[j] = [];

            if (path.length === 0) {
                continue;
            }

            var startIndex = index;

            var last;

            if (isClosed) {
                let pp = path[path.length - 1];
                if (pp instanceof Array) {
                    last = ellipsoid.lonLatToCartesian(new LonLat(pp[0], pp[1], pp[2]));
                } else {
                    last = ellipsoid.lonLatToCartesian(pp as LonLat);
                }
            } else {
                let p0, p1;
                let pp = path[0];
                if (pp instanceof Array) {
                    p0 = ellipsoid.lonLatToCartesian(new LonLat(pp[0], pp[1], pp[2]));
                } else {
                    p0 = ellipsoid.lonLatToCartesian(pp as LonLat);
                }

                pp = path[1];

                if (!pp) {
                    pp = path[0];
                }

                if (pp instanceof Array) {
                    p1 = ellipsoid.lonLatToCartesian(new LonLat(pp[0], pp[1], pp[2]));
                } else {
                    p1 = ellipsoid.lonLatToCartesian(pp as LonLat);
                }

                last = new Vec3(p0.x + p0.x - p1.x, p0.y + p0.y - p1.y, p0.z + p0.z - p1.z);
            }

            let color = defaultColor;

            if (pathColors_j && pathColors_j[0]) {
                color = pathColors_j[0];
            }

            this.__doubleToTwoFloats(last, v_high, v_low);
            outVerticesHigh.push(
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z
            );
            outVerticesLow.push(
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z
            );

            let r = color[R],
                g = color[G],
                b = color[B],
                a = color[A] != undefined ? color[A] : 1.0;

            if (j > 0) {
                outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);
            }

            outOrders.push(1, -1, 2, -2);

            for (let i = 0, len = path.length; i < len; i++) {
                var cur = path[i];

                if (cur instanceof Array) {
                    cur = new LonLat(cur[0], cur[1], cur[2]);
                }

                if (pathColors_j && pathColors_j[i]) {
                    color = pathColors_j[i];
                }

                r = color[R];
                g = color[G];
                b = color[B];
                a = color[A] != undefined ? color[A] : 1.0;

                var cartesian = ellipsoid.lonLatToCartesian(cur as LonLat);
                outTransformedPathCartesian[j].push(cartesian);
                outPathLonLat[j].push(cur as LonLat);
                outTransformedPathMerc[j].push((cur as LonLat).forwardMercator());

                this.__doubleToTwoFloats(cartesian, v_high, v_low);
                outVerticesHigh.push(
                    v_high.x, v_high.y, v_high.z,
                    v_high.x, v_high.y, v_high.z,
                    v_high.x, v_high.y, v_high.z,
                    v_high.x, v_high.y, v_high.z
                );
                outVerticesLow.push(
                    v_low.x, v_low.y, v_low.z,
                    v_low.x, v_low.y, v_low.z,
                    v_low.x, v_low.y, v_low.z,
                    v_low.x, v_low.y, v_low.z
                );

                outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);

                outOrders.push(1, -1, 2, -2);
                outIndexes.push(index++, index++, index++, index++);

                if ((cur as LonLat).lon < outExtent.southWest.lon) {
                    outExtent.southWest.lon = (cur as LonLat).lon;
                }
                if ((cur as LonLat).lat < outExtent.southWest.lat) {
                    outExtent.southWest.lat = (cur as LonLat).lat;
                }
                if ((cur as LonLat).lon > outExtent.northEast.lon) {
                    outExtent.northEast.lon = (cur as LonLat).lon;
                }
                if ((cur as LonLat).lat > outExtent.northEast.lat) {
                    outExtent.northEast.lat = (cur as LonLat).lat;
                }
            }

            var first;
            if (isClosed) {
                let pp = path[0];
                if (pp instanceof Array) {
                    first = ellipsoid.lonLatToCartesian(new LonLat(pp[0], pp[1], pp[2]));
                } else {
                    first = ellipsoid.lonLatToCartesian(pp as LonLat);
                }
                outIndexes.push(startIndex, startIndex + 1, startIndex + 1, startIndex + 1);
            } else {
                let p0, p1;
                let pp = path[path.length - 1];
                if (pp instanceof Array) {
                    p0 = ellipsoid.lonLatToCartesian(new LonLat(pp[0], pp[1], pp[2]));
                } else {
                    p0 = ellipsoid.lonLatToCartesian(pp as LonLat);
                }

                pp = path[path.length - 2];

                if (!pp) {
                    pp = path[0];
                }

                if (pp instanceof Array) {
                    p1 = ellipsoid.lonLatToCartesian(new LonLat(pp[0], pp[1], pp[2]));
                } else {
                    p1 = ellipsoid.lonLatToCartesian(pp as LonLat);
                }
                first = new Vec3(p0.x + p0.x - p1.x, p0.y + p0.y - p1.y, p0.z + p0.z - p1.z);
                outIndexes.push(index - 1, index - 1, index - 1, index - 1);
            }

            if (pathColors_j && pathColors_j[path.length - 1]) {
                color = pathColors_j[path.length - 1];
            }

            r = color[R];
            g = color[G];
            b = color[B];
            a = color[A] != undefined ? color[A] : 1.0;

            this.__doubleToTwoFloats(first, v_high, v_low);
            outVerticesHigh.push(
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z,
                v_high.x, v_high.y, v_high.z
            );
            outVerticesLow.push(
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z,
                v_low.x, v_low.y, v_low.z
            );

            outColors.push(r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a);

            outOrders.push(1, -1, 2, -2);

            if (j < pathLonLat.length - 1 && pathLonLat[j + 1].length !== 0) {
                index += 8;
                outIndexes.push(index, index);
            }
        }
    }

    /**
     * Sets polyline path with cartesian coordinates.
     * @protected
     * @param {SegmentPath3vExt[]} path3v - Cartesian coordinates.
     */
    protected _setEqualPath3v(path3v: SegmentPath3vExt[]) {

        var extent = this._extent;
        extent.southWest.set(180, 90);
        extent.northEast.set(-180, -90);

        var v_high = new Vec3(),
            v_low = new Vec3();

        var vh = this._verticesHigh,
            vl = this._verticesLow,
            l = this._pathLonLat,
            m = this._pathLonLatMerc,
            k = 0;

        var ellipsoid = (this._renderNode as Planet).ellipsoid;

        for (let j = 0; j < path3v.length; j++) {
            var path = path3v[j] as Vec3[];

            var last;
            if (this._closedLine) {
                last = path[path.length - 1];
            } else {
                last = new Vec3(
                    path[0].x + path[0].x - path[1].x,
                    path[0].y + path[0].y - path[1].y,
                    path[0].z + path[0].z - path[1].z
                );
            }

            this.__doubleToTwoFloats(last, v_high, v_low);

            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;

            for (let i = 0; i < path.length; i++) {
                var cur = path[i] as Vec3,
                    pji = this._path3v[j][i] as Vec3;

                pji.x = cur.x;
                pji.y = cur.y;
                pji.z = cur.z;

                if (ellipsoid) {
                    var lonLat = ellipsoid.cartesianToLonLat(cur);

                    this._pathLonLat[j][i] = lonLat;

                    l[j][i] = lonLat;
                    m[j][i] = lonLat.forwardMercator();

                    if (lonLat.lon < extent.southWest.lon) {
                        extent.southWest.lon = lonLat.lon;
                    }
                    if (lonLat.lat < extent.southWest.lat) {
                        extent.southWest.lat = lonLat.lat;
                    }
                    if (lonLat.lon > extent.northEast.lon) {
                        extent.northEast.lon = lonLat.lon;
                    }
                    if (lonLat.lat > extent.northEast.lat) {
                        extent.northEast.lat = lonLat.lat;
                    }
                }

                this.__doubleToTwoFloats(cur, v_high, v_low);

                vh[k] = v_high.x;
                vl[k++] = v_low.x;
                vh[k] = v_high.y;
                vl[k++] = v_low.y;
                vh[k] = v_high.z;
                vl[k++] = v_low.z;
                vh[k] = v_high.x;
                vl[k++] = v_low.x;
                vh[k] = v_high.y;
                vl[k++] = v_low.y;
                vh[k] = v_high.z;
                vl[k++] = v_low.z;
                vh[k] = v_high.x;
                vl[k++] = v_low.x;
                vh[k] = v_high.y;
                vl[k++] = v_low.y;
                vh[k] = v_high.z;
                vl[k++] = v_low.z;
                vh[k] = v_high.x;
                vl[k++] = v_low.x;
                vh[k] = v_high.y;
                vl[k++] = v_low.y;
                vh[k] = v_high.z;
                vl[k++] = v_low.z;
            }

            var first;
            if (this._closedLine) {
                first = path[0];
            } else {
                var l1 = path.length - 1;
                first = new Vec3(
                    path[l1].x + path[l1].x - path[l1 - 1].x,
                    path[l1].y + path[l1].y - path[l1 - 1].y,
                    path[l1].z + path[l1].z - path[l1 - 1].z
                );
            }

            this.__doubleToTwoFloats(first as Vec3, v_high, v_low);

            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
        }
    }

    /**
     * Sets polyline with geodetic coordinates.
     * @protected
     * @param {SegmentPathLonLat[]} pathLonLat - Geodetic polyline path coordinates.
     */
    protected _setEqualPathLonLat(pathLonLat: SegmentPathLonLat[]) {
        var extent = this._extent;
        extent.southWest.set(180.0, 90.0);
        extent.northEast.set(-180.0, -90.0);

        var v_high = new Vec3(),
            v_low = new Vec3();

        var vh = this._verticesHigh,
            vl = this._verticesLow,
            l = this._pathLonLat,
            m = this._pathLonLatMerc,
            c = this._path3v,
            k = 0;

        var ellipsoid = (this._renderNode as Planet).ellipsoid;

        for (let j = 0; j < pathLonLat.length; j++) {
            var path = pathLonLat[j] as LonLat[];

            var last;
            if (this._closedLine) {
                last = ellipsoid.lonLatToCartesian(path[path.length - 1]);
            } else {
                let p0 = ellipsoid.lonLatToCartesian(path[0]),
                    p1 = ellipsoid.lonLatToCartesian(path[1]);
                last = new Vec3(p0.x + p0.x - p1.x, p0.y + p0.y - p1.y, p0.z + p0.z - p1.z);
            }

            this.__doubleToTwoFloats(last, v_high, v_low);

            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;

            for (let i = 0; i < path.length; i++) {
                var cur = path[i] as LonLat;
                var cartesian = ellipsoid.lonLatToCartesian(cur);
                c[j][i] = cartesian;
                m[j][i] = cur.forwardMercator();
                l[j][i] = cur;

                this.__doubleToTwoFloats(cartesian, v_high, v_low);

                vh[k] = v_high.x;
                vl[k++] = v_low.x;
                vh[k] = v_high.y;
                vl[k++] = v_low.y;
                vh[k] = v_high.z;
                vl[k++] = v_low.z;
                vh[k] = v_high.x;
                vl[k++] = v_low.x;
                vh[k] = v_high.y;
                vl[k++] = v_low.y;
                vh[k] = v_high.z;
                vl[k++] = v_low.z;
                vh[k] = v_high.x;
                vl[k++] = v_low.x;
                vh[k] = v_high.y;
                vl[k++] = v_low.y;
                vh[k] = v_high.z;
                vl[k++] = v_low.z;
                vh[k] = v_high.x;
                vl[k++] = v_low.x;
                vh[k] = v_high.y;
                vl[k++] = v_low.y;
                vh[k] = v_high.z;
                vl[k++] = v_low.z;

                if (cur.lon < extent.southWest.lon) {
                    extent.southWest.lon = cur.lon;
                }
                if (cur.lat < extent.southWest.lat) {
                    extent.southWest.lat = cur.lat;
                }
                if (cur.lon > extent.northEast.lon) {
                    extent.northEast.lon = cur.lon;
                }
                if (cur.lat > extent.northEast.lat) {
                    extent.northEast.lat = cur.lat;
                }
            }

            var first;
            if (this._closedLine) {
                first = ellipsoid.lonLatToCartesian(path[0]);
            } else {
                let p0 = ellipsoid.lonLatToCartesian(path[path.length - 1]),
                    p1 = ellipsoid.lonLatToCartesian(path[path.length - 2]);
                first = new Vec3(p0.x + p0.x - p1.x, p0.y + p0.y - p1.y, p0.z + p0.z - p1.z);
            }

            this.__doubleToTwoFloats(first, v_high, v_low);

            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
            vh[k] = v_high.x;
            vl[k++] = v_low.x;
            vh[k] = v_high.y;
            vl[k++] = v_low.y;
            vh[k] = v_high.z;
            vl[k++] = v_low.z;
        }
    }

    public setPointLonLat(lonlat: LonLat, index: number, segmentIndex: number) {
        if (this._renderNode && (this._renderNode as Planet).ellipsoid) {
            let l = this._pathLonLat,
                m = this._pathLonLatMerc;

            l[segmentIndex][index] = lonlat;
            m[segmentIndex][index] = lonlat.forwardMercator();

            //
            // Apply new extent(TODO: think about optimization)
            //
            var extent = this._extent;
            extent.southWest.set(180.0, 90.0);
            extent.northEast.set(-180.0, -90.0);
            for (let i = 0; i < l.length; i++) {
                var pi = l[i] as LonLat[];
                for (let j = 0; j < pi.length; j++) {
                    var lon = pi[j].lon,
                        lat = pi[j].lat;
                    if (lon > extent.northEast.lon) {
                        extent.northEast.lon = lon;
                    }
                    if (lat > extent.northEast.lat) {
                        extent.northEast.lat = lat;
                    }
                    if (lon < extent.southWest.lon) {
                        extent.southWest.lon = lon;
                    }
                    if (lat < extent.southWest.lat) {
                        extent.southWest.lat = lat;
                    }
                }
            }

            this.setPoint3v(
                (this._renderNode as Planet).ellipsoid.lonLatToCartesian(lonlat),
                index,
                segmentIndex,
                true
            );
        } else {
            let path = this._pathLonLat[segmentIndex] as LonLat[];
            path[index].lon = lonlat.lon;
            path[index].lat = lonlat.lat;
            path[index].height = lonlat.height;
        }
    }

    /**
     * Changes cartesian point coordinates of the path
     * @param {Vec3} coordinates - New coordinates
     * @param {number} [index=0] - Path segment index
     * @param {number} [segmentIndex=0] - Index of the point in the path segment
     * @param {boolean} [skipLonLat=false] - Do not update geodetic coordinates
     */
    public setPoint3v(coordinates: Vec3, index: number = 0, segmentIndex: number = 0, skipLonLat: boolean = false) {

        if (this._renderNode) {
            var v_high = new Vec3(),
                v_low = new Vec3();

            var vh = this._verticesHigh,
                vl = this._verticesLow,
                l = this._pathLonLat,
                m = this._pathLonLatMerc,
                k = 0,
                kk = 0;

            //for (let i = 0; i < segmentIndex; i++) {
            //    kk += this._path3v[i].length * 12 + 24;
            //}
            kk = this._pathLengths[segmentIndex] * 12 + 24 * segmentIndex;

            let path = this._path3v[segmentIndex] as Vec3[];

            path[index].x = coordinates.x;
            path[index].y = coordinates.y;
            path[index].z = coordinates.z;

            let _closedLine = this._closedLine || path.length === 1;

            if (index === 0 || index === 1) {
                var last;
                if (_closedLine) {
                    last = path[path.length - 1];
                } else {
                    last = new Vec3(
                        path[0].x + path[0].x - path[1].x,
                        path[0].y + path[0].y - path[1].y,
                        path[0].z + path[0].z - path[1].z
                    );
                }

                k = kk;

                this.__doubleToTwoFloats(last, v_high, v_low);

                vh[k] = v_high.x;
                vh[k + 1] = v_high.y;
                vh[k + 2] = v_high.z;
                vh[k + 3] = v_high.x;
                vh[k + 4] = v_high.y;
                vh[k + 5] = v_high.z;
                vh[k + 6] = v_high.x;
                vh[k + 7] = v_high.y;
                vh[k + 8] = v_high.z;
                vh[k + 9] = v_high.x;
                vh[k + 10] = v_high.y;
                vh[k + 11] = v_high.z;

                vl[k] = v_low.x;
                vl[k + 1] = v_low.y;
                vl[k + 2] = v_low.z;
                vl[k + 3] = v_low.x;
                vl[k + 4] = v_low.y;
                vl[k + 5] = v_low.z;
                vl[k + 6] = v_low.x;
                vl[k + 7] = v_low.y;
                vl[k + 8] = v_low.z;
                vl[k + 9] = v_low.x;
                vl[k + 10] = v_low.y;
                vl[k + 11] = v_low.z;
            }

            if (!skipLonLat && (this._renderNode as Planet).ellipsoid) {
                var lonLat = (this._renderNode as Planet).ellipsoid.cartesianToLonLat(coordinates);
                l[segmentIndex][index] = lonLat;
                m[segmentIndex][index] = lonLat.forwardMercator();

                //
                // Apply new extent(TODO: think about optimization)
                //
                var extent = this._extent;
                extent.southWest.set(180.0, 90.0);
                extent.northEast.set(-180.0, -90.0);
                for (let i = 0; i < l.length; i++) {
                    var pi = l[i] as LonLat[];
                    for (let j = 0; j < pi.length; j++) {
                        var lon = pi[j].lon,
                            lat = pi[j].lat;
                        if (lon > extent.northEast.lon) {
                            extent.northEast.lon = lon;
                        }
                        if (lat > extent.northEast.lat) {
                            extent.northEast.lat = lat;
                        }
                        if (lon < extent.southWest.lon) {
                            extent.southWest.lon = lon;
                        }
                        if (lat < extent.southWest.lat) {
                            extent.southWest.lat = lat;
                        }
                    }
                }
            }

            k = kk + index * 12 + 12;

            this.__doubleToTwoFloats(coordinates, v_high, v_low);

            vh[k] = v_high.x;
            vh[k + 1] = v_high.y;
            vh[k + 2] = v_high.z;
            vh[k + 3] = v_high.x;
            vh[k + 4] = v_high.y;
            vh[k + 5] = v_high.z;
            vh[k + 6] = v_high.x;
            vh[k + 7] = v_high.y;
            vh[k + 8] = v_high.z;
            vh[k + 9] = v_high.x;
            vh[k + 10] = v_high.y;
            vh[k + 11] = v_high.z;

            vl[k] = v_low.x;
            vl[k + 1] = v_low.y;
            vl[k + 2] = v_low.z;
            vl[k + 3] = v_low.x;
            vl[k + 4] = v_low.y;
            vl[k + 5] = v_low.z;
            vl[k + 6] = v_low.x;
            vl[k + 7] = v_low.y;
            vl[k + 8] = v_low.z;
            vl[k + 9] = v_low.x;
            vl[k + 10] = v_low.y;
            vl[k + 11] = v_low.z;

            if (index === path.length - 1 || index === path.length - 2) {
                var first;
                if (_closedLine) {
                    first = path[0];
                } else {
                    var l1 = path.length - 1;
                    first = new Vec3(
                        path[l1].x + path[l1].x - path[l1 - 1].x,
                        path[l1].y + path[l1].y - path[l1 - 1].y,
                        path[l1].z + path[l1].z - path[l1 - 1].z
                    );
                }

                k = kk + path.length * 12 + 12;

                this.__doubleToTwoFloats(first, v_high, v_low);

                vh[k] = v_high.x;
                vh[k + 1] = v_high.y;
                vh[k + 2] = v_high.z;
                vh[k + 3] = v_high.x;
                vh[k + 4] = v_high.y;
                vh[k + 5] = v_high.z;
                vh[k + 6] = v_high.x;
                vh[k + 7] = v_high.y;
                vh[k + 8] = v_high.z;
                vh[k + 9] = v_high.x;
                vh[k + 10] = v_high.y;
                vh[k + 11] = v_high.z;

                vl[k] = v_low.x;
                vl[k + 1] = v_low.y;
                vl[k + 2] = v_low.z;
                vl[k + 3] = v_low.x;
                vl[k + 4] = v_low.y;
                vl[k + 5] = v_low.z;
                vl[k + 6] = v_low.x;
                vl[k + 7] = v_low.y;
                vl[k + 8] = v_low.z;
                vl[k + 9] = v_low.x;
                vl[k + 10] = v_low.y;
                vl[k + 11] = v_low.z;
            }

            this._changedBuffers[VERTICES_BUFFER] = true;
        } else {
            let path = this._path3v[segmentIndex] as Vec3[];
            path[index].x = coordinates.x;
            path[index].y = coordinates.y;
            path[index].z = coordinates.z;
        }
    }

    protected _resizePathLengths(index: number = 0) {
        this._pathLengths[0] = 0;
        for (let i = index + 1, len = this._path3v.length; i <= len; i++) {
            this._pathLengths[i] = this._pathLengths[i - 1] + this._path3v[i - 1].length;
        }
    }

    /**
     * Remove path segment
     * @param {number} index - Path segment index
     */
    public removeSegment(index: number) {
        this._path3v.splice(index, 1);
        this.setPath3v(([] as SegmentPath3vExt[]).concat(this._path3v));
    }

    /**
     * Remove point from the path
     * @param {number} index - Point index in a path segment
     * @param {number} [multiLineIndex=0] - Segment path index
     */
    public removePoint(index: number, multiLineIndex: number = 0) {
        this._path3v[multiLineIndex].splice(index, 1);
        if (this._path3v[multiLineIndex].length === 0) {
            this._path3v.splice(multiLineIndex, 1);
        }
        this.setPath3v(([] as SegmentPath3vExt[]).concat(this._path3v));
    }

    /**
     * Insert point coordinates in a path segment
     * @param {Vec3} point3v - Point coordinates
     * @param {number} [index=0] - Index in the path
     * @param {NumberArray4} [color] - Point color
     * @param {number} [multilineIndex=0] - Path segment index
     */
    public insertPoint3v(point3v: Vec3, index: number = 0, color?: NumberArray4, multilineIndex: number = 0) {
        let p = ([] as SegmentPath3vExt[]).concat(this._path3v),
            pp = p[multilineIndex];
        if (pp) {
            let c = ([] as SegmentPathColor[]).concat(this._pathColors);

            pp.splice(index, 0, point3v);

            if (color) {
                let cc = c[multilineIndex];
                if (!cc) {
                    cc = new Array(pp.length);
                }
                cc.splice(index, 0, color);
            }

            this.setPath3v(p, c);
        } else {
            this.addPoint3v(point3v, multilineIndex);
        }
    }

    /**
     * Adds a new cartesian point in the end of the path in a last line segment.
     * @public
     * @param {Vec3} point3v - New coordinates.
     * @param {NumberArray4} [color] -
     * @param {boolean} [skipEllipsoid] -
     */
    public appendPoint3v(point3v: Vec3, color?: NumberArray4, skipEllipsoid?: boolean) {
        if (this._path3v.length === 0 || !this._renderNode) {
            this._pathColors.push([color || this._defaultColor as NumberArray4]);
            this.addPoint3v(point3v);
        } else {
            //
            // Making typedArrays suitable for appendPoint function
            //
            this._verticesHigh = makeArray(this._verticesHigh);
            this._verticesLow = makeArray(this._verticesLow);
            this._colors = makeArray(this._colors);
            this._orders = makeArray(this._orders);
            this._indexes = makeArray(this._indexes);

            this.__appendPoint3v(
                this._path3v,
                point3v,
                this._pathColors,
                color || this._defaultColor as NumberArray4,
                this._closedLine,
                this._verticesHigh,
                this._verticesLow,
                this._colors,
                this._orders,
                this._indexes,
                !skipEllipsoid ? (this._renderNode as Planet).ellipsoid : null,
                this._pathLonLat,
                this._pathLonLatMerc,
                this._extent
            );

            this._pathLengths[this._path3v.length] += 1;

            this._changedBuffers[VERTICES_BUFFER] = true;
            this._changedBuffers[COLORS_BUFFER] = true;
            this._changedBuffers[INDEX_BUFFER] = true;
        }
    }

    /**
     * Append new point in the end of the path.
     * @public
     * @param {Vec3} point3v - New point coordinates.
     * @param {number} [multiLineIndex=0] - Path segment index, first by default.
     */
    public addPoint3v(point3v: Vec3, multiLineIndex: number = 0) {
        //
        // TODO: could be optimized
        //
        if (multiLineIndex >= this._path3v.length) {
            this._path3v.push([]);
        }
        this._path3v[multiLineIndex].push(point3v);
        this.setPath3v(([] as SegmentPath3vExt[]).concat(this._path3v));
    }

    /**
     * Append new geodetic point in the end of the path.
     * @public
     * @param {LonLat} lonLat - New coordinate.
     * @param {number} [multiLineIndex=0] - Path segment index, first by default.
     */
    public addPointLonLat(lonLat: LonLat, multiLineIndex: number = 0) {
        //
        // TODO: could be optimized
        //
        if (multiLineIndex >= this._pathLonLat.length) {
            this._pathLonLat.push([]);
        }
        this._pathLonLat[multiLineIndex].push(lonLat);
        this.setPathLonLat(([] as SegmentPathLonLatExt[]).concat(this._pathLonLat));
    }

    /**
     * Clear polyline data.
     * @public
     */
    public clear() {
        this._clearData();
    }

    /**
     * Change path point color
     * @param {NumberArray4} color - New color
     * @param {number} [index=0] - Point index
     * @param {number} [segmentIndex=0] - Path segment index
     */
    public setPointColor(color: NumberArray4, index: number = 0, segmentIndex: number = 0) {
        if (this._renderNode && index < this._path3v[segmentIndex].length) {
            let colors = this._pathColors[segmentIndex];

            if (!colors) {
                if (this._path3v[segmentIndex] && index < this._path3v[segmentIndex].length) {
                    this._pathColors[segmentIndex] = new Array(this._path3v[segmentIndex].length);
                } else {
                    return;
                }
            }

            if (!colors[index]) {
                colors[index] = [color[R], color[G], color[B], color[A] || 1.0];
            } else {
                colors[index][R] = color[R];
                colors[index][G] = color[G];
                colors[index][B] = color[B];
                colors[index][A] = color[A] || 1.0;
            }

            let c = this._colors;

            //optimized with this._pathLengths
            //for (let i = 0; i < segmentIndex; i++) {
            //    kk += this._path3v[i].length * 16 + 32;
            //}

            let k = index * 16 + this._pathLengths[segmentIndex] * 16 + 32 * segmentIndex;

            c[k] = c[k + 4] = c[k + 8] = c[k + 12] = color[R];
            c[k + 1] = c[k + 5] = c[k + 9] = c[k + 13] = color[G];
            c[k + 2] = c[k + 6] = c[k + 10] = c[k + 14] = color[B];
            c[k + 3] = c[k + 7] = c[k + 11] = c[k + 15] = color[A] || 1.0;

            this._changedBuffers[COLORS_BUFFER] = true;
        } else {
            let pathColors = this._pathColors[segmentIndex];
            pathColors[index] = color;
        }
    }

    /**
     * Sets polyline opacity.
     * @public
     * @param {number} opacity - Opacity.
     */
    public setOpacity(opacity: number) {
        this._opacity = opacity;
    }

    /**
     * Gets polyline opacity.
     * @public
     * @param {number} opacity - Opacity.
     */
    public getOpacity(): number {
        return this._opacity;
    }

    /**
     * Sets Polyline thickness in screen pixels.
     * @public
     * @param {number} thickness - Thickness.
     */
    public setAltitude(altitude: number) {
        this.altitude = altitude;
    }

    /**
     * Sets Polyline thickness in screen pixels.
     * @public
     * @param {number} thickness - Thickness.
     */
    public setThickness(thickness: number) {
        this.thickness = thickness;
    }

    /**
     * Returns thickness.
     * @public
     * @return {number} Thickness in screen pixels.
     */
    public getThickness(): number {
        return this.thickness;
    }

    /**
     * Sets visibility.
     * @public
     * @param {boolean} visibility - Polyline visibility.
     */
    public setVisibility(visibility: boolean) {
        this.visibility = visibility;
    }

    /**
     * Gets Polyline visibility.
     * @public
     * @return {boolean} Polyline visibility.
     */
    public getVisibility(): boolean {
        return this.visibility;
    }

    /**
     * Assign with render node.
     * @public
     * @param {RenderNode} renderNode -
     */
    public setRenderNode(renderNode: RenderNode) {
        if (renderNode) {
            this._renderNode = renderNode;
            if (this._pathLonLat.length) {
                this._createDataLonLat(([] as SegmentPathLonLatExt[]).concat(this._pathLonLat));
            } else {
                this._createData3v(([] as SegmentPath3vExt[]).concat(this._path3v));
            }
            this._refresh();
            if (renderNode.renderer && renderNode.renderer.isInitialized()) {
                this._update();
            }
        }
    }

    protected _clearData() {
        //@ts-ignore
        this._verticesHigh = null;
        //@ts-ignore
        this._verticesLow = null;
        //@ts-ignore
        this._orders = null;
        //@ts-ignore
        this._indexes = null;
        //@ts-ignore
        this._colors = null;

        this._verticesHigh = [];
        this._verticesLow = [];
        this._orders = [];
        this._indexes = [];
        this._colors = [];

        this._path3v.length = 0;
        this._pathLonLat.length = 0;
        this._pathLonLatMerc.length = 0;

        this._path3v = [];
        this._pathLonLat = [];
        this._pathLonLatMerc = [];
    }

    protected _createData3v(path3v: SegmentPath3vExt[]) {
        this._clearData();
        this.__appendLineData3v(
            path3v,
            this._pathColors,
            this._defaultColor as NumberArray4,
            this._closedLine,
            this._verticesHigh as number[],
            this._verticesLow as number[],
            this._orders as number[],
            this._indexes as number[],
            (this._renderNode as Planet).ellipsoid,
            this._pathLonLat,
            this._path3v,
            this._pathLonLatMerc,
            this._extent,
            this._colors as number[]
        );
        this._resizePathLengths(0);
    }

    protected _createDataLonLat(pathLonlat: SegmentPathLonLatExt[]) {
        this._clearData();
        this.__appendLineDataLonLat(
            pathLonlat,
            this._pathColors,
            this._defaultColor as NumberArray4,
            this._closedLine,
            this._verticesHigh as number[],
            this._verticesLow as number[],
            this._orders as number[],
            this._indexes as number[],
            (this._renderNode as Planet).ellipsoid,
            this._path3v,
            this._pathLonLat,
            this._pathLonLatMerc,
            this._extent,
            this._colors as number[]
        );
        this._resizePathLengths(0);
    }

    /**
     * Removes from an entity.
     * @public
     */
    public remove() {
        this._entity = null;

        this._pathColors.length = 0;
        this._pathColors = [];

        //@ts-ignore
        this._verticesHigh = null;
        //@ts-ignore
        this._verticesLow = null;
        //@ts-ignore
        this._orders = null;
        //@ts-ignore
        this._indexes = null;
        //@ts-ignore
        this._colors = null;

        this._verticesHigh = [];
        this._verticesLow = [];
        this._orders = [];
        this._indexes = [];
        this._colors = [];

        this._deleteBuffers();

        this._handler && this._handler.remove(this);
    }

    public setPickingColor3v(color: Vec3) {
        this._pickingColor[0] = color.x / 255.0;
        this._pickingColor[1] = color.y / 255.0;
        this._pickingColor[2] = color.z / 255.0;
    }

    /**
     * Returns polyline geodetic extent.
     * @public
     * @returns {Extent} - Geodetic extent
     */
    public getExtent(): Extent {
        return this._extent.clone();
    }

    /**
     * Returns path cartesian coordinates.
     * @return {SegmentPath3vExt[]} Polyline path.
     */
    public getPath3v(): SegmentPath3vExt[] {
        return this._path3v;
    }

    /**
     * Returns geodetic path coordinates.
     * @return {SegmentPathLonLatExt[]} Polyline path.
     */
    public getPathLonLat(): SegmentPathLonLatExt[] {
        return this._pathLonLat;
    }

    public getPathColors(): NumberArray4[][] {
        return this._pathColors;
    }

    /**
     * Sets polyline colors.
     * @todo - Test the function.
     * @param {NumberArray4[][]} pathColors
     */
    setPathColors(pathColors: SegmentPathColor[]) {
        if (pathColors) {
            this._colors = [];
            this._pathColors = ([] as SegmentPathColor[]).concat(pathColors);
            Polyline.setPathColors(
                this._pathLonLat,
                pathColors,
                this._defaultColor as NumberArray4,
                this._colors
            );
            // Mark the colors buffer as changed
            this._changedBuffers[COLORS_BUFFER] = true;
        }
    }

    /**
     * Sets polyline color
     * @param {string} htmlColor- HTML color
     */
    public setColorHTML(htmlColor: string) {
        this._defaultColor = htmlColorToFloat32Array(htmlColor);

        let color = htmlColorToRgba(htmlColor),
            p = this._pathColors;

        for (let i = 0, len = p.length; i < len; i++) {
            let s = p[i];
            for (let j = 0, slen = s.length; j < slen; j++) {
                s[j][0] = color.x;
                s[j][1] = color.y;
                s[j][2] = color.z;
                s[j][3] = color.w;
            }
        }

        let c = this._colors;
        for (let i = 0, len = c.length; i < len; i += 4) {
            c[i] = color.x;
            c[i + 1] = color.y;
            c[i + 2] = color.z;
            c[i + 3] = color.w;
        }

        this._changedBuffers[COLORS_BUFFER] = true;
    }

    public setPathLonLatFast(pathLonLat: SegmentPathLonLatExt[], pathColors?: SegmentPathColor[]) {
        this.setPathLonLat(pathLonLat, pathColors, true);
    }

    public setPath3vFast(path3v: SegmentPath3vExt[], pathColors?: SegmentPathColor[]) {
        this.setPath3v(path3v, pathColors, true);
    }

    /**
     * Sets polyline geodetic coordinates.
     * @public
     * @param {SegmentPathLonLat[]} pathLonLat - Polyline path cartesian coordinates.
     * @param {Boolean} [forceEqual=false] - OPTIMIZATION FLAG: Makes assigning faster for size equal coordinates array.
     */
    public setPathLonLat(pathLonLat: SegmentPathLonLatExt[], pathColors?: SegmentPathColor[], forceEqual: boolean = false) {

        if (pathColors) {
            this._pathColors = ([] as SegmentPathColor[]).concat(pathColors);
        }

        if (this._renderNode && (this._renderNode as Planet).ellipsoid) {
            if (forceEqual) {
                this._setEqualPathLonLat(pathLonLat as SegmentPathLonLat[]);
                this._changedBuffers[VERTICES_BUFFER] = true;
                this._changedBuffers[COLORS_BUFFER] = true;
            } else {
                this._createDataLonLat(pathLonLat);
                this._changedBuffers[VERTICES_BUFFER] = true;
                this._changedBuffers[INDEX_BUFFER] = true;
                this._changedBuffers[COLORS_BUFFER] = true;
            }
        } else {
            this._pathLonLat = ([] as SegmentPathLonLatExt[]).concat(pathLonLat);
        }
    }

    public getSize(index: number = 0): number {
        return this._path3v[index].length;
    }

    /**
     * Sets Polyline cartesian coordinates.
     * @public
     * @param {SegmentPath3vExt[]} path3v - Polyline path cartesian coordinates. (exactly 3 entries)
     * @param {SegmentPathColor[]} [pathColors] - Polyline path cartesian coordinates. (exactly 3 entries)
     * @param {Boolean} [forceEqual=false] - Makes assigning faster for size equal coordinates array.
     */
    public setPath3v(path3v: SegmentPath3vExt[], pathColors?: SegmentPathColor[], forceEqual: boolean = false) {
        if (pathColors) {
            this._pathColors = ([] as SegmentPathColor[]).concat(pathColors);
        }

        if (this._renderNode) {
            if (forceEqual) {
                this._setEqualPath3v(path3v);
                this._changedBuffers[VERTICES_BUFFER] = true;
                this._changedBuffers[COLORS_BUFFER] = true;
            } else {
                this._createData3v(path3v);
                this._changedBuffers[VERTICES_BUFFER] = true;
                this._changedBuffers[INDEX_BUFFER] = true;
                this._changedBuffers[COLORS_BUFFER] = true;
            }
        } else {
            this._path3v = ([] as SegmentPath3vExt[]).concat(path3v);
        }
    }

    public draw() {
        if (this.visibility && this._path3v.length) {
            this._update();

            let rn = this._renderNode!;
            let r = rn.renderer!;
            let sh = r.handler.programs.polyline_screen;
            let p = sh._program;
            let gl = r.handler.gl!,
                sha = p.attributes,
                shu = p.uniforms;

            let ec = this._handler!._entityCollection;

            sh.activate();

            gl.disable(gl.CULL_FACE);
            gl.uniform1f(shu.depthOffset, ec.polygonOffsetUnits);

            gl.uniformMatrix4fv(shu.proj, false, r.activeCamera!.getProjectionMatrix());
            gl.uniformMatrix4fv(shu.view, false, r.activeCamera!.getViewMatrix());

            // gl.uniform4fv(shu.color, [this.color.x, this.color.y, this.color.z, this.color.w * this._handler._entityCollection._fadingOpacity]);

            gl.uniform3fv(shu.rtcEyePositionHigh, this._handler!._rtcEyePositionHigh);
            gl.uniform3fv(shu.rtcEyePositionLow, this._handler!._rtcEyePositionLow);

            gl.uniform4fv(shu.visibleSphere, this._visibleSphere);

            //gl.uniform2fv(shu.uFloatParams, [(rn as Planet)._planetRadius2 || 0.0, r.activeCamera!._tanViewAngle_hradOneByHeight]);
            gl.uniform2fv(shu.viewport, [r.handler.canvas!.width, r.handler.canvas!.height]);
            gl.uniform1f(shu.thickness, this.thickness * 0.5);
            gl.uniform1f(shu.opacity, this._opacity * ec._fadingOpacity);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._colorsBuffer as WebGLBuffer);
            gl.vertexAttribPointer(sha.color, this._colorsBuffer!.itemSize, gl.FLOAT, false, 0, 0);

            let v = this._verticesHighBuffer!;
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            gl.vertexAttribPointer(sha.prevHigh, v.itemSize, gl.FLOAT, false, 12, 0);
            gl.vertexAttribPointer(sha.currentHigh, v.itemSize, gl.FLOAT, false, 12, 48);
            gl.vertexAttribPointer(sha.nextHigh, v.itemSize, gl.FLOAT, false, 12, 96);

            v = this._verticesLowBuffer!;
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            gl.vertexAttribPointer(sha.prevLow, v.itemSize, gl.FLOAT, false, 12, 0);
            gl.vertexAttribPointer(sha.currentLow, v.itemSize, gl.FLOAT, false, 12, 48);
            gl.vertexAttribPointer(sha.nextLow, v.itemSize, gl.FLOAT, false, 12, 96);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._ordersBuffer as WebGLBuffer);
            gl.vertexAttribPointer(sha.order, this._ordersBuffer!.itemSize, gl.FLOAT, false, 4, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexesBuffer as WebGLBuffer);
            gl.drawElements(gl.TRIANGLE_STRIP, this._indexesBuffer!.numItems, gl.UNSIGNED_INT, 0);

            gl.enable(gl.CULL_FACE);
        }
    }

    public drawPicking() {
        if (this.visibility && this._path3v.length) {
            let rn = this._renderNode!;
            let r = rn.renderer!;
            let sh = r.handler.programs.polyline_picking;
            let p = sh._program;
            let gl = r.handler.gl!,
                sha = p.attributes,
                shu = p.uniforms;

            let ec = this._handler!._entityCollection;

            sh.activate();

            gl.disable(gl.CULL_FACE);

            gl.uniform1f(shu.depthOffset, ec.polygonOffsetUnits);

            gl.uniformMatrix4fv(shu.proj, false, r.activeCamera!.getProjectionMatrix());
            gl.uniformMatrix4fv(shu.view, false, r.activeCamera!.getViewMatrix());

            gl.uniform4fv(shu.color, [
                this._pickingColor[0],
                this._pickingColor[1],
                this._pickingColor[2],
                1.0
            ]);

            gl.uniform3fv(shu.rtcEyePositionHigh, this._handler!._rtcEyePositionHigh);
            gl.uniform3fv(shu.rtcEyePositionLow, this._handler!._rtcEyePositionLow);

            gl.uniform4fv(shu.visibleSphere, this._visibleSphere);

            gl.uniform2fv(shu.viewport, [r.handler.canvas!.width, r.handler.canvas!.height]);
            gl.uniform1f(shu.thickness, this.thickness * 0.5 * ec.pickingScale[0]);

            let v = this._verticesHighBuffer!;
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            gl.vertexAttribPointer(sha.prevHigh, v.itemSize, gl.FLOAT, false, 12, 0);
            gl.vertexAttribPointer(sha.currentHigh, v.itemSize, gl.FLOAT, false, 12, 48);
            gl.vertexAttribPointer(sha.nextHigh, v.itemSize, gl.FLOAT, false, 12, 96);

            v = this._verticesLowBuffer!;
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            gl.vertexAttribPointer(sha.prevLow, v.itemSize, gl.FLOAT, false, 12, 0);
            gl.vertexAttribPointer(sha.currentLow, v.itemSize, gl.FLOAT, false, 12, 48);
            gl.vertexAttribPointer(sha.nextLow, v.itemSize, gl.FLOAT, false, 12, 96);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._ordersBuffer as WebGLBuffer);
            gl.vertexAttribPointer(sha.order, this._ordersBuffer!.itemSize, gl.FLOAT, false, 4, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexesBuffer as WebGLBuffer);
            gl.drawElements(gl.TRIANGLE_STRIP, this._indexesBuffer!.numItems, gl.UNSIGNED_INT, 0);

            gl.enable(gl.CULL_FACE);
        }
    }

    /**
     * Refresh buffers.
     * @protected
     */
    protected _refresh() {
        let i = this._changedBuffers.length;
        while (i--) {
            this._changedBuffers[i] = true;
        }
    }

    /**
     * Updates render buffers.
     * @protected
     */
    protected _update() {
        if (this._renderNode) {
            let i = this._changedBuffers.length;
            while (i--) {
                if (this._changedBuffers[i]) {
                    this._buffersUpdateCallbacks[i].call(this);
                    this._changedBuffers[i] = false;
                }
            }
        }
    }

    /**
     * Clear GL buffers.
     * @public
     */
    public _deleteBuffers() {
        if (this._renderNode) {
            let r = this._renderNode.renderer!,
                gl = r.handler.gl!;

            gl.deleteBuffer(this._verticesHighBuffer as WebGLBuffer);
            gl.deleteBuffer(this._verticesLowBuffer as WebGLBuffer);
            gl.deleteBuffer(this._ordersBuffer as WebGLBuffer);
            gl.deleteBuffer(this._indexesBuffer as WebGLBuffer);
            gl.deleteBuffer(this._colorsBuffer as WebGLBuffer);

            this._verticesHighBuffer = null;
            this._verticesLowBuffer = null;
            this._ordersBuffer = null;
            this._indexesBuffer = null;
            this._colorsBuffer = null;
        }
    }

    /**
     * Creates vertices buffers.
     * @protected
     */
    protected _createVerticesBuffer() {
        let h = this._renderNode!.renderer!.handler;

        let numItems = this._verticesHigh.length / 3;

        if (!this._verticesHighBuffer || this._verticesHighBuffer.numItems !== numItems) {
            h.gl!.deleteBuffer(this._verticesHighBuffer as WebGLBuffer);
            h.gl!.deleteBuffer(this._verticesLowBuffer as WebGLBuffer);
            this._verticesHighBuffer = h.createStreamArrayBuffer(3, numItems);
            this._verticesLowBuffer = h.createStreamArrayBuffer(3, numItems);
        }

        this._verticesHigh = makeArrayTyped(this._verticesHigh);
        this._verticesLow = makeArrayTyped(this._verticesLow);

        h.setStreamArrayBuffer(this._verticesHighBuffer!, this._verticesHigh as Float32Array);
        h.setStreamArrayBuffer(this._verticesLowBuffer!, this._verticesLow as Float32Array);
    }

    /**
     * Creates gl index and order buffer.
     * @protected
     */
    protected _createIndexBuffer() {
        let h = this._renderNode!.renderer!.handler;
        h.gl!.deleteBuffer(this._ordersBuffer as WebGLBuffer);
        h.gl!.deleteBuffer(this._indexesBuffer as WebGLBuffer);

        this._orders = makeArrayTyped(this._orders);
        this._ordersBuffer = h.createArrayBuffer(this._orders as Uint8Array, 1, this._orders.length / 2);

        this._indexes = makeArrayTyped(this._indexes, Uint32Array);
        this._indexesBuffer = h.createElementArrayBuffer(this._indexes as Uint32Array, 1, this._indexes.length);
    }

    protected _createColorsBuffer() {
        let h = this._renderNode!.renderer!.handler;
        h.gl!.deleteBuffer(this._colorsBuffer as WebGLBuffer);

        this._colors = makeArrayTyped(this._colors);
        this._colorsBuffer = h.createArrayBuffer(new Float32Array(this._colors), 4, this._colors.length / 4);
    }

    public setVisibleSphere(p: Vec3, r: number) {
        if (this._handler) {
            this._visibleSphere[0] = p.x - this._handler._relativeCenter.x;
            this._visibleSphere[1] = p.y - this._handler._relativeCenter.y;
            this._visibleSphere[2] = p.z - this._handler._relativeCenter.z;
        }
        this._visibleSphere[3] = r;
    }

    public updateRTCPosition() {
        if (this._handler && this._renderNode) {
            this._visibleSphere[0] = this._visibleSphere[0] - this._handler._relativeCenter.x;
            this._visibleSphere[1] = this._visibleSphere[1] - this._handler._relativeCenter.y;
            this._visibleSphere[2] = this._visibleSphere[2] - this._handler._relativeCenter.z;
            this._setEqualPath3v(this._path3v);
        }
        this._changedBuffers[VERTICES_BUFFER] = true;
    }

}

export {Polyline};
