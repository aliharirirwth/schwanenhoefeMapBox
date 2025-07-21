import { loadComponent } from "./js/utils.js";
import { NavigationManager } from "./js/navigation.js";
import { UIManager } from "./js/ui.js";

// Global variables
let map = null;
let navigationManager = null;
let uiManager = null;

// Remove fallback location - only use actual user location
// const fallbackLocation = [6.8143, 51.2187];

async function renderApp() {
  try {
    const appRoot = document.getElementById("app-root");

    // Load all components
    const [
      header,
      mapComponent,
      searchbar,
      buildingsScroll,
      buildingsList,
      footer,
    ] = await Promise.all([
      loadComponent("./components/header.html"),
      loadComponent("./components/map.html"),
      loadComponent("./components/searchbar.html"),
      loadComponent("./components/buildings-scroll.html"),
      loadComponent("./components/buildings-list.html"),
      loadComponent("./components/footer.html"),
    ]);

    // Compose the main structure
    appRoot.innerHTML = `
            ${header}
            <div class="main-wrapper">
                ${mapComponent}
                <div id="right-panel">
                    <div class="panel-toggle" onclick="togglePanel()"></div>
                    ${searchbar}
                    ${buildingsScroll}
                    ${buildingsList}
                    ${footer}
                </div>
            </div>
        `;

    // After DOM is ready, initialize logic
    initAppLogic();
  } catch (error) {
    console.error("Error rendering app:", error);
    document.getElementById("app-root").innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                <h1>Error Loading Application</h1>
                <p>There was an error loading the application components.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
  }
}

function initAppLogic() {
  // Set Mapbox access token
  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2VyaHV6IiwiYSI6ImNseXpvc3RlczJpbnIya3FscDU2aHc5d3EifQ.FHtPjde_lqensSHZxqthgw";

  console.log("Mapbox access token set:", mapboxgl.accessToken ? "Yes" : "No");
  console.log("Token preview:", mapboxgl.accessToken.substring(0, 20) + "...");

  // Initialize map with a default center (will be updated when user location is available)
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v11",
    center: [6.8143, 51.2187], // Default center, will be updated with user location
    zoom: 17.257060940340775,
    pitch: 45,
    bearing: -17.6,
    antialias: true,
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-right");

  // Add click event listener to get lat/lng coordinates
  map.on("click", (e) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    console.log(`Clicked coordinates: Latitude: ${lat}, Longitude: ${lng}`);
    console.log(`Copy-paste format: { lat: ${lat}, lng: ${lng} }`);

    // Also show in an alert for easy copying
    // alert(`Clicked coordinates:\nLatitude: ${lat}\nLongitude: ${lng}\n\nCopy format: { lat: ${lat}, lng: ${lng} }`);
  });

  // Initialize managers
  navigationManager = new NavigationManager(map, mapboxgl);
  uiManager = new UIManager(navigationManager);

  console.log("Navigation manager initialized:", navigationManager);
  console.log("UI manager initialized:", uiManager);

  // Initialize 3D buildings and markers
  initMapFeatures();

  // Initialize geolocation
  initGeolocation();

  // Initial render
  uiManager.renderMostVisited();
  uiManager.renderBuildingGrid();

  // Responsive fix: prevent horizontal overflow
  document.body.style.overflowX = "hidden";
  document.documentElement.style.overflowX = "hidden";
  document.body.style.width = "100vw";
  document.documentElement.style.width = "100vw";

  console.log("App initialization completed");

  // Add global test function
  window.testLocation = () => {
    this.navigationManager.testLocation();
  };

  // Add global navigation test function
  window.testNavigation = () => {
    console.log("=== NAVIGATION TEST ===");
    console.log("Navigation manager:", navigationManager);
    console.log("UI manager:", uiManager);
    console.log("Map:", map);
    console.log("Mapbox access token:", mapboxgl.accessToken);

    if (navigationManager) {
      navigationManager.testLocation();
    } else {
      console.error("Navigation manager not initialized");
    }
  };

  // Add global manual navigation test function
  window.testManualNavigation = () => {
    console.log("=== MANUAL NAVIGATION TEST ===");

    if (!navigationManager) {
      console.error("Navigation manager not initialized");
      return;
    }

    // Set a test destination (WHU building)
    const testDestination = [6.8147, 51.2193];
    console.log("Setting test destination:", testDestination);
    navigationManager.setDestination(testDestination);

    // Try to start navigation
    console.log("Starting test navigation...");
    const success = navigationManager.startNavigation();
    console.log("Navigation start result:", success);
  };
}

