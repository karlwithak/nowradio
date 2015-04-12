/*global $:false */
/*jshint -W116 */

/**
 * Controls the volume of the player, and the volume slider bar.
 */
var NowRadio = (function(nr) {
    'use strict';
    var barLeft, barRight, barWidth, sliderWidth;
    function showHideVolumeBar() {
        if (nr.$elems.volumeBar.is(":hidden")) {
            nr.$elems.volumeBar.velocity('stop', true).velocity({
                width: 100 + "px"
            }, {
                duration: 333,
                easing: 'swing',
                complete: function() {
                    nr.$elems.volumeSlider.show();
                    initializeSlider();
                },
                begin: function() {
                    nr.$elems.volumeBar.show();
                }
            });
        } else {
            nr.$elems.volumeBar.velocity('stop', true).velocity({
                width: 0
            }, {
                duration: 333,
                easing: 'swing',
                begin: function() {
                    nr.$elems.volumeSlider.hide();
                },
                complete: function() {
                   nr.$elems.volumeBar.hide();
                }
            });
        }
    }
    function volumeBarClick(event) {
        var sliderX = event.pageX - Math.round(sliderWidth / 2);
        nr.$elems.volumeSlider.offset({left: sliderX});
        var volume = Math.min(Math.max((sliderX - barLeft), 0) / barWidth, 1);
        showHideVolIcons(volume);
        nr.$elems.player[0].volume = volume;
        window.localStorage.setItem("volume", volume.toString());
    }
    function showHideVolIcons(volume) {
        nr.$buttons.volHi.hide();
        nr.$buttons.volMid.hide();
        nr.$buttons.volLo.hide();
        if (volume < 0.1) {
            nr.$buttons.volLo.show();
        } else if (volume < 0.9) {
            nr.$buttons.volMid.show();
        } else {
            nr.$buttons.volHi.show();
        }
    }
    function initializeSlider() {
        barLeft = nr.$elems.volumeBar.offset().left;
        barWidth = nr.$elems.volumeBar.width();
        barRight = barLeft + barWidth;
        sliderWidth = nr.$elems.volumeSlider.width();
        var sliderX = barLeft + Math.round(barWidth * nr.$elems.player[0].volume);
        nr.$elems.volumeSlider.offset({left: sliderX});
    }

    nr.VolumeManager = {};
    nr.VolumeManager.soundUp = function() {
        var volume = Math.min(1, nr.$elems.player[0].volume + 0.2);
        nr.$elems.player[0].volume = volume;
        initializeSlider();
        showHideVolIcons(volume);
    };
    nr.VolumeManager.soundDown = function() {
        var volume = Math.max(0, nr.$elems.player[0].volume - 0.2);
        nr.$elems.player[0].volume = volume;
        initializeSlider();
        showHideVolIcons(volume);
    };
    $(document).ready(function() {
        var initialVolume = window.localStorage.getItem('volume') || "1";
        initialVolume = parseFloat(initialVolume);
        showHideVolIcons(initialVolume);
        nr.$elems.player[0].volume = initialVolume;
        nr.$elems.volumeControl.click(showHideVolumeBar);
        nr.$elems.volumeBar.click(volumeBarClick);
    });

    return nr;
}(NowRadio || {}));
