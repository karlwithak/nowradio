/*global $:false */
/*global Share:false */
/*jshint -W069 */
/*jshint -W116 */

$(function() {
    'use strict';
    /**
     * Global Variables
     */
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
        'favePlayIcon'     : $('span.favePlay'),
        'loader'           : $('img#loader')
    };
    var changeStationTimeout;
    var initialStationsHaveLoaded = false;

    /**
     * Functions - Random functions that should probably be in one of the closures...
     */

    function changeTimeout() {
        stationsManager.removeCurrent();
        clearTimeout(changeStationTimeout);
        mainController.changeStationToNextStation();
    }

    function readyToPlay() {
        clearTimeout(changeStationTimeout);
        colorManager.setToGenreColor();
        mainController.playingStatePlay();
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

    function initialStationsLoaded() {
        elems.loader.hide();
        buttons.bigPlay.show();
        faveManager.initOldFaves();
        faveManager.showPlayingFave();
        initialStationsHaveLoaded = true;
    }

    function hideLandingPage() {
        elems.landingContainer.hide();
        elems.mainContainer.show();
    }

    function ipToHashCode(ip) {
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


    /**
     * Closures - Each one is like an 'object' that controls a certain aspect of the app
     */
    var mainController = {
        updateViewForNewSource : function(src) {
            sourceManager.setSource(src);
            elems.player.attr('src', sourceManager.getMediaSource());
            mainController.playingStateReload();
            colorManager.setToNeutral();
            faveManager.showPlayingFave();
            songNameManager.updateName(true);
            stationNameAnimation(false);
            hideLandingPage();
            clearTimeout(changeStationTimeout);
            changeStationTimeout = setTimeout(changeTimeout, 10000);
        },
        changeStationToNextStation : function() {
            var src = stationsManager.getNextStation();
            mainController.updateViewForNewSource(src);
        },
        changeStationToPrevStation : function() {
            var src = stationsManager.getPrevStation();
            mainController.updateViewForNewSource(src);
        },
        changeStationToNextGenre : function() {
            stationsManager.getNextGenre();
            var src = stationsManager.getNextStation();
            mainController.updateViewForNewSource(src);
        },
        changeStationToPrevGenre : function() {
            stationsManager.getPrevGenre();
            var src = stationsManager.getNextStation();
            mainController.updateViewForNewSource(src);
        },
        changeStationFromArgs: function(src, genreNum) {
            stationsManager.setActiveGenre(genreNum);
            mainController.updateViewForNewSource(src);
        },

        playingStateStop : function() {
            buttons.stop.hide();
            buttons.play.show();
            elems.player[0].pause();
            stationNameAnimation(false);
        },
        playingStatePlay : function() {
            buttons.play.hide();
            buttons.stop.show();
            stationNameAnimation(true);
            elems.player[0].play();
        },
        playingStateToggle : function() {
            if (mainController.playingStateIsPlaying()) {
                mainController.playingStateStop();
            } else {
                mainController.playingStatePlay();
            }
        },
        playingStateReload : function() {
            elems.player[0].load();
        },
        playingStateIsPlaying : function() {
            return !elems.player[0].paused;
        },
        stationPlayingChecker : function() {
            if (_skipThisCheck()) return;
            var timeCheckStart = elems.player[0].played.end(0);
            window.setTimeout(_playingChecker, 1000);
            function _playingChecker() {
                if (_skipThisCheck()) return;
                if (elems.player[0].played.end(0) === timeCheckStart) {
                    // There was no change in played time, so something is wrong, try to reload
                    mainController.playingStateReload();
                }
            }
            function _skipThisCheck() {
                return !mainController.playingStateIsPlaying() ||
                        elems.player[0].currentTime === null ||
                        elems.player[0].currentTime < 1 ||
                        elems.player[0].played.length < 1;
            }
        }
    };
    window.setInterval(mainController.stationPlayingChecker, 5000);

    var stationsManager = (function() {
        var genreManagers = [];
        var genreNum = 0;
        $.get('/get-initial-stations/', function(data) {
            data['stations'].forEach(function (stationList) {
                genreManagers.push(_getGenreManager(stationList));
            });
            if (window.location.hash.length == 0) {
                genreNum = Math.floor(Math.random() * genreManagers.length);
            }
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


    var sourceManager = {
        pre : 'http://',
        mediaPost : '/;?icy=http',
        sevenPost : '/7.html',

        setSource : function(newSource) {
            window.history.replaceState(null, null, '#' + ipToHashCode(newSource));
            elems.player.attr('src', sourceManager.getMediaSource());
            shareManager.updateShareUrl();
        },
        getMediaSource: function() {
            return sourceManager.pre + sourceManager.getSource() + sourceManager.mediaPost;
        },
        getMetaDataSource : function() {
            return  sourceManager.pre + sourceManager.getSource() + sourceManager.sevenPost;
        },
        getSource : function() {
            return hashCodeToIp(window.location.hash.substring(1));
        },
        noUrlSet : function() {
            return sourceManager.getSource() === '';
        },
        restoreFromHash : function() {
            // If the page is loaded with a #base64StringHere then play that station
            $.get('/get-genre-by-ip/', {"ip": sourceManager.getSource()}, function(data) {
                mainController.changeStationFromArgs(sourceManager.getSource(), data['genreNum']);
            });
        }
    };

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

    var colorManager = {
        setToGenreColor: function() {
            colorManager.setElemToGenreColor(elems.body);
            colorManager.setElemToGenreColor(elems.newFaveBox);
        },
        setToNeutral: function() {
           elems.body.animate({
               backgroundColor: '#aaa'
            }, 50);
            elems.newFaveBox.css("background-color", "#aaa");
        },
        setElemToGenreColor: function(elem) {
            var color = colorManager.genreNumToColor(stationsManager.getActiveGenre());
            elem.animate({
               backgroundColor: color
            }, 666);
        },
        genreNumToColor: function(genreNum) {
            var totalGenres = stationsManager.getGenreCount();
            genreNum = (genreNum * 360) / totalGenres;
            var genreColor = window.tinycolor('hsv(' + genreNum + ', 26%, 99%)');
            return genreColor.toHexString();
        }
    };

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
                mainController.changeStationToPrevStation();
            } else if (singleRightPress) {
                mainController.changeStationToNextStation();
            }
            singleLeftPress = false;
            singleRightPress = false;
        }
        function _handleKeyUp(event) {
            if (event.keyCode === 32) {
                mainController.playingStateToggle();
            } else if (event.keyCode === 77) {
                volumeManager.soundToggle();
            } else if (event.keyCode === 37) {
                if (singleLeftPress) {
                    mainController.changeStationToPrevGenre();
                    singleLeftPress = false;
                    _clearTimeouts();
                } else {
                    leftTimeout = true;
                    singleLeftPress = window.setTimeout(_clearTimeouts, 333);
                }
            } else if (event.keyCode === 39) {
                if (singleRightPress) {
                    mainController.changeStationToNextGenre();
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
                mainController.changeStationToNextStation();
            }
            var re = /<[^<]*>/gi;
            data = data.replace(re, '');
            var dataList = data.split(',');
            var isUp = dataList[1];
            if (isUp !== '1') {
                stationsManager.removeCurrent();
                mainController.changeStationToNextStation();
                return;
            }
            var newName = dataList.slice(6).join();
            // Check to see if this new station is playing the same song as the last one,
            //  if so, it's probably a duplicate station so go to the next one
            if (newName === songName && duplicateSongCheck) {
                stationsManager.removeCurrent();
                mainController.changeStationToNextStation();
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
            var infoUrl = sourceManager.getMetaDataSource();
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
            if (!initialStationsHaveLoaded) return;
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
            var ip = hashCodeToIp(faveIpHash);
            mainController.changeStationFromArgs(ip, faveData['genreNum']);
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

    var shareManager =  (function() {
        var config = {
            url: window.location.origin + encodeURIComponent(window.location.hash),
            ui: {
                flyout: 'bottom left',
                button_text: ''
            }
        };
        var share = new Share(".share-button", config);

        function _updateShareUrl() {
            config.url = window.location.origin + encodeURIComponent(window.location.hash);
            share = new Share(".share-button", config);
        }
        return {
            updateShareUrl : _updateShareUrl
        };
    }());


    /**
     * Listeners - Handle certain user actions
     */
    buttons.stop.click(mainController.playingStateStop);
    buttons.play.click(mainController.playingStatePlay);
    buttons.nextStation.click(mainController.changeStationToNextStation);
    buttons.nextGenre.click(mainController.changeStationToNextGenre);
    buttons.prevStation.click(mainController.changeStationToPrevStation);
    buttons.prevGenre.click(mainController.changeStationToPrevGenre);
    buttons.mute.click(volumeManager.soundOff);
    buttons.unmute.click(volumeManager.soundOn);
    buttons.bigPlay.click(mainController.changeStationToNextStation);
    elems.player.bind('canplay', readyToPlay);
    elems.player.bind('error', function (e) {
        window.console.error(e);
    });
    elems.spectrum.click(function (e) {
        var width = elems.spectrum.width();
        var genreCount = stationsManager.getGenreCount();
        var genreNum = Math.round((e.pageX/width) * genreCount);
        if (stationsManager.setActiveGenre(genreNum)) {
            mainController.changeStationToNextStation();
        }
    });


    /**
     * Setup - Set everything in motion
     */
    if (window.location.hash.length !== 0) {
        sourceManager.restoreFromHash();
    }
    buttons.play.hide();
});
