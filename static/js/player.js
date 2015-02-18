$(function() {
    /**
     * Global Variables
     */
    var genreList = [
        'electronic',
        'rock',
        'jazz',
        'blues',
        'pop',
        'classical',
        'dance',
        'house',
        'hop',
        'country',
        'chill',
        'talk'
    ];
    var buttons = {
        'bigPlay': $('a#bigPlayButton'),
        'play'   : $('button#playButton'),
        'stop'   : $('button#stopButton'),
        'next1'  : $('button#nextButton1'),
        'next2'  : $('button#nextButton2'),
        'next3'  : $('button#nextButton3'),
        'back'   : $('button#backButton'),
        'refresh': $('span#refreshSongButton'),
        'mute'   : $('span#muteButton'),
        'unmute' : $('span#unmuteButton')};
    var playlistManager = getPlaylistManager();
    var playerState = getStopPlayManager();
    var player = $('audio#player');
    var stationsManager = getStationsManager();
    var urlManager = getUrlManager();
    var volumeManager = getVolumeManager();
    var colorManager = getColorManager();

    /**
     * Listeners
     */
    buttons.stop.click(playerState.stop);

    buttons.play.click(playerState.play);
    
    buttons.next1.click(stationsManager.getSameGenre);

    buttons.next3.click(stationsManager.getDiffGenre);

    buttons.back.click(playlistManager.goBack);

    buttons.refresh.click(updateSongName);

    buttons.mute.click(volumeManager.soundoff);

    buttons.unmute.click(volumeManager.soundon);

    buttons.bigPlay.click(function () {
        $('div#landingContainer').hide();
        $('div#mainContainer').show();
        volumeManager.soundon();
    });

    /**
     * Functions
     */
    function changeStation(src) {
        setSource(src);
        playerState.play();
        updateSongName();
    }

    function updateStations(genre, updateCount, callback) {
        $.get('/get-stations/', {'genre': genre, 'page' : updateCount}, callback);
    }

    function setSource(src) {
        urlManager.setUrl(src);
        player.attr('src', urlManager.getMediaUrl());
    }

    function updateSongName() {
        var infoUrl = urlManager.getSevenUrl();
        $.get('/get-station-info/?stationUrl='+infoUrl,  setSongName, 'html');
    }

    function setSongName(data) {
        var re = /<[^<]*>/gi;
        data = data.replace(re, '');
        var x = 0;
        for (var i=0; i < 6; i++) {
            x = data.indexOf(',', x + 1);
        }
        data = data.slice(x + 1);
        $('span#currentSong').text(data);
    }


    /**
     * Closures
     */
    function getStopPlayManager() {
        return {
            stop : function() {
                buttons.stop.hide();
                buttons.play.show();
                player[0].pause();
            },
            play : function() {
                buttons.play.hide();
                buttons.stop.show();
                player[0].play();
            }
        };
    }

    function getStationsManager() {
        var genreManagers = [];
        for (var genreName in genreList) {
            genreManagers.push(getGenreManager(genreList[genreName]));
        }
        var position = 0;
        return {
            getDiffGenre : function() {
                position = (position + 1) % genreManagers.length;
                var station = genreManagers[position].getSameGenre();
                playlistManager.addNew(station);
                changeStation(station);
            },
            getSameGenre : function() {
                var station = genreManagers[position].getSameGenre();
                playlistManager.addNew(station);
                changeStation(station);
            },
            getActiveGenre : function() {
                return position
            },
            setActiveGenre : function(genreInfo) {
                position = genreInfo;
            }
        }
    }

    function getGenreManager(genreName) {
        var stations = [];
        var updateCount = 0;
        updateStations(genreName, updateCount, stationSetter);

        function stationSetter(data) {
            stations = data['stations'].reduce(function(left, right) {
               return right.concat(left);
            });
        }
        return {
            getSameGenre : function () {
                var station = stations.pop();
                if (stations.length == 0) {
                    updateCount += 1;
                    updateStations(genreName, updateCount, stationSetter);
                }
                return station;
            }
        }
    }

    function getUrlManager() {
        var url = '';
        var mediaPost = ';?icy=http';
        var sevenPost = '7.html';
        return {
            setUrl : function (newUrl) {
                url = newUrl;
            },
            getMediaUrl : function () {
                return url + mediaPost
            } ,
            getSevenUrl : function () {
                return  url + sevenPost;
            }
        }
    }

    // Warning to future nick, this is a strange data structure!
    function getPlaylistManager() {
        buttons.back.prop('disabled', true);
        var playlist = [];
        var index = -1;
        var end = -1;
        return {
            goBack : function () {
                if (index == 0) {
                    console.error("tried to go back too far in playlist");
                    return playlist[end];
                }
                index -= 1;
                if (index == 0) {
                    buttons.back.prop('disabled', true);
                }
                stationsManager.setActiveGenre(playlist[index][1]);
                changeStation(playlist[index][0]);
            },
            addNew : function (station) {
                var genreInfo = stationsManager.getActiveGenre();
                index += 1;
                end = index;
                playlist[index] = [station, genreInfo];
                if (index > 0)buttons.back.prop('disabled', false);
            }
        }
    }

    function getVolumeManager() {
        buttons.unmute.hide();
        return {
            soundoff : function() {
                player[0].muted = true;
                buttons.mute.hide();
                buttons.unmute.show();
            },
            soundon : function() {
                player[0].muted = false;
                buttons.mute.show();
                buttons.unmute.hide();
            }
        }
    }

    function getColorManager() {
        var elems = {
            'body'          : $("body"),
            'infoPanel'     : $("div#infoPanel"),
            'settingsPanel' : $("div#settingsPanel"),
            'stationInfo'   : $("div#stationInfo")
        };
        return {
            setColors : function(foreground, background) {
                elems.body.css('background-color', background);
                elems.body.css('color', foreground);
                elems.infoPanel.css('border-color', foreground);
                elems.settingsPanel.css('border-color', foreground);
                elems.stationInfo.css('border-color', foreground)
            }
        }
    }


    /**
     * Setup
     */
    setInterval(updateSongName, 15000);
    setTimeout(stationsManager.getSameGenre, 1000);
    buttons.mute.click();
});

