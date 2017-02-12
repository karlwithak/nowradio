/* global $ */

/**
 * Manage the map and pins on the map
 */
var NowRadio = (function (nr) {
    'use strict';
    nr.MapManager = {
        visibleMarkers: []
    };
    var style = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}]
    window.initMap = nr.MapManager.initMap = function () {
        var map = new google.maps.Map(document.querySelector('.verticalCenter'), {
            center: {lat: 37.9481, lng: -119.7881},
            zoom: 3,
            disableDefaultUI: true,
            styles: style
        });
        // Resize map so it actually shows
        google.maps.event.addListenerOnce(map, 'idle', function() {
                google.maps.event.trigger(map, 'resize');
        });

        nr.MapManager.map = map;
    }

    nr.MapManager.setMapToNull = function (marker) {
        marker.setMap(null);
    }

    nr.MapManager.showInitialMarkers = function (stations) {
        stations.forEach(function (stationList, genreNum) {
            stationList.slice(0, 5).forEach(function (station) {
                nr.MapManager.addMarker(station, genreNum);
            })
        });

    }

    nr.MapManager.addMarker = function (station, genreNum) {
        var iconStyle = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillOpacity: 0.8,
            strokeWeight: 1.5,
            strokeColor: '#000',
            fillColor: nr.Utils.genreNumToColor(genreNum),
        };
        var pos = {
            lat: station.latitude,
            lng: station.longitude
        };
        nr.MapManager.visibleMarkers.push(new google.maps.Marker({
            position: pos,
            icon: iconStyle,
            map: nr.MapManager.map
        }))
    }
    return nr;
}(NowRadio || {}));

