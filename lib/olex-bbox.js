/*

olex - my OpenLayers 2.x EXtensions
https://github.com/nrenner/olex

Copyright (c) 2012-2013, Norbert Renner. All rights reserved. 2-clause BSD License

Portions derived from OpenLayers code and examples:
Copyright 2005-2012 OpenLayers Contributors. All rights reserved. 2-clause BSD License

For full license text and contributors list see:
https://github.com/nrenner/olex/LICENSE
https://github.com/nrenner/olex/licences/openlayers-authors.txt

*/

OpenLayers.Control.LayerSwitcherBorder = OpenLayers.Class(OpenLayers.Control.LayerSwitcher, {

    borderDiv: null,

    initialize: function(options) {
        OpenLayers.Control.LayerSwitcher.prototype.initialize.apply(this, arguments);
    },

    draw: function() {
        this.borderDiv = OpenLayers.Control.prototype.draw.apply(this);
        this.div = null;
        /*
        this.borderDiv = document.createElement("div");
        //OpenLayers.Element.addClass(this.borderDiv, "border");
        OpenLayers.Element.addClass(this.borderDiv, this.displayClass);
        if (!this.allowSelection) {
            this.borderDiv.className += " olControlNoSelect";
            this.borderDiv.setAttribute("unselectable", "on", 0);
            this.borderDiv.onselectstart = OpenLayers.Function.False; 
        }    
        */

        OpenLayers.Control.LayerSwitcher.prototype.draw.apply(this);
        
        //this.div.style.width = this.borderDiv.style.width;
        //this.borderDiv.style.width = "auto";
        this.div.className = "layerSwitcherDiv";
        this.div.style.position = "";
        //OpenLayers.Element.addClass(this.div, "layerSwitcherDiv");
        //this.borderDiv.id = this.div.id;
        this.div.id = this.div.id + "_layerSwitcherDiv";
        
        this.maximizeDiv.style.position = "";

        this.borderDiv.appendChild(this.div);
        
//        OpenLayers.Util.modifyAlphaImageDiv(this.maximizeDiv, null, null, {w: 22, h: 22});
        
        return this.borderDiv;
    },

    maximizeControl: function(e) {

        // set the div's width and height to empty values, so
        // the div dimensions can be controlled by CSS
//        this.div.style.width = "";
//        this.div.style.height = "";
        this.layersDiv.style.display = "";

        this.showControls(false);

        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },

    minimizeControl: function(e) {

        // to minimize the control we set its div's width
        // and height to 0px, we cannot just set "display"
        // to "none" because it would hide the maximize
        // div
//        this.div.style.width = "0px";
//        this.div.style.height = "0px";
        this.layersDiv.style.display = "none";

        this.showControls(true);

        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    }

    // CLASS_NAME: keep parent name because CSS classes are named after this
});
OpenLayers.Control.HoverAndSelectFeature = OpenLayers.Class(OpenLayers.Control.SelectFeature, {
    initialize : function(layers, options) {
        this.hover = true;
        OpenLayers.Control.SelectFeature.prototype.initialize.apply(this, [ layers, options ]);

        // allow map panning while feature hovered or selected
        this.handlers['feature'].stopDown = false;
        this.handlers['feature'].stopUp = false;
    },

    clickFeature : function(feature) {
        if (this.hover) {
            this.hover = false;
            if (!this.highlightOnly) {
                // feature already selected by hover, unselect before calling super,
                // which is done to allow select handler to distinguish between hover and click
                this.unselect(feature);
            }
        }
        OpenLayers.Control.SelectFeature.prototype.clickFeature.apply(this, [ feature ]);
    },

    clickoutFeature : function(feature) {
        OpenLayers.Control.SelectFeature.prototype.clickoutFeature.apply(this, [ feature ]);
        this.hover = true;
    },

    CLASS_NAME : "OpenLayers.Control.HoverAndSelectFeature"
});
var bbox = (function() {

    var drawFeature, transform;
    var map, bboxLayer;

    /**
     * update, activate, deactivate
     */
    var callbacks;

    var style = {
        "default" : {
            fillColor : "#FFD119",
            fillOpacity : 0.1,
            strokeWidth : 2,
            strokeColor : "#333",
            strokeDashstyle : "solid",
            // reset to avoid overriding DragFeature classes
            cursor: ""
        },
        "select" : {
            fillOpacity : 0.2,
            strokeWidth : 2.5,
            // pointer cursor on hover
            cursor: "pointer"
        },
        "temporary" : {
            fillColor : "#FFD119",
            fillOpacity : 0.1,
            strokeDashstyle : "longdash"
        },
        "transform" : {
            display : "${getDisplay}",
            cursor : "${role}",
            pointRadius : 6,
            fillColor : "rgb(158, 158, 158)",
            fillOpacity : 1,
            strokeColor : "#333",
            strokeWidth : 2,
            strokeOpacity : 1
        }
    };

    function createStyleMap() {

        var styleMap = new OpenLayers.StyleMap({
            //"default" : new OpenLayers.Style(defaultStyle),
            "default" : new OpenLayers.Style(style["default"]),
            "select" : new OpenLayers.Style(style["select"]),
            "temporary" : new OpenLayers.Style(style["temporary"]),
            // render intent for TransformFeature control
            "transform" : new OpenLayers.Style(style["transform"], {
                context : {
                    getDisplay : function(feature) {
                        // Hide transform box, as it's styling is limited because of underlying bbox feature.
                        // Instead, the render intent of the bbox feature is assigned separately.
                        return feature.geometry.CLASS_NAME === "OpenLayers.Geometry.LineString" ? "none" : "";
                    },
                }
            })
        });
        /* debug
        var orig = OpenLayers.StyleMap.prototype.createSymbolizer;
        OpenLayers.StyleMap.prototype.createSymbolizer = function(feature, intent) {
            var ret = orig.apply(this, arguments);
            console.log(intent + '( ' + this.extendDefault + '): ' + JSON.stringify(ret));
            return ret;
        };
        */

        return styleMap;
    }

    function featureInsert(feature) {
        drawFeatureDeactivate();
        callbacks.update(getBBox(feature));
    }

    function onTransformComplete(evt) {
        callbacks.update(getBBox(evt.feature));
    }

    function drawFeatureActivate() {
        drawFeature.activate();
        if (transform.active) {
            transform.deactivate();
        }
        bboxLayer.destroyFeatures();

        // crosshair cursor
        OpenLayers.Element.addClass(map.viewPortDiv, "olDrawBox");

        callbacks.activate();
    }

    function drawFeatureDeactivate() {
        drawFeature.deactivate();

        // default cursor (remove crosshair cursor)
        OpenLayers.Element.removeClass(map.viewPortDiv, "olDrawBox");

        callbacks.deactivate();
    }

    function switchActive() {
        if (!drawFeature.active) {
            drawFeatureActivate();
        } else {
            drawFeatureDeactivate();
        }
    }

    function addControls(pMap, pBboxLayer, pCallbacks) {

        callbacks = pCallbacks;
        bboxLayer = pBboxLayer;
        map = pMap;

        // draw control
        /* TODO: use feature label or popup to update coordinates while drawing
        var onMove = function(geometry) {
            updateInfo(new OpenLayers.Feature.Vector(geometry));
        };
        */
        var polyOptions = {
            irregular : true,
            // allow dragging beyond map viewport 
            documentDrag : true
        };
        drawFeature = new OpenLayers.Control.DrawFeature(bboxLayer, OpenLayers.Handler.RegularPolygon, {
            handlerOptions : polyOptions
        /* 
        ,callbacks : {
            move : onMove
        }
        */
        });
        drawFeature.featureAdded = featureInsert;
        map.addControl(drawFeature);

        // feature edit control (move and resize), activated by select control
        transform = new OpenLayers.Control.TransformFeature(bboxLayer, {
            renderIntent : "transform",
            rotate : false,
            irregular : true
        });
        transform.events.register("transformcomplete", transform, onTransformComplete);
        map.addControl(transform);

        // select control
        // - highlight feature on hover to indicate that it is clickable
        // - activate editing on click (select), deactivate editing on click on map (unselect)
        var select = new OpenLayers.Control.HoverAndSelectFeature(bboxLayer, {
            hover : true,
            highlightOnly : true,
            onSelect : function(feature) {
                select.unhighlight(feature);
                transform.setFeature(feature);
                feature.renderIntent = "temporary";
                bboxLayer.drawFeature(feature);
            },
            onUnselect : function(feature) {
                transform.unsetFeature();
                feature.renderIntent = "default";
                bboxLayer.drawFeature(feature);
            }
        });

        map.addControl(select);
        select.activate();
    }

    function getBBox(feature) {
        return roundAndTransform(feature.geometry.getBounds());
    }

    // custom float.toFixed function that rounds to integer when .0
    // see OpenLayers.Bounds.toBBOX
    function toFixed(num) {
        var decimals = Math.floor(map.getZoom() / 3);
        var multiplier = Math.pow(10, decimals);

        return Math.round(num * multiplier) / multiplier;
    };

    function roundAndTransform(aBounds) {
        var bounds = aBounds.clone().transform(map.getProjectionObject(), map.displayProjection);

        // (left, bottom, right, top)
        var box = new OpenLayers.Bounds(
            toFixed(bounds.left),
            toFixed(bounds.bottom),
            toFixed(bounds.right),
            toFixed(bounds.top)
        );
        
        return box;
    }

    function addBBoxFromViewPort() {
        var bounds = map.getExtent();
        bboxLayer.addFeatures([new OpenLayers.Feature.Vector(bounds.toGeometry())]);

        return roundAndTransform(bounds);
    }

    return {
        style: style,
        createStyleMap : createStyleMap,
        addControls : addControls,
        switchActive : switchActive,
        addBBoxFromViewPort : addBBoxFromViewPort,
        toFixed: toFixed
    };
})();