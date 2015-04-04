/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Controls the volume of the player
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.VolumeManager = {};
    nr.VolumeManager.soundOff = function() {
        nr.$elems.player[0].muted = true;
        nr.$buttons.mute.hide();
        nr.$buttons.unmute.show();
    };
    nr.VolumeManager.soundOn = function() {
        nr.$elems.player[0].muted = false;
        nr.$buttons.mute.show();
        nr.$buttons.unmute.hide();
    };
    nr.VolumeManager.soundToggle = function() {
        if (nr.$elems.player[0].muted) {
            this.soundOn();
        } else {
            this.soundOff();
        }
    };

    return nr;
}(Nowradio || {}));
