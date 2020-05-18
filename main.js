const locations = {
    "Germany": [
        {name : "Hamburg", id: 3, geo: {lat: 53.57132, lng: 9.95367}},
        {name : "Berlin", id: 12, geo: {lat: 52.5069704, lng: 13.2846517}},
        {name : "Frankfurt am Main", id: 33, geo: {lat: 50.121301, lng: 8.5665248}},
        {name : "München", id: 26, geo: {lat: 48.155004, lng: 11.4717967}},
        {name : "Köln", id: 19, geo: {lat: 50.95779, lng: 6.8972834}},
        {name : "Stuttgart", id: 18, geo: {lat: 48.779301, lng: 9.1071762}}
    ],
    "Denmark": [
        {name : "Kopenhagen", id: 52, geo: {lat: 55.6713108, lng: 12.5588047}}
    ],
    "France": [
        {name : "Paris", id: 48, geo: {lat: 48.8589101, lng: 2.3120407}}
    ],
    "Italy": [
        {name : "Mailand", id: 20, geo: {lat: 45.4627887, lng: 9.142713}},
        {name : "Rom", id: 31, geo: {lat: 41.9101776, lng: 12.4659587}},
        {name : "Turin", id: 44, geo: {lat: 45.073544, lng: 7.6405873}}
    ],
    "Netherlands": [
        {name : "Amsterdam", id: 5, geo: {lat: 52.3547498, lng: 4.8339214}}
    ],
    "Austria": [
        {name : "Wien", id: 7, geo: {lat: 48.220778, lng: 16.3100209}}
    ],
    "Spain": [
        {name : "Madrid", id: 36, geo: {lat: 40.4380638, lng: -3.7495758}}
    ],
    "Hungary": [
        {name : "Budapest", id: 55, geo: {lat: 47.4813081, lng: 19.0602639}}
    ]
}
const idToCity = {};
Object.keys(locations).forEach(country => locations[country].forEach(city => idToCity[city.id] = city));

document.querySelectorAll("#countries li").forEach(li => {
    li.onclick = () => {
        updateCities(li.innerText);
        document.querySelectorAll("#countries li.selected").forEach(li => li.classList.remove("selected"));
        li.classList.add("selected");
    }
});
registerCityClickListeners();
function registerCityClickListeners() {
    document.querySelectorAll("#cities li").forEach(li => {
        li.onclick = () => {
            changeLocation(li.dataset.id);
        }
    });
}

function updateCities(country) {
    ul = document.getElementById("cities");
    ul.innerHTML = "";
    locations[country].forEach(city => {
        ul.insertAdjacentHTML("beforeend", `<li data-id="${city.id}">${city.name}</li>`)
    });
    registerCityClickListeners();
}
function changeLocation(id) {
    let city = idToCity[id];
    map.setView([city.geo.lat, city.geo.lng], 13);
}

var map = L.map('map').setView([53.57132, 9.95367], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let markers = {};
function addVehicleMarker(vehicle, initial = false) {
    let geoCoords = vehicle.geoCoordinate;
    if (geoCoords !== undefined) {
        const icon = L.divIcon({
            iconAnchor: [0, 24],
            labelAnchor: [-6, 0],
            popupAnchor: [0, -36],
            html: `<span class="marker ${initial ? "available" : "new"}"><i class="fas fa-car"></i></span>`
        });
        let fuelIcon = vehicle.fuelType === "ELECTRIC" ? '<i class="fas fa-bolt"></i>' : '<i class="fas fa-gas-pump"></i>';
        let marker = L.marker([vehicle.geoCoordinate.latitude, vehicle.geoCoordinate.longitude])
            .addTo(map)
            .setIcon(icon)
            .bindPopup(`
                <div class="popup-car">
                    <div>
                        <img width="150" height="150" src="${vehicle.imageUrl}">    
                    </div>
                    <div class="popup-car-details">
                        <div>${vehicle.plate}</div>
                        <div>${vehicle.address.split(",")[0]}</div>
                        <div>
                            <span>${vehicle.fuellevel}%</span>
                            ${fuelIcon}
                        </div>
                    </div>
                </div>
            `);
        markers[vehicle.id] = marker;
    }
}

function removeVehicleMarker(id) {
    let marker = markers[id];
    if (marker !== undefined) {
        //marker.removeFrom(map);
        //delete markers.id;
        const icon = L.divIcon({
            iconAnchor: [0, 24],
            labelAnchor: [-6, 0],
            popupAnchor: [0, -36],
            html: `<span class="marker unavailable"><i class="fas fa-car"></i></span>`
        });
        marker.setIcon(icon);
    }
}

ws = new WebSocket("ws://localhost:8081");
ws.onmessage = event => {
    json = JSON.parse(event.data);
    if (Array.isArray(json)) {
        // initial list
        json.forEach(v => addVehicleMarker(v, true));
    } else if ("VEHICLE_LIST_UPDATE" === json.eventType) {
        json.addedVehicles.forEach(addVehicleMarker);
        json.removedVehicles.forEach(removeVehicleMarker);
    }
};
