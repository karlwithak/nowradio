$(function() {
    /**
     * Global Variables
     */
   var genresDict = {
        'electronic'  : ['house', 'ambient'],
        'rock' : ['soft-rock', 'hard-rock']
    };
    var buttons = {
        'play'   : $('button#playButton'),
        'stop'   : $('button#stopButton'),
        'next1'  : $('button#nextButton1'),
        'next2'  : $('button#nextButton2'),
        'next3'  : $('button#nextButton3'),
        'back'   : $('button#backButton'),
        'refresh': $('span#refreshSongButton')};
    var playlistManager = getPlaylistManager();
    var playerState = getStopPlayManager();
    var player = $('audio#player');
    var stationsManager = getStationsManager();
    var urlManager = getUrlManager();


    /**
     * Setup
     */
    buttons.back.prop('disabled', true);
    setTimeout(stationsManager.getSameSubGenre, 900);
    setInterval(updateSongName, 15000);


    /**
     * Listeners
     */
    buttons.stop.click(playerState.stop);

    buttons.play.click(playerState.play);
    
    buttons.next1.click(stationsManager.getSameSubGenre);

    buttons.next2.click(stationsManager.getSameGenre);

    buttons.next3.click(stationsManager.getDiffGenre);

    buttons.back.click(playlistManager.goBack);

    buttons.refresh.click(updateSongName);


    /**
     * Functions
     */
    function changeStation(src) {
        setSource(src);
        playerState.play();
        updateSongName();
    }

    function updateStations(genre, subGenre, callback) {
        $.get('/get-stations/', {'genre': genre, 'subGenre' : subGenre}, callback);
    }

    function setSource(src) {
        urlManager.setUrl(src);
        player.attr('src', urlManager.getMediaUrl());
    }

    function updateSongName() {
        var infoUrl = "http:" + urlManager.getSevenUrl();
        $.get('/get-station-info/', {'stationUrl' : infoUrl}, setSongName, 'html');
    }

    function setSongName(data) {
        var re = /<[^<]*>/gi;
        data = data.replace(re, '');
        console.log(data);
        var x = 0;
        for (var i=0; i < 6; i++) {
            x = data.indexOf(',', x + 1);
        }
        data = data.slice(x + 1);
        console.log(data);
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
        for (var key in genresDict) {
            if (genresDict.hasOwnProperty(key)) {
                genreManagers.push(getGenreManager(key));
            }
        }
        var position = 0;
        return {
            getDiffGenre : function() {
                position = (position + 1) % genreManagers.length;
                var station = genreManagers[position].getSameGenre(0);
                playlistManager.addNew(station);
                changeStation(station);
            },
            getSameGenre : function() {
                var station = genreManagers[position].getSameGenre(1);
                playlistManager.addNew(station);
                changeStation(station);
            },
            getSameSubGenre : function() {
                var station = genreManagers[position].getSameSubGenre();
                playlistManager.addNew(station);
                changeStation(station);
            }
        }
    }

    function getGenreManager(genreName) {
        var subGenreManagers = [];
        genresDict[genreName].forEach(function(element) {
            subGenreManagers.push(getSubGenreManager(element, genreName));
        });
        var position = 0;
        return {
            getSameGenre : function (advance) {
                position = (position + advance) % subGenreManagers.length;
                return subGenreManagers[position].getSameSubGenre();
            },
            getSameSubGenre : function () {
                return subGenreManagers[position].getSameSubGenre();
            }
        }
    }

    function getSubGenreManager(subGenreName, genreName) {
        var stations = [];
        updateStations(genreName, subGenreName, stationSetter);

        function stationSetter(data) {
            stations = data['stations'];
        }
        return {
            getSameSubGenre : function () {
                var station = stations.pop();
                if (stations.length == 0) {
                    updateStations(genreName, subGenreName, stationSetter);
                }
                return station;
            }
        }
    }

    function getUrlManager() {
        var url = '';
        var mediaPost = '/;?icy=http';
        var sevenPost = '/7.html';
        var urlPre = '//';
        return {
            setUrl : function (newUrl) {
                url = newUrl;
            },
            getMediaUrl : function () {
                return urlPre + url + mediaPost
            } ,
            getSevenUrl : function () {
                return urlPre + url + sevenPost;
            }
        }
    }

    // Warning to future nick, this is a strange data structure!
    function getPlaylistManager() {
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
                changeStation(playlist[index]);
            },
            addNew : function (station) {
                index += 1;
                end = index;
                playlist[index] = station;
                if (index > 0)buttons.back.prop('disabled', false);
            }
        }
    }
});