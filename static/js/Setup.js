/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

var Nowradio = (function(nr) {
    'use strict';
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
        'spectrum'         : $('img#spectrum'),
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
        'centerContainer'  : $('div.verticalCenter')
    };


    /**
     * Setup and listeners
     */
    $(document).ready(function() {
        nr.$buttons.stop.click(nr.MainController.playingStateStop.bind(nr.MainController));
        nr.$buttons.play.click(nr.MainController.playingStateReload.bind(nr.MainController));
        nr.$buttons.nextStation.click(nr.StationChanger.nextStation.bind(nr.StationChanger));
        nr.$buttons.nextGenre.click(nr.StationChanger.nextGenre.bind(nr.StationChanger));
        nr.$buttons.prevStation.click(nr.StationChanger.prevStation.bind(nr.StationChanger));
        nr.$buttons.prevGenre.click(nr.StationChanger.prevGenre.bind(nr.StationChanger));
        nr.$buttons.mute.click(nr.VolumeManager.soundOff.bind(nr.VolumeManager));
        nr.$buttons.unmute.click(nr.VolumeManager.soundOn.bind(nr.VolumeManager));
        nr.$buttons.bigPlay.click(nr.StationChanger.nextStation.bind(nr.StationChanger));
        nr.$buttons.brightness.click(nr.ColorManager.switchBrightness.bind(nr.ColorManager));
        nr.$elems.player.bind('canplay', nr.MainController.readyToPlay.bind(nr.MainController));
        nr.$elems.player.bind('error', function (e) {
            window.console.error(e);
        });
        nr.$elems.spectrumClickBar.click(nr.SpectrumManager.handleClick.bind(nr.SpectrumManager));
        nr.$buttons.info.click(function () {
           window.open('/info/', '_blank');
        });


        if (window.location.hash.length !== 0) {
            nr.UrlManager.restoreFromHash();
        }
    });

    return nr;
}(Nowradio || {}));
