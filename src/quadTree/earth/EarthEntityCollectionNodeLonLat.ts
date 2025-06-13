import {EarthEntityCollectionsTreeStrategy} from "./EarthEntityCollectionsTreeStrategy";
import {Extent} from "../../Extent";
import {Planet} from "../../scene/Planet";
import {LonLat} from "../../LonLat";
import {NE, NW, SE, SW} from "../quadTree";
import {Entity} from "../../entity/Entity";
import {EntityCollection} from "../../entity/EntityCollection";
import {EntityCollectionNode} from "../EntityCollectionNode";
import type {NodesDict} from "../EntityCollectionNode";

export class EarthEntityCollectionNodeLonLat extends EntityCollectionNode {

    public isNorth: boolean;

    public override strategy: EarthEntityCollectionsTreeStrategy;

    constructor(strategy: EarthEntityCollectionsTreeStrategy, partId: number, parent: EarthEntityCollectionNodeLonLat | null, extent: Extent, planet: Planet, zoom: number) {
        super(strategy, partId, parent, extent, planet, zoom);
        this.strategy = strategy;
        this.isNorth = false;
    }

    public override createChildNodes() {
        const s = this.strategy;
        const ext = this.extent;
        const size_x = ext.getWidth() * 0.5;
        const size_y = ext.getHeight() * 0.5;
        const ne = ext.northEast;
        const sw = ext.southWest;
        const c = new LonLat(sw.lon + size_x, sw.lat + size_y);
        const nd = this.childNodes;
        const p = this.layer._planet!;
        const z = this.zoom + 1;

        nd[NW] = new EarthEntityCollectionNodeLonLat(s, NW, this, new Extent(new LonLat(sw.lon, sw.lat + size_y), new LonLat(sw.lon + size_x, ne.lat)), p, z);
        nd[NE] = new EarthEntityCollectionNodeLonLat(s, NE, this, new Extent(c, new LonLat(ne.lon, ne.lat)), p, z);
        nd[SW] = new EarthEntityCollectionNodeLonLat(s, SW, this, new Extent(new LonLat(sw.lon, sw.lat), c), p, z);
        nd[SE] = new EarthEntityCollectionNodeLonLat(s, SE, this, new Extent(new LonLat(sw.lon + size_x, sw.lat), new LonLat(ne.lon, sw.lat + size_y)), p, z);
    }

    protected override _setExtentBounds() {
        if (this.extent.northEast.lat > 0) {
            this.isNorth = true;
        }
        this.bsphere.setFromExtent(this.layer._planet!.ellipsoid, this.extent);
    }

    public override __setLonLat__(entity: Entity): LonLat {
        if (entity._lonLat.isZero()) {
            entity._lonLat = this.layer._planet!.ellipsoid.cartesianToLonLat(entity._cartesian);
        }
        return entity._lonLat;
    }

    public override isVisible(): boolean {
        if (this.isNorth && this.strategy._renderingNodesNorth[this.nodeId]) {
            return true;
        } else if (this.strategy._renderingNodesSouth[this.nodeId]) {
            return true;
        }
        return false;
    }

    public override isInside(entity: Entity): boolean {
        return this.extent.isInside(entity._lonLat);
    }

    public override renderCollection(outArr: EntityCollection[], visibleNodes: NodesDict, renderingNode: number) {

        if (this.isNorth) {
            this.strategy._renderingNodesNorth[this.nodeId] = true;
        } else {
            this.strategy._renderingNodesSouth[this.nodeId] = true;
        }

        if (this.deferredEntities.length && !this._inTheQueue) {
            if (this.layer.async) {
                this.strategy._queueDeferredNode(this);
            } else {
                this.applyCollection();
            }
        }

        const ec = this.entityCollection!;

        ec._fadingOpacity = this.layer._fadingOpacity;
        ec.scaleByDistance = this.layer.scaleByDistance;
        ec.pickingScale = this.layer.pickingScale;

        if (!ec.isEmpty()) {
            outArr.push(ec);
        }
    }
}
