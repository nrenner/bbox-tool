(function() {

    var t = OpenLayers.i18n;

    var map;
    var bboxLayer;
    var epsg4326 = new OpenLayers.Projection("EPSG:4326");

    function updateInfo(bounds) {
        var wkt = new OpenLayers.Format.WKT();
        wkt.extract['point'] = function(point) {
            return bbox.toFixed(point.x) + ' ' + bbox.toFixed(point.y);
        };

        if (bounds) {
            var infoHtml = '';

            // formats
            var table = [];
            table.push([ t('comma'), '${left},${bottom},${right},${top}',
                    t('commaComment') + ' - <br/>api, xapi, mapnik, maperitive, osmconvert' ]);
            table.push([ t('space'), '${left} ${bottom} ${right} ${top}', t('spaceComment') ]);
            table.push([ 'osmosis', 'left=${left} bottom=${bottom} right=${right} top=${top}' ]);
            table.push([ 'overpass ql', '(${bottom},${left},${top},${right})' ]); //(s,w,n,o)
            table.push([ 'overpass xml', '&ltbbox-query e="${right}" n="${top}" s="${bottom}" w="${left}"/&gt' ]);
            table.push([ 'wkt', wkt.write(new OpenLayers.Feature.Vector(bounds.toGeometry()), true) ]);
            var osmLink = 'http://www.openstreetmap.org/?&box=yes&minlon=${left}&minlat=${bottom}&maxlon=${right}&maxlat=${top}';
            table.push([ 'osm.org',
                    '<a href="' + osmLink + '" target="_blank">http://www.openstreetmap.org/?&box=yes& ...</a>' ]);

            // rendering
            infoHtml += '<table>';
            for (var i = 0; i < table.length; i++) {
                var row = table[i];
                var formatted = OpenLayers.String.format(row[1], bounds);
                infoHtml += '<tr><th>' + row[0] + '</th>';
                infoHtml += '<td><div onclick="selectText(this)">' + formatted + '</div>';
                if (row.length === 3) {
                    infoHtml += '<div class="comment">' + row[2] + '</div>';
                }
                infoHtml += '</td></tr>';
            }
            infoHtml += '</table>';

            document.getElementById("info-start").className = 'hidden';
            document.getElementById("info-header").className = '';
            document.getElementById("info-result").innerHTML = infoHtml;
        } else {
            document.getElementById("info-start").className = '';
            document.getElementById("info-header").className = 'hidden';
            document.getElementById("info-result").innerHTML = '';
        }

    }

    function drawActivate() {
        OpenLayers.Element.addClass(document.getElementById('info-border'), 'hidden');
        document.getElementById('draw-button').className = 'pressed';
        updateInfo(null);
    }

    function drawDeactivate() {
        OpenLayers.Element.removeClass(document.getElementById('info-border'), 'hidden');
        document.getElementById('draw-button').className = 'default';
    }

    function init() {

        OpenLayers.ImgPath = "lib/openlayers/img/";

        var options = {
            controls : [],
            theme : null,
            projection : new OpenLayers.Projection("EPSG:900913"),
            displayProjection : epsg4326
        };

        map = new OpenLayers.Map('mapdiv', options);

        map.addControl(new OpenLayers.Control.ArgParser());
        map.addControl(new OpenLayers.Control.Attribution());
        map.addControl(new OpenLayers.Control.LayerSwitcherBorder());
        map.addControl(new OpenLayers.Control.MousePosition());
        map.addControl(new OpenLayers.Control.Navigation({
            dragPanOptions : {
                enableKinetic : true
            }
        }));
        map.addControl(new OpenLayers.Control.Zoom());
        map.addControl(new OpenLayers.Control.Permalink());

        var graticule = new OpenLayers.Control.Graticule({
            numPoints : 2,
            visible : false
        });
        graticule.labelSymbolizer.fontSize = '12px';
        map.addControl(graticule);

        var giscienceAttribution = 
              '<br/><a href="https://giscience.uni-hd.de">GIScience Research Group</a> @ University of Heidelberg '
            + '(<a href="https://heigit.org/contact">info</a>), '
            + 'Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, '
            + 'licensed under <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>';

        map.addLayer(new OpenLayers.Layer.OSM(
                "OpenMapSurfer OSM Roads",
                'https://maps.heigit.org/openmapsurfer/tiles/roads/webmercator/${z}/${x}/${y}.png',
                {
                    tileOptions : {
                        crossOriginKeyword : null
                    }, 
                    transitionEffect : "resize",
                    attribution : giscienceAttribution
                }));

        map.addLayer(new OpenLayers.Layer.OSM("OSM Mapnik", null, {
            transitionEffect : "resize"
        }));

        // bbox vector layer for drawing
        bboxLayer = new OpenLayers.Layer.Vector("box", {
            styleMap : bbox.createStyleMap()
        });
        map.addLayer(bboxLayer);

        // draw control(s)
        bbox.addControls(map, bboxLayer, {
            update : updateInfo,
            activate : drawActivate,
            deactivate : drawDeactivate
        });

        var onDrawClick = function(e) {
            bbox.switchActive();
        };
        document.getElementById('draw-button').onclick = onDrawClick;

        if (!map.getCenter()) {
            map.zoomToMaxExtent();
        }
    }

    init();
})();
