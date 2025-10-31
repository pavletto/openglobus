import { SelectionScene } from './SelectionScene';
import { LonLat } from '../../LonLat';

/**
 * RotatedSelectionScene extends SelectionScene to rotate the selection rectangle
 * to align with the current camera heading instead of geographic north.
 * 
 * The rectangle drawing and mouse interaction remain the same as SelectionScene,
 * but the resulting rectangle is rotated to match the camera's facing direction.
 */
class RotatedSelectionScene extends SelectionScene {
    /**
     * Override _drawLine to apply rotation based on camera heading.
     * The rectangle corners are calculated in geographic coordinates (north-aligned),
     * then rotated around the rectangle center by the camera heading angle.
     */
    override _drawLine(startLonLat: any, endLonLat: any, startPos?: any) {
        if (!startPos) {
            startPos = this._planet.ellipsoid.lonLatToCartesian(startLonLat);
        }

        let endPos = this._planet.ellipsoid.lonLatToCartesian(endLonLat);

        // Calculate the center of the rectangle
        let centerLon = (startLonLat.lon + endLonLat.lon) / 2;
        let centerLat = (startLonLat.lat + endLonLat.lat) / 2;
        let centerHeight = (startLonLat.height + endLonLat.height) / 2;
        let centerLonLat = new LonLat(centerLon, centerLat, centerHeight);

        // Calculate half dimensions (distances from center to corners)
        let halfWidth = this._planet.ellipsoid.inverse(
            new LonLat(centerLon, centerLat),
            new LonLat(endLonLat.lon, centerLat)
        ).distance;

        let halfHeight = this._planet.ellipsoid.inverse(
            new LonLat(centerLon, centerLat),
            new LonLat(centerLon, endLonLat.lat)
        ).distance;

        // Get camera heading (azimuth in degrees)
        let cameraHeading = this._planet.camera ? this._planet.camera.getHeading() : 0;

        // Calculate the four corner azimuths relative to the camera heading
        // For a rectangle aligned to camera heading:
        // - Top-right corner: heading + 45 degrees
        // - Top-left corner: heading + 135 degrees
        // - Bottom-left corner: heading + 225 degrees
        // - Bottom-right corner: heading + 315 degrees

        // Distance from center to corner (diagonal)
        let diagonalDist = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);

        // Angle offset from heading to corner (in rectangle's local coordinate system)
        let cornerAngle = Math.atan2(halfHeight, halfWidth) * (180 / Math.PI);

        // Calculate rotated corner positions using ellipsoid.direct()
        let corner1Azimuth = cameraHeading + cornerAngle; // top-right
        let corner2Azimuth = cameraHeading + 180 - cornerAngle; // top-left
        let corner3Azimuth = cameraHeading + 180 + cornerAngle; // bottom-left
        let corner4Azimuth = cameraHeading + 360 - cornerAngle; // bottom-right

        let corner1 = this._planet.ellipsoid.direct(centerLonLat, corner1Azimuth, diagonalDist).destination;
        corner1.height = startLonLat.height;
        
        let corner2 = this._planet.ellipsoid.direct(centerLonLat, corner2Azimuth, diagonalDist).destination;
        corner2.height = startLonLat.height;
        
        let corner3 = this._planet.ellipsoid.direct(centerLonLat, corner3Azimuth, diagonalDist).destination;
        corner3.height = startLonLat.height;
        
        let corner4 = this._planet.ellipsoid.direct(centerLonLat, corner4Azimuth, diagonalDist).destination;
        corner4.height = startLonLat.height;

        // Calculate heading for display (from center to first corner)
        let res = this._planet.ellipsoid.inverse(startLonLat, endLonLat);
        this._heading = res.initialAzimuth;

        // Update corner entities to show start and end positions
        this._cornerEntity[0].setCartesian3v(startPos);
        this._cornerEntity[1].setCartesian3v(endPos);

        // Convert corners to cartesian for path drawing
        let corners = [
            this._planet.ellipsoid.lonLatToCartesian(corner1),
            this._planet.ellipsoid.lonLatToCartesian(corner2),
            this._planet.ellipsoid.lonLatToCartesian(corner3),
            this._planet.ellipsoid.lonLatToCartesian(corner4),
            this._planet.ellipsoid.lonLatToCartesian(corner1)  // close the rectangle
        ];

        // Create the path with smooth edges
        let path: any[] = [];
        const OUTLINE_COUNT = 120;

        let createPath = (sideA: any, sideB: any) => {
            let dir = sideB.sub(sideA);
            let dist = dir.length();
            dir.normalize();

            for (let i = 0; i < OUTLINE_COUNT; i++) {
                let f = dir.scaleTo(i * dist / OUTLINE_COUNT).addA(sideA);
                path.push(f);
            }
        };

        for (let i = 0; i < corners.length - 1; i++) {
            createPath(corners[i], corners[i + 1]);
        }

        this._trackEntity.polyline?.setPath3v([path]);

        if (this._ignoreTerrain) {
            // Label could be added here if needed
        }
    }
}

export { RotatedSelectionScene };
