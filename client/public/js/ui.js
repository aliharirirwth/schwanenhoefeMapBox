import { companies, buildingNumbers } from '../companies.js';

export class UIManager {
    constructor(navigationManager) {
        this.navigationManager = navigationManager;
        this.initSearch();
        this.initModals();
    }

    initSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        if (searchInput && clearSearch) {
            searchInput.addEventListener('input', e => {
                const val = e.target.value.toLowerCase().trim();
                clearSearch.style.display = val ? 'flex' : 'none';
                
                // Filter companies
                const filteredCompanies = companies.filter(c => {
                    const nameMatch = c.name.toLowerCase().includes(val);
                    const buildingMatch = c.building_code.toLowerCase().includes(val);
                    return nameMatch || buildingMatch;
                });
                
                // Filter building numbers
                const filteredBuildings = buildingNumbers.filter(num => 
                    num.toLowerCase().includes(val)
                );
                
                this.renderMostVisited(filteredCompanies);
                this.renderBuildingGrid(filteredBuildings);
            });
            
            clearSearch.onclick = () => {
                searchInput.value = '';
                clearSearch.style.display = 'none';
                this.renderMostVisited(companies);
                this.renderBuildingGrid(buildingNumbers);
                
                // Hide entrance markers when search is cleared
                if (window.hideEntranceMarkers) {
                    window.hideEntranceMarkers();
                }
                
                // Remove selected state from all buttons
                document.querySelectorAll('.company-btn, .company-grid-btn').forEach(b => b.classList.remove('selected'));
            };
        }
    }

    initModals() {
        // Add global togglePanel function
        window.togglePanel = () => {
            const panel = document.getElementById('right-panel');
            if (panel) {
                panel.classList.toggle('closed');
            }
        };

        // Add global test function
        window.testLocation = () => {
            this.navigationManager.testLocation();
        };
    }

    renderMostVisited(companiesToRender = companies) {
        const container = document.getElementById('mostVisited');
        if (!container) return;
        
        container.innerHTML = '';
        
        companiesToRender.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'company-btn';
            btn.innerHTML = `
                <div class="company-circle">
                    <img class="company-logo" src="${c.logo ? './' + c.logo : './image_logos/default.png'}" alt="${c.name}" />
                    <div class="company-info-row">
                        <span class="company-name">${c.name}</span>
                    </div>
                </div>
            `;
            btn.onclick = () => {
                document.querySelectorAll('.company-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                let coords = [c.longitude, c.latitude];
                
                // Show entrance markers for this company's building
                if (window.showEntranceMarkers) {
                    // Use the entrance code from the mapping if available, otherwise use building_code
                    const entranceCode = window.companyEntranceMapping ? window.companyEntranceMapping[c.name] : c.building_code;
                    window.showEntranceMarkers(entranceCode || c.building_code);
                }
                
                this.handleDestinationSelection(coords);
            };
            container.appendChild(btn);
        });
    }

    renderBuildingGrid(buildingsToRender = buildingNumbers) {
        const grid = document.getElementById('companyGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Sort building numbers for consistent display
        const sortedBuildings = [...buildingsToRender].sort((a, b) => {
            // Extract numbers and letters
            const aMatch = a.match(/(\d+)([A-Za-z]*)/);
            const bMatch = b.match(/(\d+)([A-Za-z]*)/);
            
            if (!aMatch || !bMatch) return 0;
            
            const aNum = parseInt(aMatch[1]);
            const bNum = parseInt(bMatch[1]);
            const aLetter = aMatch[2] || '';
            const bLetter = bMatch[2] || '';
            
            // First compare numbers
            if (aNum !== bNum) return aNum - bNum;
            // Then compare letters
            return aLetter.localeCompare(bLetter);
        });
        
        sortedBuildings.forEach(num => {
            const btn = document.createElement('button');
            btn.className = 'company-grid-btn';
            btn.textContent = num;
            
            // Find companies in this building
            const buildingCompanies = companies.filter(c => c.building_code.includes(num));
            
            btn.onclick = () => {
                document.querySelectorAll('.company-grid-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                // Use the first company's coordinates for this building
                const company = buildingCompanies[0];
                let coords = company ? [company.longitude, company.latitude] : [6.8143, 51.2187];
                
                // Show entrance markers for this building
                if (window.showEntranceMarkers) {
                    window.showEntranceMarkers(num);
                }
                
                this.handleDestinationSelection(coords);
            };
            grid.appendChild(btn);
        });
    }

    handleDestinationSelection(coords) {
        console.log('=== DESTINATION SELECTION ===');
        console.log('Destination coordinates:', coords);
        
        // Validate coordinates
        if (!coords || !Array.isArray(coords) || coords.length !== 2) {
            console.error('Invalid coordinates provided:', coords);
            alert('Invalid destination coordinates. Please try selecting a different destination.');
            return;
        }
        
        const [lng, lat] = coords;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            console.error('Coordinates out of bounds:', coords);
            alert('Invalid destination coordinates. Please try selecting a different destination.');
            return;
        }
        
        console.log('Setting destination in navigation manager...');
        this.navigationManager.setDestination(coords);
        
        console.log('Showing navigation modal...');
        this.showNavigationModal(() => {
            console.log('Navigation confirmed, starting navigation...');
            const success = this.navigationManager.startNavigation();
            if (!success) {
                console.error('Navigation start failed');
            } else {
                console.log('Navigation started successfully');
            }
        });
    }

    showNavigationModal(onConfirm) {
        console.log('Creating/showing navigation modal...');
        
        let modal = document.getElementById('navigation-modal');
        if (!modal) {
            console.log('Creating new navigation modal...');
            modal = document.createElement('div');
            modal.id = 'navigation-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-title">Start the navigation?</div>
                    <div class="modal-actions">
                        <button id="modal-yes" class="modal-btn modal-btn-yes">Yes</button>
                        <button id="modal-cancel" class="modal-btn modal-btn-cancel">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            console.log('Navigation modal created and added to DOM');
        }
        
        modal.classList.add('show');
        console.log('Navigation modal shown');
        
        // Add event listeners
        const yesBtn = document.getElementById('modal-yes');
        const cancelBtn = document.getElementById('modal-cancel');
        
        if (yesBtn) {
            yesBtn.onclick = () => {
                console.log('Navigation confirmed by user');
                modal.classList.remove('show');
                onConfirm();
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                console.log('Navigation cancelled by user');
                modal.classList.remove('show');
            };
        }
        
        console.log('Navigation modal event listeners attached');
    }
} 