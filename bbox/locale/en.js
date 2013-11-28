/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["en"]
 * Dictionary for English.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang.en = OpenLayers.Util.applyDefaults(OpenLayers.Lang.en, {

    //
    // bbox tool
    //

    'comma': 'comma',
    'commaComment': '(left,bottom,right,top)',
    'space': 'space',
    'spaceComment': '(left bottom right top)',
    'infoStart': 'Click upper left "draw" and drag box.',
    'about': 'about',
    'contact': 'contact (via OSM)',
    'infoResult': 'Click into box to edit, abort with click on map.\x3cbr\x3e'
                  + 'Select output with a single click. New box with "draw".',
    'titleResult': 'box:',
    'draw': 'draw'
});
