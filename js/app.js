'use strict';
var timeleft = 600;
  var downloadTimer = setInterval(function () {
    document.getElementById("countdown").innerHTML = `${timeleft} seconds left`;
    timeleft -= 1;
    if (timeleft <= 0) {
      clearInterval(downloadTimer);
      document.getElementById("countdown").innerHTML = "The time has ended!";
       window.location.href = 'results.html';
         
    }
  }, 1000);
$(document).ready(function() {
    function loadStorage(name, defaultValue) {
        if (window.localStorage.getItem(name)) {
            try {
                return JSON.parse(window.localStorage.getItem(name));
            } catch (err) {
                console.warn("could not load " + name + " from localStorage ", err);
            }
        }
        window.localStorage.setItem(name, JSON.stringify(defaultValue));
        return defaultValue;
    }

    var marker;
    var circlePos;
    var circle;
    var lastLocation = loadStorage('lastLocation', []);
    var resourcesPoints = [];
    var pointsOfInterest = loadStorage('pointsOfInterest', []);
    var resourceStock = loadStorage('resourceStock', {});
    var moveMapToLocation = true;
    var map = L.map('map').fitWorld();

    var MyControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (map) {
            
            
            var container = L.DomUtil.create('div', 'my-custom-control leaflet-bar leaflet-control');
            $(container).html('<div class="leaflet-bar">' +
                '<a id="locationBtn" class="localtionActive leaflet-control-zoom-in fa fa-dot-circle-o" href="#" title="Center to current location"></a>' +
                '<a id="asideBtn" class="leaflet-control-zoom-in fa fa-bars" href="#" title="Open menu"></a>' +
                '<div id="aside" class="hidden">Resources<div id="resourcesStock">' +
                '<ul id="resourcesList">' +
                '</ul>' +
                '</div>' +
                '<div id="mainBuilding">' +
                '<img src="img/mainBuilding.png" />Home' +
                '</div>' +
                '</div>' +
                '<div>');
            return container;
        },
        initialize: function (foo, options) {
            L.Util.setOptions(this, options);
        }
    });

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        id: 'mapbox.streets'
    }).addTo(map);

    map.addControl(new MyControl('bar', {position: 'topright'}));

    $('#asideBtn').on('click', function () {
        $('#aside').toggle();
    });
    $('#locationBtn').on('click', function () {
        moveMapToLocation = !moveMapToLocation;
        if (moveMapToLocation) {
            $(this).removeClass('locationInActive');
            $(this).addClass('locationActive');
        } else {
            $(this).removeClass('locationActive');
            $(this).addClass('locationInActive');
        }
    });

    $('#mainBuilding').on('click', function () {
        var mainBuld = findPoiByName('mainBuilding');
        if (mainBuld === null) {
            pointsOfInterest.push({
                'type' : 'building',
                'name' : 'mainBuilding',
                'latLng' : L.latLng(map.getCenter())
            });
            window.localStorage.setItem('pointsOfInterest', JSON.stringify(pointsOfInterest));
            console.log(lastLocation[0]);
        } else {
            console.log(mainBuld);
            map.panTo(L.latLng(mainBuld.latLng));
        }
        putPoisOnMap();
    });


    function onLocationFound(evt) {
        if (moveMapToLocation) {
            map.setView(evt.latlng, 17);
        }
        
        var radius = evt.accuracy / 2;
        if (marker) {
            marker.setLatLng(evt.latlng);
        } else {
            marker = L.marker(evt.latlng);
        }
        marker.addTo(map);
        


        if (circlePos) {
            circlePos.setLatLng(evt.latlng).setRadius(radius);
        } else {
            circlePos = L.circle(evt.latlng, radius, {
                color: "yellow",
                opacity: 0.2,
                weight: 15,
                fillOpacity: 0.3
            });
        }
        circlePos.addTo(map);

        if (circle) {
            circle.setLatLng(evt.latlng);
        } else {
            circle = L.circle(evt.latlng, RULES.distanceCatchResource);
        }
        circle.addTo(map);

        addLastPosition(evt);
        
        
    }

    function round(number, precision) {
        var factor = Math.pow(10, precision);
        var tempNumber = number * factor;
        var roundedTempNumber = Math.round(tempNumber);
        return roundedTempNumber / factor;
    }

    function findPoiByName(poiName) {
        for (var poiIndex = 0; poiIndex < pointsOfInterest.length; poiIndex++) {
            var poi = pointsOfInterest[poiIndex];
            if (poi.name == poiName) {
                return poi;
            }
        }
        return null;
    }

    function putPoisOnMap() {
        for (var poiIndex = 0; poiIndex < pointsOfInterest.length; poiIndex++) {
            var poi = pointsOfInterest[poiIndex];
            if (poi.name === 'mainBuilding') {
                var icon = L.icon({iconUrl: 'img/mainBuilding.png'});
                L.marker(poi.latLng, {icon: icon}).addTo(map)
                    .bindPopup('Main building')
                    ;
            }
        }
    }

    function addLastPosition(position) {
        lastLocation.unshift(position);
        lastLocation = lastLocation.slice(0, 100);
        delete position.target;
        window.localStorage.setItem('lastLocation', JSON.stringify(lastLocation));
    }

    function onLocationError(e) {
        toastr.error("Geolocation error: " + e.message);
    }

    function updateResourcesPoints() {
        
        for (var pointIndex = 0; pointIndex < resourcesPoints.length; pointIndex++) {
            var point = resourcesPoints[pointIndex];
            if ((new Date() - point.creation) > RULES.resourcesPointDuration) {
                
                rmResourcesPointsOnMap(point);
                resourcesPoints.splice(pointIndex, 1);
            }
        }

        if (lastLocation.length !== 0) {
            for (var i = resourcesPoints.length; i < RULES.resourcesPointNumber; i++) {
                point = createResourcesPoints();
                if (point) {
                    
                    resourcesPoints.push(point);
                }
            }
        }

        for (pointIndex = 0; pointIndex < resourcesPoints.length; pointIndex++) {
            point = resourcesPoints[pointIndex];
            putResourcesPointsOnMap(point);
        }
    }

    function guessResourceType() {
        for (var resType in RESOURCES) {
            if (RESOURCES[resType].spawnRate > Math.random()) {
                return resType;
            }
        }
        return "wood";
    }

    function createResourcesPoints() {
        var point = {
            "lat": lastLocation[0].latitude + (Math.random() - 0.5) / 200,
            "lng": lastLocation[0].longitude + (Math.random() - 0.5) / 200,
            "type": guessResourceType(),
            "quantity": Math.random(),
            "creation": new Date(),
            "marker": null
        };
       
        return point;
    }

    function putResourcesPointsOnMap(point) {
        if (point.marker === null) {
            var myIcon = L.icon({iconUrl: RESOURCES[point.type].icon});
            point.marker = L.marker(L.latLng(point.lat, point.lng), {icon: myIcon}).addTo(map)
                .bindPopup(point.type + ": " + round(point.quantity, 3) + "Kg")
                .on('click', onClickResourcesPoints)
            
        }
    }

    function rmResourcesPointsOnMap(point) {
        if (point.marker !== null) {
            map.removeLayer(point.marker);
        }
    }

    function onClickResourcesPoints(evt) {
        console.log(evt);
        var pointIndex = getResourcePointByLatlng(evt.latlng);
        if (pointIndex !== null) {
            var point = resourcesPoints[pointIndex];
            var distance = evt.latlng.distanceTo(L.latLng(lastLocation[0].latitude, lastLocation[0].longitude));
            if (distance < RULES.distanceCatchResource) {
                resourceCaught(point, pointIndex);
            } else {
                toastr.options = {"timeOut": "1001"};
                toastr.warning("Resource too far. (" + Math.round(distance) + "m)");
            }
        }
    }

    function getResourcePointByLatlng(latlng) {
        for (var pointIndex = 0; pointIndex < resourcesPoints.length; pointIndex++) {
            var point = resourcesPoints[pointIndex];
            if (latlng.lat === point.lat && latlng.lng === point.lng) {
                return pointIndex;
            }
        }
        return null;
    }

    function resourceCaught(point, pointIndex) {
        toastr.success("Resource caught " + point.type + " " + round(point.quantity, 3) + "Kg");
        if (!resourceStock[point.type]) {
            resourceStock[point.type] = 0;
        }
        resourceStock[point.type] += point.quantity;
        updateResourceStock();
        rmResourcesPointsOnMap(point);
        resourcesPoints.splice(pointIndex, 1);
        window.localStorage.setItem('resourceStock', JSON.stringify(resourceStock));
    }

    function updateResourceStock() {
        var html = '';
        for (var resourceType in resourceStock) {
            if (resourceStock.hasOwnProperty(resourceType)) {
                var resource = resourceStock[resourceType];
                html += '<li><img src="' + RESOURCES[resourceType].icon + '" title="' + resourceType + '" = /> ' + round(resource, 3) + 'Kg</li>';
            }
        }
        
        $('#resourcesList').html(html);
    }

    function isNear(p1, p2) {
        var dst = p1.distanceTo(p2);
        console.log(p1, p2, dst);
        return dst < RULES.distanceCatchResource;
    }

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    map.locate({
        setView: false,
        maxZoom: 18,
        watch: true,
        enableHighAccuracy: true
    });

    setInterval(updateResourcesPoints, 3000);
    updateResourceStock();
});

