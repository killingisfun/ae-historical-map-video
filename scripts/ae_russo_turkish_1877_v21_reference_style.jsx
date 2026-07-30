/*
  Russo-Turkish War 1877 V21.

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
    midlines, and adds reserved territory/contested-zone overlays;
  - V20 switches to the user's long-form story format: top sentence subtitles,
    large year marker, no bottom text band, and a minimal right-side state legend.
  - V21 redesigns the story layer after military atlas references and World Map Rig
    motion grammar: compact uprising clusters, labeled routes, clear date badges,
    and no unexplained large territory blobs.
*/

(function () {
    app.beginUndoGroup("Create Russo-Turkish War 1877 V21 Reference Style");

    if (!app.project) app.newProject();

    var W = 1920;
    var H = 1080;
    var FPS = 30;
    var DURATION = 186;
    var comp = app.project.items.addComp("Russo_Turkish_War_1877_V21_Reference_Style_186s", W, H, 1, DURATION, FPS);
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
        { t: 10, scale: PLAN.FAR },
        { t: 22, scale: PLAN.MED },
        { t: 34, scale: PLAN.MED },
        { t: 48, scale: PLAN.CLOSE },
        { t: 62, scale: PLAN.MED },
        { t: 74, scale: PLAN.CLOSE },
        { t: 88, scale: PLAN.MED },
        { t: 102, scale: PLAN.FAR },
        { t: 114, scale: PLAN.MED },
        { t: 128, scale: PLAN.CLOSE },
        { t: 142, scale: PLAN.MACRO },
        { t: 156, scale: PLAN.CLOSE },
        { t: 170, scale: PLAN.CLOSE },
        { t: 186, scale: PLAN.MED }
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

    function clampRigPosition(pos, scale) {
        var s = scale / 100.0;
        var mapLeft = pos[0] + (MAP_ORIGIN[0] - CENTER[0]) * s;
        var mapTop = pos[1] + (MAP_ORIGIN[1] - CENTER[1]) * s;
        var mapRight = mapLeft + IMG_W * MAP_SCALE * s;
        var mapBottom = mapTop + IMG_H * MAP_SCALE * s;
        if (mapLeft > 0) pos[0] -= mapLeft;
        if (mapRight < W) pos[0] += W - mapRight;
        mapTop = pos[1] + (MAP_ORIGIN[1] - CENTER[1]) * s;
        mapBottom = mapTop + IMG_H * MAP_SCALE * s;
        if (mapTop > 112) pos[1] -= mapTop - 112;
        if (mapBottom < H) pos[1] += H - mapBottom;
        return pos;
    }

    function cameraFocus(rig, t, lon, lat, scale, screenX, screenY) {
        var p = xy(lon, lat);
        var s = scale / 100.0;
        var pos = clampRigPosition([
            screenX - (p[0] - CENTER[0]) * s,
            screenY - (p[1] - CENTER[1]) * s
        ], scale);
        rig.property("Transform").property("Scale").setValueAtTime(t, [scale, scale]);
        rig.property("Transform").property("Position").setValueAtTime(t, pos);
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

    function subtitle(tIn, tOut, value) {
        var top = solid("subtitle_top_" + Math.round(tIn * 10), COL.black, 0, [W / 2, 62], [100, 9.4], false);
        fade(top, tIn, tOut, 70);
        var tx = shadowText("subtitle_line_" + Math.round(tIn * 10), value, [W / 2, 68], 28, COL.cream, tIn + 0.05, tOut, ParagraphJustification.CENTER_JUSTIFY, false, false);
        var cursor = rect("subtitle_cursor_" + Math.round(tIn * 10), 1728, 46, 4, 40, COL.gold, 0);
        fade(cursor, tIn + 0.25, Math.min(tOut, tIn + 1.25), 80);
        return tx;
    }

    function yearStamp(tIn, tOut, value) {
        var y = text("year_stamp_" + value + "_" + Math.round(tIn), value, [72, 1008], 64, COL.gold, ParagraphJustification.LEFT_JUSTIFY, false, false);
        fade(y, tIn, tOut, 92);
        return y;
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

    function incidentCluster(name, lon, lat, label, color, tIn, tOut, dx, dy, w, h) {
        var anchor = mapAnchor(name + "_incident_anchor", lon, lat);
        var ww = w || 92;
        var hh = h || 54;
        var oval = path(name + "_incident_oval", [[-ww / 2, 0], [-ww / 4, -hh / 2], [ww / 4, -hh / 2], [ww / 2, 0], [ww / 4, hh / 2], [-ww / 4, hh / 2]], true, [color[0], color[1], color[2]], color, 2.2, 28, false, false);
        parentLocal(oval, anchor, [0, 0]);
        fade(oval, tIn, tOut, 34);
        for (var i = -2; i <= 2; i++) {
            var hatch = path(name + "_incident_hatch_" + i, [[-28 + i * 16, 22], [2 + i * 16, -22]], false, null, color, 1.8, 72, false, false);
            parentLocal(hatch, anchor, [0, 0]);
            fade(hatch, tIn + 0.08, tOut, 72);
        }
        var dot = path(name + "_incident_dot", [[0, -6], [6, 0], [0, 6], [-6, 0]], true, color, COL.cream, 1.3, 100, false, false);
        parentLocal(dot, anchor, [0, 0]);
        fade(dot, tIn, tOut, 100);
        geoLabel(name + "_incident_label", lon, lat, label, COL.cream, tIn + 0.1, tOut, dx || 26, dy || -20, 17);
    }

    function routeLabel(name, coords, fraction, label, color, tIn, tOut, dx, dy) {
        var p = routePoint(coords, fraction);
        geoLabel(name + "_route_label", p[0], p[1], label, color || COL.gold, tIn, tOut, dx || 0, dy || -34, 15);
    }

    function dateBadge(name, lon, lat, value, color, tIn, tOut, dx, dy) {
        var anchor = mapAnchor(name + "_date_anchor", lon, lat);
        var w = 104;
        var h = 32;
        var bg = path(name + "_date_bg", [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], true, COL.black, color || COL.gold, 1.8, 84, false, false);
        parentLocal(bg, anchor, [dx || 0, dy || 0]);
        fade(bg, tIn, tOut, 84);
        var tx = text(name + "_date_text", value, [0, 0], 15, color || COL.gold, ParagraphJustification.CENTER_JUSTIFY, false, false);
        parentLocal(tx, anchor, [dx || 0, (dy || 0) + 6]);
        fade(tx, tIn + 0.08, tOut, 100);
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
        rect("legend_panel_minimal", 1648, 716, 252, 160, COL.black, 58);
        rect("legend_ottoman_swatch", 1668, 738, 22, 14, COL.ottoman, 100);
        text("legend_ottoman_text", "Османская империя", [1702, 751], 15, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        rect("legend_romania_swatch", 1668, 766, 22, 14, COL.romania, 100);
        text("legend_romania_text", "Румыния", [1702, 779], 15, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        rect("legend_serbia_swatch", 1668, 794, 22, 14, COL.serbia, 100);
        text("legend_serbia_text", "Сербия / Черногория", [1702, 807], 15, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        rect("legend_russia_swatch", 1668, 822, 22, 14, COL.russia, 100);
        text("legend_russia_text", "Российская империя", [1702, 835], 15, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        rect("legend_austro_swatch", 1668, 850, 22, 14, COL.austro, 100);
        text("legend_austro_text", "Австро-Венгрия", [1702, 863], 15, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
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

    var ROUTE_NEVESINJE_BOSNIA = [[18.11, 43.26], [17.95, 43.47], [18.42, 43.86]];
    var ROUTE_SERBIA_NIS = [[20.45, 44.79], [21.05, 44.30], [21.60, 43.78], [21.90, 43.32]];
    var ROUTE_SERBIA_NOVI_PAZAR = [[20.45, 44.79], [20.62, 44.05], [20.52, 43.14]];
    var ROUTE_MONTENEGRO_HERZ = [[19.26, 42.44], [18.95, 42.77], [18.35, 43.05]];
    var ROUTE_OSMAN_COUNTER_SERBIA = [[21.90, 43.32], [21.55, 43.70], [21.05, 44.18]];
    var ROUTE_EUROPE_REACTION = [[24.22, 41.94], [22.5, 44.6], [18.4, 48.2], [16.37, 48.21]];
    var ROUTE_CONFERENCE = [[16.37, 48.21], [22.0, 45.0], [28.978, 41.008]];
    var ROUTE_BESSARABIA_DANUBE = [[28.835, 47.010], [27.59, 47.16], [26.10, 44.43], [25.36, 43.65]];
    var ROUTE_LOWER_DANUBE_DEMO = [[28.05, 45.43], [27.97, 45.27], [28.80, 45.17], [29.65, 45.12]];
    var ROUTE_ZIMNITSA_SVISHTOV = [[25.367, 43.656], [25.358, 43.638], [25.350, 43.620]];

    camera(rig, 0, 24.4, 43.7, PLAN.FAR);
    camera(rig, 10, 24.4, 43.7, PLAN.FAR);
    camera(rig, 22, 23.1, 44.2, PLAN.MED);
    cameraRoute(rig, 34, ROUTE_NEVESINJE_BOSNIA, PLAN.MED);
    camera(rig, 48, 20.3, 43.7, PLAN.MED);
    camera(rig, 62, 21.1, 43.7, PLAN.MED);
    camera(rig, 74, 24.4, 42.5, PLAN.CLOSE);
    camera(rig, 88, 24.4, 42.5, PLAN.CLOSE);
    camera(rig, 102, 24.7, 44.1, PLAN.FAR);
    camera(rig, 114, 28.5, 42.5, PLAN.MED);
    camera(rig, 128, 24.2, 44.0, PLAN.FAR);
    cameraRoute(rig, 142, ROUTE_BESSARABIA_DANUBE, PLAN.MED);
    cameraRoute(rig, 156, ROUTE_LOWER_DANUBE_DEMO, PLAN.CLOSE);
    cameraRoute(rig, 170, ROUTE_ZIMNITSA_SVISHTOV, PLAN.MACRO);
    cameraRoute(rig, 186, ROUTE_ZIMNITSA_SVISHTOV, PLAN.MACRO);
    ease(rig.property("Transform").property("Position"));
    ease(rig.property("Transform").property("Scale"));

    yearStamp(0, 34, "1850-е");
    yearStamp(34, 61, "1875");
    yearStamp(61, 132, "1876");
    yearStamp(132, DURATION, "1877");

    subtitle(0, 11, "В середине XIX века Османская империя всё ещё удерживает большую часть Балкан.");
    subtitle(11, 22, "Сербия, Черногория и Румыния имеют автономию, но формально зависят от султана.");
    subtitle(22, 34, "После Крымской войны влияние России ограничено, но идеи панславизма усиливаются.");
    subtitle(34, 47, "В 1875 году восстание начинается в Герцеговине и быстро переходит на Боснию.");
    subtitle(47, 61, "Сербия и Черногория поддерживают восставших и вступают в войну с Османской империей.");
    subtitle(61, 76, "Сербская армия терпит поражение, и перемирие становится возможным только после ультиматума России.");
    subtitle(76, 90, "Весной 1876 года вспыхивает Болгарское восстание.");
    subtitle(90, 104, "Жестокое подавление восстания вызывает резонанс по всей Европе.");
    subtitle(104, 118, "В Константинополе великие державы предлагают реформы для христианских областей Балкан.");
    subtitle(118, 132, "Османское правительство отвергает предложения, и дипломатический путь закрывается.");
    subtitle(132, 144, "Россия договаривается с Австро-Венгрией о нейтралитете и с Румынией о проходе армии.");
    subtitle(144, 156, "24 апреля 1877 года Россия объявляет войну Османской империи.");
    subtitle(156, 170, "Русские войска проходят через Румынию к Дунаю, готовя главную переправу.");
    subtitle(170, 186, "Ночью у Зимницы и Свиштова начинается переход через Дунай и появляется первый плацдарм.");

    activeMarker("city_sofia_context", 23.321, 42.697, "София", COL.red, 3, 34, 18, 24);
    activeMarker("city_sarajevo_context", 18.414, 43.857, "Сараево", COL.red, 3, 34, 18, -22);
    mapCallout("callout_autonomy", 22.8, 44.3, "АВТОНОМИИ", "Румыния, Сербия, Черногория", 8, 28, -10, -120, "friendly");
    dateBadge("date_context_midcentury", 24.2, 42.7, "середина XIX", COL.gold, 0, 34, 0, 72);

    incidentCluster("cluster_nevesinje", 18.11, 43.26, "Невесинье", COL.gold, 34, 62, 26, -22, 86, 50);
    incidentCluster("cluster_bosnia", 18.42, 43.86, "Босния", COL.gold, 38, 62, 28, -20, 92, 54);
    routeTrail("r_nevesinje_bosnia", ROUTE_NEVESINJE_BOSNIA, COL.gold, 37, 44, 62);
    routeLabel("label_nevesinje_bosnia", ROUTE_NEVESINJE_BOSNIA, 0.56, "распространение восстания", COL.gold, 38, 62, 0, -36);
    tacticalIconOnRoute("ico_nevesinje_unrest", new File(tacticalDir.fsName + "/crossed_swords_gold.png"), ROUTE_NEVESINJE_BOSNIA, 0.28, 35, 62, 0, -44, 20);
    dateBadge("date_eastern_crisis", 18.3, 43.65, "1875", COL.gold, 34, 62, -88, 70);

    routeTrail("r_serbia_nis", ROUTE_SERBIA_NIS, COL.blue, 49, 55, 66);
    routeTrail("r_serbia_novipazar", ROUTE_SERBIA_NOVI_PAZAR, COL.blue, 50, 56, 66);
    routeTrail("r_montenegro_herz", ROUTE_MONTENEGRO_HERZ, COL.blue, 50, 57, 66);
    routeLabel("label_serbia_nis", ROUTE_SERBIA_NIS, 0.55, "сербское наступление", COL.blue, 50, 66, 0, -34);
    routeLabel("label_montenegro_herz", ROUTE_MONTENEGRO_HERZ, 0.55, "поддержка Герцеговины", COL.blue, 50, 66, 0, 34);
    activeMarker("m_nis_1876", 21.895, 43.321, "Ниш", COL.blue, 49, 66, 20, 20);
    activeMarker("m_novipazar_1876", 20.515, 43.140, "Нови-Пазар", COL.blue, 49, 66, -112, 18);
    tacticalIconOnRoute("ico_serbian_column", new File(tacticalDir.fsName + "/cavalry_blue.png"), ROUTE_SERBIA_NIS, 0.56, 50, 66, 0, 42, 22);

    routeTrail("r_osman_counter_serbia", ROUTE_OSMAN_COUNTER_SERBIA, COL.red, 62, 69, 76);
    routeLabel("label_osman_counter", ROUTE_OSMAN_COUNTER_SERBIA, 0.45, "османское давление", COL.red, 62, 76, 0, -34);
    tacticalIconOnRoute("ico_osman_counter", new File(tacticalDir.fsName + "/cannon_red.png"), ROUTE_OSMAN_COUNTER_SERBIA, 0.44, 62, 76, 0, 42, 23);

    incidentCluster("cluster_panagyurishte", 24.183, 42.500, "Панагюриште", COL.gold, 76, 104, 24, -22, 82, 48);
    incidentCluster("cluster_koprivshtitsa", 24.358, 42.633, "Копривштица", COL.gold, 76, 104, 22, -22, 82, 48);
    incidentCluster("cluster_perushtitsa", 24.550, 42.050, "Перуштица", COL.red, 88, 106, 22, 22, 78, 46);
    incidentCluster("cluster_batak", 24.218, 41.943, "Батак", COL.red, 88, 106, -76, 20, 78, 46);
    mapCallout("callout_april_uprising", 24.34, 42.28, "АПРЕЛЬСКОЕ ВОССТАНИЕ", "очаги в Средногорье", 76, 94, 0, -118, "friendly");
    pulseRing("pulse_batak_repression", 24.218, 41.943, COL.red, 90, 106, 38);
    pulseRing("pulse_perushtitsa_repression", 24.550, 42.050, COL.red, 90, 106, 36);

    routeTrail("r_europe_reaction", ROUTE_EUROPE_REACTION, COL.gold, 94, 102, 112);
    routeLabel("label_europe_reaction", ROUTE_EUROPE_REACTION, 0.62, "резонанс в Европе", COL.gold, 95, 112, 0, -34);
    mapCallout("callout_europe_press", 16.37, 48.21, "ЕВРОПЕЙСКАЯ ПРЕССА", "сообщения о репрессиях", 96, 112, 120, 50, "friendly");

    activeMarker("m_constantinople_conf", 28.978, 41.008, "Константинополь", COL.gold, 104, 132, -178, -20);
    mapCallout("callout_conference", 28.978, 41.008, "КОНФЕРЕНЦИЯ", "проекты реформ", 104, 120, -170, -102, "friendly");
    routeTrail("r_conference", ROUTE_CONFERENCE, COL.gold, 106, 114, 132);
    routeLabel("label_conference", ROUTE_CONFERENCE, 0.68, "дипломатическая линия", COL.gold, 106, 132, 0, -34);
    routeTrail("r_rejected_reforms", [[28.978, 41.008], [26.3, 42.0], [24.4, 42.3]], COL.red, 119, 126, 134);
    routeLabel("label_rejected", [[28.978, 41.008], [26.3, 42.0], [24.4, 42.3]], 0.45, "отказ Порты", COL.red, 119, 134, 0, 34);

    incidentCluster("cluster_bosnia_austro_hint", 18.42, 43.86, "Босния", COL.gold, 132, 154, 28, -18, 86, 50);
    mapCallout("callout_austro_deal", 18.42, 43.86, "НЕЙТРАЛИТЕТ", "Австро-Венгрия получает свободу рук в Боснии", 132, 154, 210, -72, "friendly");
    routeTrail("r_russia_through_romania", ROUTE_BESSARABIA_DANUBE, COL.blue, 146, 160, 176);
    routeLabel("label_russia_through_romania", ROUTE_BESSARABIA_DANUBE, 0.52, "проход через Румынию", COL.blue, 146, 176, 0, -38);
    movingMedallion("cmd_nikolai_prep", new File(portraitDir.fsName + "/nikolai_nikolaevich_medallion.png"), ROUTE_BESSARABIA_DANUBE, "Николай Николаевич", "Дунайская армия", 148, 160, 176, "friendly");
    activeMarker("m_iasi", 27.590, 47.158, "Яссы", COL.blue, 146, 176, 20, -18);
    activeMarker("m_ploiesti", 26.017, 44.944, "Плоешти", COL.blue, 146, 176, 20, -18);
    activeMarker("m_bucharest_1877", 26.102, 44.426, "Бухарест", COL.gold, 146, 176, 20, -18);

    routeTrail("r_lower_danube_demo", ROUTE_LOWER_DANUBE_DEMO, COL.blue, 158, 166, 174);
    routeLabel("label_lower_danube_demo", ROUTE_LOWER_DANUBE_DEMO, 0.58, "демонстрация у нижнего Дуная", COL.blue, 158, 174, 0, -38);
    tacticalIconOnRoute("ico_demo_flag", new File(tacticalDir.fsName + "/objective_flag_blue.png"), ROUTE_LOWER_DANUBE_DEMO, 0.60, 158, 174, 0, -40, 22);
    activeMarker("m_galati", 28.050, 45.435, "Галац", COL.blue, 156, 174, 20, -22);
    activeMarker("m_braila", 27.970, 45.269, "Брэила", COL.blue, 156, 174, 20, 20);

    incidentCluster("cluster_svishtov_bridgehead_v21", 25.350, 43.620, "плацдарм", COL.blue, 170, 186, 54, 48, 76, 46);
    activeMarker("m_zimnitsa_v21", 25.367, 43.656, "Зимница", COL.blue, 170, 186, -108, -34);
    activeMarker("m_svishtov_v21", 25.350, 43.620, "Свиштов", COL.blue, 170, 186, 42, 38);
    geoLabel("river_danube_crossing_v21", 25.355, 43.648, "Дунай", [0.76, 0.92, 1.0], 170, 186, -4, -52, 18);
    routeTrail("r_zimnitsa_svishtov_v21", ROUTE_ZIMNITSA_SVISHTOV, COL.blue, 171, 178, 186);
    routeLabel("label_zimnitsa_svishtov", ROUTE_ZIMNITSA_SVISHTOV, 0.45, "ночная переправа", COL.blue, 171, 186, 0, -70);
    movingMedallion("cmd_dragomirov_proxy", new File(portraitDir.fsName + "/nikolai_nikolaevich_medallion.png"), ROUTE_ZIMNITSA_SVISHTOV, "передовые части", "переправа", 171, 178, 186, "friendly");

    path("ui_top_rule", [[54, 124], [1866, 124]], false, null, COL.gold, 2, 72, false);

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
