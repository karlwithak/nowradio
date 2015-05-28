/*global $:false */
/*jshint -W116 */

/**
 * Manages the adding and removal of favourites in the top navigation bar.
 */
var NowRadio = (function(nr) {
    'use strict';
    var maxFaves = 5;
    var faves = [];
    function playFave(elem) {
        var faveNum = $(elem.target).parent().index();
        var faveData = faves[faveNum];
        var faveIpHash = faveData.ipHash;
        if (nr.UrlManager.getHash() == faveIpHash) {
            // IF we are already playing the station selected, do nothing
            return;
        }
        var ip = nr.Utils.hashCodeToIp(faveIpHash);
        nr.StationChanger.fromArgs(ip, faveData.genreNum);
    }
    function reportFaveChange(ip, faveWasAdded) {
        $.post("/report-fave-changed/", {ip: ip, faveWasAdded: faveWasAdded});
    }
    function removeFave(elem) {
        var faveNum = $(elem.target).parent().index();
        $(elem.target).parent().remove();
        var faveRemoved = faves.splice(faveNum, 1)[0];
        reportFaveChange(nr.Utils.hashCodeToIp(faveRemoved.ipHash), false);
        window.localStorage.setItem("faves", JSON.stringify(faves));
        nr.FaveManager.showHideNewFaveBox();
    }
    function loadOldFaves() {
        var oldFaves = window.localStorage.getItem("faves");
        if (oldFaves === null) {
            faves = [];
        } else {
            faves = JSON.parse(oldFaves);
        }
    }
    function storageChanged(event) {
        if (event.key === "faves") {
            loadOldFaves();
            $('div#oldFaveBox').not(nr.$elems.oldFaveBox).remove();
            nr.FaveManager.initOldFaves();
        }
    }

    
    nr.FaveManager = {};
    nr.FaveManager.initOldFaves = function() {
        faves.forEach(function(fave) {
            var newBox = nr.$elems.oldFaveBox.clone(true).insertBefore(nr.$elems.oldFaveBox).show();
            var color = nr.Utils.genreNumToColor(fave.genreNum);
            newBox.css("background-color", color);
        });
        this.showHideNewFaveBox();
        this.showPlayingFave();
    };
    nr.FaveManager.addFave = function() {
        var $oldFaveBox = $('div#oldFaveBox');
        if (!nr.MainController.initialStationsHaveLoaded) return;
        if ($oldFaveBox.length > maxFaves) return;
        var faveCount = $oldFaveBox.length - 1;
        var newBox = nr.$elems.oldFaveBox.clone(true).insertBefore(nr.$elems.oldFaveBox).show();
        nr.ColorManager.setElemBgToColor(newBox, nr.ColorManager.currentGenreColor());
        var ipHash = nr.UrlManager.getHash();
        var genreNum = nr.StationsManager.getActiveGenre();
        faves[faveCount] = {"ipHash": ipHash, "genreNum": genreNum};
        window.localStorage.setItem("faves", JSON.stringify(faves));
        this.showPlayingFave();
        this.showHideNewFaveBox();
        reportFaveChange(nr.Utils.hashCodeToIp(ipHash), true);
    };
    nr.FaveManager.showHideNewFaveBox = function() {
        if ($('div#oldFaveBox').length <= maxFaves && nr.UrlManager.getHash().length > 1) {
            nr.$elems.newFaveBox.show();
        } else {
            nr.$elems.newFaveBox.hide();
        }
    };
    nr.FaveManager.showPlayingFave = function() {
        faves.forEach(function(fave, index) {
            if (fave.ipHash === nr.UrlManager.getHash()) {
                $("span.favePlay").eq(index).css('color', 'white');
            } else {
                $("span.favePlay").eq(index).attr('style', '');
            }
        });
    };
    nr.FaveManager.playFaveNumber = function(faveNumber) {
        var $oldFaveBox = $('div#oldFaveBox');
        if (faveNumber < $oldFaveBox.length - 1) {
            $oldFaveBox.eq(faveNumber).find("span.favePlay").click();
        }
    };
    $(document).ready(function() {
        loadOldFaves();
        nr.$elems.oldFaveBox.hide();
        nr.$elems.faveAddIcon.click(nr.FaveManager.addFave.bind(nr.FaveManager));
        nr.$elems.faveRemoveIcon.click(removeFave);
        nr.$elems.favePlayIcon.click(playFave);
        window.addEventListener('storage', storageChanged);
    });

    return nr;
}(NowRadio || {}));
