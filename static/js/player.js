/*global $:false */
/*global Share:false */
/*jshint -W069 */
/*jshint -W116 */

window.onload = function() {
    'use strict';
    /**
     * Global Variables
     */
    var buttons = {
        'bigPlay'     : $('span#bigPlayButton'),
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
        'spectrumMarker'   : $('span.spectrumMarker').hide(),
        'spectrumClickBar' : $('span.spectrumClickBar')
    };
    var changeStationTimeout;
    var initialStationsHaveLoaded = false;

    /**
     * Functions - Random functions that should probably be in one of the closures...
     */

    function changeTimeout() {
        StationsManager.removeCurrentThenNext();
        clearTimeout(changeStationTimeout);
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
        SpectrumManager.hoverHandler();
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
        ZEROES : '00000000000000000000000000000000',
        genreNumToColor: function (genreNum) {
            var totalGenres = StationsManager.getGenreCount();
            var colorNum = (genreNum * 360) / totalGenres;
            return Utils.hsvToRgb(colorNum, 26, 99);
        },
        ipToHashCode: function(ip) {
            var parts = ip.split(':');
            var hashcode = parts[0].split('.').reduce(function (accumulator,octetAsString) {
                var bin = Utils.ZEROES + parseInt(octetAsString).toString(2);
                return accumulator + bin.substr(-8);
            }, '');
            var port = Utils.ZEROES + parseInt(parts[1]).toString(2);
            hashcode += port.substr(-16);
            return (Utils.ZEROES + parseInt(hashcode.substr(0, 24), 2).toString(32)).substr(-5) +
                    (Utils.ZEROES + parseInt(hashcode.substr(24), 2).toString(32)).substr(-5);
        },
        hashCodeToIp: function(hashcode) {
            var bin = (Utils.ZEROES +parseInt(hashcode.substr(0, 5), 32).toString(2)).substr(-24) +
                    (Utils.ZEROES + parseInt(hashcode.substr(5), 32).toString(2)).substr(-24);
            var ip = '';
            for (var i = 0; i < 32; i += 8) {
                ip += parseInt(bin.substr(i, 8), 2).toString().trim() + '.';
            }
            ip = ip.slice(0, -1);
            ip += ':' + parseInt(bin.substr(-16), 2).toString();
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
        changeStationFromArgsAndSetFirst: function(src, genreNum) {
            StationsManager.setActiveGenre(genreNum);
            MainController.updateViewForNewSource(src);
            StationsManager.setStationFirstUnique(src);
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
        var genreLists = [];
        var genreMarkers = [];
        var genreNum = 0;
        $.get('/get-initial-stations/', function(data) {
            data['stations'].forEach(function (stationList) {
                genreLists.push(stationList);
                genreMarkers.push(-1);
            });
            if (UrlManager.getHash().length == 0) {
                genreNum = Math.floor(Math.random() * genreLists.length);
            }
            initialStationsLoaded();
        });

        function _getNextGenre() {
            genreNum = (genreNum + 1) % genreLists.length;
            return genreNum;
        }
        function _getPrevGenre() {
            genreNum = (genreNum + genreLists.length - 1) % genreLists.length;
            return genreNum;
        }
        function _getNextStation() {
            genreMarkers[genreNum] = (genreMarkers[genreNum] + 1) % genreLists[genreNum].length;
            return genreLists[genreNum][genreMarkers[genreNum]];
        }
        function _getPrevStation() {
            genreMarkers[genreNum] = (genreMarkers[genreNum] + (genreLists[genreNum].length - 1)) %
                                                                genreLists[genreNum].length;
            return genreLists[genreNum][genreMarkers[genreNum]];
        }
        function _getActiveGenre() {
            return genreNum;
        }
        function _setActiveGenre(genreInfo) {
            if (genreNum === genreInfo) return false;
            genreNum = genreInfo;
            return true;
        }
        function _removeCurrentThenNext() {
            genreLists[genreNum].splice(genreMarkers[genreNum], 1);
            genreMarkers[genreNum] -= 1;
            MainController.changeStationToNextStation();
        }
        function _getGenreCount() {
            return genreLists.length;
        }
        function _setStationFirstUnique(src) {
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
        }
        return {
            getNextGenre           : _getNextGenre,
            getNextStation         : _getNextStation,
            getActiveGenre         : _getActiveGenre,
            setActiveGenre         : _setActiveGenre,
            removeCurrentThenNext  : _removeCurrentThenNext,
            getPrevStation         : _getPrevStation,
            getPrevGenre           : _getPrevGenre,
            getGenreCount          : _getGenreCount,
            setStationFirstUnique  : _setStationFirstUnique
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
                MainController.changeStationFromArgsAndSetFirst(UrlManager.getUrl(), data['genreNum']);
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
                elems.body.velocity({
                    backgroundColor: '#aaa'
                }, 50);
            } else {
                elems.navBar.velocity({
                    backgroundColor: '#aaa',
                    text: '#aaa'
                }, 50);
            }
            elems.newFaveBox.css("background-color", "#aaa");
        },
        setElemBgToGenreColor: function(elem) {
            var color = Utils.genreNumToColor(StationsManager.getActiveGenre());
            elem.velocity('finish').velocity({
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
                elems.body.velocity('finish');
                elems.body.css("background-color" , "black");
                elems.navBar.css("color", "black");
                elems.landingContainer.css("color", "white");
                ColorManager.setToGenreColor();
            } else {
                ColorManager.isBright = true;
                elems.navBar.velocity('finish');
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
                StationsManager.removeCurrentThenNext();
            }
            var re = /<[^<]*>/gi;
            data = data.replace(re, '');
            var dataList = data.split(',');
            var isUp = dataList[1];
            if (isUp !== '1') {
                StationsManager.removeCurrentThenNext();
                return;
            }
            var newName = dataList.slice(6).join();
            // Check to see if this new station is playing the same song as the last one,
            //  if so, it's probably a duplicate station so go to the next one
            if (newName === songName && duplicateSongCheck) {
                StationsManager.removeCurrentThenNext();
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
            elems.stationInfo.velocity('finish').velocity({
                'max-height': 300,
                'padding-top': '15px',
                'padding-bottom': '15px'
            }, {
                duration: 333,
                easing: 'swing',
                complete: function () {
                    elems.stationInfo.children().css('visibility', 'visible');
                }
            });
        }
        function _animateClosed() {
            elems.stationInfo.velocity('finish').velocity({
                'max-height': 0,
                'padding-top': 0,
                'padding-bottom': 0
            }, {
                duration:  333,
                easing: 'swing',
                begin : function () {
                    elems.stationInfo.children().css('visibility','hidden');
                }
            });
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
     * Manages everything relating to the bottom spectrum bar
     */
    var SpectrumManager = {
        markerWidth : 18,
        currentXval : -1,
        handleClick : function(event) {
            var totalWidth = elems.spectrum.width();
            var xVal = Math.max(1, Math.min(totalWidth, event.pageX - SpectrumManager.markerWidth));
            var genreCount = StationsManager.getGenreCount();
            var genreNum = Math.min(Math.round((xVal / totalWidth) * genreCount), genreCount - 1);
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
            var xCoord = Math.round((totalWidth * genreNum) / genreCount);
            elems.spectrumMarker.show();
            elems.spectrumMarker.velocity('stop', true).velocity({translateX: xCoord + "px"});
            SpectrumManager.currentXval = xCoord;
        },
        hoverHandler : function() {
            var totalWidth = $(window).width();
            var genreCount = StationsManager.getGenreCount();
            elems.spectrumClickBar.bind('mousemove', function(event) {
                var xVal = Math.max(1, Math.min(totalWidth, event.pageX - SpectrumManager.markerWidth));
                xVal = Math.round((xVal / totalWidth) * genreCount) * (totalWidth / genreCount);
                if (xVal === SpectrumManager.currentXval) return;
                SpectrumManager.currentXval = xVal;
                elems.spectrumMarker.velocity('stop', true).velocity({translateX: xVal + "px"});
            }).bind('mouseout', SpectrumManager.updateMarker);
        }
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
    elems.spectrumClickBar.click(SpectrumManager.handleClick);


    /**
     * Setup - Set everything in motion
     */
    if (window.location.hash.length !== 0) {
        UrlManager.restoreFromHash();
    }
};
