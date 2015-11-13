/*global $:false */
/*jshint -W116 */

/**
 * Manages the genres and their stations. Keeps track of what genres and stations have been
 * played and what will be played in the future.
 */
var NowRadio = (function(nr) {
    'use strict';
    var blacklist = JSON.parse(window.localStorage.getItem("blacklist")) || {};
    var genreLists = [];
    var genreMarkers = [];
    var genreNum = 0;

    nr.StationsManager = {};

    nr.StationsManager.getNextGenre = function() {
        genreNum = (genreNum + 1) % genreLists.length;
        return this.getCurrentStation();
    };
    nr.StationsManager.getPrevGenre = function() {
        genreNum = (genreNum + genreLists.length - 1) % genreLists.length;
        return this.getCurrentStation();
    };
    nr.StationsManager.getNextStation = function() {
        genreMarkers[genreNum] = (genreMarkers[genreNum] + 1) % genreLists[genreNum].length;
        return this.getCurrentStation();
    };
    nr.StationsManager.getCurrentStation = function() {
        return genreLists[genreNum][genreMarkers[genreNum]];
    };
    nr.StationsManager.getPrevStation = function() {
        genreMarkers[genreNum] = (genreMarkers[genreNum] + (genreLists[genreNum].length - 1)) %
                                                            genreLists[genreNum].length;
        return this.getCurrentStation();
    };
    nr.StationsManager.getActiveGenre = function() {
        return genreNum;
    };
    nr.StationsManager.setActiveGenre = function(genreInfo) {
        if (genreNum === genreInfo) return false;
        genreNum = genreInfo;
        return true;
    };
    nr.StationsManager.removeCurrentThenNext = function() {
        var current_index = genreMarkers[genreNum];
        var current_ip = genreLists[genreNum][current_index];
        blacklist[current_ip] = true;
        window.localStorage.setItem("blacklist", JSON.stringify(blacklist));
        genreLists[genreNum].splice(current_index, 1);
        genreMarkers[genreNum] -= 1;
        nr.StationChanger.nextStation();
    };
    nr.StationsManager.getGenreCount = function() {
        return genreLists.length;
    };
    nr.StationsManager.setStationFirstUnique = function(src) {
        callback();
        function callback() {
            if (genreMarkers.length < 1) return window.setTimeout(callback, 200);
            var currentLocation = genreLists[genreNum].indexOf(src);
            if (currentLocation != -1) {
                genreLists[genreNum][currentLocation] = genreLists[genreNum][0];
                genreLists[genreNum][0] = src;
                genreMarkers[genreNum] = 0;
            } else {
                genreLists[genreNum].push(src);
                genreMarkers[genreNum] = genreLists[genreNum].length - 1;
            }
        }
    };
    $(document).ready(function() {
        $.get('/get-initial-stations/', function (data) {
            data.stations.forEach(function (stationList) {
                var approved_stations = [];
                stationList.forEach(function (station) {
                    if (blacklist[station] == null) {
                        approved_stations.push(station);
                    }
                });
                genreLists.push(approved_stations);
                genreMarkers.push(0);
            });
            if (nr.UrlManager.getHash().length == 0) {
                genreNum = Math.floor(Math.random() * genreLists.length);
            }
            nr.MainController.initialStationsLoaded();
        });
    });

    return nr;
}(NowRadio || {}));