function initMapFeatures() {
  // 3D buildings configuration
  const ids = [
    282619375, 152447953, 282619377, 152447952, 152447949, 152447945, 282619374,
    152447919, 152447944, 282619379, 152447946, 152447951, 152447950, 152447933,
    282619376, 152447941, 282619380, 282619378, 152447948, 305949322, 152447936,
    152447918, 152447934, 152447925,
  ];
  const filters = ids.map((id) => ["==", "$id", id]);

  map.on("style.load", () => {
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
      (layer) => layer.type === "symbol" && layer.layout["text-field"]
    ).id;

    // Add 3D buildings layer
    map.addLayer(
      {
        id: "add-3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["all", ["==", "extrude", "true"], ["any", ...filters]],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "skyblue",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 1,
        },
      },
      labelLayerId
    );

    // Add entrance markers
    addEntranceMarkers();
  });
}

function addEntranceMarkers() {
  // Only include correctly positioned markers and add missing ones
  const entrances = [
    // Correctly positioned markers (keep these)
    {
      code: "224",
      lat: 51.21928529408453,
      lng: 6.814183890036276,
      direction: "toward",
    },
    {
      code: "224A",
      lat: 51.219530239226515,
      lng: 6.814220763301364,
      direction: "toward",
    },
    {
      code: "224A",
      lat: 51.21946028473144,
      lng: 6.814404275819186,
      direction: "toward",
    },
    {
      code: "224B",
      lat: 51.2197654889722,
      lng: 6.814430621704446,
      direction: "toward",
    },
    {
      code: "224D",
      lat: 51.219689227752895,
      lng: 6.81492333401556,
      direction: "toward",
    },
    {
      code: "228A",
      lat: 51.21955037283399,
      lng: 6.8151935696277235,
      direction: "toward",
    },
    {
      code: "228B",
      lat: 51.21962453111021,
      lng: 6.815691069620897,
      direction: "toward",
    },
    {
      code: "228C",
      lat: 51.219276669641374,
      lng: 6.815638454380121,
      direction: "toward",
    },
    {
      code: "228D",
      lat: 51.21906427805746,
      lng: 6.815429752763293,
      direction: "toward",
    },
    {
      code: "228D",
      lat: 51.219164173079236,
      lng: 6.8151462034410315,
      direction: "toward",
    },
    {
      code: "230",
      lat: 51.21895641191708,
      lng: 6.814859576022968,
      direction: "toward",
    },

    // Add missing markers with correct coordinates based on green X positions
    {
      code: "214",
      direction: "toward",
      lat: 51.21902533774613,
      lng: 6.814130302604809,
    },
    {
      code: "216A",
      direction: "toward",
      lat: 51.219323245810926,
      lng: 6.813524202428965,
    },
    {
      code: "216B",
      direction: "toward",
      lat: 51.2193562843016,
      lng: 6.813372010191728,
    },
    {
      code: "218A",
      direction: "toward",
      lat: 51.219523343233504,
      lng: 6.813229025639004,
    },
    {
      code: "218B",
      direction: "toward",
      lat: 51.21940036569492,
      lng: 6.812950676321776,
    },
    {
      code: "220",
      lat: 51.219527814787114,
      lng: 6.813803288505937,
      direction: "toward",
    },
    {
      code: "220A",
      lat: 51.21968730337116,
      lng: 6.814093604524373,
      direction: "toward",
    },
    {
      code: "220A",
      lat: 51.21972807109941,
      lng: 6.8139464753942605,
      direction: "toward",
    },
    {
      code: "220B",
      lat: 51.22015182583914,
      lng: 6.814136995381432,
      direction: "toward",
    },
    {
      code: "220C",
      lat: 51.219942766685534,
      lng: 6.813854210178533,
      direction: "toward",
    },

    {
      code: "222",
      lat: 51.220112816753044,
      lng: 6.814930146743507,
      direction: "toward",
    },
    {
      code: "224C",
      lat: 51.21998423037459,
      lng: 6.814761139580355,
      direction: "toward",
    },
    {
      code: "226",
      lat: 51.21985578031408,
      lng: 6.815547904647531,
      direction: "toward",
    },
    {
      code: "232",
      lat: 51.2193018375784,
      lng: 6.816630854779902,
      direction: "toward",
    },
    {
      code: "234A",
      lat: 51.21901243846824,
      lng: 6.815702315388563,
      direction: "toward",
    },
    {
      code: "234B",
      lat: 51.219363354161715,
      lng: 6.815975115068284,
      direction: "toward",
    },
    {
      code: "234C",
      lat: 51.21927140986131,
      lng: 6.816214042878272,
      direction: "toward",
    },
    {
      code: "234D",
      lat: 51.21903144470147,
      lng: 6.816222417837224,
      direction: "toward",
    },
  ];

  console.log("Creating entrance markers using GeoJSON symbol layer");

  // Create GeoJSON features from entrance data
  const geojsonData = {
    type: "FeatureCollection",
    features: entrances.map((entrance) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [entrance.lng, entrance.lat],
      },
      properties: {
        code: entrance.code,
        direction: entrance.direction,
      },
    })),
  };

  // Add the GeoJSON source
  map.addSource("entrance-markers", {
    type: "geojson",
    data: geojsonData,
  });

  // Add circle layer for the red dots
  map.addLayer({
    id: "entrance-circles",
    type: "circle",
    source: "entrance-markers",
    paint: {
      "circle-color": "#ff0000",
      "circle-radius": 8,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
      "circle-opacity": 1,
    },
  });

  // Add symbol layer for the entrance labels
  map.addLayer({
    id: "entrance-labels",
    type: "symbol",
    source: "entrance-markers",
    layout: {
      "text-field": ["get", "code"],
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-size": 10,
      "text-offset": [0, 1.8],
      "text-anchor": "top",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#000000",
      "text-halo-color": "#ffffff",
      "text-halo-width": 2,
      "text-halo-blur": 0,
    },
  });

  console.log("Entrance markers created successfully using GeoJSON");
}

