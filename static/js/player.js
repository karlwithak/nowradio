/*global $:false */
/*jshint -W069 */

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
        "#ddd",
        "#dfb",
        "#dff",
        "#fbd",
        "#fdb",
        "#fdf",
        "#ffd"
    ];
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
    function changeStation(src, genreNum) {
        colorManager.changeGenreColor(colors[genreNum]);
        urlManager.setUrl(src);
        player.attr('src', urlManager.getMediaUrl());
        playerStateManager.play();
        songNameManager.updateName(true);
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

        return { stop : _stop, play : _play, toggle : _toggle };
    }());

    var stationsManager = (function() {
        var genreManagers = [];
        var genreNum = 0;
        $.get('/get-initial-stations/', function(data) {
            for (var i = 0; i < data['stations'].length; i++) {
                genreManagers.push(_getGenreManager(data['stations'][i]));
            }
        });

        function _getDiffGenre() {
            genreNum = (genreNum + 1) % genreManagers.length;
            var station = genreManagers[genreNum].getSameGenre();
            playlistManager.addNew(station);
            changeStation(station, genreNum);
        }
        function _getSameGenre() {
            var station = genreManagers[genreNum].getSameGenre();
            playlistManager.addNew(station);
            changeStation(station, genreNum);
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
        function _getGenreManager(stationsList) {
            var stations = stationsList;
            var stationNum = 0;

            function _getSameGenre() {
                stationNum = (stationNum + 1) % stations.length ;
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

            return { getSameGenre : _getSameGenre, removeStation : _removeStation};
        }

        return {
            getDiffGenre : _getDiffGenre, getSameGenre : _getSameGenre,
            getActiveGenre: _getActiveGenre, setActiveGenre : _setActiveGenre,
            removeStationFromGenre: _removeStationFromGenre
        };
    }());


    var urlManager = (function() {
        var url = '';
        var pre = "http://";
        var mediaPost = '/;?icy=http';
        var sevenPost = '/7.html';

        function _setUrl(newUrl) {
            url = newUrl;
            window.history.replaceState(null, null, "#" + btoa(url));
        }
        function _getMediaUrl() {
            return pre + url + mediaPost;
        }
        function _getDataUrl() {
            return  pre + url + sevenPost;
        }

        return { setUrl : _setUrl, getMediaUrl : _getMediaUrl, getDataUrl : _getDataUrl};
    }());

    // Warning to future nick, this is a strange data structure!
    var playlistManager = (function() {
        buttons.back.prop('disabled', true);
        var playlist = [];
        var index = -1;
        var end = -1;

        function _goBack() {
            if (index === 0) {
                window.console.error("tried to go back too far in playlist");
                return playlist[end];
            }
            index -= 1;
            if (index === 0) {
                buttons.back.prop('disabled', true);
            }
            stationsManager.setActiveGenre(playlist[index][1]);
            changeStation(playlist[index][0], playlist[index][1]);
        }
        function _addNew(station) {
            var genreInfo = stationsManager.getActiveGenre();
            index += 1;
            end = index;
            playlist[index] = [station, genreInfo];
            if (index > 0) {
                buttons.back.prop('disabled', false);
            }
        }

        return { goBack : _goBack, addNew : _addNew };
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

        return { soundOff: _soundOff, soundOn : _soundOn, soundToggle: _soundToggle };
    }());

    var colorManager = (function() {
        var genreColor = "white";
        var elems = {
            'body'          : $("body"),
            'infoPanel'     : $("div#infoPanel"),
            'settingsPanel' : $("div#settingsPanel"),
            'stationInfo'   : $("div#stationInfo")
        };

        function _setColors(background) {
            elems.body.animate({
               backgroundColor: background
            }, 1000);
        }
        function _changeGenreColor(color) {
            elems.body.animate({
               backgroundColor: "#ffffff"
            }, 50);
            genreColor = color;
        }
        function _setToGenreColor() {
            _setColors(genreColor);
        }

        return { changeGenreColor : _changeGenreColor, setToGenreColor : _setToGenreColor};
    }());

    var keyUpManager = (function() {
        var singleRightPress = false;
        var timeOutInterval;

        function _clearRightPress() {
            singleRightPress = false;
            stationsManager.getSameGenre();
        }
        function _handleKeyUp(event) {
            if (event.keyCode === 32) {
                playerStateManager.toggle();
            } else if (event.keyCode === 77) {
                volumeManager.soundToggle();
            } else if (event.keyCode === 37) {
                buttons.back.click();
            } else if (event.keyCode === 39) {
                if (singleRightPress) {
                    stationsManager.getDiffGenre();
                    singleRightPress = false;
                    clearInterval(timeOutInterval);
                } else {
                    singleRightPress = true;
                    timeOutInterval = window.setTimeout(_clearRightPress, 333);
                }
            }
        }

        return { handleKeyUp : _handleKeyUp};
    }());

    var songNameManager = (function () {
        var stationName = "";
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
            if (data === stationName && duplicateSongCheck) {
                stationsManager.getSameGenre();
            } else {
                $('span#currentSong').text(data);
                stationName = data;
                duplicateSongCheck = false;
                intervalId = setInterval(_updateName, 5000);
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

        return { updateName : _updateName };
    }());


    /**
     * Listeners - Handle certain user actions
     */
    buttons.stop.click(playerStateManager.stop);
    buttons.play.click(playerStateManager.play);
    buttons.next1.click(stationsManager.getSameGenre);
    buttons.next3.click(stationsManager.getDiffGenre);
    buttons.back.click(playlistManager.goBack);
    buttons.mute.click(volumeManager.soundOff);
    buttons.unmute.click(volumeManager.soundOn);
    buttons.bigPlay.click(function () {
        $('div#landingContainer').hide();
        $('div#mainContainer').show();
        volumeManager.soundOn();
    });
    player.bind("canplay", colorManager.setToGenreColor);


    /**
     * Setup - Set everything in motion
     */
    if (window.location.hash.length !== 0) {
        // If the page is loaded with a #base64StringHere then play that station
        buttons.bigPlay.click();
        var url = atob(window.location.hash.substring(1));
        playlistManager.addNew(url);
        $.get('/get-genre-by-ip/', {'ip': url}, function(data) {
            var genreNum = data['genreNum'];
            stationsManager.setActiveGenre(genreNum);
            changeStation(url, genreNum);
            stationsManager.removeStationFromGenre(url, genreNum);
        });

    } else {
        setTimeout(stationsManager.getSameGenre, 1000);
        volumeManager.soundOff();
    }
    window.onkeyup = keyUpManager.handleKeyUp;
});

