class WorldMap {
    constructor() {
        this.activeTimezone = 'Asia/Kathmandu';
        this.init();
    }
    
    init() {
        this.setupTimezoneDots();
        console.log('World Map initialized');
    }
    
    setupTimezoneDots() {
        // Use event delegation to handle clicks on all timezone dots
        const worldMap = document.querySelector('.dotted-world-map');
        
        worldMap.addEventListener('click', (e) => {
            if (e.target.classList.contains('timezone-dot')) {
                const timezone = e.target.dataset.timezone;
                this.setActiveTimezone(timezone);
                
                // Trigger custom event for parent application
                const event = new CustomEvent('timezoneChanged', {
                    detail: { timezone: timezone }
                });
                document.dispatchEvent(event);
            }
        });
    }
    
    setActiveTimezone(timezone) {
        // Remove active class from all dots
        const dots = document.querySelectorAll('.timezone-dot');
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to selected dot
        const activeDot = document.querySelector(`[data-timezone="${timezone}"]`);
        if (activeDot) {
            activeDot.classList.add('active');
            this.activeTimezone = timezone;
        }
    }
    
    addTimezoneDot(timezone, position, title) {
        const worldMap = document.querySelector('.dotted-world-map');
        
        // Check if dot already exists
        const existingDot = worldMap.querySelector(`[data-timezone="${timezone}"]`);
        if (existingDot) {
            return existingDot;
        }
        
        // Create new dot
        const dot = document.createElement('div');
        dot.className = 'timezone-dot';
        dot.dataset.timezone = timezone;
        dot.style.left = position.left;
        dot.style.top = position.top;
        dot.title = title;
        
        worldMap.appendChild(dot);
        return dot;
    }
    
    removeTimezoneDot(timezone) {
        const dot = document.querySelector(`[data-timezone="${timezone}"]`);
        if (dot) {
            dot.remove();
        }
    }
    
    getActiveTimezone() {
        return this.activeTimezone;
    }
}

// Random circle pulse animation
function setRandomClass() {
    const svg = document.querySelector('.dotted-world-map svg');
    if (!svg) return;
    
    const circles = svg.querySelectorAll('circle');
    const number = circles.length;
    const random = Math.floor((Math.random() * number));
    
    // Remove previous animation class
    circles.forEach(circle => circle.classList.remove('banaan'));
    
    // Add animation class to random circle
    if (circles[random]) {
        circles[random].classList.add('banaan');
    }
}

// Initialize the world map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.worldMap = new WorldMap();
    
    // Start random circle animation
    setRandomClass();
    setInterval(function () {
        setRandomClass();
    }, 2000); // 2 seconds interval
});