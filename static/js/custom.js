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

        var options = {
            delay: {'show' : 800, 'hide' : 50 },
            placement: 'top'
        };
        $('[data-toggle="tooltip"]').tooltip(options);
    }
});

