/*global $:false */

/**
 * Handles all keyboard controls for player.
 */
var NowRadio = (function(nr) {
    'use strict';
    var singleRightPress = false;
    var singleLeftPress = false;
    var leftTimeout = -1;
    var rightTimeout = -1;
    function clearTimeouts() {
        clearTimeout(leftTimeout);
        clearTimeout(rightTimeout);
        if (singleLeftPress) {
            nr.StationChanger.prevStation();
        } else if (singleRightPress) {
            nr.StationChanger.nextStation();
        }
        singleLeftPress = false;
        singleRightPress = false;
    }
    function handleKeyUp(event) {
        if (event.keyCode === 32) {
            nr.MainController.playingStateToggle();
        } else if (event.keyCode === 77) {
            nr.VolumeManager.soundToggle();
        } else if (event.keyCode === 83) {
            nr.FaveManager.addFave();
        } else if (event.keyCode === 37) {
            if (singleLeftPress) {
                nr.StationChanger.prevGenre();
                singleLeftPress = false;
                clearTimeouts();
            } else {
                singleLeftPress = true;
                leftTimeout = window.setTimeout(clearTimeouts, 333);
            }
        } else if (event.keyCode === 39) {
            if (singleRightPress) {
                nr.StationChanger.nextGenre();
                singleRightPress = false;
                clearTimeouts();
            } else {
                singleRightPress = true;
                rightTimeout = window.setTimeout(clearTimeouts, 333);
            }
        } else {
            clearTimeout(leftTimeout);
            clearTimeout(rightTimeout);
        }
    }
    window.onkeyup = handleKeyUp;

    return nr;
}(NowRadio || {}));