$(function() {
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
    function changeStation(src, genreNum) {
        colorManager.setColors(colors[genreNum]);
        urlManager.setUrl(src);
        player.attr('src', urlManager.getMediaUrl());
        playerState.play();
        updateSongName();
    }

    function updateStations(genre, updateCount, callback) {
        $.get('/get-stations/', {'genre': genre, 'page' : updateCount}, callback);
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
        var genreNum = 0;
        $.get('/get-genre-count/', function(data) {
            for (var i = 0; i < data['genreCount']; i++) {
                genreManagers.push(getGenreManager(i));
            }
        });
        return {
            getDiffGenre : function() {
                genreNum = (genreNum + 1) % genreManagers.length;
                var station = genreManagers[genreNum].getSameGenre();
                playlistManager.addNew(station);
                changeStation(station, genreNum);
            },
            getSameGenre : function() {
                var station = genreManagers[genreNum].getSameGenre();
                playlistManager.addNew(station);
                changeStation(station, genreNum);
            },
            getActiveGenre : function() {
                return genreNum
            },
            setActiveGenre : function(genreInfo) {
                genreNum = genreInfo;
            },
            removeStationFromGenre : function(station, genreNum) {
                // The genreManagers list might not be populated yet, so keep trying until it is
                var removeStationFromGenreInterval = window.setInterval(doRemovalFromGenre, 200);
                function doRemovalFromGenre() {
                    if (genreManagers.length > 0) {
                        clearInterval(removeStationFromGenreInterval);
                        genreManagers[genreNum].removeStation(station)
                    }
                }
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
            },
            removeStation : function (station) {
                // The stations might not have been loaded yet, so keep trying until they are
                var removeStationInterval = window.setInterval(doRemoval, 200);
                function doRemoval() {
                    if (stations.length > 0) {
                        window.clearInterval(removeStationInterval);
                        var stationIndex = stations.indexOf(station);
                        if (stationIndex > -1) stations.splice(stationIndex, 1)
                    }
                }
            }
        }
    }

    function getUrlManager() {
        var url = '';
        var pre = "http://";
        var mediaPost = '/;?icy=http';
        var sevenPost = '/7.html';
        return {
            setUrl : function (newUrl) {
                url = newUrl;
                window.history.replaceState(null, null, "#" + btoa(url));
            },
            getMediaUrl : function () {
                return pre + url + mediaPost;
            } ,
            getSevenUrl : function () {
                return  pre + url + sevenPost;
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
                changeStation(playlist[index][0], playlist[index][1]);
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
            setColors : function(background) {
                elems.body.animate({
                   backgroundColor: background
                }, 1000);
            }
        }
    }


    /**
     * Setup
     */
    if (window.location.hash.length != 0) {
        // If the page is loaded with a #base64StringHere then play that station
        var url = atob(window.location.hash.substring(1));
        playlistManager.addNew(url);
        $.get('/get-genre-by-ip/', {'ip': url}, function(data) {
            var genreNum = data['genreNum'];
            stationsManager.setActiveGenre(genreNum);
            changeStation(url, genreNum);
            buttons.bigPlay.click();
            stationsManager.removeStationFromGenre(url, genreNum)
        });

    } else {
        setTimeout(stationsManager.getSameGenre, 1000);
        volumeManager.soundoff()
    }
    setInterval(updateSongName, 10000);
});

