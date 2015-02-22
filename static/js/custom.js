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
});