function initGeolocation() {
  if ("geolocation" in navigator) {
    console.log("Geolocation available, starting location tracking...");

    // First, get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = [position.coords.longitude, position.coords.latitude];
        console.log("Initial location received:", loc);
        console.log("Accuracy:", position.coords.accuracy, "meters");

        // Update map center to user location
        map.flyTo({
          center: loc,
          zoom: 18,
          duration: 2000,
        });

        navigationManager.setUserLocation(loc);
      },
      (error) => {
        console.error("Error getting initial location:", error);
        alert(
          "Unable to get your location. Please allow location access to use navigation features."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    // Then start watching for position updates
    navigator.geolocation.watchPosition(
      (position) => {
        const loc = [position.coords.longitude, position.coords.latitude];
        console.log("Location update received:", loc);
        console.log("Accuracy:", position.coords.accuracy, "meters");

        navigationManager.setUserLocation(loc);
        navigationManager.updateRouteProgress(loc);

        // Only zoom to location when navigation is active
        if (navigationManager.navigationActive) {
          map.flyTo({
            center: loc,
            zoom: 18,
            bearing: position.coords.heading || 0,
            pitch: 60,
            duration: 1000,
          });
        }
      },
      (error) => {
        console.error("Error getting location update:", error);
        // Don't set fallback location - just log the error
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 1000,
      }
    );
  } else {
    console.log("Geolocation not available");
    alert(
      "Geolocation is not available in your browser. Navigation features will not work."
    );
  }
}

// Start rendering
renderApp();
