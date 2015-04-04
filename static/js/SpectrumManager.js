/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Manages everything relating to the bottom spectrum bar
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.SpectrumManager = {
        markerWidth: 18,
        currentXval: -1
    };
    nr.SpectrumManager.handleClick = function(event) {
        var totalWidth = nr.$elems.spectrum.width();
        var xVal = Math.max(1, Math.min(totalWidth, event.pageX - this.markerWidth));
        var genreCount = nr.StationsManager.getGenreCount();
        var genreNum = Math.min(Math.round((xVal / totalWidth) * genreCount), genreCount - 1);
        if (nr.StationsManager.setActiveGenre(genreNum)) {
            nr.StationChanger.nextStation();
        } else {
            this.updateMarker();
        }
    };
    nr.SpectrumManager.updateMarker = function() {
        var genreNum = nr.StationsManager.getActiveGenre();
        var genreCount = nr.StationsManager.getGenreCount();
        var totalWidth = nr.$elems.spectrum.width();
        var xCoord = Math.round((totalWidth * genreNum) / genreCount);
        nr.$elems.spectrumMarker.show();
        nr.$elems.spectrumMarker.velocity('stop', true).velocity({translateX: xCoord + "px"});
        this.currentXval = xCoord;
    };
    nr.SpectrumManager.hoverHandler = function() {
        var totalWidth = $(window).width();
        var genreCount = nr.StationsManager.getGenreCount();
        var _this = this;
        nr.$elems.spectrumClickBar.bind('mousemove', function(event) {
            var xVal = Math.max(1, Math.min(totalWidth, event.pageX - _this.markerWidth));
            xVal = Math.round((xVal / totalWidth) * genreCount) * (totalWidth / genreCount);
            if (xVal === _this.currentXval) return;
            _this.currentXval = xVal;
            nr.$elems.spectrumMarker.velocity('stop', true).velocity({translateX: xVal + "px"});
        }).bind('mouseout', this.updateMarker.bind(nr.SpectrumManager));
    };
    $(document).ready(function () {
        var canvas = nr.$elems.spectrum[0];
        var ctx = canvas.getContext("2d");
        function drawLine(color, x, y) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x,0);
            ctx.lineTo(x,y);
            ctx.stroke();
        }
        for (var i = 0; i < canvas.width; ++i) {
            var ratio = i / canvas.width;
            var hue = Math.floor(360 * ratio);
            drawLine(nr.Utils.hsvToRgb(hue, 30, 99), i, canvas.height);
        }
    });
    return nr;
}(Nowradio || {}));
