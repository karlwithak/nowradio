/*global $:false */

/**
 * Manages the background color and it's animations.
 */
var NowRadio = (function(nr) {
    'use strict';
    var isBright = true;
    function updateColors(color) {
        if (isBright) {
            nr.ColorManager.setElemBgToColor(nr.$elems.newFaveBox, color);
            nr.$elems.metaThemeColor.attr('content', color);
        } else {
            nr.ColorManager.setElemBgToColor(nr.$elems.navBar, color);
            nr.ColorManager.setElemFgToColor(nr.$elems.stationInfo, color);
            nr.ColorManager.setElemBgToColor(nr.$elems.newFaveBox, color);
            nr.$elems.metaThemeColor.attr('content', "#000000");
        }
    }

    nr.ColorManager = {};
    nr.ColorManager.updateToGenreColor = function() {
        updateColors(this.currentGenreColor());
    };
    nr.ColorManager.setToNeutral = function() {
        if (isBright) {
            nr.$elems.navBar.velocity('stop', true).velocity({
                backgroundColor: '#ddd',
                text: '#ddd'
            }, 50);
        }
        nr.$elems.newFaveBox.css("background-color", "#ddd");
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
