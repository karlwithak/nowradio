/*global $:false */

/**
 * Manages the favicon and it's changing of colors;
 */
var NowRadio = (function(nr) {
    'use strict';
    var canvas, ctx;
    function drawCircle(fill) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(8, 8, 7, 0, Math.PI * 2);
        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }
    function updateToColor(color) {
        ctx.clearRect(0, 0, 16, 16);
        // Draw inner colored circle
        ctx.fillStyle = color;
        drawCircle(true);
        // Draw inner black triangle
        ctx.strokeStyle = ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(5, 4);
        ctx.lineTo(5, 12);
        ctx.lineTo(13, 8);
        ctx.fill();
        // Draw outer black circle
        drawCircle(false);

        nr.$elems.faviconLink.attr('href', canvas.toDataURL('image/png'));
    }

    nr.FaviconManager = {};
    nr.FaviconManager.updateToGenreColor = function() {
        updateToColor(nr.ColorManager.currentGenreColor());
    };
    $(document).ready(function() {
        canvas = document.createElement('canvas');
        canvas.width = canvas.height = 16;
        ctx = canvas.getContext('2d');
        updateToColor("#bbb");
    });

    return nr;
}(NowRadio || {}));