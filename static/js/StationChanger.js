/*global $:false */
/*jshint -W116 */

/**
 * Handles all station changing logic.
 */
var NowRadio = (function(nr) {
    'use strict';
    nr.StationChanger = {};
    nr.StationChanger.nextStation = function() {
        var src = nr.StationsManager.changeToNextStation();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.prevStation = function() {
        var src = nr.StationsManager.changeToPrevStation();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.currentStation = function() {
        var src = nr.StationsManager.getCurrentStation();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.nextGenre = function() {
        var src = nr.StationsManager.changeToNextGenre();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.prevGenre = function() {
        var src = nr.StationsManager.changeToPrevGenre();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.fromArgs = function(src, genreNum) {
        nr.StationsManager.setActiveGenre(genreNum);
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.fromArgsAndSetFirst = function(src, genreNum) {
        nr.StationsManager.setActiveGenre(genreNum);
        nr.MainController.updateViewForNewSource(src);
        nr.StationsManager.setStationFirstUnique(src);
    };
    $(document).ready(function() {
        nr.$buttons.nextStation.click(nr.StationChanger.nextStation.bind(nr.StationChanger));
        nr.$buttons.nextGenre.click(nr.StationChanger.nextGenre.bind(nr.StationChanger));
        nr.$buttons.prevStation.click(nr.StationChanger.prevStation.bind(nr.StationChanger));
        nr.$buttons.prevGenre.click(nr.StationChanger.prevGenre.bind(nr.StationChanger));
    });

    return nr;
}(NowRadio || {}));