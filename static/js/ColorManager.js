/*global $:false */

/**
 * Manages the background color and it's animations.
 */
var NowRadio = (function(nr) {
    'use strict';
    function updateColors(color) {
        nr.ColorManager.setElemBgToColor(nr.$elems.navBar, color);
        nr.ColorManager.setElemFgToColor(nr.$elems.stationInfo, color);
        nr.ColorManager.setElemBgToColor(nr.$elems.newFaveBox, color);
        nr.$elems.metaThemeColor.attr('content', "#000000");
        nr.$elems.navBar.css("color", "black");
    }

    nr.ColorManager = {};
    nr.ColorManager.updateToGenreColor = function() {
        updateColors(this.currentGenreColor());
    };
    nr.ColorManager.setToNeutral = function() {
        nr.$elems.newFaveBox.css("background-color", "#ddd");
        nr.$elems.navBar.css("backgroundColor", "#ddd");
    };
    nr.ColorManager.setElemBgToColor = function(elem, color) {
        elem.velocity('stop', true).velocity({
            'backgroundColor': color
        }, 666);
    };
    nr.ColorManager.setElemFgToColor = function(elem, color) {
        elem.css({
            'color': color,
            'border-color': color
        });
    };
    nr.ColorManager.currentGenreColor = function() {
        return nr.Utils.genreNumToColor(nr.StationsManager.getActiveGenre());
    };

    return nr;
}(NowRadio || {}));
