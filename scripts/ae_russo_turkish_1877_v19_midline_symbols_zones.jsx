/*
  Russo-Turkish War 1877 V19.

  Fixes from V7:
  - overscan basemap with real 1880 boundaries and Natural Earth rivers;
  - water/rivers use one blue family, countries do not use blue;
  - fake mountain hachures removed;
  - active city dots, labels and arrows are geographically locked to the map;
  - overlay sizes are stabilized with keyframes, not AE expressions;
  - persistent legend and milsymbol unit icons are included;
  - active city labels are parented locally to their dots, so labels do not fly
    outside the map during camera moves;
  - V14 action viewport remains the baseline;
  - adds cinematic 2.5D overlays, commander medallions and tactical icon pulses;
  - commander portraits come from the local image API and are normalized as round cards;
  - V16 keeps PNG symbols and commander cards inside stable geo anchors, so offsets
    do not inflate during zooms and commanders stay beside the active route;
  - V17 makes the commander/avatar the moving route head, with a thin route trail
    instead of a separate arrowhead;
  - V18 fixes the projected map origin: lon/lat overlays now use the same centered
    and scaled PNG coordinate space as the basemap layer;
  - V19 removes heavy city-label shadows, places tactical pictograms on route
    midlines, and adds reserved territory/contested-zone overlays.
*/

