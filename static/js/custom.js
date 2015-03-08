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

    $("span.buttonIcon").hover(turnGrey, turnBlack);
    $("span.faveRemove").hover(turnLightGrey, turnWhite);

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
});

