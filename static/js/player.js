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
        'fromArgs'    : 4
    };
    var buttons = {
        'bigPlay'     : $('a#bigPlayButton'),
        "play"        : $('div#playButton'),
        'stop'        : $('div#stopButton'),
        'nextStation' : $('div#nextStationButton'),
        'nextGenre'   : $('div#nextGenreButton'),
        'prevStation' : $('div#prevStationButton'),
        'prevGenre'   : $('div#prevGenreButton'),
        'mute'        : $('span#muteButton'),
        'unmute'      : $('span#unmuteButton')
    };
    var elems = {
        'body'             : $('body'),
        'player'           : $('audio#player'),
        'spectrum'         : $('img#spectrum'),
        'mainContainer'    : $('div#mainContainer'),
        'landingContainer' : $('div#landingContainer'),
        'currentSongText'  : $('span#currentSong'),
        'stationInfo'      : $('div#stationInfo'),
        'oldFaveBox'       : $('div#oldFaveBox'),
        'newFaveBox'       : $('div#newFaveBox'),
        'faveAddIcon'      : $('span.faveAdd'),
        'faveRemoveIcon'   : $('span.faveRemove'),
        'favePlayIcon'   : $('span.favePlay')
    };
    var changeStationTimeout;

    /**
     * Functions - Random functions that should probably be in one of the closures...
     */
    function changeStation(changeType, _src, _genreNum) {
        var genreNum, src;
        if (changeType === stationChangeType.nextStation || changeType === undefined) {
            src = stationsManager.getNextStation();
        } else if (changeType === stationChangeType.nextGenre) {
            stationsManager.getNextGenre();
            src = stationsManager.getNextStation();
        } else if (changeType === stationChangeType.prevStation) {
            src = stationsManager.getPrevStation();
        } else if (changeType === stationChangeType.prevGenre) {
            stationsManager.getPrevGenre();
            src = stationsManager.getNextStation();
        } else if (changeType === stationChangeType.fromArgs) {
            src = _src;
            genreNum = _genreNum;
            stationsManager.setActiveGenre(genreNum);
            stationsManager.removeStationFromGenre(src, genreNum, true);
        }
        urlManager.setUrl(src);
        elems.player.attr('src', urlManager.getMediaUrl());
        elems.player.load();
        colorManager.setToNeutral();
        faveManager.showPlayingFave();
        songNameManager.updateName(true);
        stationNameAnimation(false);
        clearTimeout(changeStationTimeout);
        changeStationTimeout = setTimeout(changeTimeout, 10000);
    }

    function changeTimeout() {
        stationsManager.removeCurrent();
        clearTimeout(changeStationTimeout);
        changeStation(stationChangeType.nextStation);
    }

    function readyToPlay() {
        clearTimeout(changeStationTimeout);
        colorManager.setToGenreColor();
        playerStateManager.play();
    }

    function stationNameAnimation(open) {
        var stationInfoDiv = elems.stationInfo;
        if (open) {
            stationInfoDiv.stop(true).animate({
                'max-height': 300,
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

    function stationPlayingChecker() {
        if (_skipThisCheck()) return;
        var timeCheckStart = elems.player[0].played.end(0);
        window.setTimeout(_playingChecker, 1000);
        function _playingChecker() {
            if (_skipThisCheck()) return;
            if (elems.player[0].played.end(0) === timeCheckStart) {
                // There was no change in played time, so something is wrong, try to reload
                elems.player[0].load();
            }
        }
        function _skipThisCheck() {
            return !playerStateManager.isPlayingNow() ||
                    elems.player[0].currentTime === null ||
                    elems.player[0].currentTime < 1 ||
                    elems.player[0].played.length < 1;
        }
    }
    window.setInterval(stationPlayingChecker, 5000);

    function initialStationsLoaded() {
        if (urlManager.noUrlSet()) {
            changeStation(stationChangeType.nextStation);
        }
        faveManager.initOldFaves();
        faveManager.showPlayingFave();
    }


    /**
     * Closures - Each one is like an 'object' that controls a certain aspect of the app
     */
    var playerStateManager = (function() {
        var playingNow = false;

        function _stop() {
            buttons.stop.hide();
            buttons.play.show();
            elems.player[0].pause();
            playingNow = false;
            stationNameAnimation(false);
        }
        function _play() {
            buttons.play.hide();
            buttons.stop.show();
            elems.player[0].play();
            playingNow = true;
            stationNameAnimation(true);
        }
        function _updateStream() {
            elems.player[0].load();
        }
        function _toggle() {
            if (playingNow) {
                _stop();
            }
            else {
                _updateStream();
                _play();
            }
        }
        function _isPlayingNow() {
            return playingNow;
        }
        return {
            stop         : _stop,
            toggle       : _toggle,
            play         : _play,
            isPlayingNow : _isPlayingNow,
            updateStream : _updateStream
        };
    }());

    var stationsManager = (function() {
        var genreManagers = [];
        var genreNum = 0;
        $.get('/get-initial-stations/', function(data) {
            data['stations'].forEach(function (stationList) {
                genreManagers.push(_getGenreManager(stationList));
            });
            initialStationsLoaded();
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
        function _removeStationFromGenre(station, genreNum, addToEnd) {
            // The genreManagers list might not be populated yet, so keep trying until it is
            var removeStationFromGenreInterval = window.setInterval(doRemovalFromGenre, 200);
            function doRemovalFromGenre() {
                if (genreManagers.length > 0) {
                    clearInterval(removeStationFromGenreInterval);
                    genreManagers[genreNum].removeStation(station);
                    if (addToEnd) {
                        genreManagers[genreNum].appendStation(station);
                    }
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
            var stationNum = -1;

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
            function _appendStation(station) {
                stations.push(station);
            }
            function _removeCurrentStation() {
                stations.splice(stationNum, 1);
            }
            return {
                getNextStation       : _getNextStation,
                removeStation        : _removeStation,
                removeCurrentStation : _removeCurrentStation,
                getPrevStation       : _getPrevStation,
                appendStation        : _appendStation
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
        function _getUrl() {
            return url;
        }
        function _noUrlSet() {
            return url === '';
        }
        function _restoreFromHash() {
            // If the page is loaded with a #base64StringHere then play that station
            buttons.bigPlay.click();
            url = _hashCodeToIp(window.location.hash.substring(1));
            $.get('/get-genre-by-ip/', {"ip": url}, function(data) {
                changeStation(stationChangeType.fromArgs, url, data['genreNum']);
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
        function _hashCodeToIp(hashcode) {
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
            hashCodeToIp     : _hashCodeToIp,
            ipToHashCode     : _ipToHashCode,
            getUrl           : _getUrl
        };
    }());

    var volumeManager = (function() {
        buttons.unmute.hide();
        var soundOnNow = false;

        function _soundOff() {
            elems.player[0].muted = true;
            buttons.mute.hide();
            buttons.unmute.show();
            soundOnNow = false;
        }
        function _soundOn() {
            elems.player[0].muted = false;
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
            _setElemToGenreColor(elems.body);
            _setElemToGenreColor(elems.newFaveBox);
        }
        function _setToNeutral() {
           elems.body.animate({
               backgroundColor: '#aaa'
            }, 50);
            elems.newFaveBox.css("background-color", "#aaa");
        }
        function _setElemToGenreColor(elem) {
            var color = _genreNumToColor(stationsManager.getActiveGenre());
            elem.animate({
               backgroundColor: color
            }, 666);
        }
        function _genreNumToColor(genreNum) {
            var totalGenres = stationsManager.getGenreCount();
            genreNum = (genreNum * 360) / totalGenres;
            var genreColor = window.tinycolor('hsv(' + genreNum + ', 26%, 99%)');
            return genreColor.toHexString();
        }
        return {
            setToNeutral        : _setToNeutral,
            setToGenreColor     : _setToGenreColor,
            setElemToGenreColor : _setElemToGenreColor,
            genreNumToColor     : _genreNumToColor
        };
    }());

    var keyUpManager = (function() {
        var singleRightPress = false;
        var singleLeftPress = false;
        var leftTimeout;
        var rightTimeout;
        window.onkeyup = _handleKeyUp;

        function _clearTimeouts() {
            clearTimeout(leftTimeout);
            clearTimeout(rightTimeout);
            if (singleLeftPress) {
                changeStation(stationChangeType.prevStation);
            } else if (singleRightPress) {
                changeStation(stationChangeType.nextStation);
            }
            singleLeftPress = false;
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
                    _clearTimeouts();
                } else {
                    leftTimeout = true;
                    singleLeftPress = window.setTimeout(_clearTimeouts, 333);
                }
            } else if (event.keyCode === 39) {
                if (singleRightPress) {
                    changeStation(stationChangeType.nextGenre);
                    singleRightPress = false;
                    _clearTimeouts();
                } else {
                    rightTimeout = true;
                    singleRightPress = window.setTimeout(_clearTimeouts, 333);
                }
            } else {
                clearTimeout(leftTimeout);
                clearTimeout(rightTimeout);
            }
        }
    }());

    var songNameManager = (function () {
        var songName = '-1';
        var duplicateSongCheck = false;
        var intervalId = -1;

        function _setName(data, status) {
            if (status !== "success") {
                stationsManager.removeCurrent();
                changeStation(stationChangeType.nextStation);
            }
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
            } else if (newName !== songName) {
                elems.currentSongText.text(newName);
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

    var faveManager = (function () {
        var maxFaves = 5;
        var faves = window.localStorage.getItem("faves");
        if (faves === null) {
            faves = [];
        } else {
            faves = JSON.parse(faves);
        }
        elems.oldFaveBox.hide();
        elems.faveAddIcon.click(_addFave);
        elems.faveRemoveIcon.click(_removeFave);
        elems.favePlayIcon.click(_playFave);

        function _initOldFaves() {
            faves.forEach(function (fave) {
                var newBox = elems.oldFaveBox.clone(true).insertBefore(elems.oldFaveBox).show();
                var color = colorManager.genreNumToColor(fave['genreNum']);
                newBox.css("background-color", color);
            });
            _showHideNewFaveBox();
        }
        function _addFave() {
            var faveCount = $('div#oldFaveBox').length - 1;
            var newBox = elems.oldFaveBox.clone(true).insertBefore(elems.oldFaveBox).show();
            colorManager.setElemToGenreColor(newBox);
            var ipHash = window.location.hash.substring(1);
            var genreNum = stationsManager.getActiveGenre();
            faves[faveCount] = {"ipHash" : ipHash, "genreNum" : genreNum};
            window.localStorage.setItem("faves", JSON.stringify(faves));
            _showPlayingFave();
            _showHideNewFaveBox();
        }
        function _playFave(elem) {
            var faveNum = $(elem.target).parent().index();
            var faveData = faves[faveNum];
            var faveIpHash = faveData['ipHash'];
            if (window.location.hash.substring(1) == faveIpHash) {
                // IF we are already playing the station selected, do nothing
                return;
            }
            var ip = urlManager.hashCodeToIp(faveIpHash);
            changeStation(stationChangeType.fromArgs, ip, faveData['genreNum']);
        }
        function _removeFave(elem) {
            var faveNum = $(elem.target).parent().index();
            $(elem.target).parent().remove();
            faves.splice(faveNum, 1);
            window.localStorage.setItem("faves", JSON.stringify(faves));
            _showHideNewFaveBox();
        }
        function _showHideNewFaveBox() {
            if ($('div#oldFaveBox').length <= maxFaves) {
                elems.newFaveBox.show();
            } else {
                elems.newFaveBox.hide();
            }
        }
        function _showPlayingFave() {
            var playingIpHash = window.location.hash.substring(1);
            faves.forEach(function (fave, index) {
                if (fave['ipHash'] === playingIpHash) {
                    $("span.favePlay").eq(index).css('color', 'white');
                } else {
                    $("span.favePlay").eq(index).css('color', 'black');
                }
            });
        }
        return {
            initOldFaves : _initOldFaves,
            showPlayingFave : _showPlayingFave
        };
    }());


    /**
     * Listeners - Handle certain user actions
     */
    buttons.stop.click(playerStateManager.stop);
    buttons.play.click(function () {
        playerStateManager.updateStream();
        playerStateManager.play();
    });
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
        elems.landingContainer.hide();
        elems.mainContainer.show();
        volumeManager.soundOn();
    });
    elems.player.bind('canplay', readyToPlay);
    elems.player.bind('error', function (e) {
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
    buttons.play.hide();

    elems.spectrum.click(function (e) {
        var width = elems.spectrum.width();
        var genreCount = stationsManager.getGenreCount();
        var genreNum = Math.round((e.pageX/width) * genreCount);
        if (stationsManager.setActiveGenre(genreNum)) {
            changeStation(stationChangeType.nextStation);
        }
    });
});
