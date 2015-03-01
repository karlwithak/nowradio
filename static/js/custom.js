/*global $:false */

$(function() {
    "use strict";
    $('span#infoButton').click(function() {
        $('div#infoPanel').toggle();
        $('div#settingsPanel').hide();
    });

    $('span#settingsButton').click(function() {
        $('div#settingsPanel').toggle();
        $('div#infoPanel').hide();
    });

    $("div.customButton").hover(function () {
        $(this).css("color", "#505050");
    }, function () {
        $(this).css("color", "#000000");
    });
});

