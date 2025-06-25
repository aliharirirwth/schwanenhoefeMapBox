import { calculateDistance } from './utils.js';

// Global navigation state
let navigationActive = false;
let currentRoute = null;
let selectedDestination = null;
let userCurrentLocation = null;
let userMarker = null;
let destinationMarker = null;
let traveledPath = [];

export class NavigationManager {
    constructor(map, mapboxgl) {
        this.map = map;
        this.mapboxgl = mapboxgl;
        this.accessToken = mapboxgl.accessToken;
    }

    setUserLocation(location) {
        userCurrentLocation = location;
        this.updateUserMarker();
    }

    setDestination(destination) {
        selectedDestination = destination;
        console.log('Destination set:', destination);
    }

    updateUserMarker() {
        if (userMarker) userMarker.remove();
        if (userCurrentLocation) {
            userMarker = new this.mapboxgl.Marker({ color: 'blue' })
                .setLngLat(userCurrentLocation)
                .addTo(this.map);
        }
    }

    startNavigation() {
        console.log('=== STARTING NAVIGATION ===');
        console.log('Selected destination:', selectedDestination);
        console.log('User current location:', userCurrentLocation);
        console.log('Navigation active before:', navigationActive);
        
        if (!selectedDestination) {
            console.error('No destination selected!');
            alert('No destination selected. Please select a building or company first.');
            return false;
        }
        
        if (!userCurrentLocation) {
            console.error('No user location available!');
            alert('Unable to get your location. Please allow location access.');
            return false;
        }
        
        navigationActive = true;
        console.log('Navigation active after:', navigationActive);
        
        console.log('Calling drawRoute...');
        this.drawRoute();
        
        console.log('Calling attachEndNavigationToMarker...');
        this.attachEndNavigationToMarker();
        
        console.log('Navigation started successfully');
        return true;
    }

    stopNavigation() {
        navigationActive = false;
        this.detachEndNavigationFromMarker();
        if (this.map.getSource('route')) {
            this.map.getSource('route').setData({ 
                type: 'Feature', 
                geometry: { type: 'LineString', coordinates: [] } 
            });
        }
        if (destinationMarker) {
            destinationMarker.remove();
            destinationMarker = null;
        }
        selectedDestination = null;
        currentRoute = null;
        console.log('Navigation stopped');
    }

