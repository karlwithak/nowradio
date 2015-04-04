/*global $:false */
/*jshint -W116 */

/**
 * Controls the volume of the player
 */
var NowRadio = (function(nr) {
    'use strict';
    function soundOff() {
        nr.$elems.player[0].muted = true;
        nr.$buttons.mute.hide();
        nr.$buttons.unmute.show();
    }
    function soundOn() {
        nr.$elems.player[0].muted = false;
        nr.$buttons.mute.show();
        nr.$buttons.unmute.hide();
    }

    nr.VolumeManager = {};
    nr.VolumeManager.soundToggle = function() {
        if (nr.$elems.player[0].muted) {
            soundOn();
        } else {
            soundOff();
        }
    };
    $(document).ready(function() {
        nr.$buttons.mute.click(soundOff);
        nr.$buttons.unmute.click(soundOn);
    });

    return nr;
}(NowRadio || {}));
