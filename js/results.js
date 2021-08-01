var RESOURCES = {
    
    "diamond": {
        "icon": "img/resources/diamond.png",
        "spawnRate": 0.01
    },
    "gold": {
        "icon": "img/resources/gold.png",
        "spawnRate": 0.05
    },
    "silver": {
        "icon": "img/resources/silver.png",
        "spawnRate": 0.05
    },
    "copper": {
        "icon": "img/resources/copper.png",
        "spawnRate": 0.1
    },
    "iron": {
        "icon": "img/resources/iron.png",
        "spawnRate": 0.3
    },
    "wood": {
        "icon": "img/resources/wood.png",
        "spawnRate": 0.5
    },
    "marble": {
        "icon": "img/resources/marble.png",
        "spawnRate": 0.5
    },
    "obsidian": {
        "icon": "img/resources/obsidian.png",
        "spawnRate": 0.2
    },
    "coal": {
        "icon": "img/resources/coal.png",
        "spawnRate": 0.5
    }
};
function round(number, precision) {
        var factor = Math.pow(10, precision);
        var tempNumber = number * factor;
        var roundedTempNumber = Math.round(tempNumber);
        return roundedTempNumber / factor;
    }

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


var resourceStock = loadStorage('resourceStock', {});

function updateResourceStock() {
        var html = '';
        for (var resourceType in resourceStock) {
            if (resourceStock.hasOwnProperty(resourceType)) {
                var resource = resourceStock[resourceType];
                html += '<li><img src="' + RESOURCES[resourceType].icon + '" title="' + resourceType + '" = /> ' + round(resource, 3) + 'Kg</li>';
            }
        }
        
        document.getElementById("resourcesList").innerHTML=html;
}
updateResourceStock();