    drawRoute() {
        console.log('=== DRAWING ROUTE ===');
        console.log('Selected destination:', selectedDestination);
        console.log('User current location:', userCurrentLocation);
        
        if (!selectedDestination || !userCurrentLocation) {
            console.error('Missing destination or user location for route drawing');
            console.log('selectedDestination:', selectedDestination);
            console.log('userCurrentLocation:', userCurrentLocation);
            return;
        }
        
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userCurrentLocation[0]},${userCurrentLocation[1]};${selectedDestination[0]},${selectedDestination[1]}?geometries=geojson&access_token=${this.accessToken}`;
        
        console.log('Drawing route from', userCurrentLocation, 'to', selectedDestination);
        console.log('API URL:', url);
        
        console.log('Making fetch request...');
        fetch(url)
            .then(res => {
                console.log('Response received:', res.status, res.statusText);
                if (!res.ok) {
                    throw new Error(`Directions API error: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(json => {
                console.log('JSON response:', json);
                if (!json.routes || json.routes.length === 0) {
                    throw new Error('No route found');
                }
                
                const data = json.routes[0].geometry;
                currentRoute = json.routes[0];
                traveledPath = [userCurrentLocation];

                console.log('Route drawn successfully:', currentRoute);
                console.log('Route geometry:', data);

                this.addRouteToMap(data);
                this.addDestinationMarker();
            })
            .catch(error => {
                console.error('Error drawing route:', error);
                console.error('Error details:', error.message);
                alert('Error drawing route: ' + error.message);
            });
    }

    addRouteToMap(data) {
        if (!this.map.getSource('route')) {
            console.log('Creating new route source and layer...');
            this.map.addSource('route', { 
                type: 'geojson', 
                data: { type: 'Feature', geometry: data } 
            });
            this.map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-width': 6,
                    'line-gradient': [
                        'interpolate',
                        ['linear'],
                        ['line-progress'],
                        0, '#0d47a1', // dark blue (traveled)
                        0.001, '#0d47a1',
                        0.0011, '#90caf9', // light blue (remaining)
                        1, '#90caf9'
                    ]
                }
            });
            console.log('Route layer created successfully');
        } else {
            console.log('Updating existing route source...');
            this.map.getSource('route').setData({ type: 'Feature', geometry: data });
            console.log('Route source updated successfully');
        }
    }

    addDestinationMarker() {
        if (destinationMarker) {
            console.log('Removing existing destination marker...');
            destinationMarker.remove();
        }
        console.log('Adding new destination marker...');
        destinationMarker = new this.mapboxgl.Marker({ color: 'red' })
            .setLngLat(selectedDestination)
            .addTo(this.map);
        console.log('Destination marker added successfully');
    }

    updateRouteProgress(newLocation) {
        if (!navigationActive || !currentRoute) return;
        
        userCurrentLocation = newLocation;
        this.updateUserMarker();
        
        // Find progress along the route
        const coordinates = currentRoute.geometry.coordinates;
        let closestIdx = 0;
        let minDist = Infinity;
        
        for (let i = 0; i < coordinates.length; i++) {
            const dist = calculateDistance(userCurrentLocation, coordinates[i]);
            if (dist < minDist) {
                minDist = dist;
                closestIdx = i;
            }
        }
        
        // Check if user is within 10 meters of destination
        const destDist = calculateDistance(userCurrentLocation, coordinates[coordinates.length - 1]);
        if (destDist < 10) {
            this.stopNavigation();
            this.showArrivalModal();
            return;
        }
        
        // Update route gradient
        if (this.map.getSource('route')) {
            const progress = closestIdx / (coordinates.length - 1);
            this.map.setPaintProperty('route', 'line-gradient', [
                'interpolate',
                ['linear'],
                ['line-progress'],
                0, '#0d47a1',
                Math.max(0.001, progress), '#0d47a1',
                Math.min(0.0011, progress + 0.0001), '#90caf9',
                1, '#90caf9'
            ]);
        }
    }

    attachEndNavigationToMarker() {
        if (userMarker && navigationActive) {
            userMarker.getElement().style.cursor = 'pointer';
            userMarker.getElement().onclick = () => {
                this.showEndNavigationModal();
            };
        }
    }

    detachEndNavigationFromMarker() {
        if (userMarker) {
            userMarker.getElement().style.cursor = '';
            userMarker.getElement().onclick = null;
        }
    }

    showEndNavigationModal() {
        let modal = document.getElementById('end-navigation-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'end-navigation-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-title">End navigation?</div>
                    <div class="modal-actions">
                        <button id="end-modal-yes" class="modal-btn modal-btn-yes">Yes</button>
                        <button id="end-modal-cancel" class="modal-btn modal-btn-cancel">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'block';
        }
        
        document.getElementById('end-modal-yes').onclick = () => {
            modal.style.display = 'none';
            this.stopNavigation();
        };
        document.getElementById('end-modal-cancel').onclick = () => {
            modal.style.display = 'none';
        };
    }

    showArrivalModal() {
        let modal = document.getElementById('arrival-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'arrival-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-title">You have arrived!</div>
                    <div class="modal-actions">
                        <button id="arrival-modal-ok" class="modal-btn modal-btn-yes">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'block';
        }
        
        document.getElementById('arrival-modal-ok').onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Test function for debugging
    testLocation() {
        console.log('=== LOCATION TEST ===');
        console.log('Current user location:', userCurrentLocation);
        console.log('Selected destination:', selectedDestination);
        console.log('Navigation active:', navigationActive);
        console.log('Current route:', currentRoute);
        
        if (selectedDestination) {
            const distance = calculateDistance(userCurrentLocation, selectedDestination);
            console.log('Distance to destination:', distance, 'meters (', (distance/1000).toFixed(2), 'km)');
        }
        
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const loc = [position.coords.longitude, position.coords.latitude];
                    console.log('Current GPS location:', loc);
                    console.log('Distance from GPS to destination:', selectedDestination ? calculateDistance(loc, selectedDestination) : 'N/A', 'meters');
                },
                error => console.error('GPS error:', error)
            );
        }
    }
}

// Export for global access
export { navigationActive, currentRoute, selectedDestination, userCurrentLocation }; 