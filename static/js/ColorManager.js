/*global $:false */

/**
 * Manages the background color and it's animations.
 */
var NowRadio = (function(nr) {
    'use strict';
    var isBright = true;
    function updateColors(color) {
        if (isBright) {
            nr.ColorManager.setElemBgToColor(nr.$elems.centerContainer, color);
            nr.ColorManager.setElemBgToColor(nr.$elems.newFaveBox, color);
            nr.$elems.metaThemeColor.attr('content', color);
        } else {
            nr.ColorManager.setElemBgToColor(nr.$elems.navBar, color);
            nr.ColorManager.setElemFgToColor(nr.$elems.stationInfo, color);
            nr.ColorManager.setElemBgToColor(nr.$elems.newFaveBox, color);
            nr.$elems.metaThemeColor.attr('content', "#000000");
        }
    }
    function switchBrightness() {
        if (isBright) {
            isBright = false;
            nr.$elems.centerContainer.velocity('finish');
            nr.$elems.centerContainer.css("background-color", "black");
            nr.$elems.navBar.css("color", "black");
            nr.$elems.landingContainer.css("color", "white");
            nr.ColorManager.updateToGenreColor();
            nr.$elems.metaThemeColor.attr('content', "#000000");
        } else {
            isBright = true;
            nr.$elems.navBar.velocity('finish');
            nr.$elems.navBar.css("backgroundColor", "black");
            nr.$elems.navBar.css("color", "white");
            nr.$elems.stationInfo.css("color", "black")
                .css("border-color", "black");
            nr.$elems.landingContainer.css("color", "black");
            nr.ColorManager.updateToGenreColor();
            nr.$elems.metaThemeColor.attr('content', nr.ColorManager.currentGenreColor());
        }
    }

    nr.ColorManager = {};
    nr.ColorManager.updateToGenreColor = function() {
        updateColors(this.currentGenreColor());
    };
    nr.ColorManager.setToNeutral = function() {
        if (isBright) {
            nr.$elems.centerContainer.velocity({
                backgroundColor: '#aaa'
            }, 50);
        } else {
            nr.$elems.navBar.velocity({
                backgroundColor: '#aaa',
                text: '#aaa'
            }, 50);
        }
        nr.$elems.newFaveBox.css("background-color", "#aaa");
    };
    nr.ColorManager.setElemBgToColor = function(elem, color) {
        elem.velocity('finish').velocity({
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
    $(document).ready(function() {
        nr.$buttons.brightness.click(switchBrightness);
    });

    return nr;
}(NowRadio || {}));
