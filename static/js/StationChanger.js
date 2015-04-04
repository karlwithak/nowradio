/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Handles all station changing logic.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.StationChanger = {};
    nr.StationChanger.nextStation = function () {
        var src = nr.StationsManager.getNextStation();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.prevStation = function () {
        var src = nr.StationsManager.getPrevStation();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.nextGenre = function () {
        nr.StationsManager.getNextGenre();
        var src = nr.StationsManager.getNextStation();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.prevGenre = function () {
        nr.StationsManager.getPrevGenre();
        var src = nr.StationsManager.getNextStation();
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.fromArgs = function (src, genreNum) {
        nr.StationsManager.setActiveGenre(genreNum);
        nr.MainController.updateViewForNewSource(src);
    };
    nr.StationChanger.fromArgsAndSetFirst = function (src, genreNum) {
        nr.StationsManager.setActiveGenre(genreNum);
        nr.MainController.updateViewForNewSource(src);
        nr.StationsManager.setStationFirstUnique(src);
    };

    return nr;
}(Nowradio || {}));