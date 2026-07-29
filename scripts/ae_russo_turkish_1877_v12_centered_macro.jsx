/*
  Russo-Turkish War 1877 V12.

  Fixes from V7:
  - overscan basemap with real 1880 boundaries and Natural Earth rivers;
  - water/rivers use one blue family, countries do not use blue;
  - fake mountain hachures removed;
  - active city dots, labels and arrows are geographically locked to the map;
  - overlay sizes are stabilized with keyframes, not AE expressions;
  - persistent legend and milsymbol unit icons are included;
  - active city labels are parented locally to their dots, so labels do not fly
    outside the map during camera moves;
  - camera staging is centered on the active route/node; tiny movements use MACRO.
*/

(function () {
    app.beginUndoGroup("Create Russo-Turkish War 1877 V12 Centered Macro");

    if (!app.project) app.newProject();

    var W = 1920;
    var H = 1080;
    var FPS = 30;
    var DURATION = 92;
    var comp = app.project.items.addComp("Russo_Turkish_War_1877_V12_Centered_Macro_92s", W, H, 1, DURATION, FPS);
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

    var PLAN = { FAR: 100, MED: 145, CLOSE: 205, MACRO: 275 };
    var CAMERA_KEYS = [
        { t: 0, scale: PLAN.FAR },
        { t: 7, scale: PLAN.FAR },
        { t: 12, scale: PLAN.MED },
        { t: 19, scale: PLAN.MED },
        { t: 24, scale: PLAN.MED },
        { t: 29, scale: PLAN.MACRO },
        { t: 37, scale: PLAN.MACRO },
        { t: 42, scale: PLAN.MED },
        { t: 50, scale: PLAN.MED },
        { t: 55, scale: PLAN.MED },
        { t: 66, scale: PLAN.MED },
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
        return [px * IMG_SCALE / 100.0, py * IMG_SCALE / 100.0];
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
        var scaleProp = layer.property("Transform").property("Scale");
        for (var i = 0; i < CAMERA_KEYS.length; i++) {
            var s = 10000 / CAMERA_KEYS[i].scale;
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

    function path(name, points, closed, fill, stroke, width, opacity, parentMap) {
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
            inverseStroke(st.property("ADBE Vector Stroke Width"), width);
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
            shadowText(name + "_persistent_label", label, [p[0] + dx, p[1] + dy], isCapital ? 20 : 15, isCapital ? COL.gold : COL.muted, 0.5, DURATION, ParagraphJustification.LEFT_JUSTIFY, true, true);
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

        var sh = text(name + "_geo_label_shadow", label, [0, 0], 19, [0, 0, 0], ParagraphJustification.LEFT_JUSTIFY, false, false);
        var tx = text(name + "_geo_label", label, [0, 0], 19, COL.cream, ParagraphJustification.LEFT_JUSTIFY, false, false);
        try {
            sh.setParentWithJump(dot);
            tx.setParentWithJump(dot);
        } catch (e) {
            sh.parent = dot;
            tx.parent = dot;
        }
        sh.property("Transform").property("Position").setValue([dx + 3, dy + 3]);
        tx.property("Transform").property("Position").setValue([dx, dy]);
        fade(sh, tIn + 0.08, tOut, 58);
        fade(tx, tIn + 0.08, tOut, 100);
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
    shadowText("river_danube_label", "Дунай", xy(26.35, 43.95), 20, [0.76, 0.92, 1.0], 0.5, DURATION, ParagraphJustification.LEFT_JUSTIFY, true, true);

    mapDot("capital_bucharest", 26.102, 44.426, "Бухарест", 10, 10, -10, true);
    mapDot("capital_constantinople", 28.978, 41.008, "Константинополь", 10, 10, -10, true);
    mapDot("capital_belgrade", 20.448, 44.787, "Белград", 10, 10, -10, true);

    var rig = comp.layers.addNull();
    rig.name = "MAP_RIG_geo_locked_camera";
    rig.property("Transform").property("Anchor Point").setValue(CENTER);

    camera(rig, 0, 24.8, 44.05, PLAN.FAR);
    camera(rig, 7, 24.8, 44.05, PLAN.FAR);
    camera(rig, 12, 28.25, 47.12, PLAN.MED);
    camera(rig, 19, 28.25, 47.12, PLAN.MED);
    cameraFocus(rig, 24, 25.36, 43.64, PLAN.MED, 960, 555);
    cameraFocus(rig, 29, 25.358, 43.638, PLAN.MACRO, 960, 555);
    cameraFocus(rig, 37, 25.358, 43.638, PLAN.MACRO, 960, 555);
    cameraFocus(rig, 42, 25.12, 43.66, PLAN.MED, 930, 555);
    cameraFocus(rig, 50, 25.12, 43.66, PLAN.MED, 930, 555);
    cameraFocus(rig, 55, 25.30, 43.15, PLAN.MED, 960, 555);
    cameraFocus(rig, 66, 25.30, 43.15, PLAN.MED, 960, 555);
    cameraFocus(rig, 72, 23.75, 43.74, PLAN.MED, 960, 555);
    cameraFocus(rig, 80, 24.62, 43.42, PLAN.CLOSE, 960, 555);
    cameraFocus(rig, 88, 24.62, 43.42, PLAN.CLOSE, 960, 555);
    camera(rig, 92, 24.3, 43.4, PLAN.FAR);
    ease(rig.property("Transform").property("Position"));
    ease(rig.property("Transform").property("Scale"));

    caption(8.0, 20.0, "КИШИНЁВ -> УНГЕНЫ", "24 апреля 1877: движение к переправам через Прут.");
    activeMarker("m_kishinev", 28.835, 47.010, "Кишинёв", COL.blue, 9.0, 20.0, 24, 26);
    activeMarker("m_ungheny", 27.795, 47.209, "Унгены", COL.blue, 9.0, 20.0, -98, -22);
    route("r_kishinev_ungheny", [[28.835, 47.010], [28.32, 47.10], [27.795, 47.209]], COL.blue, 11.0, 16.0, 20.0);

    caption(25.0, 38.0, "ЗИМНИЦА -> СВИШТОВ", "27-28 июня 1877: короткая переправа через Дунай показана крупным планом.");
    activeMarker("m_zimnitsa", 25.367, 43.656, "Зимница", COL.blue, 26.0, 38.0, 28, -28);
    activeMarker("m_svishtov", 25.350, 43.620, "Свиштов", COL.blue, 26.0, 38.0, 28, 28);
    route("r_zimnitsa_svishtov", [[25.367, 43.656], [25.358, 43.638], [25.350, 43.620]], COL.blue, 28.2, 33.5, 38.0);

    caption(39.0, 51.0, "СВИШТОВ -> НИКОПОЛЬ", "Июль 1877: движение вдоль Дуная к Никополю.");
    activeMarker("m_svishtov2", 25.350, 43.620, "Свиштов", COL.blue, 40.0, 51.0, 24, 26);
    activeMarker("m_nikopol", 24.900, 43.700, "Никополь", COL.blue, 40.0, 51.0, -104, -24);
    route("r_svishtov_nikopol", [[25.350, 43.620], [25.16, 43.67], [24.900, 43.700]], COL.blue, 42.0, 47.2, 51.0);

    caption(52.0, 67.0, "СВИШТОВ -> ТЫРНОВО -> ШИПКА", "Июль 1877: выход к Балканским проходам.");
    activeMarker("m_svishtov3", 25.350, 43.620, "Свиштов", COL.red, 53.0, 67.0, 24, -28);
    activeMarker("m_tarnovo", 25.636, 43.075, "Тырново", COL.red, 53.0, 67.0, 24, 26);
    activeMarker("m_shipka", 25.320, 42.750, "Шипка", COL.red, 53.0, 67.0, -92, 28);
    route("r_svishtov_tarnovo_shipka", [[25.350, 43.620], [25.55, 43.28], [25.636, 43.075], [25.47, 42.91], [25.320, 42.750]], COL.red, 55.5, 62.8, 67.0);

    caption(68.0, 79.0, "ВИДИН -> ПЛЕВНА", "Июль 1877: Осман-паша занимает Плевну.");
    activeMarker("m_vidin", 22.872, 43.996, "Видин", COL.red, 69.0, 79.0, -78, -24);
    activeMarker("m_plevna", 24.617, 43.417, "Плевна", COL.red, 69.0, 79.0, 24, 26);
    route("r_vidin_plevna", [[22.872, 43.996], [23.48, 43.78], [24.617, 43.417]], COL.red, 71.0, 76.0, 79.0);

    caption(80.0, 91.5, "ПЛЕВНА: ОСАДА", "Июль-декабрь 1877: стрелки убраны; остаётся ключевой узел кампании.");
    activeMarker("m_plevna_siege", 24.617, 43.417, "Плевна", COL.gold, 81.0, 91.5, 24, -26);
    var plev = xy(24.617, 43.417);
    var siege = path("siege_ring_geo_locked", [[0, -60], [78, -34], [90, 34], [0, 64], [-84, 34], [-78, -34]], true, null, COL.gold, 4.5, 100, true);
    siege.property("Transform").property("Position").setValue(plev);
    inverseScale(siege);
    fade(siege, 81.0, 91.5, 100);

    path("ui_top_rule", [[54, 136], [1866, 136]], false, null, COL.gold, 2, 88, false);
    path("ui_bottom_rule", [[54, 936], [1866, 936]], false, null, COL.gold, 2, 88, false);
    text("ui_footer_title", "Русско-турецкая война 1877. V12: центр события + MACRO для коротких перемещений.", [58, 970], 23, COL.gold, ParagraphJustification.LEFT_JUSTIFY, false, false);
    text("ui_footer_note", "Тест: переправа Зимница-Свиштов должна быть крупнее и ближе к центру, без дрейфа подписей.", [58, 1002], 19, COL.muted, ParagraphJustification.LEFT_JUSTIFY, false, false);

    addLegend(scriptFolder);

    for (var i = 0; i < mapLayers.length; i++) {
        if (mapLayers[i] && mapLayers[i] !== rig && mapLayers[i].parent === null) mapLayers[i].parent = rig;
    }
    rig.moveToEnd();
    comp.openInViewer();
    app.endUndoGroup();
})();
