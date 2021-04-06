'use strict';

import { Globe } from '../../src/og/Globe.js';
import { GlobusTerrain } from '../../src/og/terrain/GlobusTerrain.js';
import { LonLat } from '../../src/og/LonLat.js';
import { Vec3 } from '../../src/og/math/Vec3.js';
import { XYZ } from '../../src/og/layer/XYZ.js';
import { ObjectScene } from "./ObjectScene.js";

let globus = new Globe({
    "target": "globus",
    "name": "Earth",
    "terrain": new GlobusTerrain(),
    "layers": [new XYZ("MapQuest Satellite", {
        shininess: 20,
        specular: new Vec3(0.00048, 0.00037, 0.00035),
        diffuse: new Vec3(0.88, 0.85, 0.8),
        ambient: new Vec3(0.15, 0.1, 0.23),
        isBaseLayer: true,
        url: "//tileproxy.cloud.mapquest.com/tiles/1.0.0/sat/{z}/{x}/{y}.png",
        visibility: true,
        attribution: '@2014 MapQuest - Portions @2014 "Map data @ <a target="_blank" href="//www.openstreetmap.org/">OpenStreetMap</a> and contributors, <a target="_blank" href="//opendatacommons.org/licenses/odbl/"> CC-BY-SA</a>"'
    })]
});

// globus.planet.events.on("draw", () => {
//     // carrots.each(function (e) {
//     //     let c = e.getLonLat();
//     //     let ll = globus.planet.ellipsoid.getBearingDestination(c, e.properties.bearing, 2000);
//     //     e.properties.bearing = Ellipsoid.getFinalBearing(c, ll);
//     //     e.setLonLat(new LonLat(ll.lon, ll.lat, c.height));
//     //     e.billboard.setRotation(e.billboard.getRotation() + 0.01);
//     // });
// });

// carrots.addTo(globus.planet);
const object = new ObjectScene(),
    placeLonLat = new LonLat(42.51425, 43.25652, 2500),
    cameraLonLat = new LonLat(42.51425, 43.25332, 3000),
    { activeCamera } = globus.planet.renderer,
    pitchCamera = () => {
        activeCamera.pitch(45);
        activeCamera.refresh();

        activeCamera.events.off('moveend', pitchCamera);
    };
globus.planet.flyLonLat(cameraLonLat);
globus.planet.renderer.addNode(object);
activeCamera.set(new Vec3(5, 5, 5), Vec3.ZERO).update();

activeCamera.events.on('moveend', pitchCamera);
object.setTranslate(globus.planet.ellipsoid.lonLatToCartesian(placeLonLat));

window.globus = globus;
window.object = object;