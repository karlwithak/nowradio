/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Manages the browser's url.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.UrlManager = {
        pre: 'http://',
        mediaPost: '/;?icy=http',
        sevenPost: '/7.html'
    };
    nr.UrlManager.setUrlHash = function (newSource) {
        window.history.replaceState(null, null, '#' + nr.Utils.ipToHashCode(newSource));
    };
    nr.UrlManager.getMediaUrl = function () {
        return this.pre + this.getUrl() + this.mediaPost;
    };
    nr.UrlManager.getMetaDataUrl = function () {
        return this.pre + this.getUrl() + this.sevenPost;
    };
    nr.UrlManager.getUrl = function () {
        return nr.Utils.hashCodeToIp(this.getHash());
    };
    nr.UrlManager.getHash = function () {
        return window.location.hash.substring(1);
    };
    nr.UrlManager.restoreFromHash = function () {
        var _this = this;
        // If the page is loaded with a #base64StringHere then play that station
        $.get('/get-genre-by-ip/', {"ip": this.getUrl()}, function (data) {
            nr.StationChanger.fromArgsAndSetFirst(_this.getUrl(), data['genreNum']);
        });
    };

    return nr;
}(Nowradio || {}));
