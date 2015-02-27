/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

$(function() {
    "use strict";
    /**
     * Global Variables
     */
    var colors = [
        "#bbd",
        "#bdb",
        "#bdf",
        "#bfd",
        "#dbb",
        "#dbf",
        "#dfb",
        "#dff",
        "#fbd",
        "#fdb",
        "#fdf",
        "#ffd"
    ];
    var stationChangeType = {
        'nextStation' : 0,
        'nextGenre'   : 1,
        'goBack'      : 2,
        'restoreHash' : 3
    };
    var buttons = {
        'bigPlay': $('a#bigPlayButton'),
        'play'   : $('button#playButton'),
        'stop'   : $('button#stopButton'),
        'next1'  : $('button#nextButton1'),
        'next2'  : $('button#nextButton2'),
        'next3'  : $('button#nextButton3'),
        'back'   : $('button#backButton'),
        'mute'   : $('span#muteButton'),
        'unmute' : $('span#unmuteButton')};
    var player = $('audio#player');

    /**
     * Functions - Random functions that should probably be in one of the closures...
     */
    function changeStation(changeType) {
        var genreNum, src;
        if (changeType === stationChangeType.nextStation) {
            genreNum = stationsManager.getActiveGenre();
            src = stationsManager.getNextStation();
            playlistManager.addNew(src, genreNum);
        } else if (changeType === stationChangeType.nextGenre) {
            genreNum = stationsManager.getNextGenre();
            src = stationsManager.getNextStation();
            playlistManager.addNew(src, genreNum);
        } else if (changeType === stationChangeType.goBack) {
            var result = playlistManager.goBack();
            if (result === null) return;
            genreNum =  result[1];
            src = result[0];
            stationsManager.setActiveGenre(genreNum);
        } else if (changeType === stationChangeType.restoreHash) {
            src = urlManager.getBareUrl();
            genreNum = urlManager.getGenreFromHash();
            stationsManager.setActiveGenre(genreNum);
            stationsManager.removeStationFromGenre(src, genreNum);
            playlistManager.addNew(src, genreNum);
        }
        urlManager.setUrl(src);
        player.attr('src', urlManager.getMediaUrl());
        colorManager.setToNeutral();
        songNameManager.updateName(true);
    }

    function readyToPlay() {
        colorManager.setToGenreColor();
        playerStateManager.play();
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
        }
        function _play() {
            buttons.play.hide();
            buttons.stop.show();
            player[0].play();
            playingNow = true;
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
        var genreNum = 0;
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
        function _getNextStation() {
            return genreManagers[genreNum].getNextStation();
        }
        function _getActiveGenre() {
            return genreNum;
        }
        function _setActiveGenre(genreInfo) {
            genreNum = genreInfo;
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
        function _getGenreManager(stationsList) {
            var stations = stationsList;
            var stationNum = 0;

            function _getNextStation() {
                stationNum = (stationNum + 1) % stations.length;
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
                removeCurrentStation : _removeCurrentStation
            };
        }
        return {
            getNextGenre           : _getNextGenre,
            getNextStation         : _getNextStation,
            getActiveGenre         : _getActiveGenre,
            setActiveGenre         : _setActiveGenre,
            removeStationFromGenre : _removeStationFromGenre,
            removeCurrent          : _removeCurrent
        };
    }());


    var urlManager = (function() {
        var url = '';
        var genreFromHash;
        var pre = "http://";
        var mediaPost = '/;?icy=http';
        var sevenPost = '/7.html';

        function _setUrl(newUrl) {
            url = newUrl;
            window.history.replaceState(null, null, "#" + _ipToHashCode(url));
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
            $.get('/get-genre-by-ip/', {'ip': url}, function(data) {
                genreFromHash = data['genreNum'];
                changeStation(stationChangeType.restoreHash);
            });
        }
        function _ipToHashCode(ip) {
            window.console.log(ip);
            var parts = ip.split(":");
            var port = (parts.length === 1 ? "80" : parts[1]);
            var hashcode = parts[0].split(".").reduce(function (accumulator, octetAsString) {
                if (parseInt(octetAsString) < 16) {
                    accumulator += "0";
                }
                return accumulator + parseInt(octetAsString).toString(16);
            }, "");
            hashcode += parseInt(port).toString(16);
            window.console.log(hashcode);
            return hashcode;
        }
        function hashCodeToIp(hashcode) {
            window.console.log(hashcode);
            var ip = "";
            for (var i = 0; i < 8; i += 2) {
                ip += parseInt(hashcode.substr(i, 2), 16).toString().trim() + ".";
            }
            ip = ip.slice(0, -1);
            ip += ":" + parseInt(hashcode.substr(8, 12), 16).toString();
            window.console.log(ip);
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

    // Warning to future nick, this is a strange data structure!
    var playlistManager = (function() {
        buttons.back.prop('disabled', true);
        var playlist = [];
        var index = -1;
        var end = -1;

        function _goBack() {
            if (index === 0) {
                return null;
            }
            index -= 1;
            if (index === 0) {
                buttons.back.prop('disabled', true);
            }
            return playlist[index];
        }
        function _addNew(station, genreNum) {
            index += 1;
            end = index;
            playlist[index] = [station, genreNum];
            if (index > 0) {
                buttons.back.prop('disabled', false);
            }
        }
        function _popCurrent() {
            playlist.pop();
            index -= 1;
        }
        return {
            goBack     : _goBack,
            addNew     : _addNew,
            popCurrent : _popCurrent
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
            var genreColor = colors[stationsManager.getActiveGenre()];
            $("body").animate({
               backgroundColor: genreColor
            }, 666);
        }
        function _setToNeutral() {
           $("body").animate({
               backgroundColor: "#ddd"
            }, 50);
        }
        return {
            setToNeutral    : _setToNeutral,
            setToGenreColor : _setToGenreColor
        };
    }());

    var keyUpManager = (function() {
        var singleRightPress = false;
        var timeOutInterval;
        window.onkeyup = _handleKeyUp;

        function _clearRightPress() {
            singleRightPress = false;
            changeStation(stationChangeType.nextStation);
        }
        function _handleKeyUp(event) {
            if (event.keyCode === 32) {
                playerStateManager.toggle();
            } else if (event.keyCode === 77) {
                volumeManager.soundToggle();
            } else if (event.keyCode === 37) {
                changeStation(stationChangeType.goBack);
            } else if (event.keyCode === 39) {
                if (singleRightPress) {
                    changeStation(stationChangeType.nextGenre);
                    singleRightPress = false;
                    clearInterval(timeOutInterval);
                } else {
                    singleRightPress = true;
                    timeOutInterval = window.setTimeout(_clearRightPress, 333);
                }
            }
        }
    }());

    var songNameManager = (function () {
        var songName = "-1";
        var duplicateSongCheck = false;
        var intervalId = -1;

        function _setName(data) {
            var re = /<[^<]*>/gi;
            data = data.replace(re, '');
            var x = 0;
            for (var i=0; i < 6; i++) {
                x = data.indexOf(',', x + 1);
            }
            data = data.slice(x + 1);
            // Check to see if this new station is playing the same song as the last one,
            //  if so, it's probably a duplicate station so go to the next one
            if (data === songName && duplicateSongCheck) {
                playlistManager.popCurrent();
                stationsManager.removeCurrent();
                changeStation(stationChangeType.nextStation);
            } else {
                $('span#currentSong').text(data);
                songName = data;
                duplicateSongCheck = false;
                intervalId = setInterval(_updateName, 10000);
            }
        }
        function _updateName(doDuplicateSongCheck) {
            if (intervalId !== -1) {
                clearInterval(intervalId);
            }
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
    buttons.next1.click(function () {
        changeStation(stationChangeType.nextStation);
    });
    buttons.next3.click(function () {
        changeStation(stationChangeType.nextGenre);
    });
    buttons.back.click(function () {
        changeStation(stationChangeType.goBack);
    });
    buttons.mute.click(volumeManager.soundOff);
    buttons.unmute.click(volumeManager.soundOn);
    buttons.bigPlay.click(function () {
        $('div#landingContainer').hide();
        $('div#mainContainer').show();
        volumeManager.soundOn();
    });
    player.bind("canplay", readyToPlay);
    player.bind("error", function (e) {
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
});
