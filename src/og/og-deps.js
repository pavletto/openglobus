// This file was autogenerated by depswriter.py.
// Please do not edit.
goog.addDependency('../../../og/src/og/ajax.js', ['og.ajax', 'og.ajax.Xhr'], [], false);
goog.addDependency('../../../og/src/og/astro/astro.js', ['og.astro'], ['og.jd', 'og.math'], false);
goog.addDependency('../../../og/src/og/astro/earth.js', ['og.astro.earth'], ['og.astro', 'og.jd', 'og.math', 'og.math.Quaternion', 'og.math.Vector3', 'og.orbit', 'og.rotation'], false);
goog.addDependency('../../../og/src/og/astro/jd.js', ['og.jd'], ['og.utils'], false);
goog.addDependency('../../../og/src/og/astro/orbit.js', ['og.orbit'], ['og.math', 'og.math.Matrix3'], false);
goog.addDependency('../../../og/src/og/astro/rotation.js', ['og.rotation'], [], false);
goog.addDependency('../../../og/src/og/bv/box.js', ['og.bv.Box'], ['og.bv', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/bv/bv.js', ['og.bv'], ['og.Extent', 'og.LonLat', 'og.math'], false);
goog.addDependency('../../../og/src/og/bv/sphere.js', ['og.bv.Sphere'], ['og.bv', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/camera/camera.js', ['og.Camera'], ['og.Events', 'og.Frustum', 'og.math', 'og.math.Matrix4', 'og.math.Pixel', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/camera/planetCamera.js', ['og.PlanetCamera'], ['og.Camera', 'og.inheritance', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/clock.js', ['og.Clock'], ['og.jd'], false);
goog.addDependency('../../../og/src/og/console.js', ['og.Console'], [], false);
goog.addDependency('../../../og/src/og/control/baseControl.js', ['og.control.BaseControl'], [], false);
goog.addDependency('../../../og/src/og/control/earthCoordinates.js', ['og.control.EarthCoordinates'], ['og.control.BaseControl', 'og.inheritance', 'og.mercator', 'og.planetSegment'], false);
goog.addDependency('../../../og/src/og/control/geoImageDragControl.js', ['og.control.GeoImageDragControl'], ['og.control.BaseControl', 'og.inheritance', 'og.layer.BaseGeoImage', 'og.mercator'], false);
goog.addDependency('../../../og/src/og/control/keyboardNavigation.js', ['og.control.KeyboardNavigation'], ['og.control.BaseControl', 'og.inheritance', 'og.input'], false);
goog.addDependency('../../../og/src/og/control/layerSwitcher.js', ['og.control.LayerSwitcher'], ['og.inheritance'], false);
goog.addDependency('../../../og/src/og/control/loadingSpinner.js', ['og.control.LoadingSpinner'], ['og.control.BaseControl', 'og.inheritance'], false);
goog.addDependency('../../../og/src/og/control/mouseNavigation.js', ['og.control.MouseNavigation'], ['og.bv.Sphere', 'og.control.BaseControl', 'og.inheritance', 'og.math', 'og.math.Matrix4', 'og.math.Quaternion', 'og.math.Ray', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/control/showFps.js', ['og.control.ShowFps'], ['og.control.BaseControl', 'og.inheritance'], false);
goog.addDependency('../../../og/src/og/control/simpleNavigation.js', ['og.control.SimpleNavigation'], ['og.control.BaseControl', 'og.inheritance', 'og.input'], false);
goog.addDependency('../../../og/src/og/control/spinNavigation.js', ['og.SpinNavigation'], ['og.bv.Sphere', 'og.control.BaseControl', 'og.inheritance', 'og.math', 'og.math.Matrix4', 'og.math.Quaternion', 'og.math.Ray', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/control/sun.js', ['og.control.Sun'], ['og.LightSource', 'og.astro.earth', 'og.control.BaseControl', 'og.inheritance', 'og.math.Quaternion'], false);
goog.addDependency('../../../og/src/og/control/toggleWireframe.js', ['og.control.ToggleWireframe'], ['og.inheritance', 'og.input', 'og.webgl'], false);
goog.addDependency('../../../og/src/og/control/touchNavigation.js', ['og.control.TouchNavigation'], ['og.bv.Sphere', 'og.control.BaseControl', 'og.inheritance', 'og.math', 'og.math.Matrix4', 'og.math.Pixel', 'og.math.Quaternion', 'og.math.Ray', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/control/zoomControl.js', ['og.control.ZoomControl'], ['og.control.BaseControl', 'og.control.MouseNavigation', 'og.inheritance'], false);
goog.addDependency('../../../og/src/og/ellipsoid/ellipsoid.js', ['og.Ellipsoid'], ['og.LonLat', 'og.math', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/ellipsoid/wgs84ellipsoid.js', ['og.ellipsoid.wgs84'], ['og.Ellipsoid'], false);
goog.addDependency('../../../og/src/og/entity/baseBillboard.js', ['og.BaseBillboard'], ['og.math.Vector3', 'og.math.Vector4', 'og.utils'], false);
goog.addDependency('../../../og/src/og/entity/billboard.js', ['og.Billboard'], ['og.BaseBillboard', 'og.inheritance', 'og.math.Vector2'], false);
goog.addDependency('../../../og/src/og/entity/billboardHandler.js', ['og.BillboardHandler'], ['og.shaderProgram.billboard', 'og.shaderProgram.billboardPicking'], false);
goog.addDependency('../../../og/src/og/entity/entity.js', ['og.Entity', 'og.entity'], ['og.Billboard', 'og.Label', 'og.LineString', 'og.LonLat', 'og.PointCloud', 'og.math.Vector3', 'og.shape.Sphere'], false);
goog.addDependency('../../../og/src/og/entity/entityCollection.js', ['og.EntityCollection'], ['og.BillboardHandler', 'og.Events', 'og.LabelHandler', 'og.LineStringHandler', 'og.PointCloudHandler', 'og.ShapeHandler'], false);
goog.addDependency('../../../og/src/og/entity/label.js', ['og.Label'], ['og.BaseBillboard', 'og.inheritance', 'og.math.Vector4', 'og.utils'], false);
goog.addDependency('../../../og/src/og/entity/labelHandler.js', ['og.LabelHandler'], ['og.BillboardHandler', 'og.Label', 'og.inheritance', 'og.shaderProgram.label', 'og.shaderProgram.labelPicking'], false);
goog.addDependency('../../../og/src/og/entity/lineString.js', ['og.LineString'], ['og.math.Vector3', 'og.mercator'], false);
goog.addDependency('../../../og/src/og/entity/lineStringHandler.js', ['og.LineStringHandler'], ['og.shaderProgram.lineString'], false);
goog.addDependency('../../../og/src/og/entity/pointCloud.js', ['og.PointCloud'], ['og.math.Vector3', 'og.math.Vector4', 'og.mercator'], false);
goog.addDependency('../../../og/src/og/entity/pointCloudHandler.js', ['og.PointCloudHandler'], ['og.shaderProgram.pointCloud'], false);
goog.addDependency('../../../og/src/og/entity/shapeHandler.js', ['og.ShapeHandler'], ['og.shaderProgram.shape_nl', 'og.shaderProgram.shape_wl', 'og.shape.BaseShape', 'og.shape.Sphere'], false);
goog.addDependency('../../../og/src/og/events/events.js', ['og.Events'], [], false);
goog.addDependency('../../../og/src/og/extent/extent.js', ['og.Extent', 'og.extent'], ['og.LonLat', 'og.math'], false);
goog.addDependency('../../../og/src/og/frustum.js', ['og.Frustum'], [], false);
goog.addDependency('../../../og/src/og/globus.js', ['og.Globus'], ['og.Renderer', 'og.ellipsoid.wgs84', 'og.scene.Planet', 'og.scene.PlanetAtmosphere', 'og.terrainProvider.EmptyTerrainProvider', 'og.webgl.Handler'], false);
goog.addDependency('../../../og/src/og/imageCanvas/imageCanvas.js', ['og.ImageCanvas'], [], false);
goog.addDependency('../../../og/src/og/inheritance.js', ['og.inheritance'], [], false);
goog.addDependency('../../../og/src/og/input/input.js', ['og.input'], [], false);
goog.addDependency('../../../og/src/og/input/keyboardHandler.js', ['og.input.KeyboardHandler'], [], false);
goog.addDependency('../../../og/src/og/input/mouseHandler.js', ['og.input.MouseHandler'], [], false);
goog.addDependency('../../../og/src/og/input/touchHandler.js', ['og.input.TouchHandler'], [], false);
goog.addDependency('../../../og/src/og/layer/baseGeoImage.js', ['og.layer.BaseGeoImage'], ['og.layer.Layer', 'og.math'], false);
goog.addDependency('../../../og/src/og/layer/canvasTiles.js', ['og.layer.CanvasTiles'], ['og.ImageCanvas', 'og.inheritance', 'og.layer.Layer'], false);
goog.addDependency('../../../og/src/og/layer/geoImage.js', ['og.layer.GeoImage'], ['og.inheritance', 'og.layer.BaseGeoImage'], false);
goog.addDependency('../../../og/src/og/layer/geoTexture2d.js', ['og.layer.GeoTexture2d'], ['og.inheritance', 'og.layer.BaseGeoImage'], false);
goog.addDependency('../../../og/src/og/layer/geoVideo.js', ['og.layer.GeoVideo'], ['og.inheritance', 'og.layer.BaseGeoImage'], false);
goog.addDependency('../../../og/src/og/layer/layer.js', ['og.layer', 'og.layer.Layer'], ['og.Events', 'og.Extent', 'og.QueueArray', 'og.mercator'], false);
goog.addDependency('../../../og/src/og/layer/vector.js', ['og.layer.Vector'], ['og.Entity', 'og.EntityCollection', 'og.LonLat', 'og.QueueArray', 'og.inheritance', 'og.math', 'og.quadTree', 'og.quadTree.EntityCollectionQuadNode'], false);
goog.addDependency('../../../og/src/og/layer/wms.js', ['og.layer.WMS'], ['og.inheritance', 'og.layer.XYZ'], false);
goog.addDependency('../../../og/src/og/layer/xyz.js', ['og.layer.XYZ'], ['og.inheritance', 'og.layer.Layer', 'og.proj.EPSG3857', 'og.quadTree', 'og.utils'], false);
goog.addDependency('../../../og/src/og/light/lightSource.js', ['og.LightSource'], ['og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/lonlat.js', ['og.LonLat'], ['og.mercator'], false);
goog.addDependency('../../../og/src/og/math/coder.js', ['og.math.coder'], ['og.math', 'og.math.Vector4'], false);
goog.addDependency('../../../og/src/og/math/math.js', ['og.math'], [], false);
goog.addDependency('../../../og/src/og/math/matrix3.js', ['og.math.Matrix3'], ['og.math', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/math/matrix4.js', ['og.math.Matrix4'], ['og.math', 'og.math.Matrix3', 'og.math.Vector3', 'og.math.Vector4'], false);
goog.addDependency('../../../og/src/og/math/pixel.js', ['og.math.Pixel'], [], false);
goog.addDependency('../../../og/src/og/math/quaternion.js', ['og.math.Quaternion'], ['og.math', 'og.math.Matrix4'], false);
goog.addDependency('../../../og/src/og/math/ray.js', ['og.math.Ray'], ['og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/math/vector2.js', ['og.math.Vector2'], ['og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/math/vector3.js', ['og.math.Vector3'], [], false);
goog.addDependency('../../../og/src/og/math/vector4.js', ['og.math.Vector4'], ['og.math', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/mercator.js', ['og.mercator'], [], false);
goog.addDependency('../../../og/src/og/og.js', ['og'], [], false);
goog.addDependency('../../../og/src/og/planetSegment/NormalMapCreatorQueue.js', ['og.planetSegment.NormalMapCreatorQueue'], ['og.QueueArray', 'og.inheritance', 'og.utils.NormalMapCreator'], false);
goog.addDependency('../../../og/src/og/planetSegment/material.js', ['og.planetSegment.Material'], [], false);
goog.addDependency('../../../og/src/og/planetSegment/planetSegmentHelper.js', ['og.PlanetSegmentHelper'], ['og.quadTree'], false);
goog.addDependency('../../../og/src/og/planetSegment/segment.js', ['og.planetSegment', 'og.planetSegment.Segment'], ['og.Extent', 'og.LonLat', 'og.PlanetSegmentHelper', 'og.bv.Box', 'og.bv.Sphere', 'og.layer', 'og.math', 'og.math.Vector3', 'og.mercator', 'og.proj.EPSG3857'], false);
goog.addDependency('../../../og/src/og/planetSegment/segmentWGS84.js', ['og.planetSegment.SegmentWGS84'], ['og.LonLat', 'og.inheritance', 'og.planetSegment.Segment', 'og.proj.EPSG4326'], false);
goog.addDependency('../../../og/src/og/proj/epsg3857.js', ['og.proj.EPSG3857'], ['og.Units', 'og.proj.Projection'], false);
goog.addDependency('../../../og/src/og/proj/epsg4326.js', ['og.proj.EPSG4326'], ['og.Units', 'og.proj.Projection'], false);
goog.addDependency('../../../og/src/og/proj/proj.js', ['og.Units', 'og.proj', 'og.proj.METERS_PER_UNIT', 'og.proj.Projection'], [], false);
goog.addDependency('../../../og/src/og/quadTree/entityCollectionQuadNode.js', ['EntityCollectionQuadNodeWGS84', 'og.quadTree.EntityCollectionQuadNode'], ['og.EntityCollection', 'og.Extent', 'og.LonLat', 'og.bv.Box', 'og.bv.Sphere', 'og.inheritance', 'og.quadTree'], false);
goog.addDependency('../../../og/src/og/quadTree/quadNode.js', ['og.quadTree.QuadNode'], ['og.Extent', 'og.LonLat', 'og.mercator', 'og.planetSegment.Material', 'og.proj.EPSG4326', 'og.quadTree'], false);
goog.addDependency('../../../og/src/og/quadTree/quadTree.js', ['og.quadTree'], [], false);
goog.addDependency('../../../og/src/og/queueArray.js', ['og.QueueArray'], [], false);
goog.addDependency('../../../og/src/og/rectangle.js', ['og.Rectangle'], [], false);
goog.addDependency('../../../og/src/og/renderer/renderer.js', ['og.Renderer'], ['og.Camera', 'og.RendererEvents', 'og.math.Pixel', 'og.math.Vector3', 'og.utils', 'og.webgl.MultiFramebuffer'], false);
goog.addDependency('../../../og/src/og/renderer/rendererEvents.js', ['og.RendererEvents'], ['og.Events', 'og.inheritance', 'og.input', 'og.input.KeyboardHandler', 'og.input.MouseHandler', 'og.input.TouchHandler', 'og.math.Pixel'], false);
goog.addDependency('../../../og/src/og/scene/axes.js', ['og.scene.Axes'], ['og.inheritance', 'og.scene.RenderNode', 'og.shaderProgram.simple'], false);
goog.addDependency('../../../og/src/og/scene/node.js', ['og.scene.Node'], [], false);
goog.addDependency('../../../og/src/og/scene/planet.js', ['og.scene.Planet'], ['og.Extent', 'og.ImageCanvas', 'og.LonLat', 'og.PlanetCamera', 'og.PlanetSegmentHelper', 'og.bv.Sphere', 'og.ellipsoid.wgs84', 'og.inheritance', 'og.layer', 'og.math', 'og.math.Matrix4', 'og.math.Ray', 'og.math.Vector2', 'og.math.Vector3', 'og.math.coder', 'og.mercator', 'og.planetSegment', 'og.planetSegment.NormalMapCreatorQueue', 'og.planetSegment.Segment', 'og.planetSegment.SegmentWGS84', 'og.proj.EPSG4326', 'og.quadTree', 'og.quadTree.QuadNode', 'og.scene.RenderNode', 'og.shaderProgram.drawnode_nl', 'og.utils.GeoImageCreator', 'og.webgl', 'og.webgl.Framebuffer'], false);
goog.addDependency('../../../og/src/og/scene/planetAtmosphere.js', ['og.scene.PlanetAtmosphere'], ['og.inheritance', 'og.shaderProgram.atmosphereSpace', 'og.shape.Icosphere'], false);
goog.addDependency('../../../og/src/og/scene/renderNode.js', ['og.scene.RenderNode'], ['og.Events', 'og.inheritance', 'og.math.Matrix4', 'og.math.Vector3', 'og.scene.Node', 'og.utils.FontAtlas', 'og.utils.TextureAtlas', 'og.webgl'], false);
goog.addDependency('../../../og/src/og/scene/skyBox.js', ['og.scene.SkyBox'], ['og.inheritance', 'og.scene.RenderNode', 'og.shaderProgram.skybox'], false);
goog.addDependency('../../../og/src/og/scene/skySphere.js', ['og.scene.SkySphere'], ['og.inheritance', 'og.scene.RenderNode', 'og.shaderProgram.skysphere'], false);
goog.addDependency('../../../og/src/og/shaderProgram/atmosphereSpace.js', ['og.shaderProgram.atmosphereSpace'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types', 'og.utils'], false);
goog.addDependency('../../../og/src/og/shaderProgram/billboard.js', ['og.shaderProgram.billboard', 'og.shaderProgram.billboardPicking'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types', 'og.utils'], false);
goog.addDependency('../../../og/src/og/shaderProgram/callbacks.js', ['og.shaderProgram.callbacks'], ['og.shaderProgram.types'], false);
goog.addDependency('../../../og/src/og/shaderProgram/drawnode.js', ['og.shaderProgram.drawnode_nl', 'og.shaderProgram.drawnode_wl'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types'], false);
goog.addDependency('../../../og/src/og/shaderProgram/label.js', ['og.shaderProgram.label', 'og.shaderProgram.labelPicking'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types', 'og.utils'], false);
goog.addDependency('../../../og/src/og/shaderProgram/lineString.js', ['og.shaderProgram.lineString'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types', 'og.utils'], false);
goog.addDependency('../../../og/src/og/shaderProgram/pointCloud.js', ['og.shaderProgram.pointCloud'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types', 'og.utils'], false);
goog.addDependency('../../../og/src/og/shaderProgram/shaderProgram.js', ['og.shaderProgram', 'og.shaderProgram.ShaderProgram'], ['og.shaderProgram.callbacks'], false);
goog.addDependency('../../../og/src/og/shaderProgram/shape.js', ['og.shaderProgram.shape_nl', 'og.shaderProgram.shape_wl'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types', 'og.utils'], false);
goog.addDependency('../../../og/src/og/shaderProgram/simple.js', ['og.shaderProgram.simple'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types', 'og.utils'], false);
goog.addDependency('../../../og/src/og/shaderProgram/skybox.js', ['og.shaderProgram.skybox'], ['og.shaderProgram', 'og.shaderProgram.ShaderProgram', 'og.shaderProgram.types', 'og.utils'], false);
goog.addDependency('../../../og/src/og/shaderProgram/types.js', ['og.shaderProgram.types'], [], false);
goog.addDependency('../../../og/src/og/shapes/baseShape.js', ['og.shape.BaseShape'], ['og.math.Matrix4', 'og.math.Quaternion', 'og.math.Vector3'], false);
goog.addDependency('../../../og/src/og/shapes/icosphere.js', ['og.shape.Icosphere'], ['og.shape.BaseShape'], false);
goog.addDependency('../../../og/src/og/shapes/sphere.js', ['og.shape.Sphere'], ['og.shape.BaseShape'], false);
goog.addDependency('../../../og/src/og/stack.js', ['og.Stack'], [], false);
goog.addDependency('../../../og/src/og/terrainProvider/emptyTerrainProvider.js', ['og.terrainProvider.EmptyTerrainProvider'], [], false);
goog.addDependency('../../../og/src/og/terrainProvider/terrainProvider.js', ['og.terrainProvider.TerrainProvider'], ['og.Events', 'og.QueueArray', 'og.ajax', 'og.inheritance', 'og.layer', 'og.proj.EPSG3857', 'og.quadTree', 'og.terrainProvider.EmptyTerrainProvider', 'og.utils'], false);
goog.addDependency('../../../og/src/og/utils/fontAtlas.js', ['og.utils.FontAtlas'], ['og.FontDetector', 'og.ImageCanvas', 'og.QueueArray', 'og.math', 'og.utils.SDFCreator', 'og.utils.TextureAtlas'], false);
goog.addDependency('../../../og/src/og/utils/fontDetector.js', ['og.FontDetector'], [], false);
goog.addDependency('../../../og/src/og/utils/geoImageCreator.js', ['og.utils.GeoImageCreator'], ['og.PlanetSegmentHelper', 'og.math', 'og.webgl.Framebuffer'], false);
goog.addDependency('../../../og/src/og/utils/imagesCacheManager.js', ['og.utils.ImagesCacheManager'], ['og.QueueArray'], false);
goog.addDependency('../../../og/src/og/utils/normalMapCreator.js', ['og.utils.NormalMapCreator'], ['og.PlanetSegmentHelper', 'og.shaderProgram.ShaderProgram', 'og.webgl.Framebuffer', 'og.webgl.Handler'], false);
goog.addDependency('../../../og/src/og/utils/sdfCreator.js', ['og.utils.SDFCreator'], ['og.shaderProgram.ShaderProgram', 'og.webgl.Framebuffer', 'og.webgl.Handler'], false);
goog.addDependency('../../../og/src/og/utils/textureAtlas.js', ['og.utils.TextureAtlas', 'og.utils.TextureAtlasNode'], ['og.ImageCanvas', 'og.Rectangle', 'og.utils.ImagesCacheManager'], false);
goog.addDependency('../../../og/src/og/utils/utils.js', ['og.utils'], ['og.LonLat', 'og.ajax', 'og.math.Vector2', 'og.math.Vector3', 'og.math.Vector4'], false);
goog.addDependency('../../../og/src/og/webgl/framebuffer.js', ['og.webgl.Framebuffer'], ['og.ImageCanvas', 'og.webgl'], false);
goog.addDependency('../../../og/src/og/webgl/handler.js', ['og.webgl.Handler'], ['og.Clock', 'og.Console', 'og.ImageCanvas', 'og.Stack', 'og.math', 'og.math.Pixel', 'og.webgl', 'og.webgl.ShaderController'], false);
goog.addDependency('../../../og/src/og/webgl/multiFramebuffer.js', ['og.webgl.MultiFramebuffer'], ['og.ImageCanvas', 'og.webgl'], false);
goog.addDependency('../../../og/src/og/webgl/shaderController.js', ['og.webgl.ShaderController'], [], false);
goog.addDependency('../../../og/src/og/webgl/webgl.js', ['og.webgl'], [], false);
