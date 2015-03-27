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
        'bigPlay'     : $('a#bigPlayButton').hide(),
        "play"        : $('span#playButton').hide(),
        'stop'        : $('span#stopButton'),
        'nextStation' : $('span#nextStationButton'),
        'nextGenre'   : $('span#nextGenreButton'),
        'prevStation' : $('span#prevStationButton'),
        'prevGenre'   : $('span#prevGenreButton'),
        'mute'        : $('span#muteButton'),
        'unmute'      : $('span#unmuteButton').hide(),
        'brightness'  : $('span#brightnessButton')
    };
    var elems = {
        'body'             : $('body'),
        'navBar'           : $('nav.navigationBar'),
        'player'           : $('audio#player'),
        'spectrum'         : $('img#spectrum'),
        'mainContainer'    : $('div#mainContainer').hide(),
        'landingContainer' : $('div#landingContainer'),
        'currentSongText'  : $('span#currentSong'),
        'stationInfo'      : $('div#stationInfo'),
        'oldFaveBox'       : $('div#oldFaveBox'),
        'newFaveBox'       : $('div#newFaveBox').hide(),
        'faveAddIcon'      : $('span.faveAdd'),
        'faveRemoveIcon'   : $('span.faveRemove'),
        'favePlayIcon'     : $('span.favePlay'),
        'loader'           : $('div.stillLoading'),
        'spectrumMarker'   : $('span.spectrumMarker').hide()
    };
    var changeStationTimeout;
    var initialStationsHaveLoaded = false;

    /**
     * Functions - Random functions that should probably be in one of the closures...
     */

    function changeTimeout() {
        StationsManager.removeCurrent();
        clearTimeout(changeStationTimeout);
        MainController.changeStationToNextStation();
    }

    function readyToPlay() {
        clearTimeout(changeStationTimeout);
        ColorManager.setToGenreColor();
        MainController.playingStatePlay();
        SpectrumManager.updateMarker();
    }

    function initialStationsLoaded() {
        elems.loader.hide();
        buttons.bigPlay.show();
        FaveManager.initOldFaves();
        SpectrumManager.updateMarker();
        initialStationsHaveLoaded = true;
    }

    function hideLandingPage() {
        elems.landingContainer.hide();
        elems.mainContainer.show();
        FaveManager.showHideNewFaveBox();
    }

    /**
     * Utility functions used throughout.
     */
    var Utils = {
        genreNumToColor: function (genreNum) {
            var totalGenres = StationsManager.getGenreCount();
            var colorNum = (genreNum * 360) / totalGenres;
            return Utils.hsvToRgb(colorNum, 26, 99);
        },
        ipToHashCode: function(ip) {
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
        },
        hashCodeToIp: function(hashcode) {
            var ip = '';
            for (var i = 0; i < 8; i += 2) {
                ip += parseInt(hashcode.substr(i, 2), 16).toString().trim() + '.';
            }
            ip = ip.slice(0, -1);
            ip += ':' + parseInt(hashcode.substr(8, 12), 16).toString();
            return ip;
        },
        hsvToRgb: function(h, s, v) {
            var r, g, b, i, f, p, q, t;
            h = Math.max(0, Math.min(360, h));
            s = Math.max(0, Math.min(100, s));
            v = Math.max(0, Math.min(100, v));
            s /= 100;
            v /= 100;
            if(s == 0) {
                r = g = b = v;
                return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
            }
            h /= 60;
            i = Math.floor(h);
            f = h - i;
            p = v * (1 - s);
            q = v * (1 - s * f);
            t = v * (1 - s * (1 - f));
            switch(i) {
                case 0: r = v; g = t; b = p; break;
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break;
                default: r = v; g = p; b = q;
            }
            return "#" + Math.round(r * 255).toString(16) +
                         Math.round(g * 255).toString(16) +
                         Math.round(b * 255).toString(16);
        }
    };


    /**
     * Handles all player controller buttons and actions. Responsible for station changes and play
     * state changes.
     */
    var MainController = {
        updateViewForNewSource : function(src) {
            UrlManager.setUrlHash(src);
            SpectrumManager.updateMarker();
            elems.player.attr('src', UrlManager.getMediaUrl());
            //ShareManager.updateShareUrl();
            MainController.playingStateReload();
            ColorManager.setToNeutral();
            FaveManager.showPlayingFave();
            SongNameManager.updateName(true);
            SongNameManager.animateClosed();
            hideLandingPage();

            clearTimeout(changeStationTimeout);
            changeStationTimeout = setTimeout(changeTimeout, 10000);
        },
        changeStationToNextStation : function() {
            var src = StationsManager.getNextStation();
            MainController.updateViewForNewSource(src);
        },
        changeStationToPrevStation : function() {
            var src = StationsManager.getPrevStation();
            MainController.updateViewForNewSource(src);
        },
        changeStationToNextGenre : function() {
            StationsManager.getNextGenre();
            var src = StationsManager.getNextStation();
            MainController.updateViewForNewSource(src);
        },
        changeStationToPrevGenre : function() {
            StationsManager.getPrevGenre();
            var src = StationsManager.getNextStation();
            MainController.updateViewForNewSource(src);
        },
        changeStationFromArgs: function(src, genreNum) {
            StationsManager.setActiveGenre(genreNum);
            MainController.updateViewForNewSource(src);
        },

        playingStateStop : function() {
            buttons.stop.hide();
            buttons.play.show();
            elems.player[0].pause();
            SongNameManager.animateClosed();
        },
        playingStatePlay : function() {
            SongNameManager.animateOpen();
            elems.player[0].play();
        },
        playingStateToggle : function() {
            if (MainController.playingStateIsPlaying()) {
                MainController.playingStateStop();
            } else {
                MainController.playingStateReload();
            }
        },
        playingStateReload : function() {
            buttons.play.hide();
            buttons.stop.show();
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
                    MainController.playingStateReload();
                }
            }
            function _skipThisCheck() {
                return !MainController.playingStateIsPlaying() ||
                        elems.player[0].currentTime === null ||
                        elems.player[0].currentTime < 1 ||
                        elems.player[0].played.length < 1;
            }
        }
    };
    window.setInterval(MainController.stationPlayingChecker, 5000);

    /**
     * Manages the genres and their stations. Keeps track of what genres and stations have been
     * played and what will be played in the future.
     */
    var StationsManager = (function() {
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

    /**
     * Manages the browser's url.
     */
    var UrlManager = {
        pre : 'http://',
        mediaPost : '/;?icy=http',
        sevenPost : '/7.html',

        setUrlHash : function(newSource) {
            window.history.replaceState(null, null, '#' + Utils.ipToHashCode(newSource));
        },
        getMediaUrl: function() {
            return UrlManager.pre + UrlManager.getUrl() + UrlManager.mediaPost;
        },
        getMetaDataUrl : function() {
            return  UrlManager.pre + UrlManager.getUrl() + UrlManager.sevenPost;
        },
        getUrl : function() {
            return Utils.hashCodeToIp(UrlManager.getHash());
        },
        getHash : function() {
            return window.location.hash.substring(1);
        },
        restoreFromHash : function() {
            // If the page is loaded with a #base64StringHere then play that station
            $.get('/get-genre-by-ip/', {"ip": UrlManager.getUrl()}, function(data) {
                MainController.changeStationFromArgs(UrlManager.getUrl(), data['genreNum']);
            });
        }
    };

    /**
     * Controls the volume of the player
     */
    var VolumeManager = {
        soundOff: function() {
            elems.player[0].muted = true;
            buttons.mute.hide();
            buttons.unmute.show();
        },
        soundOn: function() {
            elems.player[0].muted = false;
            buttons.mute.show();
            buttons.unmute.hide();
        },
        soundToggle: function() {
            if (elems.player[0].muted) {
                VolumeManager.soundOn();
            } else {
                VolumeManager.soundOff();
            }
        }
    };

    /**
     * Manages the background color and it's animations.
     */
    var ColorManager = {
        isBright: true,
        setToGenreColor: function() {
            if (ColorManager.isBright) {
                ColorManager.setElemBgToGenreColor(elems.body);
                ColorManager.setElemBgToGenreColor(elems.newFaveBox);
            } else {
                ColorManager.setElemBgToGenreColor(elems.navBar);
                ColorManager.setElemFgToGenreColor(elems.stationInfo);
                ColorManager.setElemBgToGenreColor(elems.newFaveBox);
            }
        },
        setToNeutral: function() {
            if (ColorManager.isBright) {
                elems.body.animate({
                    backgroundColor: '#aaa'
                }, 50);
            } else {
                elems.navBar.animate({
                    backgroundColor: '#aaa',
                    text: '#aaa'
                }, 50);
            }
            elems.newFaveBox.css("background-color", "#aaa");
        },
        setElemBgToGenreColor: function(elem) {
            var color = Utils.genreNumToColor(StationsManager.getActiveGenre());
            elem.stop(true).animate({
               'backgroundColor': color
            }, 666);
        },
        setElemFgToGenreColor: function(elem) {
            var color = Utils.genreNumToColor(StationsManager.getActiveGenre());
            elem.css({
                'color': color,
                'border-color': color
            });
        },
        switchBrightness: function() {
            if (ColorManager.isBright) {
                ColorManager.isBright = false;
                elems.body.stop(true, true);
                elems.body.css("background-color" , "black");
                elems.navBar.css("color", "black");
                elems.landingContainer.css("color", "white");
                ColorManager.setToGenreColor();
            } else {
                ColorManager.isBright = true;
                elems.navBar.stop(true, true);
                elems.navBar.css("backgroundColor", "black");
                elems.navBar.css("color", "white");
                elems.stationInfo.css("color", "black")
                                 .css("border-color", "black");
                elems.landingContainer.css("color", "black");
                ColorManager.setToGenreColor();
            }
        }
    };

    /**
     * Handles all keyboard controls for player.
     */
    var KeyUpManager = (function() {
        var singleRightPress = false;
        var singleLeftPress = false;
        var leftTimeout;
        var rightTimeout;
        window.onkeyup = _handleKeyUp;

        function _clearTimeouts() {
            clearTimeout(leftTimeout);
            clearTimeout(rightTimeout);
            if (singleLeftPress) {
                MainController.changeStationToPrevStation();
            } else if (singleRightPress) {
                MainController.changeStationToNextStation();
            }
            singleLeftPress = false;
            singleRightPress = false;
        }
        function _handleKeyUp(event) {
            if (event.keyCode === 32) {
                MainController.playingStateToggle();
            } else if (event.keyCode === 77) {
                VolumeManager.soundToggle();
            } else if (event.keyCode === 37) {
                if (singleLeftPress) {
                    MainController.changeStationToPrevGenre();
                    singleLeftPress = false;
                    _clearTimeouts();
                } else {
                    leftTimeout = true;
                    singleLeftPress = window.setTimeout(_clearTimeouts, 333);
                }
            } else if (event.keyCode === 39) {
                if (singleRightPress) {
                    MainController.changeStationToNextGenre();
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

    /**
     * Controls all aspects of the currently playing song name.
     */
    var SongNameManager = (function () {
        var songName = '-1';
        var duplicateSongCheck = false;
        var intervalId = -1;

        function _setName(data, status) {
            if (status !== "success") {
                StationsManager.removeCurrent();
                MainController.changeStationToNextStation();
            }
            var re = /<[^<]*>/gi;
            data = data.replace(re, '');
            var dataList = data.split(',');
            var isUp = dataList[1];
            if (isUp !== '1') {
                StationsManager.removeCurrent();
                MainController.changeStationToNextStation();
                return;
            }
            var newName = dataList.slice(6).join();
            // Check to see if this new station is playing the same song as the last one,
            //  if so, it's probably a duplicate station so go to the next one
            if (newName === songName && duplicateSongCheck) {
                StationsManager.removeCurrent();
                MainController.changeStationToNextStation();
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
            var infoUrl = UrlManager.getMetaDataUrl();
            $.get('/get-station-info/?stationUrl='+infoUrl,  _setName, 'html');
        }
        function _animateOpen() {
            elems.stationInfo.stop(true).animate({
                'max-height': 300,
                'padding-top': '15px',
                'padding-bottom': '15px'
            }, 333, 'swing', function () {
                elems.stationInfo.children().css('visibility', 'visible');
            });
        }
        function _animateClosed() {
            elems.stationInfo.children().css('visibility','hidden');
            elems.stationInfo.stop(true).animate({
                'max-height': 0,
                'padding-top': 0,
                'padding-bottom': 0
            }, 333, 'swing');
        }

        return {
            updateName   : _updateName,
            animateOpen  : _animateOpen,
            animateClosed: _animateClosed
        };
    }());

    /**
     * Manages the adding and removal of favourites in the header bar.
     */
    var FaveManager = (function () {
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
        window.addEventListener('storage', _storageChanged);

        function _initOldFaves() {
            faves.forEach(function (fave) {
                var newBox = elems.oldFaveBox.clone(true).insertBefore(elems.oldFaveBox).show();
                var color = Utils.genreNumToColor(fave['genreNum']);
                newBox.css("background-color", color);
            });
            _showHideNewFaveBox();
            _showPlayingFave();
        }
        function _addFave() {
            if (!initialStationsHaveLoaded) return;
            var faveCount = $('div#oldFaveBox').length - 1;
            var newBox = elems.oldFaveBox.clone(true).insertBefore(elems.oldFaveBox).show();
            ColorManager.setElemBgToGenreColor(newBox);
            var ipHash = UrlManager.getHash();
            var genreNum = StationsManager.getActiveGenre();
            faves[faveCount] = {"ipHash" : ipHash, "genreNum" : genreNum};
            window.localStorage.setItem("faves", JSON.stringify(faves));
            _showPlayingFave();
            _showHideNewFaveBox();
            _reportFaveChange(Utils.hashCodeToIp(ipHash), true);
        }
        function _playFave(elem) {
            var faveNum = $(elem.target).parent().index();
            var faveData = faves[faveNum];
            var faveIpHash = faveData['ipHash'];
            if (UrlManager.getHash() == faveIpHash) {
                // IF we are already playing the station selected, do nothing
                return;
            }
            var ip = Utils.hashCodeToIp(faveIpHash);
            MainController.changeStationFromArgs(ip, faveData['genreNum']);
        }
        function _removeFave(elem) {
            var faveNum = $(elem.target).parent().index();
            $(elem.target).parent().remove();
            var faveRemoved = faves.splice(faveNum, 1)[0];
            _reportFaveChange(Utils.hashCodeToIp(faveRemoved['ipHash']), false);
            window.localStorage.setItem("faves", JSON.stringify(faves));
            _showHideNewFaveBox();
        }
        function _showHideNewFaveBox() {
            if ($('div#oldFaveBox').length <= maxFaves && UrlManager.getHash().length > 1) {
                elems.newFaveBox.show();
            } else {
                elems.newFaveBox.hide();
            }
        }
        function _showPlayingFave() {
            faves.forEach(function (fave, index) {
                if (fave['ipHash'] === UrlManager.getHash()) {
                    $("span.favePlay").eq(index).css('color', 'white');
                } else {
                    $("span.favePlay").eq(index).css('color', 'black');
                }
            });
        }
        function _reportFaveChange(ip, faveWasAdded) {
            $.post("/report-fave-changed/",  {ip : ip, faveWasAdded : faveWasAdded});
        }
        function _storageChanged(event) {
            if (event.key === "faves") {
                faves = window.localStorage.getItem("faves");
                if (faves === null) {
                    faves = [];
                } else {
                    faves = JSON.parse(faves);
                }
                $('div#oldFaveBox').not(elems.oldFaveBox).remove();
                _initOldFaves();
            }
        }
        return {
            initOldFaves : _initOldFaves,
            showPlayingFave : _showPlayingFave,
            showHideNewFaveBox : _showHideNewFaveBox
        };
    }());

    /**
     * Manages the share button in the header bar. Also responsible for updating the url that
     * will be shared whenever the page url changes.

    var ShareManager =  (function() {
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
     */

    var SpectrumManager = {
        isDragging : false,
        handleStopDrag : function(xVal) {
            var totalWidth = elems.spectrum.width();
            xVal = Math.max(1, Math.min(totalWidth, xVal));
            var genreCount = StationsManager.getGenreCount();
            var genreNum = Math.min(Math.round((xVal/totalWidth) * genreCount), genreCount - 1);
            if (StationsManager.setActiveGenre(genreNum)) {
                MainController.changeStationToNextStation();
            } else {
                SpectrumManager.updateMarker();
            }
        },
        updateMarker : function() {
            var genreNum = StationsManager.getActiveGenre();
            var genreCount = StationsManager.getGenreCount();
            var totalWidth = elems.spectrum.width();
            var xCoord = Math.round((totalWidth * genreNum)/ genreCount);
            elems.spectrumMarker.show();
            elems.spectrumMarker.css("left", xCoord);
        },
        dragHandler : function() {
            elems.spectrumMarker.bind('mousedown touchstart', function() {
                $(window).bind('mousemove touchmove', function(event) {
                    SpectrumManager.isDragging = true;
                    elems.spectrumMarker.css("left", event.pageX - 13);
                });
            });
            $(window).bind('mouseup touchend', function(event) {
                if (SpectrumManager.isDragging) {
                    SpectrumManager.isDragging = false;
                    $(window).unbind('mousemove');
                    SpectrumManager.handleStopDrag(event.pageX - 13);
                }
            });
        }()
    };


    /**
     * Listeners - Handle certain user actions
     */
    buttons.stop.click(MainController.playingStateStop);
    buttons.play.click(MainController.playingStateReload);
    buttons.nextStation.click(MainController.changeStationToNextStation);
    buttons.nextGenre.click(MainController.changeStationToNextGenre);
    buttons.prevStation.click(MainController.changeStationToPrevStation);
    buttons.prevGenre.click(MainController.changeStationToPrevGenre);
    buttons.mute.click(VolumeManager.soundOff);
    buttons.unmute.click(VolumeManager.soundOn);
    buttons.bigPlay.click(MainController.changeStationToNextStation);
    buttons.brightness.click(ColorManager.switchBrightness);
    elems.player.bind('canplay', readyToPlay);
    elems.player.bind('error', function (e) {
        window.console.error(e);
    });


    /**
     * Setup - Set everything in motion
     */
    if (window.location.hash.length !== 0) {
        UrlManager.restoreFromHash();
    }
});
