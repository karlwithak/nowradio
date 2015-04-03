/*global $:false */
/*global Share:false */
/*jshint -W069 */
/*jshint -W116 */

window.onload = function() {
    'use strict';
    /**
     * Global Variables
     */
    var $buttons = {
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
    var $elems = {
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
        'spectrumClickBar' : $('span.spectrumClickBar'),
        'centerContainer'  : $('div.verticalCenter')
    };

    /**
     * Utility functions used throughout.
     */
    var Utils = {
        ZEROES: '00000000000000000000000000000000'
    };
    Utils.genreNumToColor = function (genreNum) {
        var totalGenres = StationsManager.getGenreCount();
        var colorNum = (genreNum * 360) / totalGenres;
        return this.hsvToRgb(colorNum, 26, 99);
    };
    Utils.ipToHashCode = function(ip) {
        var parts = ip.split(':');
        var hashcode = parts[0].split('.').reduce(function (accumulator,octetAsString) {
            var bin = Utils.ZEROES + parseInt(octetAsString).toString(2);
            return accumulator + bin.substr(-8);
        }, '');
        var port = this.ZEROES + parseInt(parts[1]).toString(2);
        hashcode += port.substr(-16);
        return (this.ZEROES + parseInt(hashcode.substr(0, 24), 2).toString(32)).substr(-5) +
                (this.ZEROES + parseInt(hashcode.substr(24), 2).toString(32)).substr(-5);
    };
    Utils.hashCodeToIp = function(hashcode) {
        var bin = (this.ZEROES +parseInt(hashcode.substr(0, 5), 32).toString(2)).substr(-24) +
                (this.ZEROES + parseInt(hashcode.substr(5), 32).toString(2)).substr(-24);
        var ip = '';
        for (var i = 0; i < 32; i += 8) {
            ip += parseInt(bin.substr(i, 8), 2).toString().trim() + '.';
        }
        ip = ip.slice(0, -1);
        ip += ':' + parseInt(bin.substr(-16), 2).toString();
        return ip;
    };
    Utils.hsvToRgb = function(h, s, v) {
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
    };

    /**
     * Handles all station changing logic.
     */
    var StationChanger = {};
    StationChanger.nextStation = function() {
        var src = StationsManager.getNextStation();
        MainController.updateViewForNewSource(src);
    };
    StationChanger.prevStation = function() {
        var src = StationsManager.getPrevStation();
        MainController.updateViewForNewSource(src);
    };
    StationChanger.nextGenre = function() {
        StationsManager.getNextGenre();
        var src = StationsManager.getNextStation();
        MainController.updateViewForNewSource(src);
    };
    StationChanger.prevGenre = function() {
        StationsManager.getPrevGenre();
        var src = StationsManager.getNextStation();
        MainController.updateViewForNewSource(src);
    };
    StationChanger.fromArgs = function(src, genreNum) {
        StationsManager.setActiveGenre(genreNum);
        MainController.updateViewForNewSource(src);
    };
    StationChanger.fromArgsAndSetFirst = function(src, genreNum) {
        StationsManager.setActiveGenre(genreNum);
        MainController.updateViewForNewSource(src);
        StationsManager.setStationFirstUnique(src);
    };

    /**
     * Handles all player controller buttons and actions. Responsible for station changes and play
     * state changes.
     */
    var MainController = {
        changeStationTimeout : -1,
        initialStationsHaveLoaded : false
    };
    MainController.changeTimeout = function() {
        StationsManager.removeCurrentThenNext();
        clearTimeout(this.changeStationTimeout);
    };
    MainController.readyToPlay = function() {
        clearTimeout(this.changeStationTimeout);
        ColorManager.setToGenreColor();
        this.playingStatePlay();
        SpectrumManager.updateMarker();
    };
    MainController.initialStationsLoaded = function() {
        $elems.loader.hide();
        $buttons.bigPlay.show();
        FaveManager.initOldFaves();
        SpectrumManager.updateMarker();
        SpectrumManager.hoverHandler();
        this.initialStationsHaveLoaded = true;
    };
    MainController.hideLandingPage = function() {
        $elems.landingContainer.hide();
        $elems.mainContainer.show();
        FaveManager.showHideNewFaveBox();
    };
    MainController.updateViewForNewSource = function(src) {
        UrlManager.setUrlHash(src);
        SpectrumManager.updateMarker();
        $elems.player.attr('src', UrlManager.getMediaUrl());
        MainController.playingStateReload();
        ColorManager.setToNeutral();
        FaveManager.showPlayingFave();
        SongNameManager.updateName(true);
        SongNameManager.animateClosed();
        this.hideLandingPage();

        clearTimeout(this.changeStationTimeout);
        this.changeStationTimeout = setTimeout(this.changeTimeout, 10000);
    };
    MainController.playingStateStop = function() {
        $buttons.stop.hide();
        $buttons.play.show();
        $elems.player[0].pause();
        SongNameManager.animateClosed();
    };
    MainController.playingStatePlay = function() {
        SongNameManager.animateOpen();
        $elems.player[0].play();
    };
    MainController.playingStateToggle = function() {
        if (MainController.playingStateIsPlaying()) {
            MainController.playingStateStop();
        } else {
            MainController.playingStateReload();
        }
    };
    MainController.playingStateReload = function() {
        $buttons.play.hide();
        $buttons.stop.show();
        $elems.player[0].load();
    };
    MainController.playingStateIsPlaying = function() {
        return !$elems.player[0].paused;
    };
    MainController.stationPlayingChecker = function() {
        if (_skipThisCheck()) return;
        var timeCheckStart = $elems.player[0].played.end(0);
        window.setTimeout(_playingChecker, 1000);
        function _playingChecker() {
            if (_skipThisCheck()) return;
            if ($elems.player[0].played.end(0) === timeCheckStart) {
                // There was no change in played time, so something is wrong, try to reload
                MainController.playingStateReload();
            }
        }
        function _skipThisCheck() {
            return !MainController.playingStateIsPlaying() ||
                    $elems.player[0].currentTime === null ||
                    $elems.player[0].currentTime < 1 ||
                    $elems.player[0].played.length < 1;
        }
    };
    window.setInterval(MainController.stationPlayingChecker.bind(MainController), 5000);

    /**
     * Manages the genres and their stations. Keeps track of what genres and stations have been
     * played and what will be played in the future.
     */
    var StationsManager = {
        genreLists : [],
        genreMarkers : [],
        genreNum : 0
    };
    StationsManager.getNextGenre = function() {
        this.genreNum = (this.genreNum + 1) % this.genreLists.length;
        return this.genreNum;
    };
    StationsManager.getPrevGenre = function() {
        this.genreNum = (this.genreNum + this.genreLists.length - 1) % this.genreLists.length;
        return this.genreNum;
    };
    StationsManager.getNextStation = function() {
        this.genreMarkers[this.genreNum] = (this.genreMarkers[this.genreNum] + 1) % this.genreLists[this.genreNum].length;
        return this.genreLists[this.genreNum][this.genreMarkers[this.genreNum]];
    };
    StationsManager.getPrevStation = function() {
        this.genreMarkers[this.genreNum] = (this.genreMarkers[this.genreNum] + (this.genreLists[this.genreNum].length - 1)) %
                                                            this.genreLists[this.genreNum].length;
        return this.genreLists[this.genreNum][this.genreMarkers[this.genreNum]];
    };
    StationsManager.getActiveGenre = function() {
        return this.genreNum;
    };
    StationsManager.setActiveGenre = function(genreInfo) {
        if (this.genreNum === genreInfo) return false;
        this.genreNum = genreInfo;
        return true;
    };
    StationsManager.removeCurrentThenNext = function() {
        this.genreLists[this.genreNum].splice(this.genreMarkers[this.genreNum], 1);
        this.genreMarkers[this.genreNum] -= 1;
        StationChanger.nextStation();
    };
    StationsManager.getGenreCount = function() {
        return this.genreLists.length;
    };
    StationsManager.setStationFirstUnique = function(src) {
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
    StationsManager._init = function(_this) {
        $.get('/get-initial-stations/', function(data) {
            data['stations'].forEach(function (stationList) {
                _this.genreLists.push(stationList);
                _this.genreMarkers.push(-1);
            });
            if (UrlManager.getHash().length == 0) {
                _this.genreNum = Math.floor(Math.random() * _this.genreLists.length);
            }
            MainController.initialStationsLoaded();
        });
    }(StationsManager);

    /**
     * Manages the browser's url.
     */
    var UrlManager = {
        pre: 'http://',
        mediaPost: '/;?icy=http',
        sevenPost: '/7.html'
    };
    UrlManager.setUrlHash = function(newSource) {
        window.history.replaceState(null, null, '#' + Utils.ipToHashCode(newSource));
    };
    UrlManager.getMediaUrl = function() {
        return this.pre + this.getUrl() + this.mediaPost;
    };
    UrlManager.getMetaDataUrl = function() {
        return this.pre + this.getUrl() + this.sevenPost;
    };
    UrlManager.getUrl = function() {
        return Utils.hashCodeToIp(this.getHash());
    };
    UrlManager.getHash = function() {
        return window.location.hash.substring(1);
    };
    UrlManager.restoreFromHash = function() {
        var _this = this;
        // If the page is loaded with a #base64StringHere then play that station
        $.get('/get-genre-by-ip/', {"ip": this.getUrl()}, function(data) {
            StationChanger.fromArgsAndSetFirst(_this.getUrl(), data['genreNum']);
        });
    };

    /**
     * Controls the volume of the player
     */
    var VolumeManager = {};
    VolumeManager.soundOff = function() {
        $elems.player[0].muted = true;
        $buttons.mute.hide();
        $buttons.unmute.show();
    };
    VolumeManager.soundOn = function() {
        $elems.player[0].muted = false;
        $buttons.mute.show();
        $buttons.unmute.hide();
    };
    VolumeManager.soundToggle = function() {
        if ($elems.player[0].muted) {
            this.soundOn();
        } else {
            this.soundOff();
        }
    };

    /**
     * Manages the background color and it's animations.
     */
    var ColorManager = {
        isBright: true
    };
    ColorManager.setToGenreColor = function() {
        if (this.isBright) {
            this.setElemBgToGenreColor($elems.centerContainer);
            this.setElemBgToGenreColor($elems.centerContainer);
            $('meta[name="theme-color"]').attr('content', this.currentGenreColor());
        } else {
            this.setElemBgToGenreColor($elems.navBar);
            this.setElemFgToGenreColor($elems.stationInfo);
            this.setElemBgToGenreColor($elems.newFaveBox);
            $('meta[name="theme-color"]').attr('content', "#000000");
        }
    };
    ColorManager.setToNeutral = function() {
        if (this.isBright) {
            $elems.centerContainer.velocity({
                backgroundColor: '#aaa'
            }, 50);
        } else {
            $elems.navBar.velocity({
                backgroundColor: '#aaa',
                text: '#aaa'
            }, 50);
        }
        $elems.newFaveBox.css("background-color", "#aaa");
    };
    ColorManager.setElemBgToGenreColor = function(elem) {
        var color = this.currentGenreColor();
        elem.velocity('finish').velocity({
           'backgroundColor': color
        }, 666);
    };
    ColorManager.setElemFgToGenreColor = function(elem) {
        var color = this.currentGenreColor();
        elem.css({
            'color': color,
            'border-color': color
        });
    };
    ColorManager.switchBrightness = function() {
        if (this.isBright) {
            this.isBright = false;
            $elems.centerContainer.velocity('finish');
            $elems.centerContainer.css("background-color" , "black");
            $elems.navBar.css("color", "black");
            $elems.landingContainer.css("color", "white");
            this.setToGenreColor();
            $('meta[name="theme-color"]').attr('content', "#000000");
        } else {
            this.isBright = true;
            $elems.navBar.velocity('finish');
            $elems.navBar.css("backgroundColor", "black");
            $elems.navBar.css("color", "white");
            $elems.stationInfo.css("color", "black")
                             .css("border-color", "black");
            $elems.landingContainer.css("color", "black");
            this.setToGenreColor();
            $('meta[name="theme-color"]').attr('content', this.currentGenreColor());
        }
    };
    ColorManager.currentGenreColor = function() {
        return Utils.genreNumToColor(StationsManager.getActiveGenre());
    };

    /**
     * Handles all keyboard controls for player.
     */
    var KeyUpManager = {
        singleRightPress : false,
        singleLeftPress : false,
        leftTimeout: -1,
        rightTimeout: -1
    };
    KeyUpManager.clearTimeouts = function() {
        clearTimeout(this.leftTimeout);
        clearTimeout(this.rightTimeout);
        if (this.singleLeftPress) {
            StationChanger.prevStation();
        } else if (this.singleRightPress) {
            StationChanger.nextStation();
        }
        this.singleLeftPress = false;
        this.singleRightPress = false;
    };
    KeyUpManager.handleKeyUp = function(event) {
        if (event.keyCode === 32) {
            MainController.playingStateToggle();
        } else if (event.keyCode === 77) {
            VolumeManager.soundToggle();
        } else if (event.keyCode === 37) {
            if (this.singleLeftPress) {
                StationChanger.prevGenre();
                this.singleLeftPress = false;
                this.clearTimeouts();
            } else {
                this.singleLeftPress = true;
                this.leftTimeout = window.setTimeout(this.clearTimeouts.bind(KeyUpManager), 333);
            }
        } else if (event.keyCode === 39) {
            if (this.singleRightPress) {
                StationChanger.nextGenre();
                this.singleRightPress = false;
                this.clearTimeouts();
            } else {
                this.singleRightPress = true;
                this.rightTimeout = window.setTimeout(this.clearTimeouts.bind(KeyUpManager), 333);
            }
        } else {
            clearTimeout(this.leftTimeout);
            clearTimeout(this.rightTimeout);
        }
    };
    window.onkeyup = KeyUpManager.handleKeyUp.bind(KeyUpManager);

    /**
     * Controls all aspects of the currently playing song name.
     */
    var SongNameManager = {
        songName : '-1',
        duplicateSongCheck : false,
        intervalId : -1
    };
    SongNameManager.setName = function(data, status) {
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
        if (newName === this.songName && this.duplicateSongCheck) {
            StationsManager.removeCurrentThenNext();
        } else if (newName !== this.songName) {
            $elems.currentSongText.text(newName);
            this.songName = newName;
            this.duplicateSongCheck = false;
            clearInterval(this.intervalId);
            this.intervalId = setInterval(this.updateName, 10000);
        }
    };
    SongNameManager.updateName = function(doDuplicateSongCheck) {
        if (doDuplicateSongCheck === true) {
            this.duplicateSongCheck = doDuplicateSongCheck;
        }
        var infoUrl = UrlManager.getMetaDataUrl();
        $.get('/get-station-info/?stationUrl='+infoUrl,  this.setName, 'html');
    };
    SongNameManager.animateOpen = function() {
        $elems.stationInfo.velocity('finish').velocity({
            'max-height': 300,
            'padding-top': '15px',
            'padding-bottom': '15px'
        }, {
            duration: 333,
            easing: 'swing',
            complete: function () {
                $elems.stationInfo.children().css('visibility', 'visible');
            }
        });
    };
    SongNameManager.animateClosed = function() {
        $elems.stationInfo.velocity('finish').velocity({
            'max-height': 0,
            'padding-top': 0,
            'padding-bottom': 0
        }, {
            duration:  333,
            easing: 'swing',
            begin : function () {
                $elems.stationInfo.children().css('visibility','hidden');
            }
        });
    };

    /**
     * Manages the adding and removal of favourites in the header bar.
     */
    var FaveManager = {
        maxFaves: 5,
        faves: []
    };
    FaveManager.initOldFaves = function() {
        this.faves.forEach(function (fave) {
            var newBox = $elems.oldFaveBox.clone(true).insertBefore($elems.oldFaveBox).show();
            var color = Utils.genreNumToColor(fave['genreNum']);
            newBox.css("background-color", color);
        });
        this.showHideNewFaveBox();
        this.showPlayingFave();
    };
    FaveManager.addFave = function() {
        if (!MainController.initialStationsHaveLoaded) return;
        var faveCount = $('div#oldFaveBox').length - 1;
        var newBox = $elems.oldFaveBox.clone(true).insertBefore($elems.oldFaveBox).show();
        ColorManager.setElemBgToGenreColor(newBox);
        var ipHash = UrlManager.getHash();
        var genreNum = StationsManager.getActiveGenre();
        this.faves[faveCount] = {"ipHash" : ipHash, "genreNum" : genreNum};
        window.localStorage.setItem("faves", JSON.stringify(this.faves));
        this.showPlayingFave();
        this.showHideNewFaveBox();
        this.reportFaveChange(Utils.hashCodeToIp(ipHash), true);
    };
    FaveManager.playFave = function(elem) {
        var faveNum = $(elem.target).parent().index();
        var faveData = this.faves[faveNum];
        var faveIpHash = faveData['ipHash'];
        if (UrlManager.getHash() == faveIpHash) {
            // IF we are already playing the station selected, do nothing
            return;
        }
        var ip = Utils.hashCodeToIp(faveIpHash);
        StationChanger.fromArgs(ip, faveData['genreNum']);
    };
    FaveManager.removeFave = function(elem) {
        var faveNum = $(elem.target).parent().index();
        $(elem.target).parent().remove();
        var faveRemoved = this.faves.splice(faveNum, 1)[0];
        this.reportFaveChange(Utils.hashCodeToIp(faveRemoved['ipHash']), false);
        window.localStorage.setItem("faves", JSON.stringify(this.faves));
        this.showHideNewFaveBox();
    };
    FaveManager.showHideNewFaveBox = function() {
        if ($('div#oldFaveBox').length <= this.maxFaves && UrlManager.getHash().length > 1) {
            $elems.newFaveBox.show();
        } else {
            $elems.newFaveBox.hide();
        }
    };
    FaveManager.showPlayingFave = function() {
        this.faves.forEach(function (fave, index) {
            if (fave['ipHash'] === UrlManager.getHash()) {
                $("span.favePlay").eq(index).css('color', 'white');
            } else {
                $("span.favePlay").eq(index).css('color', 'black');
            }
        });
    };
    FaveManager.reportFaveChange = function(ip, faveWasAdded) {
        $.post("/report-fave-changed/",  {ip : ip, faveWasAdded : faveWasAdded});
    };
    FaveManager.storageChanged = function(event) {
        if (event.key === "faves") {
            this.faves = window.localStorage.getItem("faves");
            if (this.faves === null) {
                this.faves = [];
            } else {
                this.faves = JSON.parse(this.faves);
            }
            $('div#oldFaveBox').not($elems.oldFaveBox).remove();
            this.initOldFaves();
        }
    };
    FaveManager._init = function() {
        this.faves = window.localStorage.getItem("faves");
        if (this.faves === null) {
            this.faves = [];
        } else {
            this.faves = JSON.parse(this.faves);
        }
        $elems.oldFaveBox.hide();
        $elems.faveAddIcon.click(this.addFave.bind(FaveManager));
        $elems.faveRemoveIcon.click(this.removeFave.bind(FaveManager));
        $elems.favePlayIcon.click(this.playFave.bind(FaveManager));
        window.addEventListener('storage', this.storageChanged.bind(FaveManager));
    };
    FaveManager._init();


    /**
     * Manages everything relating to the bottom spectrum bar
     */
    var SpectrumManager = {
        markerWidth: 18,
        currentXval: -1
    };
    SpectrumManager.handleClick = function(event) {
        var totalWidth = $elems.spectrum.width();
        var xVal = Math.max(1, Math.min(totalWidth, event.pageX - this.markerWidth));
        var genreCount = StationsManager.getGenreCount();
        var genreNum = Math.min(Math.round((xVal / totalWidth) * genreCount), genreCount - 1);
        if (StationsManager.setActiveGenre(genreNum)) {
            StationChanger.nextStation();
        } else {
            this.updateMarker();
        }
    };
    SpectrumManager.updateMarker = function() {
        var genreNum = StationsManager.getActiveGenre();
        var genreCount = StationsManager.getGenreCount();
        var totalWidth = $elems.spectrum.width();
        var xCoord = Math.round((totalWidth * genreNum) / genreCount);
        $elems.spectrumMarker.show();
        $elems.spectrumMarker.velocity('stop', true).velocity({translateX: xCoord + "px"});
        this.currentXval = xCoord;
    };
    SpectrumManager.hoverHandler = function() {
        var totalWidth = $(window).width();
        var genreCount = StationsManager.getGenreCount();
        var _this = this;
        $elems.spectrumClickBar.bind('mousemove', function(event) {
            var xVal = Math.max(1, Math.min(totalWidth, event.pageX - _this.markerWidth));
            xVal = Math.round((xVal / totalWidth) * genreCount) * (totalWidth / genreCount);
            if (xVal === _this.currentXval) return;
            _this.currentXval = xVal;
            $elems.spectrumMarker.velocity('stop', true).velocity({translateX: xVal + "px"});
        }).bind('mouseout', this.updateMarker.bind(SpectrumManager));
    };

    /**
     * Listeners - Handle certain user actions
     */
    $buttons.stop.click(MainController.playingStateStop.bind(MainController));
    $buttons.play.click(MainController.playingStateReload.bind(MainController));
    $buttons.nextStation.click(StationChanger.nextStation.bind(StationChanger));
    $buttons.nextGenre.click(StationChanger.nextGenre.bind(StationChanger));
    $buttons.prevStation.click(StationChanger.prevStation.bind(StationChanger));
    $buttons.prevGenre.click(StationChanger.prevGenre.bind(StationChanger));
    $buttons.mute.click(VolumeManager.soundOff.bind(VolumeManager));
    $buttons.unmute.click(VolumeManager.soundOn.bind(VolumeManager));
    $buttons.bigPlay.click(StationChanger.nextStation.bind(StationChanger));
    $buttons.brightness.click(ColorManager.switchBrightness.bind(ColorManager));
    $elems.player.bind('canplay', MainController.readyToPlay.bind(MainController));
    $elems.player.bind('error', function (e) {
        window.console.error(e);
    });
    $elems.spectrumClickBar.click(SpectrumManager.handleClick.bind(SpectrumManager));

    /**
     * Setup - Set everything in motion
     */
    if (window.location.hash.length !== 0) {
        UrlManager.restoreFromHash();
    }
};
