/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Controls all aspects of the currently playing song name.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.SongNameManager = {
        songName : '-1',
        duplicateSongCheck : false,
        intervalId : -1
    };
    nr.SongNameManager.setName = function(data, status) {
        if (status !== "success") {
            nr.StationsManager.removeCurrentThenNext();
        }
        var re = /<[^<]*>/gi;
        data = data.replace(re, '');
        var dataList = data.split(',');
        var isUp = dataList[1];
        if (isUp !== '1') {
            nr.StationsManager.removeCurrentThenNext();
            return;
        }
        var newName = dataList.slice(6).join();
        // Check to see if this new station is playing the same song as the last one,
        //  if so, it's probably a duplicate station so go to the next one
        if (newName === this.songName && this.duplicateSongCheck) {
            nr.StationsManager.removeCurrentThenNext();
        } else if (newName !== this.songName) {
            nr.$elems.currentSongText.text(newName);
            this.songName = newName;
            this.duplicateSongCheck = false;
            clearInterval(this.intervalId);
            this.intervalId = setInterval(this.updateName.bind(nr.SongNameManager), 10000);
        }
    };
    nr.SongNameManager.updateName = function(doDuplicateSongCheck) {
        if (doDuplicateSongCheck === true) {
            this.duplicateSongCheck = doDuplicateSongCheck;
        }
        var infoUrl = nr.UrlManager.getMetaDataUrl();
        $.get('/get-station-info/?stationUrl='+infoUrl, this.setName.bind(nr.SongNameManager), 'html');
    };
    nr.SongNameManager.animateOpen = function() {
        nr.$elems.stationInfo.velocity('finish').velocity({
            'max-height': 300,
            'padding-top': '15px',
            'padding-bottom': '15px'
        }, {
            duration: 333,
            easing: 'swing',
            complete: function () {
                nr.$elems.stationInfo.children().css('visibility', 'visible');
            }
        });
    };
    nr.SongNameManager.animateClosed = function() {
        nr.$elems.stationInfo.velocity('finish').velocity({
            'max-height': 0,
            'padding-top': 0,
            'padding-bottom': 0
        }, {
            duration:  333,
            easing: 'swing',
            begin : function () {
                nr.$elems.stationInfo.children().css('visibility','hidden');
            }
        });
    };

    return nr;
}(Nowradio || {}));