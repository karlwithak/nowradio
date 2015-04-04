/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Utility functions used throughout.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.Utils = {
        ZEROES: '00000000000000000000000000000000'
    };
    nr.Utils.genreNumToColor = function (genreNum) {
        var totalGenres = nr.StationsManager.getGenreCount();
        var colorNum = (genreNum * 360) / totalGenres;
        return this.hsvToRgb(colorNum, 26, 99);
    };
    nr.Utils.ipToHashCode = function (ip) {
        var parts = ip.split(':');
        var hashcode = parts[0].split('.').reduce(function (accumulator, octetAsString) {
            var bin = nr.Utils.ZEROES + parseInt(octetAsString).toString(2);
            return accumulator + bin.substr(-8);
        }, '');
        var port = this.ZEROES + parseInt(parts[1]).toString(2);
        hashcode += port.substr(-16);
        return (this.ZEROES + parseInt(hashcode.substr(0, 24), 2).toString(32)).substr(-5) +
            (this.ZEROES + parseInt(hashcode.substr(24), 2).toString(32)).substr(-5);
    };
    nr.Utils.hashCodeToIp = function (hashcode) {
        var bin = (this.ZEROES + parseInt(hashcode.substr(0, 5), 32).toString(2)).substr(-24) +
            (this.ZEROES + parseInt(hashcode.substr(5), 32).toString(2)).substr(-24);
        var ip = '';
        for (var i = 0; i < 32; i += 8) {
            ip += parseInt(bin.substr(i, 8), 2).toString().trim() + '.';
        }
        ip = ip.slice(0, -1);
        ip += ':' + parseInt(bin.substr(-16), 2).toString();
        return ip;
    };
    nr.Utils.hsvToRgb = function (h, s, v) {
        var r, g, b, i, f, p, q, t;
        h = Math.max(0, Math.min(360, h));
        s = Math.max(0, Math.min(100, s));
        v = Math.max(0, Math.min(100, v));
        s /= 100;
        v /= 100;
        if (s == 0) {
            r = g = b = v;
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }
        h /= 60;
        i = Math.floor(h);
        f = h - i;
        p = v * (1 - s);
        q = v * (1 - s * f);
        t = v * (1 - s * (1 - f));
        switch (i) {
            case 0:
                r = v;
                g = t;
                b = p;
                break;
            case 1:
                r = q;
                g = v;
                b = p;
                break;
            case 2:
                r = p;
                g = v;
                b = t;
                break;
            case 3:
                r = p;
                g = q;
                b = v;
                break;
            case 4:
                r = t;
                g = p;
                b = v;
                break;
            default:
                r = v;
                g = p;
                b = q;
        }
        return "#" + Math.round(r * 255).toString(16) +
            Math.round(g * 255).toString(16) +
            Math.round(b * 255).toString(16);
    };

    return nr;
}(Nowradio || {}));