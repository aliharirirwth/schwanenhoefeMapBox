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
                    const buildingMatch = c.building.toLowerCase().includes(val);
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
            btn.className = 'company-circle company-btn';
            btn.innerHTML = `<img class="company-logo" src="./${c.logo}" alt="${c.name}" /><div class="company-name">${c.name}</div>`;
            btn.onclick = () => {
                document.querySelectorAll('.company-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                let coords = [c.longitude, c.latitude];
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
            const buildingCompanies = companies.filter(c => c.building === num);
            
            btn.onclick = () => {
                document.querySelectorAll('.company-grid-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // If there are companies in this building, use the first one's coordinates
                // Otherwise use the default location
                const company = buildingCompanies[0];
                let coords = company ? [company.longitude, company.latitude] : [6.8143, 51.2187];
                this.handleDestinationSelection(coords);
            };
            grid.appendChild(btn);
        });
    }

    handleDestinationSelection(coords) {
        console.log('Destination selected:', coords);
        this.navigationManager.setDestination(coords);
        this.showNavigationModal(() => {
            this.navigationManager.startNavigation();
        });
    }

    showNavigationModal(onConfirm) {
        let modal = document.getElementById('navigation-modal');
        if (!modal) {
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
        } else {
            modal.style.display = 'block';
        }
        
        document.getElementById('modal-yes').onclick = () => {
            modal.style.display = 'none';
            onConfirm();
        };
        document.getElementById('modal-cancel').onclick = () => {
            modal.style.display = 'none';
        };
    }
} 