import { RotatedSelectionScene } from '../../src/control/selection/RotatedSelectionScene';
import { Ellipsoid } from '../../src/ellipsoid/Ellipsoid';
import { LonLat } from '../../src/LonLat';

test('RotatedSelectionScene instantiation', () => {
    const scene = new RotatedSelectionScene({
        name: 'testScene',
        ignoreTerrain: true
    });
    
    expect(scene).toBeTruthy();
    expect(scene._ignoreTerrain).toBe(true);
    expect(scene._heading).toBe(0);
});

test('RotatedSelectionScene extends SelectionScene', () => {
    const scene = new RotatedSelectionScene();
    
    expect(scene._trackEntity).toBeTruthy();
    expect(scene._cornerEntity).toBeTruthy();
    expect(scene._cornerEntity.length).toBe(2);
});

test('RotatedSelectionScene has _drawLine method', () => {
    const scene = new RotatedSelectionScene();
    
    expect(typeof scene._drawLine).toBe('function');
});
