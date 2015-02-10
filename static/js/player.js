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
    var playStack = [];
    var playerState = getStopPlayManager();
    var player = $('audio#player');
    var stationsManager = getStationsManager();
    var urlManager = getUrlManager();


    /**
     * Setup
     */
    buttons.back.prop('disabled', true);
    setTimeout(function () {
        stationsManager.getSameSubGenre();
        playerState.play();
    }, 250);


    /**
     * Listeners
     */
    buttons.stop.click(playerState.stop);

    buttons.play.click(playerState.play);
    
    buttons.next1.click(stationsManager.getSameSubGenre);

    buttons.next2.click(stationsManager.getSameGenre);

    buttons.next3.click(stationsManager.getDiffGenre);

    buttons.back.click(function() {
        playStack.pop();
        if (playStack.length === 1) {
            buttons.back.prop('disabled', true);
        }
        setSource(playStack[playStack.length - 1]);
        playerState.play();
    });

    buttons.refresh.click(updateSongName);


    /**
     * Functions
     */
    function changeStation(src) {
        setSource(src);
        playerState.play();
        playStack.push(src);
        buttons.back.prop('disabled', false);
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
        data = data.slice(data.lastIndexOf(',') + 1);
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
                changeStation(genreManagers[position].getSameGenre(0));
            },
            getSameGenre : function() {
                changeStation(genreManagers[position].getSameGenre(1));
            },
            getSameSubGenre : function() {
                changeStation(genreManagers[position].getSameSubGenre());
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
});