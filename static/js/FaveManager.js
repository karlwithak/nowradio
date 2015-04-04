/*global $:false */
/*jshint -W069 */
/*jshint -W116 */

/**
 * Manages the adding and removal of favourites in the top navigation bar.
 */
var Nowradio = (function(nr) {
    'use strict';
    nr.FaveManager = {
        maxFaves: 5,
        faves: []
    };
    nr.FaveManager.initOldFaves = function () {
        this.faves.forEach(function (fave) {
            var newBox = nr.$elems.oldFaveBox.clone(true).insertBefore(nr.$elems.oldFaveBox).show();
            var color = nr.Utils.genreNumToColor(fave['genreNum']);
            newBox.css("background-color", color);
        });
        this.showHideNewFaveBox();
        this.showPlayingFave();
    };
    nr.FaveManager.addFave = function () {
        var $oldFaveBox = $('div#oldFaveBox');
        if (!nr.MainController.initialStationsHaveLoaded) return;
        if ($oldFaveBox.length > this.maxFaves) return;
        var faveCount = $oldFaveBox.length - 1;
        var newBox = nr.$elems.oldFaveBox.clone(true).insertBefore(nr.$elems.oldFaveBox).show();
        nr.ColorManager.setElemBgToGenreColor(newBox);
        var ipHash = nr.UrlManager.getHash();
        var genreNum = nr.StationsManager.getActiveGenre();
        this.faves[faveCount] = {"ipHash": ipHash, "genreNum": genreNum};
        window.localStorage.setItem("faves", JSON.stringify(this.faves));
        this.showPlayingFave();
        this.showHideNewFaveBox();
        this.reportFaveChange(nr.Utils.hashCodeToIp(ipHash), true);
    };
    nr.FaveManager.playFave = function (elem) {
        var faveNum = $(elem.target).parent().index();
        var faveData = this.faves[faveNum];
        var faveIpHash = faveData['ipHash'];
        if (nr.UrlManager.getHash() == faveIpHash) {
            // IF we are already playing the station selected, do nothing
            return;
        }
        var ip = nr.Utils.hashCodeToIp(faveIpHash);
        nr.StationChanger.fromArgs(ip, faveData['genreNum']);
    };
    nr.FaveManager.removeFave = function (elem) {
        var faveNum = $(elem.target).parent().index();
        $(elem.target).parent().remove();
        var faveRemoved = this.faves.splice(faveNum, 1)[0];
        this.reportFaveChange(nr.Utils.hashCodeToIp(faveRemoved['ipHash']), false);
        window.localStorage.setItem("faves", JSON.stringify(this.faves));
        this.showHideNewFaveBox();
    };
    nr.FaveManager.showHideNewFaveBox = function () {
        if ($('div#oldFaveBox').length <= this.maxFaves && nr.UrlManager.getHash().length > 1) {
            nr.$elems.newFaveBox.show();
        } else {
            nr.$elems.newFaveBox.hide();
        }
    };
    nr.FaveManager.showPlayingFave = function () {
        this.faves.forEach(function (fave, index) {
            if (fave['ipHash'] === nr.UrlManager.getHash()) {
                $("span.favePlay").eq(index).css('color', 'white');
            } else {
                $("span.favePlay").eq(index).css('color', 'black');
            }
        });
    };
    nr.FaveManager.reportFaveChange = function (ip, faveWasAdded) {
        $.post("/report-fave-changed/", {ip: ip, faveWasAdded: faveWasAdded});
    };
    nr.FaveManager.storageChanged = function (event) {
        if (event.key === "faves") {
            this.faves = window.localStorage.getItem("faves");
            if (this.faves === null) {
                this.faves = [];
            } else {
                this.faves = JSON.parse(this.faves);
            }
            $('div#oldFaveBox').not(nr.$elems.oldFaveBox).remove();
            this.initOldFaves();
        }
    };
    $(document).ready(function () {
        var _this = nr.FaveManager;
        _this.faves = window.localStorage.getItem("faves");
        if (_this.faves === null) {
            _this.faves = [];
        } else {
            _this.faves = JSON.parse(_this.faves);
        }
        nr.$elems.oldFaveBox.hide();
        nr.$elems.faveAddIcon.click(_this.addFave.bind(_this));
        nr.$elems.faveRemoveIcon.click(_this.removeFave.bind(_this));
        nr.$elems.favePlayIcon.click(_this.playFave.bind(_this));
        window.addEventListener('storage', _this.storageChanged.bind(_this));
    });

    return nr;
}(Nowradio || {}));
