/*global $:false */
/*jshint -W116 */

/**
 * Manages everything relating to the bottom spectrum bar
 */
var NowRadio = (function(nr) {
    'use strict';
    var markerWidth = 18;
    var currentXval = -1;
    function handleClick(event) {
        var totalWidth = nr.$elems.spectrum.width();
        var xVal = Math.max(1, Math.min(totalWidth, event.pageX - markerWidth));
        var genreCount = nr.StationsManager.getGenreCount();
        var genreNum = Math.min(Math.round((xVal / totalWidth) * genreCount), genreCount - 1);
        if (nr.StationsManager.setActiveGenre(genreNum)) {
            nr.StationChanger.nextStation();
        } else {
            nr.SpectrumManager.updateMarker();
        }
    }

    nr.SpectrumManager = {};
    nr.SpectrumManager.updateMarker = function() {
        var genreNum = nr.StationsManager.getActiveGenre();
        var genreCount = nr.StationsManager.getGenreCount();
        var totalWidth = nr.$elems.spectrum.width();
        var xCoord = Math.round((totalWidth * genreNum) / genreCount);
        nr.$elems.spectrumMarker.show();
        nr.$elems.spectrumMarker.velocity('stop', true).velocity({translateX: xCoord + "px"});
        currentXval = xCoord;
    };
    nr.SpectrumManager.hoverHandler = function() {
        var totalWidth = $(window).width();
        var genreCount = nr.StationsManager.getGenreCount();
        nr.$elems.spectrumClickBar.bind('mousemove', function(event) {
            var xVal = Math.max(1, Math.min(totalWidth, event.pageX - markerWidth));
            xVal = Math.round((xVal / totalWidth) * genreCount) * (totalWidth / genreCount);
            if (xVal === currentXval) return;
            currentXval = xVal;
            nr.$elems.spectrumMarker.velocity('stop', true).velocity({translateX: xVal + "px"});
        }).bind('mouseout', this.updateMarker.bind(nr.SpectrumManager));
    };
    $(document).ready(function() {
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

        nr.$elems.spectrumClickBar.click(handleClick);
    });
    return nr;
}(NowRadio || {}));
