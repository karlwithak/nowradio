$(function() {
    /**
     * Global Variables
     */
   var genresDict = {
        'electronic'  : ['house', 'ambient'],
        'rock' : ['soft-rock', 'hard-rock']
    };
    var buttons = {
        'play' : $('button#playButton'),
        'stop' : $('button#stopButton'),
        'next1': $('button#nextButton1'),
        'next2': $('button#nextButton2'),
        'next3': $('button#nextButton3'),
        'back' : $('button#backButton')};
    var playStack = [];
    var playerState = getStopPlayManager();
    var player = $('audio#player');
    var stationsManager = getStationsManager();
    var urlPost = '/;?icy=http';
    var urlPre = '//';


    /**
     * Setup
     */
    playStack.push(0);
    buttons.back.prop('disabled', true);
    setTimeout(function () {
        var startStation = stationsManager.getSameSubGenre();
        setSource(startStation);
        playerState.play();
    }, 250);


    /**
     * Listeners
     */
    buttons.stop.click(function() {
        playerState.stop();
    });

    buttons.play.click(function() {
        playerState.play();
    });
    
    buttons.next1.click(function() {
        var nextStation = stationsManager.getSameSubGenre();
        changeStation(nextStation);
    });

    buttons.next2.click(function() {
        var nextStation = stationsManager.getSameGenre();
        changeStation(nextStation);
    });

    buttons.next3.click(function() {
        var nextStation = stationsManager.getDiffGenre();
        changeStation(nextStation);
    });

    buttons.back.click(function() {
        playStack.pop();
        if (playStack.length === 1) {
            buttons.back.prop('disabled', true);
        }
        setSource(playStack[playStack.length - 1]);
        playerState.play();
    });


    /**
     * Functions
     */
    function changeStation(src) {
        setSource(src);
        playerState.play();
        playStack.push(src);
        buttons.back.prop('disabled', false);
        console.log(src)
    }

    function updateStations(genre, subGenre, callback) {
        $.get('/get-stations/', {'genre': genre, 'subGenre' : subGenre}, callback);
    }

    function setSource(src) {
        src = urlPre + src + urlPost;
        console.log(src);
        player.attr('src', src);
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
                return genreManagers[position].getSameGenre(0);
            },
            getSameGenre : function() {
                return genreManagers[position].getSameGenre(1);
            },
            getSameSubGenre : function() {
                return genreManagers[position].getSameSubGenre();
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
});