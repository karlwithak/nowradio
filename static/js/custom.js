/*global $:false */

$(function() {
    "use strict";
    $("#infoButton").click(function () {
       window.open('/info/', '_blank');
    });

    function turnGrey(elem) {
        $(elem.target).css("color", "#505050");
    }
    function turnLightGrey(elem) {
        $(elem.target).css("color", "#EEEEEE");
    }
    function turnWhite(elem) {
        $(elem.target).css("color", "#ffffff");
    }
    function turnBlack(elem) {
        $(elem.target).css("color", "#000000");
    }

    // enable tooltips and hover listeners if this is not a mobile device
    if(!('ontouchstart' in window)) {
        $("span.playerButtonIcon").hover(turnGrey, turnBlack);
        $("span.faveRemove").hover(turnLightGrey, turnWhite);
    }
});

