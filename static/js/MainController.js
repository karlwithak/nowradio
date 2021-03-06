/*global $:false */
/*jshint -W116 */

/**
 * Handles all player controller buttons and actions. Responsible for station changes and play
 * state changes.
 */
var NowRadio = (function(nr) {
    'use strict';
    var changeStationTimeout = -1;
    function changeTimeout() {
        nr.StationsManager.removeCurrentThenNext();
        clearTimeout(changeStationTimeout);
    }
    function playingStatePlay() {
        nr.SongNameManager.animateOpen();
        nr.$elems.player[0].play();
    }
    function playingStateStop() {
        nr.$buttons.stop.hide();
        nr.$buttons.play.show();
        nr.$elems.player[0].pause();
        nr.$elems.player.attr('src', '');
        nr.SongNameManager.animateClosed();
    }
    function playingStateReload() {
        nr.$buttons.play.hide();
        nr.$buttons.stop.show();
        nr.$elems.player.attr('src', nr.UrlManager.getMediaUrl());
        nr.$elems.player[0].load();
    }
    function readyToPlay() {
        clearTimeout(changeStationTimeout);
        nr.ColorManager.updateToGenreColor();
        nr.FaviconManager.updateToGenreColor();
        playingStatePlay();
        nr.SpectrumManager.updateMarker();
    }
    function stationPlayingChecker() {
        if (_skipThisCheck()) return;
        var timeCheckStart = nr.$elems.player[0].played.end(0);
        window.setTimeout(_playingChecker, 1000);
        function _playingChecker() {
            if (_skipThisCheck()) return;
            if (nr.$elems.player[0].played.end(0) === timeCheckStart) {
                // There was no change in played time, so something is wrong, try to reload
                playingStateReload();
            }
        }
        function _skipThisCheck() {
            return !nr.MainController.playingStateIsPlaying() ||
                    nr.$elems.player[0].currentTime === null ||
                    nr.$elems.player[0].currentTime < 1 ||
                    nr.$elems.player[0].played.length < 1;
        }
    }

    nr.MainController = {
        initialStationsHaveLoaded : false
    };
    nr.MainController.initialStationsLoaded = function() {
        nr.$elems.loader.hide();
        nr.FaveManager.initOldFaves();
        nr.SpectrumManager.updateMarker();
        nr.SpectrumManager.hoverHandler();
        this.initialStationsHaveLoaded = true;
        nr.StationChanger.nextStation();
        playingStatePlay();
    };
    nr.MainController.updateViewForNewSource = function(src) {
        nr.UrlManager.setUrlHash(src);
        nr.SpectrumManager.updateMarker();
        nr.$elems.player.attr('src', nr.UrlManager.getMediaUrl());
        playingStateReload();
        nr.ColorManager.setToNeutral();
        nr.FaveManager.showPlayingFave();
        nr.SongNameManager.updateName(true);
        nr.SongNameManager.animateClosed();
        nr.FaveManager.showHideNewFaveBox();

        clearTimeout(changeStationTimeout);
        changeStationTimeout = setTimeout(changeTimeout, 10000);
    };
    nr.MainController.playingStateToggle = function() {
        if (this.playingStateIsPlaying()) {
            playingStateStop();
        } else {
            playingStateReload();
        }
    };
    nr.MainController.playingStateIsPlaying = function() {
        return !nr.$elems.player[0].paused;
    };
    $(document).ready(function() {
        nr.$buttons.stop.click(playingStateStop);
        nr.$buttons.play.click(playingStateReload);
        nr.$elems.player.bind('canplay', readyToPlay);
        window.setInterval(stationPlayingChecker, 5000);
    });

    return nr;
}(NowRadio || {}));
