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
    nr.ColorManager.setToGenreColor = function () {
        if (this.isBright) {
            this.setElemBgToGenreColor(nr.$elems.centerContainer);
            this.setElemBgToGenreColor(nr.$elems.newFaveBox);
            $('meta[name="theme-color"]').attr('content', this.currentGenreColor());
        } else {
            this.setElemBgToGenreColor(nr.$elems.navBar);
            this.setElemFgToGenreColor(nr.$elems.stationInfo);
            this.setElemBgToGenreColor(nr.$elems.newFaveBox);
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
    nr.ColorManager.setElemBgToGenreColor = function (elem) {
        var color = this.currentGenreColor();
        elem.velocity('finish').velocity({
            'backgroundColor': color
        }, 666);
    };
    nr.ColorManager.setElemFgToGenreColor = function (elem) {
        var color = this.currentGenreColor();
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
            this.setToGenreColor();
            $('meta[name="theme-color"]').attr('content', "#000000");
        } else {
            this.isBright = true;
            nr.$elems.navBar.velocity('finish');
            nr.$elems.navBar.css("backgroundColor", "black");
            nr.$elems.navBar.css("color", "white");
            nr.$elems.stationInfo.css("color", "black")
                .css("border-color", "black");
            nr.$elems.landingContainer.css("color", "black");
            this.setToGenreColor();
            $('meta[name="theme-color"]').attr('content', this.currentGenreColor());
        }
    };
    nr.ColorManager.currentGenreColor = function () {
        return nr.Utils.genreNumToColor(nr.StationsManager.getActiveGenre());
    };

    return nr;
}(Nowradio || {}));
