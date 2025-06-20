import {Globe, control, OpenStreetMap, GlobusRgbTerrain, Bing} from "../../lib/og.es.js";

let globe = null;

self.onmessage = (e) => {
    if (e.data.type === 'init') {
        const canvas = e.data.canvas;
        globe = new Globe({
            target: canvas,
            name: 'Earth',
            terrain: new GlobusRgbTerrain(),
            layers: [new OpenStreetMap(), new Bing()],
            atmosphereEnabled: false,
            fontsSrc: '../../res/fonts'
        });
        globe.planet.addControl(new control.TimelineControl());
        globe.planet.addControl(new control.LayerSwitcher());
    }
};
