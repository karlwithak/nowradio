/*global $:false */
/*jshint -W116 */

/**
 * Controls all aspects of the currently playing song name.
 */
var NowRadio = (function(nr) {
    'use strict';
    var songName = '-1';
    var duplicateSongCheck = false;
    var intervalId = -1;
    function setName(data, status) {
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
        if (newName === songName && duplicateSongCheck) {
            nr.StationsManager.removeCurrentThenNext();
        } else if (newName !== songName) {
            nr.$elems.currentSongText.text(newName);
            songName = newName;
            duplicateSongCheck = false;
            clearInterval(intervalId);
            intervalId = setInterval(nr.SongNameManager.updateName.bind(nr.SongNameManager), 10000);
        }
    }

    nr.SongNameManager = {};
    nr.SongNameManager.updateName = function(_doDuplicateSongCheck) {
        if (!nr.MainController.playingStateIsPlaying() && !_doDuplicateSongCheck) return;
        if (_doDuplicateSongCheck === true) {
            duplicateSongCheck = _doDuplicateSongCheck;
        }
        var infoUrl = nr.UrlManager.getMetaDataUrl();
        $.get('/get-station-info/?stationUrl='+infoUrl, setName, 'html');
    };
    nr.SongNameManager.animateOpen = function() {
        nr.$elems.stationInfo.velocity('finish').velocity({
            'max-height': 300,
            'padding-top': '15px',
            'padding-bottom': '15px'
        }, {
            duration: 333,
            easing: 'swing',
            complete: function() {
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
            begin : function() {
                nr.$elems.stationInfo.children().css('visibility','hidden');
            }
        });
    };

    return nr;
}(NowRadio || {}));