// Utility functions
export function calculateDistance(coord1, coord2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1[1] * Math.PI / 180;
    const φ2 = coord2[1] * Math.PI / 180;
    const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
    const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Utility to load HTML components
export async function loadComponent(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) {
            throw new Error(`Failed to load component: ${path} (${res.status} ${res.statusText})`);
        }
        return await res.text();
    } catch (error) {
        console.error(`Error loading component ${path}:`, error);
        throw error;
    }
} 