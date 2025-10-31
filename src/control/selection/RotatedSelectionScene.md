# RotatedSelectionScene

## Overview

`RotatedSelectionScene` extends `SelectionScene` to rotate the selection rectangle to align with the current camera heading instead of geographic north.

## Key Differences from SelectionScene

- **SelectionScene**: Rectangle is always aligned to geographic north (lat/lon axes)
- **RotatedSelectionScene**: Rectangle rotates to match the camera's facing direction (heading)

## Usage

### Basic Usage

```typescript
import { RotatedSelectionScene } from '@openglobus/og';

// Create a rotated selection scene
const rotatedSelectionScene = new RotatedSelectionScene({
    name: 'rotatedSelection',
    ignoreTerrain: true,
    onSelect: (extent) => {
        console.log('Selected extent:', extent);
    },
    autoSelectionHide: false
});
```

### Integration with Selection Control

To use the rotated selection scene with the Selection control, you would need to extend the Selection class:

```typescript
import { Selection } from '@openglobus/og';
import { RotatedSelectionScene } from '@openglobus/og';

class RotatedSelection extends Selection {
    constructor(options = {}) {
        super(options);
        // Replace the default scene with rotated scene
        this._selectorScene = new RotatedSelectionScene({
            name: `rotatedSelectionScene:${this.__id}`,
            ignoreTerrain: options.ignoreTerrain,
            onSelect: options.onSelect,
            autoSelectionHide: options.autoSelectionHide
        });
    }
}

// Use it in your application
const rotatedSelection = new RotatedSelection({
    ignoreTerrain: false,
    autoSelectionHide: true,
    onSelect: (extent) => {
        console.log('Selected extent:', extent);
    }
});

globe.planet.addControl(rotatedSelection);
```

## How It Works

1. User draws a rectangle by dragging the mouse (same as SelectionScene)
2. Rectangle dimensions are calculated from startLonLat to endLonLat
3. Rectangle center is calculated
4. Camera heading is retrieved via `planet.camera.getHeading()`
5. Four corner positions are calculated using geodetic math:
   - Distance from center to each corner (diagonal)
   - Angle from camera heading to each corner
   - Ellipsoid.direct() is used to calculate rotated positions
6. The rotated rectangle is rendered on the globe

## Technical Details

### Coordinate Transformation

The class uses Vincenty's direct formula (via `ellipsoid.direct()`) to accurately calculate corner positions on the ellipsoid:

```typescript
// Calculate corner azimuth relative to camera heading
let corner1Azimuth = cameraHeading + cornerAngle;

// Calculate corner position using geodetic calculations
let corner1 = ellipsoid.direct(centerLonLat, corner1Azimuth, diagonalDist).destination;
```

### Camera Heading

The camera heading is obtained from the planet's active camera:

```typescript
let cameraHeading = this._planet.camera.getHeading(); // in degrees
```

## Options

Same options as SelectionScene:

- `name` (string): Name of the scene node
- `ignoreTerrain` (boolean): Whether to ignore terrain when drawing
- `onSelect` (function): Callback function called with selected extent
- `autoSelectionHide` (boolean): Whether to hide selection after callback
- `planet` (Planet): Planet instance (usually set via bindPlanet)

## Methods

### _drawLine(startLonLat, endLonLat, startPos?)

Overrides the parent class method to apply rotation based on camera heading.

**Parameters:**
- `startLonLat`: Starting longitude/latitude position
- `endLonLat`: Ending longitude/latitude position
- `startPos`: Optional pre-calculated cartesian position for start point

## Example Scenario

Imagine you're flying a virtual aircraft on the globe and want to select an area relative to your flight direction (heading 45° NE). With `RotatedSelectionScene`, when you draw a rectangle, it will be oriented 45° to match your aircraft's heading, not aligned to north-south.

This is useful for:
- Flight planning applications
- Vehicle-centric area selection
- Navigation-based area queries
- Any scenario where orientation relative to view direction matters
