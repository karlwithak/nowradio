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
    function reportTimeout(ip) {
        $.post("/report-timeout/", {ip: ip});
    }

    nr.StationsManager = {};

    nr.StationsManager.changeToNextGenre = function() {
        genreNum = (genreNum + 1) % genreLists.length;
        return this.getCurrentStation();
    };
    nr.StationsManager.getNextGenre = function() {
        var temp_genreNum = (genreNum + 1) % genreLists.length;
        return genreLists[temp_genreNum][(genreMarkers[temp_genreNum] + 1) % genreLists[temp_genreNum].length];
    };
    nr.StationsManager.changeToPrevGenre = function() {
        genreNum = (genreNum + genreLists.length - 1) % genreLists.length;
        return this.getCurrentStation();
    };
    nr.StationsManager.getPrevGenre = function() {
        var temp_genreNum = (genreNum + genreLists.length - 1) % genreLists.length;
        return genreLists[temp_genreNum][(genreMarkers[temp_genreNum] + 1) % genreLists[temp_genreNum].length];
    };
    nr.StationsManager.changeToNextStation = function() {
        genreMarkers[genreNum] = (genreMarkers[genreNum] + 1) % genreLists[genreNum].length;
        return this.getCurrentStation();
    };
    nr.StationsManager.getNextStation = function() {
        var temp_marker = (genreMarkers[genreNum] + 1) % genreLists[genreNum].length;
        return genreLists[genreNum][temp_marker];
    };
    nr.StationsManager.changeToPrevStation = function() {
        genreMarkers[genreNum] = (genreMarkers[genreNum] + (genreLists[genreNum].length - 1)) %
                                                            genreLists[genreNum].length;
        return this.getCurrentStation();
    };
    nr.StationsManager.getPrevStation = function() {
        var temp_marker = (genreMarkers[genreNum] + (genreLists[genreNum].length - 1)) %
                                                            genreLists[genreNum].length;
        return genreLists[genreNum][temp_marker];
    };
    nr.StationsManager.getCurrentStation = function() {
        return genreLists[genreNum][genreMarkers[genreNum]];
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
        reportTimeout(current_ip);
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
            // data.stations is a list (one for each genre) of lists (one for each station dictionary)
            data.stations.forEach(function (stationList) {
                // stationList is a list of station dictionaries for a particular genre
                var approved_stations = [];
                stationList.forEach(function (station_dict) {
                    // station_dict is a dictionary that has ip_addr, latitude, longitude
                    if (blacklist[station_dict.ip_addr] == null) {
                        approved_stations.push(station_dict.ip_addr);
                    }
                });

                genreLists.push(approved_stations);
                genreMarkers.push(0);
            });

            // Pass station data to MapManager, set inital markers.
            nr.MapManager.showInitialMarkers(data.stations);

            if (nr.UrlManager.getHash().length == 0) {
                // selecting genreNum based on the current selection of favorites
                // if there are no favorites, a random genre is picked
                // else, it selects randomly amongst the genres with the most favorites
                var faves = JSON.parse(localStorage.getItem('faves')) || [];
                if (faves.length == 0) {
                    genreNum = Math.floor(Math.random() * genreLists.length);
                } else {
                    var faveStations = {};
                    faves.forEach(function(element, index, array) {
                        if (element['genreNum'] in faveStations) {
                            faveStations[element['genreNum']]++;
                        } else {
                            faveStations[element['genreNum']] = 1;
                        }
                    });

                    var max_value = 0;
                    var genreNumList = [];
                    $.each(faveStations, function(key, value) {
                        if (value > max_value) {
                            genreNumList = [key];
                            max_value = value;
                        } else if (value == max_value) {
                            genreNumList.push(key);
                        }
                    });
                    genreNum = genreNumList[Math.floor(Math.random() * genreNumList.length)];
                }
            }
            nr.MainController.initialStationsLoaded();
        });
    });

    return nr;
}(NowRadio || {}));
