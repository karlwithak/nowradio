/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Handles all player controller buttons and actions. Responsible for station changes and play
 * state changes.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.MainController = {
        changeStationTimeout : -1,
        initialStationsHaveLoaded : false
    };
    nr.MainController.changeTimeout = function() {
        nr.StationsManager.removeCurrentThenNext();
        clearTimeout(this.changeStationTimeout);
    };
    nr.MainController.readyToPlay = function() {
        clearTimeout(this.changeStationTimeout);
        nr.ColorManager.setToGenreColor();
        this.playingStatePlay();
        nr.SpectrumManager.updateMarker();
    };
    nr.MainController.initialStationsLoaded = function() {
        nr.$elems.loader.hide();
        nr.$buttons.bigPlay.show();
        nr.FaveManager.initOldFaves();
        nr.SpectrumManager.updateMarker();
        nr.SpectrumManager.hoverHandler();
        this.initialStationsHaveLoaded = true;
    };
    nr.MainController.hideLandingPage = function() {
        nr.$elems.landingContainer.hide();
        nr.$elems.mainContainer.show();
        nr.FaveManager.showHideNewFaveBox();
    };
    nr.MainController.updateViewForNewSource = function(src) {
        nr.UrlManager.setUrlHash(src);
        nr.SpectrumManager.updateMarker();
        nr.$elems.player.attr('src', nr.UrlManager.getMediaUrl());
        nr.MainController.playingStateReload();
        nr.ColorManager.setToNeutral();
        nr.FaveManager.showPlayingFave();
        nr.SongNameManager.updateName(true);
        nr.SongNameManager.animateClosed();
        this.hideLandingPage();

        clearTimeout(this.changeStationTimeout);
        this.changeStationTimeout = setTimeout(this.changeTimeout, 10000);
    };
    nr.MainController.playingStateStop = function() {
        nr.$buttons.stop.hide();
        nr.$buttons.play.show();
        nr.$elems.player[0].pause();
        nr.SongNameManager.animateClosed();
    };
    nr.MainController.playingStatePlay = function() {
        nr.SongNameManager.animateOpen();
        nr.$elems.player[0].play();
    };
    nr.MainController.playingStateToggle = function() {
        if (nr.MainController.playingStateIsPlaying()) {
            nr.MainController.playingStateStop();
        } else {
            nr.MainController.playingStateReload();
        }
    };
    nr.MainController.playingStateReload = function() {
        nr.$buttons.play.hide();
        nr.$buttons.stop.show();
        nr.$elems.player[0].load();
    };
    nr.MainController.playingStateIsPlaying = function() {
        return !nr.$elems.player[0].paused;
    };
    nr.MainController.stationPlayingChecker = function() {
        if (_skipThisCheck()) return;
        var timeCheckStart = nr.$elems.player[0].played.end(0);
        window.setTimeout(_playingChecker, 1000);
        function _playingChecker() {
            if (_skipThisCheck()) return;
            if (nr.$elems.player[0].played.end(0) === timeCheckStart) {
                // There was no change in played time, so something is wrong, try to reload
                nr.MainController.playingStateReload();
            }
        }
        function _skipThisCheck() {
            return !nr.MainController.playingStateIsPlaying() ||
                    nr.$elems.player[0].currentTime === null ||
                    nr.$elems.player[0].currentTime < 1 ||
                    nr.$elems.player[0].played.length < 1;
        }
    };
    $(document).ready(function () {
        window.setInterval(nr.MainController.stationPlayingChecker.bind(nr.MainController), 5000);
    });

    return nr;
}(Nowradio || {}));
