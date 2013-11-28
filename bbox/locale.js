/**
 * html i18n: sets language-specific text as content for all tags with a "data-i18n" attribute,
 * the attribute value is the key to a locale lookup (loaded e.g. from locale/en.js, see OpenLayers.Lang)
 */
(function() {

	var i18nEleList = document.querySelectorAll('[data-i18n]');
	for (var i = 0; i < i18nEleList.length; i++) {
		var ele = i18nEleList[i];
		var key = ele.getAttribute('data-i18n');
		ele.innerHTML = OpenLayers.i18n(key);
	}

})();