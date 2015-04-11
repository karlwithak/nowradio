/*global $:false */
/*jshint -W116 */

var NowRadio = (function(nr) {
    'use strict';
    /**
     * Global jQuery variables;
     */
    nr.$buttons = {
        'bigPlay'       : $('span#bigPlayButton'),
        "play"          : $('span#playButton').hide(),
        'stop'          : $('span#stopButton'),
        'nextStation'   : $('span#nextStationButton'),
        'nextGenre'     : $('span#nextGenreButton'),
        'prevStation'   : $('span#prevStationButton'),
        'prevGenre'     : $('span#prevGenreButton'),
        'mute'          : $('span#muteButton'),
        'unmute'        : $('span#unmuteButton').hide(),
        'brightness'    : $('span#brightnessButton'),
        'info'          : $("#infoButton"),
        'playerControl' : $("span.playerButtonIcon")
    };
    nr.$elems = {
        'body'             : $('body'),
        'navBar'           : $('nav.navigationBar'),
        'player'           : $('audio#player'),
        'spectrum'         : $('canvas#spectrum'),
        'mainContainer'    : $('div#mainContainer').hide(),
        'landingContainer' : $('div#landingContainer'),
        'currentSongText'  : $('span#currentSong'),
        'stationInfo'      : $('div#stationInfo'),
        'oldFaveBox'       : $('div#oldFaveBox'),
        'newFaveBox'       : $('div#newFaveBox').hide(),
        'faveAddIcon'      : $('span.faveAdd'),
        'faveRemoveIcon'   : $('span.faveRemove'),
        'favePlayIcon'     : $('span.favePlay'),
        'loader'           : $('div.stillLoading'),
        'spectrumMarker'   : $('span.spectrumMarker').hide(),
        'spectrumClickBar' : $('span.spectrumClickBar'),
        'centerContainer'  : $('div.verticalCenter'),
        'metaThemeColor'   : $('meta[name="theme-color"]'),
        'faviconLink'      : $('link#favicon')
    };


    /**
     * Setup and listeners
     */
    $(document).ready(function() {
        nr.$elems.player.bind('error', function(e) {
            window.console.log(e);
        });
        nr.$buttons.info.click(function() {
           window.open('/info/', '_blank');
        });

        if (window.location.hash.length !== 0) {
            nr.UrlManager.restoreFromHash();
        }
    });

    return nr;
}(NowRadio || {}));
