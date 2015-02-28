/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

$(function() {
    'use strict';
    /**
     * Global Variables
     */
    var stationChangeType = {
        'nextStation' : 0,
        'nextGenre'   : 1,
        'prevStation' : 2,
        'prevGenre'   : 3,
        'restoreHash' : 4
    };
    var buttons = {
        'bigPlay'     : $('a#bigPlayButton'),
        'play'        : $('button#playButton'),
        'stop'        : $('button#stopButton'),
        'nextStation' : $('button#nextStationButton'),
        'nextGenre'   : $('button#nextGenreButton'),
        'prevStation' : $('button#prevStationButton'),
        'prevGenre'   : $('button#prevGenreButton'),
        'mute'        : $('span#muteButton'),
        'unmute'      : $('span#unmuteButton')};
    var player = $('audio#player');

    /**
     * Functions - Random functions that should probably be in one of the closures...
     */
    function changeStation(changeType) {
        var genreNum, src;
        if (changeType === stationChangeType.nextStation) {
            genreNum = stationsManager.getActiveGenre();
            src = stationsManager.getNextStation();
        } else if (changeType === stationChangeType.nextGenre) {
            genreNum = stationsManager.getNextGenre();
            src = stationsManager.getNextStation();
        } else if (changeType === stationChangeType.prevStation) {
            genreNum = stationsManager.getActiveGenre();
            src = stationsManager.getPrevStation();
        } else if (changeType === stationChangeType.prevGenre) {
            genreNum = stationsManager.getPrevGenre();
            src = stationsManager.getNextStation();
        } else if (changeType === stationChangeType.restoreHash) {
            src = urlManager.getBareUrl();
            genreNum = urlManager.getGenreFromHash();
            stationsManager.setActiveGenre(genreNum);
            stationsManager.removeStationFromGenre(src, genreNum);
        }
        urlManager.setUrl(src);
        player.attr('src', urlManager.getMediaUrl());
        colorManager.setToNeutral();
        songNameManager.updateName(true);
        stationNameAnimation(false);
    }

    function readyToPlay() {
        colorManager.setToGenreColor();
        playerStateManager.play();
        stationNameAnimation(true);
    }

    function stationNameAnimation(open) {
        var stationInfoDiv = $('div#stationInfo');
        if (open) {
            stationInfoDiv.stop(true).animate({
                'max-height': 200,
                'padding-top': '15px',
                'padding-bottom': '15px'
            }, 333, 'swing', function () {
                stationInfoDiv.children().css('visibility','visible');
            });
        } else {
            stationInfoDiv.children().css('visibility','hidden');
            stationInfoDiv.stop(true).animate({
                'max-height': 0,
                'padding-top': 0,
                'padding-bottom': 0
            }, 333, 'swing');
        }
    }


    /**
     * Closures - Each one is like an 'object' that controls a certain aspect of the app
     */
    var playerStateManager = (function() {
        var playingNow = false;

        function _stop() {
            buttons.stop.hide();
            buttons.play.show();
            player[0].pause();
            playingNow = false;
            stationNameAnimation(false);
        }
        function _play() {
            buttons.play.hide();
            buttons.stop.show();
            player[0].play();
            playingNow = true;
            stationNameAnimation(true);
        }
        function _toggle() {
            if (playingNow) {
                _stop();
            }
            else {
                _play();
            }
        }
        return {
            stop   : _stop,
            play   : _play,
            toggle : _toggle
        };
    }());

    var stationsManager = (function() {
        var genreManagers = [];
        var genreNum = -1;
        $.get('/get-initial-stations/', function(data) {
            data['stations'].forEach(function (stationList) {
                genreManagers.push(_getGenreManager(stationList));
            });
            if (urlManager.noUrlSet()) {
                changeStation(stationChangeType.nextStation);
            }
        });

        function _getNextGenre() {
            genreNum = (genreNum + 1) % genreManagers.length;
            return genreNum;
        }
        function _getPrevGenre() {
            genreNum = (genreNum + genreManagers.length - 1) % genreManagers.length;
            return genreNum;
        }
        function _getNextStation() {
            return genreManagers[genreNum].getNextStation();
        }
        function _getPrevStation() {
            return genreManagers[genreNum].getPrevStation();
        }
        function _getActiveGenre() {
            return genreNum;
        }
        function _setActiveGenre(genreInfo) {
            if (genreNum === genreInfo) return false;
            genreNum = genreInfo;
            return true;
        }
        function _removeStationFromGenre(station, genreNum) {
            // The genreManagers list might not be populated yet, so keep trying until it is
            var removeStationFromGenreInterval = window.setInterval(doRemovalFromGenre, 200);
            function doRemovalFromGenre() {
                if (genreManagers.length > 0) {
                    clearInterval(removeStationFromGenreInterval);
                    genreManagers[genreNum].removeStation(station);
                }
            }
        }
        function _removeCurrent() {
            genreManagers[genreNum].removeCurrentStation();
        }
        function _getGenreCount() {
            return genreManagers.length;
        }
        function _getGenreManager(stationsList) {
            var stations = stationsList;
            var stationNum = 0;

            function _getNextStation() {
                stationNum = (stationNum + 1) % stations.length;
                return stations[stationNum];
            }
            function _getPrevStation() {
                stationNum = (stationNum + stations.length - 1) % stations.length;
                return stations[stationNum];
            }
            function _removeStation(station) {
                // The stations might not have been loaded yet, so keep trying until they are
                var removeStationInterval = window.setInterval(doRemoval, 200);
                function doRemoval() {
                    if (stations.length > 0) {
                        window.clearInterval(removeStationInterval);
                        var stationIndex = stations.indexOf(station);
                        if (stationIndex > -1) {
                            stations.splice(stationIndex, 1);
                        }
                    }
                }
            }
            function _removeCurrentStation() {
                stations.splice(stationNum, 1);
            }
            return {
                getNextStation       : _getNextStation,
                removeStation        : _removeStation,
                removeCurrentStation : _removeCurrentStation,
                getPrevStation       : _getPrevStation
            };
        }
        return {
            getNextGenre           : _getNextGenre,
            getNextStation         : _getNextStation,
            getActiveGenre         : _getActiveGenre,
            setActiveGenre         : _setActiveGenre,
            removeStationFromGenre : _removeStationFromGenre,
            removeCurrent          : _removeCurrent,
            getPrevStation         : _getPrevStation,
            getPrevGenre           : _getPrevGenre,
            getGenreCount          : _getGenreCount
        };
    }());


    var urlManager = (function() {
        var url = '';
        var genreFromHash;
        var pre = 'http://';
        var mediaPost = '/;?icy=http';
        var sevenPost = '/7.html';

        function _setUrl(newUrl) {
            url = newUrl;
            window.history.replaceState(null, null, '#' + _ipToHashCode(url));
        }
        function _getMediaUrl() {
            return pre + url + mediaPost;
        }
        function _getDataUrl() {
            return  pre + url + sevenPost;
        }
        function _getBareUrl() {
            return url;
        }
        function _getGenreFromHash() {
            return genreFromHash;
        }
        function _noUrlSet() {
            return url === '';
        }
        function _restoreFromHash() {
            // If the page is loaded with a #base64StringHere then play that station
            buttons.bigPlay.click();
            url = hashCodeToIp(window.location.hash.substring(1));
            $.get('/get-genre-by-ip/', {"ip": url}, function(data) {
                genreFromHash = data['genreNum'];
                changeStation(stationChangeType.restoreHash);
            });
        }
        function _ipToHashCode(ip) {
            var parts = ip.split(':');
            var port = (parts.length === 1 ? '80' : parts[1]);
            var hashcode = parts[0].split('.').reduce(function (accumulator, octetAsString) {
                if (parseInt(octetAsString) < 16) {
                    accumulator += '0';
                }
                return accumulator + parseInt(octetAsString).toString(16);
            }, '');
            hashcode += parseInt(port).toString(16);
            return hashcode;
        }
        function hashCodeToIp(hashcode) {
            var ip = '';
            for (var i = 0; i < 8; i += 2) {
                ip += parseInt(hashcode.substr(i, 2), 16).toString().trim() + '.';
            }
            ip = ip.slice(0, -1);
            ip += ':' + parseInt(hashcode.substr(8, 12), 16).toString();
            return ip;
        }
        return {
            setUrl           : _setUrl,
            getMediaUrl      : _getMediaUrl,
            noUrlSet         : _noUrlSet,
            getDataUrl       : _getDataUrl,
            restoreFromHash  : _restoreFromHash,
            getBareUrl       : _getBareUrl,
            getGenreFromHash : _getGenreFromHash
        };
    }());

    var volumeManager = (function() {
        buttons.unmute.hide();
        var soundOnNow = false;

        function _soundOff() {
            player[0].muted = true;
            buttons.mute.hide();
            buttons.unmute.show();
            soundOnNow = false;
        }
        function _soundOn() {
            player[0].muted = false;
            buttons.mute.show();
            buttons.unmute.hide();
            soundOnNow = true;
        }
        function _soundToggle() {
            if (soundOnNow) {
                _soundOff();
            } else {
                _soundOn();
            }
        }

        return {
            soundOff    : _soundOff,
            soundOn     : _soundOn,
            soundToggle : _soundToggle
        };
    }());

    var colorManager = (function() {
        function _setToGenreColor() {
            var genreNum = stationsManager.getActiveGenre();
            var totalGenres = stationsManager.getGenreCount();
            genreNum = (genreNum * 360) / totalGenres;
            var genreColor = window.tinycolor("hsv(" + genreNum + ", 26%, 99%)");
            $('body').animate({
               backgroundColor: genreColor.toHexString()
            }, 666);
        }
        function _setToNeutral() {
           $('body').animate({
               backgroundColor: '#aaa'
            }, 50);
        }
        return {
            setToNeutral    : _setToNeutral,
            setToGenreColor : _setToGenreColor
        };
    }());

    var keyUpManager = (function() {
        var singleRightPress = false;
        var singleLeftPress = false;
        var leftInterval;
        var rightInterval;
        window.onkeyup = _handleKeyUp;

        function _clearIntervals() {
            clearInterval(leftInterval);
            clearInterval(rightInterval);
            if (singleLeftPress) {
                changeStation(stationChangeType.prevStation);
            } else if (singleRightPress) {
                changeStation(stationChangeType.nextStation);
            }
            singleRightPress = false;
            singleRightPress = false;
        }
        function _handleKeyUp(event) {
            if (event.keyCode === 32) {
                playerStateManager.toggle();
            } else if (event.keyCode === 77) {
                volumeManager.soundToggle();
            } else if (event.keyCode === 37) {
                if (singleLeftPress) {
                    changeStation(stationChangeType.prevGenre);
                    singleLeftPress = false;
                    _clearIntervals();
                } else {
                    leftInterval = true;
                    singleLeftPress = window.setTimeout(_clearIntervals, 333);
                }
            } else if (event.keyCode === 39) {
                if (singleRightPress) {
                    changeStation(stationChangeType.nextGenre);
                    singleRightPress = false;
                    _clearIntervals();
                } else {
                    rightInterval = true;
                    singleRightPress = window.setTimeout(_clearIntervals, 333);
                }
            } else {
                clearInterval(leftInterval);
                clearInterval(rightInterval);
            }
        }
    }());

    var songNameManager = (function () {
        var songName = '-1';
        var duplicateSongCheck = false;
        var intervalId = -1;

        function _setName(data) {
            var re = /<[^<]*>/gi;
            data = data.replace(re, '');
            var dataList = data.split(',');
            var isUp = dataList[1];
            if (isUp !== '1') {
                stationsManager.removeCurrent();
                changeStation(stationChangeType.nextStation);
                return;
            }
            var newName = dataList.slice(6).join();
            // Check to see if this new station is playing the same song as the last one,
            //  if so, it's probably a duplicate station so go to the next one
            if (newName === songName && duplicateSongCheck) {
                stationsManager.removeCurrent();
                changeStation(stationChangeType.nextStation);
            } else {
                $('span#currentSong').text(newName);
                songName = newName;
                duplicateSongCheck = false;
                clearInterval(intervalId);
                intervalId = setInterval(_updateName, 10000);
            }
        }
        function _updateName(doDuplicateSongCheck) {
            if (doDuplicateSongCheck === true) {
                duplicateSongCheck = doDuplicateSongCheck;
            }
            var infoUrl = urlManager.getDataUrl();
            $.get('/get-station-info/?stationUrl='+infoUrl,  _setName, 'html');
        }
        return {
            updateName : _updateName
        };
    }());


    /**
     * Listeners - Handle certain user actions
     */
    buttons.stop.click(playerStateManager.stop);
    buttons.play.click(playerStateManager.play);
    buttons.nextStation.click(function () {
        changeStation(stationChangeType.nextStation);
    });
    buttons.nextGenre.click(function () {
        changeStation(stationChangeType.nextGenre);
    });
    buttons.prevStation.click(function () {
        changeStation(stationChangeType.prevStation);
    });
    buttons.prevGenre.click(function () {
        changeStation(stationChangeType.prevGenre);
    });
    buttons.mute.click(volumeManager.soundOff);
    buttons.unmute.click(volumeManager.soundOn);
    buttons.bigPlay.click(function () {
        $('div#landingContainer').hide();
        $('div#mainContainer').show();
        volumeManager.soundOn();
    });
    player.bind('canplay', readyToPlay);
    player.bind('error', function (e) {
        window.console.error(e);
    });


    /**
     * Setup - Set everything in motion
     */
    if (window.location.hash.length !== 0) {
        urlManager.restoreFromHash();
    } else {
        volumeManager.soundOff();
    }

    $("img#spectrum").click(function (e) {
        var width = $("img#spectrum").width();
        var genreCount = stationsManager.getGenreCount();
        var genreNum = Math.round((e.pageX/width) * genreCount);
        if (stationsManager.setActiveGenre(genreNum)) {
            changeStation(stationChangeType.nextStation);
        }
    });
});
