import axios from 'axios';
import {$} from './bling';

const mapOptions = {
    center: {lat: 43.2, lng: -79.8},
    zoom: 10
};

function loadPlaces(map, lat = 42.1354079, lng = 24.74529039999993) {
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
        .then(res => {
            const places = res.data;
            //console.log(`${JSON.stringify(places)}`);
            if (!places.length) {
                alert('no places found!');
                return;
            }

            // create a bounds ( calculate zoom lvl to catch all points)
            const bounds = new google.maps.LatLngBounds();
            const infoWindow = new google.maps.InfoWindow();

            const markers = places.map(place => {
                const [placeLng, placeLat] = place.location.coordinates; // array destructuring
                const position = {lat: placeLat, lng: placeLng};
                bounds.extend(position);
                const marker = new google.maps.Marker({
                    map,
                    position
                });
                marker.place = place;
                return marker;
            });
            //console.log(markers);

            // when someone clicks on a marker show the details of that place
            // normal function to have access to this
            markers.forEach(marker => marker.addListener('click', function () {
                const html = `
                    <div class="popup">
                        <a href="/store/${this.place.slug}">
                            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
                            <p>${this.place.name} - ${this.place.location.address}</p>
                        </a>
                    </div>
                `;
                //console.log(this);
                infoWindow.setContent(html);
                infoWindow.open(map, this)
            }));

            // then zoom the map to fit all the markers perfectly
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);
        })
        .catch(console.error);
}

function makeMap(mapDiv) {
    if (!mapDiv) return;
    // make our map
    const map = new google.maps.Map(mapDiv, mapOptions);
    loadPlaces(map);

    const input = $('[name="geolocate"]');
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        //console.log(place);
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
    })
}

export default makeMap;