(function () {
    app.beginUndoGroup("Create Russo-Turkish War 1877 V19 Midline Symbols Zones");

    if (!app.project) app.newProject();

    var W = 1920;
    var H = 1080;
    var FPS = 30;
    var DURATION = 92;
    var comp = app.project.items.addComp("Russo_Turkish_War_1877_V19_Midline_Symbols_Zones_92s", W, H, 1, DURATION, FPS);
    comp.bgColor = [0.032, 0.030, 0.026];

    var IMG_W = 5120;
    var IMG_H = 2880;
    var IMG_SCALE = 42;
    var LON_MIN = 14.0;
    var LON_MAX = 35.2;
    var LAT_MIN = 38.2;
    var LAT_MAX = 51.4;
    var mercMin = mercY(LAT_MIN);
    var mercMax = mercY(LAT_MAX);
    var CENTER = [W / 2, H / 2];
    var ACTION_CENTER = [W / 2, 500];
    var MAP_SCALE = IMG_SCALE / 100.0;
    var MAP_ORIGIN = [
        CENTER[0] - (IMG_W * MAP_SCALE) / 2.0,
        CENTER[1] - (IMG_H * MAP_SCALE) / 2.0
    ];

    var PLAN = { FAR: 112, MED: 175, CLOSE: 245, MACRO: 360 };
    var CAMERA_KEYS = [
        { t: 0, scale: PLAN.FAR },
        { t: 7, scale: PLAN.FAR },
        { t: 12, scale: PLAN.CLOSE },
        { t: 19, scale: PLAN.CLOSE },
        { t: 24, scale: PLAN.CLOSE },
        { t: 29, scale: PLAN.MACRO },
        { t: 37, scale: PLAN.MACRO },
        { t: 42, scale: PLAN.CLOSE },
        { t: 50, scale: PLAN.CLOSE },
        { t: 55, scale: PLAN.CLOSE },
        { t: 66, scale: PLAN.CLOSE },
        { t: 72, scale: PLAN.MED },
        { t: 80, scale: PLAN.CLOSE },
        { t: 88, scale: PLAN.CLOSE },
        { t: 92, scale: PLAN.FAR }
    ];
    var COL = {
        blue: [0.03, 0.23, 0.78],
        red: [0.76, 0.09, 0.05],
        gold: [0.96, 0.68, 0.20],
        cream: [0.96, 0.92, 0.80],
        muted: [0.74, 0.74, 0.68],
        black: [0.016, 0.015, 0.013],
        water: [0.24, 0.49, 0.62],
        romania: [0.79, 0.72, 0.41],
        ottoman: [0.67, 0.36, 0.29],
        serbia: [0.48, 0.59, 0.40],
        russia: [0.59, 0.54, 0.68],
        austro: [0.56, 0.52, 0.41]
    };

    var mapLayers = [];

    function mercY(lat) {
        var r = lat * Math.PI / 180.0;
        return Math.log(Math.tan(Math.PI / 4.0 + r / 2.0));
    }

    function xy(lon, lat) {
        var px = (lon - LON_MIN) / (LON_MAX - LON_MIN) * IMG_W;
        var py = (mercMax - mercY(lat)) / (mercMax - mercMin) * IMG_H;
        return [
            MAP_ORIGIN[0] + px * MAP_SCALE,
            MAP_ORIGIN[1] + py * MAP_SCALE
        ];
    }

    function solid(name, color, opacity, pos, scale, parentMap) {
        var layer = comp.layers.addSolid(color, name, W, H, 1, DURATION);
        if (opacity !== undefined) layer.property("Transform").property("Opacity").setValue(opacity);
        if (pos) layer.property("Transform").property("Position").setValue(pos);
        if (scale) layer.property("Transform").property("Scale").setValue(scale);
        if (parentMap) mapLayers.push(layer);
        return layer;
    }

    function ease(prop) {
        for (var i = 1; i <= prop.numKeys; i++) {
            try { prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); } catch (e0) {}
            try { prop.setTemporalEaseAtKey(i, [new KeyframeEase(0, 45)], [new KeyframeEase(0, 45)]); } catch (e1) {}
        }
    }

    function fade(layer, tIn, tOut, opacity) {
        var op = layer.property("Transform").property("Opacity");
        op.setValueAtTime(Math.max(0, tIn - 0.22), 0);
        op.setValueAtTime(tIn, opacity);
        if (tOut < DURATION) {
            op.setValueAtTime(tOut - 0.22, opacity);
            op.setValueAtTime(tOut, 0);
        }
        ease(op);
    }

    function inverseScale(layer) {
        inverseScaleBase(layer, 100);
    }

    function inverseScaleBase(layer, baseScale) {
        var scaleProp = layer.property("Transform").property("Scale");
        for (var i = 0; i < CAMERA_KEYS.length; i++) {
            var s = baseScale * 100 / CAMERA_KEYS[i].scale;
            scaleProp.setValueAtTime(CAMERA_KEYS[i].t, [s, s]);
        }
        ease(scaleProp);
    }

    function inverseStroke(strokeProp, baseWidth) {
        for (var i = 0; i < CAMERA_KEYS.length; i++) {
            strokeProp.setValueAtTime(CAMERA_KEYS[i].t, baseWidth * 100 / CAMERA_KEYS[i].scale);
        }
        ease(strokeProp);
    }

    function text(name, value, pos, size, color, justify, parentMap, stableSize) {
        var layer = comp.layers.addText(value);
        layer.name = name;
        var doc = layer.property("Source Text").value;
        doc.font = "Arial-BoldMT";
        doc.fontSize = size;
        doc.fillColor = color;
        doc.justification = justify || ParagraphJustification.LEFT_JUSTIFY;
        doc.leading = size * 1.1;
        layer.property("Source Text").setValue(doc);
        layer.property("Transform").property("Position").setValue(pos);
        if (stableSize) inverseScale(layer);
        if (parentMap) mapLayers.push(layer);
        return layer;
    }

    function shadowText(name, value, pos, size, color, tIn, tOut, justify, parentMap, stableSize) {
        var sh = text(name + "_shadow", value, [pos[0] + 3, pos[1] + 3], size, [0, 0, 0], justify, parentMap, stableSize);
        var tx = text(name, value, pos, size, color, justify, parentMap, stableSize);
        fade(sh, tIn, tOut, 58);
        fade(tx, tIn, tOut, 100);
        return tx;
    }

    function shapeObj(points, closed) {
        var s = new Shape();
        s.vertices = points;
        s.inTangents = [];
        s.outTangents = [];
        for (var i = 0; i < points.length; i++) {
            s.inTangents.push([0, 0]);
            s.outTangents.push([0, 0]);
        }
        s.closed = closed;
        return s;
    }

    function path(name, points, closed, fill, stroke, width, opacity, parentMap, inverseStrokeEnabled, dashed) {
        var layer = comp.layers.addShape();
        layer.name = name;
        layer.property("Transform").property("Anchor Point").setValue([0, 0]);
        layer.property("Transform").property("Position").setValue([0, 0]);
        if (opacity !== undefined) layer.property("Transform").property("Opacity").setValue(opacity);
        var root = layer.property("ADBE Root Vectors Group");
        var group = root.addProperty("ADBE Vector Group");
        var vectors = group.property("ADBE Vectors Group");
        var p = vectors.addProperty("ADBE Vector Shape - Group");
        p.property("ADBE Vector Shape").setValue(shapeObj(points, closed));
        if (fill) {
            var f = vectors.addProperty("ADBE Vector Graphic - Fill");
            f.property("ADBE Vector Fill Color").setValue(fill);
        }
        if (stroke && width > 0) {
            var st = vectors.addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue(stroke);
            st.property("ADBE Vector Stroke Width").setValue(width);
            st.property("ADBE Vector Stroke Line Cap").setValue(2);
            st.property("ADBE Vector Stroke Line Join").setValue(2);
            if (dashed) {
                var dashes = st.property("ADBE Vector Stroke Dashes");
                if (dashes) {
                    dashes.addProperty("ADBE Vector Stroke Dash 1").setValue(16);
                    dashes.addProperty("ADBE Vector Stroke Gap 1").setValue(10);
                }
            }
            if (inverseStrokeEnabled !== false) inverseStroke(st.property("ADBE Vector Stroke Width"), width);
        }
        if (parentMap) mapLayers.push(layer);
        return layer;
    }

    function mapDot(name, lon, lat, label, size, dx, dy, isCapital) {
        var p = xy(lon, lat);
        var dot = comp.layers.addShape();
        dot.name = name + "_persistent_dot";
        dot.property("Transform").property("Anchor Point").setValue([0, 0]);
        dot.property("Transform").property("Position").setValue(p);
        inverseScale(dot);
        var root = dot.property("ADBE Root Vectors Group");
        var group = root.addProperty("ADBE Vector Group");
        var vectors = group.property("ADBE Vectors Group");
        var ell = vectors.addProperty("ADBE Vector Shape - Ellipse");
        ell.property("ADBE Vector Ellipse Size").setValue([size, size]);
        var f = vectors.addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(COL.black);
        var st = vectors.addProperty("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue(isCapital ? COL.gold : COL.cream);
        st.property("ADBE Vector Stroke Width").setValue(isCapital ? 2.2 : 1.6);
        inverseStroke(st.property("ADBE Vector Stroke Width"), isCapital ? 2.2 : 1.6);
        mapLayers.push(dot);
        if (label) {
            text(name + "_persistent_label", label, [p[0] + dx, p[1] + dy], isCapital ? 20 : 15, isCapital ? COL.gold : COL.muted, ParagraphJustification.LEFT_JUSTIFY, true, true);
        }
    }

    function activeMarker(name, lon, lat, label, color, tIn, tOut, dx, dy) {
        var p = xy(lon, lat);
        var dot = comp.layers.addShape();
        dot.name = name + "_geo_locked_marker";
        dot.property("Transform").property("Anchor Point").setValue([0, 0]);
        dot.property("Transform").property("Position").setValue(p);
        inverseScale(dot);
        var root = dot.property("ADBE Root Vectors Group");
        var group = root.addProperty("ADBE Vector Group");
        var vectors = group.property("ADBE Vectors Group");
        var ell = vectors.addProperty("ADBE Vector Shape - Ellipse");
        ell.property("ADBE Vector Ellipse Size").setValue([13, 13]);
        var f = vectors.addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(color);
        var st = vectors.addProperty("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue(COL.cream);
        st.property("ADBE Vector Stroke Width").setValue(1.8);
        inverseStroke(st.property("ADBE Vector Stroke Width"), 1.8);
        fade(dot, tIn, tOut, 100);
        mapLayers.push(dot);

        var tx = text(name + "_geo_label", label, [0, 0], 19, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        try {
            tx.setParentWithJump(dot);
        } catch (e) {
            tx.parent = dot;
        }
        tx.property("Transform").property("Position").setValue([dx, dy]);
        fade(tx, tIn + 0.08, tOut, 100);
    }

    function geoLabel(name, lon, lat, label, color, tIn, tOut, dx, dy, size) {
        var p = xy(lon, lat);
        var anchor = mapAnchor(name, lon, lat);
        var sh = text(name + "_geo_text_shadow", label, [0, 0], size || 18, [0, 0, 0], ParagraphJustification.CENTER_JUSTIFY, false, false);
        var tx = text(name + "_geo_text", label, [0, 0], size || 18, color || COL.cream, ParagraphJustification.CENTER_JUSTIFY, false, false);
        parentLocal(sh, anchor, [(dx || 0) + 2, (dy || 0) + 2]);
        parentLocal(tx, anchor, [dx || 0, dy || 0]);
        fade(sh, tIn, tOut, 58);
        fade(tx, tIn, tOut, 100);
        return tx;
    }

    function route(name, coords, color, tIn, tGrow, tOut) {
        var pts = [];
        for (var i = 0; i < coords.length; i++) pts.push(xy(coords[i][0], coords[i][1]));
        var line = path(name + "_geo_locked_route", pts, false, null, color, 4.2, 100, true);
        var vectors = line.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
        var trim = vectors.addProperty("ADBE Vector Filter - Trim");
        var end = trim.property("ADBE Vector Trim End");
        end.setValueAtTime(tIn, 0);
        end.setValueAtTime(tGrow, 100);
        ease(end);
        fade(line, tIn, tOut, 100);

        var last = pts[pts.length - 1];
        var prev = pts[pts.length - 2];
        var angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]) * 180 / Math.PI;
        var head = path(name + "_geo_locked_head", [[0, -5], [15, 0], [0, 5]], true, color, COL.gold, 0.8, 100, true);
        head.property("Transform").property("Position").setValue(last);
        head.property("Transform").property("Rotation").setValue(angle);
        inverseScale(head);
        fade(head, Math.max(tIn, tGrow - 0.12), tOut, 100);
    }

    function routeTrail(name, coords, color, tIn, tGrow, tOut) {
        var pts = [];
        for (var i = 0; i < coords.length; i++) pts.push(xy(coords[i][0], coords[i][1]));
        var halo = path(name + "_geo_locked_trail_halo", pts, false, null, COL.cream, 8.5, 48, true);
        var haloVectors = halo.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
        var haloTrim = haloVectors.addProperty("ADBE Vector Filter - Trim");
        var haloEnd = haloTrim.property("ADBE Vector Trim End");
        haloEnd.setValueAtTime(tIn, 0);
        haloEnd.setValueAtTime(tGrow, 100);
        ease(haloEnd);
        fade(halo, tIn, tOut, 48);
        var line = path(name + "_geo_locked_trail", pts, false, null, color, 4.8, 100, true);
        var vectors = line.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
        var trim = vectors.addProperty("ADBE Vector Filter - Trim");
        var end = trim.property("ADBE Vector Trim End");
        end.setValueAtTime(tIn, 0);
        end.setValueAtTime(tGrow, 100);
        ease(end);
        fade(line, tIn, tOut, 92);
        return line;
    }

    function routeDistances(coords) {
        var pts = [];
        var seg = [];
        var total = 0;
        for (var i = 0; i < coords.length; i++) pts.push(xy(coords[i][0], coords[i][1]));
        for (var j = 1; j < pts.length; j++) {
            var dx = pts[j][0] - pts[j - 1][0];
            var dy = pts[j][1] - pts[j - 1][1];
            var d = Math.sqrt(dx * dx + dy * dy);
            seg.push(d);
            total += d;
        }
        return { pts: pts, seg: seg, total: Math.max(total, 0.001) };
    }

    function routePoint(coords, fraction) {
        var rd = routeDistances(coords);
        var target = rd.total * Math.max(0, Math.min(1, fraction));
        var passed = 0;
        for (var i = 1; i < coords.length; i++) {
            var segLen = rd.seg[i - 1];
            if (passed + segLen >= target) {
                var k = segLen <= 0 ? 0 : (target - passed) / segLen;
                return [
                    coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * k,
                    coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * k
                ];
            }
            passed += segLen;
        }
        return [coords[coords.length - 1][0], coords[coords.length - 1][1]];
    }

    function movingMedallion(name, fileObj, coords, label, role, tIn, tGrow, tOut, side) {
        if (!fileObj.exists) return null;
        var rd = routeDistances(coords);
        var anchor = comp.layers.addNull();
        anchor.name = name + "_moving_geo_anchor";
        anchor.property("Transform").property("Anchor Point").setValue([0, 0]);
        if (typeof rig !== "undefined" && rig !== null) anchor.parent = rig;
        var pos = anchor.property("Transform").property("Position");
        var elapsed = 0;
        pos.setValueAtTime(tIn, rd.pts[0]);
        for (var i = 1; i < rd.pts.length; i++) {
            elapsed += rd.seg[i - 1];
            var tt = tIn + (elapsed / rd.total) * (tGrow - tIn);
            pos.setValueAtTime(tt, rd.pts[i]);
        }
        if (tOut > tGrow) pos.setValueAtTime(tOut, rd.pts[rd.pts.length - 1]);
        inverseScaleBase(anchor, 100);
        ease(pos);
        mapLayers.push(anchor);

        var color = side === "hostile" ? COL.red : COL.blue;
        var ring = path(name + "_avatar_ring", [[0, -34], [34, 0], [0, 34], [-34, 0]], true, null, COL.gold, 2.2, 100, false, false);
        parentLocal(ring, anchor, [0, 0]);
        fade(ring, tIn, tOut, 100);

        var footage = app.project.importFile(new ImportOptions(fileObj));
        var med = comp.layers.add(footage);
        med.name = name + "_moving_avatar_head";
        med.property("Transform").property("Position").setValue(rd.pts[0]);
        med.property("Transform").property("Scale").setValue([25, 25]);
        parentLocal(med, anchor, [0, 0]);
        fade(med, tIn, tOut, 100);

        var nameShadow = text(name + "_moving_label_shadow", label, [0, 0], 15, [0, 0, 0], ParagraphJustification.CENTER_JUSTIFY, false, false);
        var nameText = text(name + "_moving_label", label, [0, 0], 15, COL.cream, ParagraphJustification.CENTER_JUSTIFY, false, false);
        var roleText = text(name + "_moving_role", role, [0, 0], 11, side === "hostile" ? [1.0, 0.72, 0.62] : [0.72, 0.86, 1.0], ParagraphJustification.CENTER_JUSTIFY, false, false);
        parentLocal(nameShadow, anchor, [2, 47]);
        parentLocal(nameText, anchor, [0, 45]);
        parentLocal(roleText, anchor, [0, 61]);
        fade(nameShadow, tIn + 0.08, tOut, 58);
        fade(nameText, tIn + 0.08, tOut, 100);
        fade(roleText, tIn + 0.14, tOut, 100);
        return med;
    }

    function camera(rig, t, lon, lat, scale) {
        cameraFocus(rig, t, lon, lat, scale, CENTER[0], CENTER[1]);
    }

    function cameraFocus(rig, t, lon, lat, scale, screenX, screenY) {
        var p = xy(lon, lat);
        var s = scale / 100.0;
        rig.property("Transform").property("Scale").setValueAtTime(t, [scale, scale]);
        rig.property("Transform").property("Position").setValueAtTime(t, [
            screenX - (p[0] - CENTER[0]) * s,
            screenY - (p[1] - CENTER[1]) * s
        ]);
    }

    function routeFocus(coords) {
        var minLon = coords[0][0];
        var maxLon = coords[0][0];
        var minLat = coords[0][1];
        var maxLat = coords[0][1];
        for (var i = 1; i < coords.length; i++) {
            minLon = Math.min(minLon, coords[i][0]);
            maxLon = Math.max(maxLon, coords[i][0]);
            minLat = Math.min(minLat, coords[i][1]);
            maxLat = Math.max(maxLat, coords[i][1]);
        }
        return [(minLon + maxLon) / 2.0, (minLat + maxLat) / 2.0];
    }

    function cameraRoute(rig, t, coords, scale) {
        var f = routeFocus(coords);
        cameraFocus(rig, t, f[0], f[1], scale, ACTION_CENTER[0], ACTION_CENTER[1]);
    }

    function cameraNode(rig, t, lon, lat, scale) {
        cameraFocus(rig, t, lon, lat, scale, ACTION_CENTER[0], ACTION_CENTER[1]);
    }

    function caption(tIn, tOut, title, body) {
        var top = solid("caption_top_" + title, COL.black, 0, [W / 2, 70], [100, 12], false);
        var bottom = solid("caption_bottom_" + title, COL.black, 0, [W / 2, 1007], [100, 8.5], false);
        fade(top, tIn, tOut, 84);
        fade(bottom, tIn, tOut, 72);
        shadowText("title_" + title, title, [W / 2, 55], 40, COL.gold, tIn + 0.05, tOut, ParagraphJustification.CENTER_JUSTIFY, false, false);
        shadowText("body_" + title, body, [W / 2, 103], 24, COL.cream, tIn + 0.12, tOut, ParagraphJustification.CENTER_JUSTIFY, false, false);
    }

    function rect(name, x, y, w, h, color, opacity) {
        var layer = solid(name, color, opacity, [x + w / 2, y + h / 2], [w / W * 100, h / H * 100], false);
        return layer;
    }

    function legendLine(name, x, y, color) {
        path(name, [[x, y], [x + 54, y]], false, null, color, 6, 100, false);
    }

    function addIconPng(name, fileObj, x, y, scale) {
        if (!fileObj.exists) return null;
        var footage = app.project.importFile(new ImportOptions(fileObj));
        var layer = comp.layers.add(footage);
        layer.name = name;
        layer.property("Transform").property("Position").setValue([x, y]);
        layer.property("Transform").property("Scale").setValue([scale, scale]);
        return layer;
    }

    function mapAnchor(name, lon, lat) {
        var p = xy(lon, lat);
        var anchor = comp.layers.addNull();
        anchor.name = name + "_stable_geo_anchor";
        anchor.property("Transform").property("Anchor Point").setValue([0, 0]);
        if (typeof rig !== "undefined" && rig !== null) anchor.parent = rig;
        anchor.property("Transform").property("Position").setValue(p);
        inverseScaleBase(anchor, 100);
        mapLayers.push(anchor);
        return anchor;
    }

    function parentLocal(layer, parent, localPos) {
        try {
            layer.setParentWithJump(parent);
        } catch (e) {
            layer.parent = parent;
        }
        layer.property("Transform").property("Position").setValue(localPos);
    }

    function addMapPng(name, fileObj, lon, lat, scale, tIn, tOut, dx, dy) {
        if (!fileObj.exists) return null;
        var anchor = mapAnchor(name, lon, lat);
        var p = xy(lon, lat);
        var footage = app.project.importFile(new ImportOptions(fileObj));
        var layer = comp.layers.add(footage);
        layer.name = name;
        layer.property("Transform").property("Position").setValue(p);
        layer.property("Transform").property("Scale").setValue([scale, scale]);
        parentLocal(layer, anchor, [dx || 0, dy || 0]);
        fade(layer, tIn, tOut, 100);
        return layer;
    }

    function pulseRing(name, lon, lat, color, tIn, tOut, radius) {
        var p = xy(lon, lat);
        var ring = path(name + "_pulse_ring", [[0, -radius], [radius, 0], [0, radius], [-radius, 0]], true, null, color, 3, 100, true);
        ring.property("Transform").property("Position").setValue(p);
        inverseScale(ring);
        var op = ring.property("Transform").property("Opacity");
        op.setValueAtTime(tIn, 0);
        op.setValueAtTime(tIn + 0.25, 82);
        op.setValueAtTime(tOut - 0.25, 82);
        op.setValueAtTime(tOut, 0);
        ease(op);
        return ring;
    }

    function mapMedallion(name, fileObj, lon, lat, label, role, tIn, tOut, dx, dy, side) {
        var p = xy(lon, lat);
        var anchor = mapAnchor(name, lon, lat);
        var color = side === "hostile" ? COL.red : COL.blue;
        var leadLen = Math.sqrt(dx * dx + dy * dy);
        if (leadLen > 34) {
            var lead = path(name + "_leader_line", [[0, 0], [dx * 0.72, dy * 0.72]], false, null, color, 2.2, 86, false, false);
            parentLocal(lead, anchor, [0, 0]);
            fade(lead, tIn, tOut, 86);
        }
        var footage = null;
        if (!fileObj.exists) return null;
        footage = app.project.importFile(new ImportOptions(fileObj));
        var med = comp.layers.add(footage);
        med.name = name + "_portrait_medallion";
        med.property("Transform").property("Position").setValue(p);
        med.property("Transform").property("Scale").setValue([23, 23]);
        parentLocal(med, anchor, [dx, dy]);
        fade(med, tIn, tOut, 100);
        if (!med) return null;
        pulseRing(name, lon, lat, color, tIn + 0.2, tOut, 26);
        var nameShadow = text(name + "_card_label_shadow", label, [0, 0], 15, [0, 0, 0], ParagraphJustification.CENTER_JUSTIFY, false, false);
        var nameText = text(name + "_card_label", label, [0, 0], 15, COL.cream, ParagraphJustification.CENTER_JUSTIFY, false, false);
        var roleShadow = text(name + "_card_role_shadow", role, [0, 0], 11, [0, 0, 0], ParagraphJustification.CENTER_JUSTIFY, false, false);
        var roleText = text(name + "_card_role", role, [0, 0], 11, side === "hostile" ? [1.0, 0.72, 0.62] : [0.72, 0.86, 1.0], ParagraphJustification.CENTER_JUSTIFY, false, false);
        parentLocal(nameShadow, anchor, [dx + 2, dy + 52]);
        parentLocal(nameText, anchor, [dx, dy + 50]);
        parentLocal(roleShadow, anchor, [dx + 2, dy + 68]);
        parentLocal(roleText, anchor, [dx, dy + 66]);
        fade(nameShadow, tIn + 0.12, tOut, 58);
        fade(nameText, tIn + 0.12, tOut, 100);
        fade(roleShadow, tIn + 0.18, tOut, 52);
        fade(roleText, tIn + 0.18, tOut, 100);
        return med;
    }

    function tacticalIcon(name, fileObj, lon, lat, tIn, tOut, dx, dy, scale) {
        var layer = addMapPng(name + "_tactical_icon", fileObj, lon, lat, scale || 18, tIn, tOut, dx || 0, dy || 0);
        if (!layer) return null;
        var rot = layer.property("Transform").property("Rotation");
        rot.setValueAtTime(tIn, -5);
        rot.setValueAtTime((tIn + tOut) / 2.0, 5);
        rot.setValueAtTime(tOut, -5);
        ease(rot);
        return layer;
    }

    function tacticalIconOnRoute(name, fileObj, coords, fraction, tIn, tOut, dx, dy, scale) {
        var p = routePoint(coords, fraction);
        return tacticalIcon(name, fileObj, p[0], p[1], tIn, tOut, dx || 0, dy || 0, scale || 22);
    }

    function territoryZone(name, coords, fillColor, strokeColor, tIn, tOut, opacity, dashed) {
        var pts = [];
        for (var i = 0; i < coords.length; i++) pts.push(xy(coords[i][0], coords[i][1]));
        var zone = path(name + "_geo_zone", pts, true, fillColor, strokeColor, 3.2, opacity || 34, true, true, dashed);
        fade(zone, tIn, tOut, opacity || 34);
        return zone;
    }

    function mapCallout(name, lon, lat, title, body, tIn, tOut, dx, dy, side) {
        var p = xy(lon, lat);
        var anchor = mapAnchor(name, lon, lat);
        var w = 280;
        var h = 82;
        var bg = path(name + "_callout_bg", [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], true, [0.02, 0.018, 0.014], side === "hostile" ? COL.red : COL.blue, 2, 86, true, false);
        bg.property("Transform").property("Position").setValue(p);
        parentLocal(bg, anchor, [dx, dy]);
        fade(bg, tIn, tOut, 88);
        var titleShadow = text(name + "_callout_title_shadow", title, [0, 0], 17, [0, 0, 0], ParagraphJustification.CENTER_JUSTIFY, false, false);
        var titleText = text(name + "_callout_title", title, [0, 0], 17, COL.gold, ParagraphJustification.CENTER_JUSTIFY, false, false);
        var bodyText = text(name + "_callout_body", body, [0, 0], 12, COL.cream, ParagraphJustification.CENTER_JUSTIFY, false, false);
        parentLocal(titleShadow, anchor, [dx + 2, dy - 6]);
        parentLocal(titleText, anchor, [dx, dy - 8]);
        parentLocal(bodyText, anchor, [dx, dy + 18]);
        fade(titleShadow, tIn + 0.08, tOut, 58);
        fade(titleText, tIn + 0.08, tOut, 100);
        fade(bodyText, tIn + 0.14, tOut, 100);
    }

    function addLegend(scriptFolder) {
        rect("legend_panel", 1390, 700, 470, 235, COL.black, 74);
        path("legend_rule_top", [[1410, 722], [1840, 722]], false, null, COL.gold, 2, 90, false);
        text("legend_title", "ЛЕГЕНДА", [1410, 715], 24, COL.gold, ParagraphJustification.LEFT_JUSTIFY, false, false);

        rect("legend_romania_swatch", 1412, 746, 26, 16, COL.romania, 100);
        text("legend_romania_text", "Румыния", [1450, 761], 18, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        rect("legend_ottoman_swatch", 1412, 774, 26, 16, COL.ottoman, 100);
        text("legend_ottoman_text", "Османские владения", [1450, 789], 18, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        rect("legend_serbia_swatch", 1412, 802, 26, 16, COL.serbia, 100);
        text("legend_serbia_text", "Сербия / Черногория", [1450, 817], 18, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        rect("legend_russia_swatch", 1412, 830, 26, 16, COL.russia, 100);
        text("legend_russia_text", "Российская империя", [1450, 845], 18, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        legendLine("legend_water_line", 1412, 868, COL.water);
        text("legend_water_text", "реки и моря", [1480, 875], 18, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        legendLine("legend_russian_arrow", 1412, 900, COL.blue);
        text("legend_russian_text", "русское движение", [1480, 907], 18, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        legendLine("legend_ottoman_arrow", 1412, 926, COL.red);
        text("legend_ottoman_arrow_text", "османское движение", [1480, 933], 18, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);

        var assets = new Folder(scriptFolder.fsName + "/milsymbol_assets");
        addIconPng("legend_friendly_milsymbol", new File(assets.fsName + "/friendly_infantry.png"), 1734, 764, 21);
        text("legend_friendly_milsymbol_text", "APP-6 / MIL-STD", [1762, 771], 15, COL.muted, ParagraphJustification.LEFT_JUSTIFY, false, false);
        addIconPng("legend_hostile_milsymbol", new File(assets.fsName + "/hostile_infantry.png"), 1734, 812, 21);
        text("legend_hostile_milsymbol_text", "milsymbol", [1762, 819], 15, COL.muted, ParagraphJustification.LEFT_JUSTIFY, false, false);
    }

    var scriptFolder = File($.fileName).parent;
    var portraitDir = new Folder(scriptFolder.fsName + "/portraits/medallions");
    var tacticalDir = new Folder(scriptFolder.fsName + "/tactical_icons");
    var bgFile = new File(scriptFolder.fsName + "/balkans_1880_real_boundaries_v9_overscan.png");
    if (!bgFile.exists) {
        alert("Не найден balkans_1880_real_boundaries_v9_overscan.png рядом с JSX.");
        app.endUndoGroup();
        return;
    }

    var footage = app.project.importFile(new ImportOptions(bgFile));
    var map = comp.layers.add(footage);
    map.name = "real boundary basemap v9 overscan";
    map.property("Transform").property("Position").setValue([W / 2, H / 2]);
    map.property("Transform").property("Scale").setValue([IMG_SCALE, IMG_SCALE]);
    mapLayers.push(map);

    shadowText("territory_romania", "РУМЫНИЯ", xy(24.2, 45.1), 32, [0.20, 0.17, 0.10], 0.5, DURATION, ParagraphJustification.CENTER_JUSTIFY, true, false);
    shadowText("territory_ottoman", "ОСМАНСКИЕ ВЛАДЕНИЯ", xy(25.0, 42.05), 30, [1.0, 0.78, 0.62], 0.5, DURATION, ParagraphJustification.CENTER_JUSTIFY, true, false);
    shadowText("territory_serbia", "СЕРБИЯ", xy(20.2, 43.30), 25, [0.15, 0.20, 0.10], 0.5, DURATION, ParagraphJustification.CENTER_JUSTIFY, true, false);
    shadowText("territory_russia", "РОССИЙСКАЯ ИМПЕРИЯ", xy(30.0, 48.0), 25, [0.22, 0.16, 0.30], 0.5, DURATION, ParagraphJustification.CENTER_JUSTIFY, true, false);
    mapDot("capital_bucharest", 26.102, 44.426, "Бухарест", 10, 10, -10, true);
    mapDot("capital_constantinople", 28.978, 41.008, "Константинополь", 10, 10, -10, true);
    mapDot("capital_belgrade", 20.448, 44.787, "Белград", 10, 10, -10, true);

    var rig = comp.layers.addNull();
    rig.name = "MAP_RIG_geo_locked_camera";
    rig.property("Transform").property("Anchor Point").setValue(CENTER);

    var ROUTE_KISHINEV_UNGHENY = [[28.835, 47.010], [28.32, 47.10], [27.795, 47.209]];
    var ROUTE_ZIMNITSA_SVISHTOV = [[25.367, 43.656], [25.358, 43.638], [25.350, 43.620]];
    var ROUTE_SVISHTOV_NIKOPOL = [[25.350, 43.620], [25.16, 43.67], [24.900, 43.700]];
    var ROUTE_SVISHTOV_TARNOVO_SHIPKA = [[25.350, 43.620], [25.55, 43.28], [25.636, 43.075], [25.47, 42.91], [25.320, 42.750]];
    var ROUTE_VIDIN_PLEVNA = [[22.872, 43.996], [23.48, 43.78], [24.617, 43.417]];

    camera(rig, 0, 24.8, 44.05, PLAN.FAR);
    camera(rig, 7, 24.8, 44.05, PLAN.FAR);
    cameraRoute(rig, 12, ROUTE_KISHINEV_UNGHENY, PLAN.CLOSE);
    cameraRoute(rig, 19, ROUTE_KISHINEV_UNGHENY, PLAN.CLOSE);
    cameraRoute(rig, 24, ROUTE_ZIMNITSA_SVISHTOV, PLAN.CLOSE);
    cameraRoute(rig, 29, ROUTE_ZIMNITSA_SVISHTOV, PLAN.MACRO);
    cameraRoute(rig, 37, ROUTE_ZIMNITSA_SVISHTOV, PLAN.MACRO);
    cameraRoute(rig, 42, ROUTE_SVISHTOV_NIKOPOL, PLAN.CLOSE);
    cameraRoute(rig, 50, ROUTE_SVISHTOV_NIKOPOL, PLAN.CLOSE);
    cameraRoute(rig, 55, ROUTE_SVISHTOV_TARNOVO_SHIPKA, PLAN.CLOSE);
    cameraRoute(rig, 66, ROUTE_SVISHTOV_TARNOVO_SHIPKA, PLAN.CLOSE);
    cameraRoute(rig, 72, ROUTE_VIDIN_PLEVNA, PLAN.MED);
    cameraNode(rig, 80, 24.617, 43.417, PLAN.CLOSE);
    cameraNode(rig, 88, 24.617, 43.417, PLAN.CLOSE);
    camera(rig, 92, 24.3, 43.4, PLAN.FAR);
    ease(rig.property("Transform").property("Position"));
    ease(rig.property("Transform").property("Scale"));

    caption(8.0, 20.0, "КИШИНЁВ -> УНГЕНЫ", "24 апреля 1877: движение к переправам через Прут.");
    activeMarker("m_kishinev", 28.835, 47.010, "Кишинёв", COL.blue, 9.0, 20.0, 24, 26);
    activeMarker("m_ungheny", 27.795, 47.209, "Унгены", COL.blue, 9.0, 20.0, -98, -22);
    routeTrail("r_kishinev_ungheny", ROUTE_KISHINEV_UNGHENY, COL.blue, 11.0, 16.0, 22.0);
    movingMedallion("cmd_nikolai", new File(portraitDir.fsName + "/nikolai_nikolaevich_medallion.png"), ROUTE_KISHINEV_UNGHENY, "Николай Николаевич", "русская армия", 11.0, 16.0, 22.0, "friendly");
    tacticalIconOnRoute("ico_kishinev_column", new File(tacticalDir.fsName + "/cavalry_blue.png"), ROUTE_KISHINEV_UNGHENY, 0.52, 10.2, 22.0, -28, 44, 22);

    caption(25.0, 38.0, "ЗИМНИЦА -> СВИШТОВ", "27-28 июня 1877: короткая переправа через Дунай показана крупным планом.");
    territoryZone("zone_svishtov_bridgehead", [[25.28, 43.67], [25.44, 43.67], [25.49, 43.59], [25.32, 43.56]], COL.blue, COL.blue, 27.0, 42.0, 22, false);
    activeMarker("m_zimnitsa", 25.367, 43.656, "Зимница", COL.blue, 26.0, 39.0, 28, -28);
    activeMarker("m_svishtov", 25.350, 43.620, "Свиштов", COL.blue, 26.0, 39.0, 28, 28);
    geoLabel("river_danube_crossing", 25.355, 43.648, "Дунай", [0.76, 0.92, 1.0], 26.0, 38.0, -4, -52, 18);
    routeTrail("r_zimnitsa_svishtov", ROUTE_ZIMNITSA_SVISHTOV, COL.blue, 28.2, 33.5, 39.0);
    movingMedallion("cmd_carol", new File(portraitDir.fsName + "/carol_i_medallion.png"), ROUTE_ZIMNITSA_SVISHTOV, "Кароль I", "румынский союзник", 28.2, 33.5, 39.0, "friendly");
    tacticalIconOnRoute("ico_crossing_flag", new File(tacticalDir.fsName + "/objective_flag_blue.png"), ROUTE_ZIMNITSA_SVISHTOV, 0.50, 27.4, 39.0, 48, -20, 22);
    mapCallout("note_crossing", 25.358, 43.638, "ПЕРЕПРАВА", "через Дунай", 27.0, 39.0, 0, 96, "friendly");

    caption(39.0, 51.0, "СВИШТОВ -> НИКОПОЛЬ", "Июль 1877: движение вдоль Дуная к Никополю.");
    territoryZone("zone_nikopol_operation", [[25.38, 43.61], [25.10, 43.68], [24.82, 43.73], [24.82, 43.63], [25.34, 43.56]], COL.blue, COL.blue, 40.5, 53.0, 18, true);
    activeMarker("m_svishtov2", 25.350, 43.620, "Свиштов", COL.blue, 40.0, 51.0, 24, 26);
    activeMarker("m_nikopol", 24.900, 43.700, "Никополь", COL.blue, 40.0, 51.0, -104, -24);
    geoLabel("river_danube_nikopol", 25.12, 43.73, "Дунай", [0.76, 0.92, 1.0], 39.5, 51.0, 0, -42, 18);
    routeTrail("r_svishtov_nikopol", ROUTE_SVISHTOV_NIKOPOL, COL.blue, 42.0, 47.2, 52.0);
    movingMedallion("cmd_nikolai_nikopol", new File(portraitDir.fsName + "/nikolai_nikolaevich_medallion.png"), ROUTE_SVISHTOV_NIKOPOL, "русская колонна", "вдоль Дуная", 42.0, 47.2, 52.0, "friendly");
    tacticalIcon("ico_nikopol_fort", new File(tacticalDir.fsName + "/fort_gold.png"), 24.900, 43.700, 40.0, 52.0, 50, -44, 20);
    tacticalIconOnRoute("ico_nikopol_cannon", new File(tacticalDir.fsName + "/cannon_blue.png"), ROUTE_SVISHTOV_NIKOPOL, 0.46, 42.0, 52.0, 0, 48, 22);

    caption(52.0, 67.0, "СВИШТОВ -> ТЫРНОВО -> ШИПКА", "Июль 1877: выход к Балканским проходам.");
    territoryZone("zone_balkan_passes", [[25.20, 43.00], [25.78, 43.02], [25.72, 42.70], [25.18, 42.68]], COL.gold, COL.gold, 54.0, 69.0, 20, true);
    activeMarker("m_svishtov3", 25.350, 43.620, "Свиштов", COL.blue, 53.0, 67.0, 24, -28);
    activeMarker("m_tarnovo", 25.636, 43.075, "Тырново", COL.blue, 53.0, 67.0, 24, 26);
    activeMarker("m_shipka", 25.320, 42.750, "Шипка", COL.blue, 53.0, 67.0, -92, 28);
    routeTrail("r_svishtov_tarnovo_shipka", ROUTE_SVISHTOV_TARNOVO_SHIPKA, COL.blue, 55.5, 62.8, 68.0);
    movingMedallion("cmd_gurko", new File(portraitDir.fsName + "/iosif_gurko_medallion.png"), ROUTE_SVISHTOV_TARNOVO_SHIPKA, "Иосиф Гурко", "передовой отряд", 55.5, 62.8, 68.0, "friendly");
    tacticalIconOnRoute("ico_gurko_cavalry", new File(tacticalDir.fsName + "/cavalry_blue.png"), ROUTE_SVISHTOV_TARNOVO_SHIPKA, 0.58, 54.0, 68.0, -50, -44, 23);
    tacticalIcon("ico_shipka_hill", new File(tacticalDir.fsName + "/hill_fort_gold.png"), 25.320, 42.750, 56.0, 68.0, 46, 18, 21);

    caption(68.0, 79.0, "ВИДИН -> ПЛЕВНА", "Июль 1877: Осман-паша занимает Плевну.");
    territoryZone("zone_plevna_occupied", [[24.30, 43.62], [24.78, 43.55], [24.90, 43.28], [24.36, 43.25]], COL.red, COL.red, 72.0, 91.5, 18, true);
    activeMarker("m_vidin", 22.872, 43.996, "Видин", COL.red, 69.0, 79.0, -78, -24);
    activeMarker("m_plevna", 24.617, 43.417, "Плевна", COL.red, 69.0, 79.0, 24, 26);
    routeTrail("r_vidin_plevna", ROUTE_VIDIN_PLEVNA, COL.red, 71.0, 76.0, 80.0);
    movingMedallion("cmd_osman_move", new File(portraitDir.fsName + "/osman_pasha_medallion.png"), ROUTE_VIDIN_PLEVNA, "Осман-паша", "османская армия", 71.0, 76.0, 80.0, "hostile");
    tacticalIconOnRoute("ico_osman_cannon", new File(tacticalDir.fsName + "/cannon_red.png"), ROUTE_VIDIN_PLEVNA, 0.50, 70.0, 80.0, -10, 50, 23);

    caption(80.0, 91.5, "ПЛЕВНА: ОСАДА", "Июль-декабрь 1877: стрелки убраны; остаётся ключевой узел кампании.");
    activeMarker("m_plevna_siege", 24.617, 43.417, "Плевна", COL.gold, 81.0, 91.5, 24, -26);
    var plev = xy(24.617, 43.417);
    var siege = path("siege_ring_geo_locked", [[0, -60], [78, -34], [90, 34], [0, 64], [-84, 34], [-78, -34]], true, null, COL.gold, 4.5, 100, true, true, true);
    siege.property("Transform").property("Position").setValue(plev);
    inverseScale(siege);
    fade(siege, 81.0, 91.5, 100);
    mapMedallion("cmd_osman_siege", new File(portraitDir.fsName + "/osman_pasha_medallion.png"), 24.617, 43.417, "Осман-паша", "оборона Плевны", 80.5, 91.5, -72, -56, "hostile");
    mapMedallion("cmd_skobelev", new File(portraitDir.fsName + "/mikhail_skobelev_medallion.png"), 24.617, 43.417, "Михаил Скобелев", "штурмы Плевны", 82.0, 91.5, 72, -56, "friendly");
    tacticalIcon("ico_plevna_fort", new File(tacticalDir.fsName + "/fort_gold.png"), 24.617, 43.417, 80.5, 91.5, 0, 56, 21);
    tacticalIcon("ico_plevna_swords", new File(tacticalDir.fsName + "/crossed_swords_gold.png"), 24.617, 43.417, 82.0, 91.0, 0, -48, 21);

    path("ui_top_rule", [[54, 136], [1866, 136]], false, null, COL.gold, 2, 88, false);
    path("ui_bottom_rule", [[54, 936], [1866, 936]], false, null, COL.gold, 2, 88, false);
    text("ui_footer_title", "Русско-турецкая война 1877. V19: значки на маршруте, зоны операций на карте.", [58, 970], 23, COL.gold, ParagraphJustification.LEFT_JUSTIFY, false, false);
    text("ui_footer_note", "Городские тени убраны; стикеры стоят на середине действия, спорные зоны выделены пунктиром.", [58, 1002], 19, COL.muted, ParagraphJustification.LEFT_JUSTIFY, false, false);

    addLegend(scriptFolder);

    for (var i = 0; i < mapLayers.length; i++) {
        if (mapLayers[i] && mapLayers[i] !== rig && mapLayers[i].parent === null) {
            try {
                mapLayers[i].setParentWithJump(rig);
            } catch (e) {
                mapLayers[i].parent = rig;
            }
        }
    }
    rig.moveToEnd();
    comp.openInViewer();
    app.endUndoGroup();
})();
