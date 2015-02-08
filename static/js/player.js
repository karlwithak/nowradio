$(function() {
    /**
     * Global Variables
     */
    var stations = ['http://sc8.1.fm:8030/;?icy=http',
                    'http://stream.house-radio.com/;?icy=http',
                    'http://50.7.173.162:8014/;?icy=http'];
    var buttons = {
        'play' : $('button#playButton'),
        'stop' : $('button#stopButton'),
        'next1': $('button#nextButton1'),
        'next2': $('button#nextButton2'),
        'next3': $('button#nextButton3'),
        'back' : $('button#backButton')};
    var playStack = [];
    var playerState = getStopPlayToggle();
    var player = $('audio#player');


    /**
     * Setup
     */
    playStack.push(0);
    buttons.back.prop('disabled', true);
    player.attr('src', stations[peek(playStack)]);
    playerState.play();


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
        var nextStation = (peek(playStack) + 1) % stations.length;
        player.attr('src', stations[nextStation]);
        playerState.play();
        playStack.push(nextStation);
        buttons.back.prop('disabled', false);
    });

    buttons.back.click(function() {
        playStack.pop();
        if (playStack.length === 1) {
            buttons.back.prop('disabled', true);
        }
        player.attr('src', stations[peek(playStack)]);
        playerState.play();
    });


    /**
     * Objects and functions
     */
    function getStopPlayToggle() {
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

    function peek(stack) {
        return stack[stack.length - 1];
    }
});