/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Handles all keyboard controls for player.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.KeyUpManager = {
        singleRightPress : false,
        singleLeftPress : false,
        leftTimeout: -1,
        rightTimeout: -1
    };
    nr.KeyUpManager.clearTimeouts = function() {
        clearTimeout(this.leftTimeout);
        clearTimeout(this.rightTimeout);
        if (this.singleLeftPress) {
            nr.StationChanger.prevStation();
        } else if (this.singleRightPress) {
            nr.StationChanger.nextStation();
        }
        this.singleLeftPress = false;
        this.singleRightPress = false;
    };
    nr.KeyUpManager.handleKeyUp = function(event) {
        if (event.keyCode === 32) {
            nr.MainController.playingStateToggle();
        } else if (event.keyCode === 77) {
            nr.VolumeManager.soundToggle();
        } else if (event.keyCode === 83) {
            nr.FaveManager.addFave();
        } else if (event.keyCode === 37) {
            if (this.singleLeftPress) {
                nr.StationChanger.prevGenre();
                this.singleLeftPress = false;
                this.clearTimeouts();
            } else {
                this.singleLeftPress = true;
                this.leftTimeout = window.setTimeout(this.clearTimeouts.bind(nr.KeyUpManager), 333);
            }
        } else if (event.keyCode === 39) {
            if (this.singleRightPress) {
                nr.StationChanger.nextGenre();
                this.singleRightPress = false;
                this.clearTimeouts();
            } else {
                this.singleRightPress = true;
                this.rightTimeout = window.setTimeout(this.clearTimeouts.bind(nr.KeyUpManager), 333);
            }
        } else {
            clearTimeout(this.leftTimeout);
            clearTimeout(this.rightTimeout);
        }
    };
    $(document).ready(function () {
        window.onkeyup = nr.KeyUpManager.handleKeyUp.bind(nr.KeyUpManager);
    });

    return nr;
}(Nowradio || {}));