/*global $:false */
/*jshint -W116 */

/**
 * Manages the browser's url.
 */
var NowRadio = (function(nr) {
    'use strict';
    var pre = 'http://';
    var mediaPost = '/;?icy=http';
    var sevenPost = '/7.html';

    nr.UrlManager = {};
    nr.UrlManager.setUrlHash = function(newSource) {
        window.history.replaceState(null, null, '#' + nr.Utils.ipToHashCode(newSource));
    };
    nr.UrlManager.getMediaUrl = function() {
        return pre + this.getUrl() + mediaPost;
    };
    nr.UrlManager.getMetaDataUrl = function() {
        return pre + this.getUrl() + sevenPost;
    };
    nr.UrlManager.getUrl = function() {
        return nr.Utils.hashCodeToIp(this.getHash());
    };
    nr.UrlManager.getHash = function() {
        return window.location.hash.substring(1);
    };
    nr.UrlManager.restoreFromHash = function() {
        // If the page is loaded with a #base64StringHere then play that station
        $.get('/get-genre-by-ip/', {"ip": this.getUrl()}, function(data) {
            nr.StationChanger.fromArgsAndSetFirst(nr.UrlManager.getUrl(), data.genreNum);
        });
    };

    return nr;
}(NowRadio || {}));
