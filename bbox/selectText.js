// Sets the selection to all text content of the given DOM node, when nothing is selected yet.
// Allows convenient selection of an element's text, e.g. with a single click when called from a click handler.
function selectText(node) {
    if (typeof window.getSelection === 'undefined') {
        // IE8
        var range = document.selection.createRange();
        if (!range.text) {
            range.moveToElementText(node);
            range.select();
        }
    } else {
        if (window.getSelection().isCollapsed) {
            window.getSelection().selectAllChildren(node);
        }
    }
}
