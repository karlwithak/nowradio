/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Manages the background color and it's animations.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.ColorManager = {
        isBright: true
    };
    nr.ColorManager.updateToGenreColor = function () {
        nr.ColorManager.updateColors(this.currentGenreColor());
    };
    nr.ColorManager.updateColors = function (color) {
        if (this.isBright) {
            this.setElemBgToColor(nr.$elems.centerContainer, color);
            this.setElemBgToColor(nr.$elems.newFaveBox, color);
            $('meta[name="theme-color"]').attr('content', color);
        } else {
            this.setElemBgToColor(nr.$elems.navBar, color);
            this.setElemFgToColor(nr.$elems.stationInfo, color);
            this.setElemBgToColor(nr.$elems.newFaveBox, color);
            $('meta[name="theme-color"]').attr('content', "#000000");
        }
    };
    nr.ColorManager.setToNeutral = function () {
        if (this.isBright) {
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
    nr.ColorManager.setElemBgToColor = function (elem, color) {
        elem.velocity('finish').velocity({
            'backgroundColor': color
        }, 666);
    };
    nr.ColorManager.setElemFgToColor = function (elem, color) {
        elem.css({
            'color': color,
            'border-color': color
        });
    };
    nr.ColorManager.switchBrightness = function () {
        if (this.isBright) {
            this.isBright = false;
            nr.$elems.centerContainer.velocity('finish');
            nr.$elems.centerContainer.css("background-color", "black");
            nr.$elems.navBar.css("color", "black");
            nr.$elems.landingContainer.css("color", "white");
            this.updateToGenreColor();
            $('meta[name="theme-color"]').attr('content', "#000000");
        } else {
            this.isBright = true;
            nr.$elems.navBar.velocity('finish');
            nr.$elems.navBar.css("backgroundColor", "black");
            nr.$elems.navBar.css("color", "white");
            nr.$elems.stationInfo.css("color", "black")
                .css("border-color", "black");
            nr.$elems.landingContainer.css("color", "black");
            this.updateToGenreColor();
            $('meta[name="theme-color"]').attr('content', this.currentGenreColor());
        }
    };
    nr.ColorManager.currentGenreColor = function () {
        return nr.Utils.genreNumToColor(nr.StationsManager.getActiveGenre());
    };

    return nr;
}(Nowradio || {}));
