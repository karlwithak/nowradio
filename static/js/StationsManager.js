/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Manages the genres and their stations. Keeps track of what genres and stations have been
 * played and what will be played in the future.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.StationsManager = {
        genreLists : [],
        genreMarkers : [],
        genreNum : 0
    };
    nr.StationsManager.getNextGenre = function() {
        this.genreNum = (this.genreNum + 1) % this.genreLists.length;
        return this.genreNum;
    };
    nr.StationsManager.getPrevGenre = function() {
        this.genreNum = (this.genreNum + this.genreLists.length - 1) % this.genreLists.length;
        return this.genreNum;
    };
    nr.StationsManager.getNextStation = function() {
        this.genreMarkers[this.genreNum] = (this.genreMarkers[this.genreNum] + 1) % this.genreLists[this.genreNum].length;
        return this.genreLists[this.genreNum][this.genreMarkers[this.genreNum]];
    };
    nr.StationsManager.getPrevStation = function() {
        this.genreMarkers[this.genreNum] = (this.genreMarkers[this.genreNum] + (this.genreLists[this.genreNum].length - 1)) %
                                                            this.genreLists[this.genreNum].length;
        return this.genreLists[this.genreNum][this.genreMarkers[this.genreNum]];
    };
    nr.StationsManager.getActiveGenre = function() {
        return this.genreNum;
    };
    nr.StationsManager.setActiveGenre = function(genreInfo) {
        if (this.genreNum === genreInfo) return false;
        this.genreNum = genreInfo;
        return true;
    };
    nr.StationsManager.removeCurrentThenNext = function() {
        this.genreLists[this.genreNum].splice(this.genreMarkers[this.genreNum], 1);
        this.genreMarkers[this.genreNum] -= 1;
        nr.StationChanger.nextStation();
    };
    nr.StationsManager.getGenreCount = function() {
        return this.genreLists.length;
    };
    nr.StationsManager.setStationFirstUnique = function(src) {
        var _this = this;
        callback();
        function callback() {
            if (_this.genreMarkers.length < 1) return window.setTimeout(callback, 200);
            var currentLocation = _this.genreLists[_this.genreNum].indexOf(src);
            if (currentLocation != -1) {
                _this.genreLists[_this.genreNum][currentLocation] = _this.genreLists[_this.genreNum][0];
                _this.genreLists[_this.genreNum][0] = src;
                _this.genreMarkers[_this.genreNum] = 0;
            } else {
                _this.genreLists[_this.genreNum].push(src);
                _this.genreMarkers[_this.genreNum] = _this.genreLists[_this.genreNum].length - 1;
            }
        }
    };
    $(document).ready(function () {
        var _this = nr.StationsManager;
        $.get('/get-initial-stations/', function(data) {
            data['stations'].forEach(function (stationList) {
                _this.genreLists.push(stationList);
                _this.genreMarkers.push(-1);
            });
            if (nr.UrlManager.getHash().length == 0) {
                _this.genreNum = Math.floor(Math.random() * _this.genreLists.length);
            }
            nr.MainController.initialStationsLoaded();
        });
    });

    return nr;
}(Nowradio || {}));
