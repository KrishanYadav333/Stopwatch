/**
 * Time Manager - Stopwatch, Timer & World Clock
 * Copyright (c) 2025 Krishan
 * Licensed under the MIT License
 */

class TimeManager {
    constructor() {
        this.stopwatchTime = 0;
        this.stopwatchInterval = null;
        this.stopwatchRunning = false;
        this.lapCount = 0;
        this.laps = [];
        
        this.timerTime = 0;
        this.timerInterval = null;
        this.timerRunning = false;
        this.previousTimerTime = 0;
        
        this.init();
        this.updateCopyright();
    }
    
    init() {
        this.setupNavigation();
        this.setupStopwatch();
        this.setupTimer();
        this.setupWorldClock();
        
        // Force immediate update
        this.updateWorldClocks();
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Update world clocks every second
        setInterval(() => this.updateWorldClocks(), 1000);
    }
    
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Update active nav button
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(tab => tab.classList.remove('active'));
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }
    
    setupStopwatch() {
        const startBtn = document.getElementById('stopwatch-start');
        const resetBtn = document.getElementById('stopwatch-reset');
        
        startBtn.addEventListener('click', () => {
            if (this.stopwatchRunning) {
                this.stopStopwatch();
                this.addLap();
            } else {
                this.startStopwatch();
            }
        });
        
        resetBtn.addEventListener('click', () => {
            this.resetStopwatch();
        });
    }
    
    startStopwatch() {
        this.stopwatchRunning = true;
        const startBtn = document.getElementById('stopwatch-start');
        startBtn.textContent = 'Lap';
        startBtn.classList.add('stop');
        
        this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime += 10;
            this.updateStopwatchDisplay();
        }, 10);
    }
    
    stopStopwatch() {
        this.stopwatchRunning = false;
        const startBtn = document.getElementById('stopwatch-start');
        startBtn.textContent = 'Start';
        startBtn.classList.remove('stop');
        
        clearInterval(this.stopwatchInterval);
    }
    
    resetStopwatch() {
        this.stopStopwatch();
        this.stopwatchTime = 0;
        this.lapCount = 0;
        this.laps = [];
        this.updateStopwatchDisplay();
        this.updateLapsDisplay();
        
        const startBtn = document.getElementById('stopwatch-start');
        startBtn.textContent = 'Start';
        startBtn.classList.remove('stop');
    }
    
    addLap() {
        this.lapCount++;
        const lapTime = this.stopwatchTime;
        const splitTime = this.laps.length > 0 ? lapTime - this.laps[this.laps.length - 1].total : lapTime;
        
        this.laps.push({
            number: this.lapCount,
            split: splitTime,
            total: lapTime
        });
        
        this.updateLapsDisplay();
    }
    
    updateStopwatchDisplay() {
        const display = document.getElementById('stopwatch-time');
        display.textContent = this.formatTime(this.stopwatchTime, true);
    }
    
    updateLapsDisplay() {
        const lapsList = document.getElementById('laps-list');
        lapsList.innerHTML = '';
        
        this.laps.slice().reverse().forEach(lap => {
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-item';
            lapItem.innerHTML = `
                <span>Lap ${lap.number}</span>
                <span>${this.formatTime(lap.split, true)}</span>
                <span>${this.formatTime(lap.total, true)}</span>
            `;
            lapsList.appendChild(lapItem);
        });
    }
    
    setupTimer() {
        const startBtn = document.getElementById('timer-start');
        
        // Initialize timer values
        this.timerHours = 0;
        this.timerMinutes = 0;
        this.timerSeconds = 30;
        
        // Setup scroll pickers
        this.setupScrollPicker('hours', 24, 0);
        this.setupScrollPicker('minutes', 60, 0);
        this.setupScrollPicker('seconds', 60, 30);
        
        startBtn.addEventListener('click', () => {
            if (this.timerRunning) {
                this.stopTimer();
            } else {
                const totalSeconds = this.timerHours * 3600 + this.timerMinutes * 60 + this.timerSeconds;
                if (totalSeconds > 0) {
                    this.startTimer(totalSeconds);
                }
            }
        });
        
        const pauseBtn = document.getElementById('timer-pause');
        pauseBtn.addEventListener('click', () => {
            if (this.timerRunning) {
                this.pauseTimer();
            } else {
                this.resumeTimer();
            }
        });
        
        this.updateTimerPicker();
    }
    
    setupScrollPicker(type, maxValue, defaultValue) {
        const optionsContainer = document.getElementById(`${type}-options`);
        const wheel = document.getElementById(`${type}-wheel`);
        
        // Create options
        for (let i = 0; i < maxValue; i++) {
            const option = document.createElement('div');
            option.className = 'picker-option';
            option.textContent = i;
            option.dataset.value = i;
            
            if (i === defaultValue) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', () => {
                this.selectPickerValue(type, i);
            });
            
            optionsContainer.appendChild(option);
        }
        
        // Simple wheel scroll
        let scrollAccumulator = 0;
        const scrollThreshold = 120;
        
        wheel.addEventListener('wheel', (e) => {
            if (this.timerRunning) return;
            
            e.preventDefault();
            scrollAccumulator += e.deltaY;
            
            if (Math.abs(scrollAccumulator) >= scrollThreshold) {
                const currentValue = this[`timer${type.charAt(0).toUpperCase() + type.slice(1)}`];
                const delta = scrollAccumulator > 0 ? 1 : -1;
                const newValue = Math.max(0, Math.min(maxValue - 1, currentValue + delta));
                
                if (newValue !== currentValue) {
                    this.selectPickerValue(type, newValue);
                }
                
                scrollAccumulator = 0;
            }
        });
        
        // Simple touch/drag
        let touchStartY = 0;
        let isDragging = false;
        let dragAccumulator = 0;
        const dragThreshold = 70;
        
        wheel.addEventListener('touchstart', (e) => {
            if (this.timerRunning) return;
            touchStartY = e.touches[0].clientY;
            isDragging = true;
            dragAccumulator = 0;
        });
        
        wheel.addEventListener('touchmove', (e) => {
            if (!isDragging || this.timerRunning) return;
            e.preventDefault();
            
            const touchCurrentY = e.touches[0].clientY;
            const diff = touchStartY - touchCurrentY;
            
            dragAccumulator += diff;
            
            if (Math.abs(dragAccumulator) >= dragThreshold) {
                const currentValue = this[`timer${type.charAt(0).toUpperCase() + type.slice(1)}`];
                const delta = dragAccumulator > 0 ? 1 : -1;
                const newValue = Math.max(0, Math.min(maxValue - 1, currentValue + delta));
                
                if (newValue !== currentValue) {
                    this.selectPickerValue(type, newValue);
                }
                
                dragAccumulator = 0;
                touchStartY = touchCurrentY;
            }
        });
        
        wheel.addEventListener('touchend', () => {
            isDragging = false;
            dragAccumulator = 0;
        });
        
        // Simple mouse drag
        let mouseStartY = 0;
        let isMouseDragging = false;
        let mouseDragAccumulator = 0;
        
        wheel.addEventListener('mousedown', (e) => {
            if (this.timerRunning) return;
            mouseStartY = e.clientY;
            isMouseDragging = true;
            mouseDragAccumulator = 0;
            e.preventDefault();
        });
        
        wheel.addEventListener('mousemove', (e) => {
            if (!isMouseDragging || this.timerRunning) return;
            e.preventDefault();
            
            const mouseCurrentY = e.clientY;
            const diff = mouseStartY - mouseCurrentY;
            
            mouseDragAccumulator += diff;
            
            if (Math.abs(mouseDragAccumulator) >= dragThreshold) {
                const currentValue = this[`timer${type.charAt(0).toUpperCase() + type.slice(1)}`];
                const delta = mouseDragAccumulator > 0 ? 1 : -1;
                const newValue = Math.max(0, Math.min(maxValue - 1, currentValue + delta));
                
                if (newValue !== currentValue) {
                    this.selectPickerValue(type, newValue);
                }
                
                mouseDragAccumulator = 0;
                mouseStartY = mouseCurrentY;
            }
        });
        
        wheel.addEventListener('mouseup', () => {
            isMouseDragging = false;
            mouseDragAccumulator = 0;
        });
        
        wheel.addEventListener('mouseleave', () => {
            isMouseDragging = false;
            mouseDragAccumulator = 0;
        });
        
        // Set initial position
        this.updatePickerPosition(type, defaultValue);
        
        // Update selection display
        this.updateSelectionDisplay();
    }
    
    selectPickerValue(type, value) {
        if (this.timerRunning) return;
        
        // Update internal value
        this[`timer${type.charAt(0).toUpperCase() + type.slice(1)}`] = value;
        
        // Update visual selection
        const options = document.querySelectorAll(`#${type}-options .picker-option`);
        options.forEach((option, index) => {
            option.classList.toggle('selected', index === value);
        });
        
        // Update position
        this.updatePickerPosition(type, value);
        
        // Update selection display and timer
        this.updateSelectionDisplay();
        this.updateTimerPicker();
    }
    
    updatePickerPosition(type, value) {
        const optionsContainer = document.getElementById(`${type}-options`);
        const offset = -value * 40; // 40px per option
        optionsContainer.style.transform = `translateY(${offset}px)`;
    }
    
    updateSelectionDisplay() {
        document.getElementById('selected-hours').textContent = this.timerHours;
        document.getElementById('selected-minutes').textContent = this.timerMinutes;
        document.getElementById('selected-seconds').textContent = this.timerSeconds;
    }
    
    startTimer(seconds) {
        if (seconds <= 0) return;
        
        this.timerTime = seconds;
        this.previousTimerTime = seconds;
        this.timerRunning = true;
        const startBtn = document.getElementById('timer-start');
        startBtn.textContent = 'Stop';
        startBtn.classList.add('stop');
        
        // Show flip clock and hide scroll picker
        document.querySelector('.flip-clock').style.display = 'flex';
        document.querySelector('.timer-controls').style.display = 'none';
        document.getElementById('timer-pause').style.display = 'block';
        this.initializeFlipDisplay();
        
        this.timerInterval = setInterval(() => {
            this.previousTimerTime = this.timerTime;
            this.timerTime--;
            this.updateTimerDisplay();
            
            if (this.timerTime <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.timerRunning = false;
        const pauseBtn = document.getElementById('timer-pause');
        pauseBtn.textContent = 'Resume';
        clearInterval(this.timerInterval);
    }
    
    resumeTimer() {
        this.timerRunning = true;
        const pauseBtn = document.getElementById('timer-pause');
        pauseBtn.textContent = 'Pause';
        
        this.timerInterval = setInterval(() => {
            this.previousTimerTime = this.timerTime;
            this.timerTime--;
            this.updateTimerDisplay();
            
            if (this.timerTime <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }
    
    stopTimer() {
        this.timerRunning = false;
        const startBtn = document.getElementById('timer-start');
        const pauseBtn = document.getElementById('timer-pause');
        startBtn.textContent = 'Start';
        startBtn.classList.remove('stop');
        pauseBtn.textContent = 'Pause';
        
        // Hide flip clock and show scroll picker
        document.querySelector('.flip-clock').style.display = 'none';
        document.querySelector('.timer-controls').style.display = 'flex';
        document.getElementById('timer-pause').style.display = 'none';
        
        clearInterval(this.timerInterval);
    }
    
    resetTimer() {
        this.stopTimer();
        this.timerHours = 0;
        this.timerMinutes = 0;
        this.timerSeconds = 30;
        this.timerTime = this.timerHours * 3600 + this.timerMinutes * 60 + this.timerSeconds;
        
        // Reset picker positions
        this.selectPickerValue('hours', 0);
        this.selectPickerValue('minutes', 0);
        this.selectPickerValue('seconds', 30);
        
        this.updateTimerDisplay();
        this.updateTimerPicker();
    }
    
    updateTimerPicker() {
        if (!this.timerRunning) {
            this.timerTime = this.timerHours * 3600 + this.timerMinutes * 60 + this.timerSeconds;
            this.updateTimerDisplay();
        }
    }
    
    timerComplete() {
        this.stopTimer();
        
        // Visual feedback
        const flipClock = document.querySelector('.flip-clock');
        flipClock.style.color = '#ff4444';
        flipClock.style.animation = 'pulse 1s infinite';
        
        // Audio notification
        this.playTimerSound();
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: 'Your timer has finished.',
                icon: '/favicon.ico'
            });
        } else {
            alert('Timer finished!');
        }
        
        // Reset after 3 seconds
        setTimeout(() => {
            flipClock.style.color = '#7BB3FF';
            flipClock.style.animation = '';
            this.resetTimer();
        }, 3000);
    }
    
    playTimerSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    updateTimerDisplay() {
        const hours = Math.floor(this.timerTime / 3600);
        const minutes = Math.floor((this.timerTime % 3600) / 60);
        const seconds = this.timerTime % 60;
        
        // Update flip display when timer is running
        if (this.timerRunning) {
            this.updateFlipDisplay(hours, minutes, seconds);
        }
    }
    
    initializeFlipDisplay() {
        const hours = Math.floor(this.timerTime / 3600);
        const minutes = Math.floor((this.timerTime % 3600) / 60);
        const seconds = this.timerTime % 60;
        const secondsTens = Math.floor(seconds / 10);
        const secondsOnes = seconds % 10;
        
        // Show/hide hours display based on timer value
        const hoursUnit = document.getElementById('hours-flip-unit');
        const hoursSeparator = document.getElementById('hours-separator');
        
        if (hours > 0) {
            hoursUnit.style.display = 'block';
            hoursSeparator.style.display = 'block';
            this.setFlipValue('hours-flip', hours);
        } else {
            hoursUnit.style.display = 'none';
            hoursSeparator.style.display = 'none';
        }
        
        // Set initial values without animation
        this.setFlipValue('minutes-flip', minutes);
        this.setFlipValue('seconds-tens-flip', secondsTens);
        this.setFlipValue('seconds-ones-flip', secondsOnes);
    }
    
    updateFlipDisplay(hours, minutes, seconds) {
        const prevHours = Math.floor(this.previousTimerTime / 3600);
        const prevMinutes = Math.floor((this.previousTimerTime % 3600) / 60);
        const prevSeconds = this.previousTimerTime % 60;
        
        const secondsTens = Math.floor(seconds / 10);
        const secondsOnes = seconds % 10;
        const prevSecondsTens = Math.floor(prevSeconds / 10);
        const prevSecondsOnes = prevSeconds % 10;
        
        // Show/hide hours display
        const hoursUnit = document.getElementById('hours-flip-unit');
        const hoursSeparator = document.getElementById('hours-separator');
        
        if (hours > 0 || prevHours > 0) {
            hoursUnit.style.display = 'block';
            hoursSeparator.style.display = 'block';
            
            if (hours !== prevHours) {
                this.flipValue('hours-flip', hours);
            }
        } else {
            hoursUnit.style.display = 'none';
            hoursSeparator.style.display = 'none';
        }
        
        // Animate changes
        if (minutes !== prevMinutes) {
            this.flipValue('minutes-flip', minutes);
        }
        
        if (secondsTens !== prevSecondsTens) {
            this.flipValue('seconds-tens-flip', secondsTens);
        }
        
        if (secondsOnes !== prevSecondsOnes) {
            this.flipValue('seconds-ones-flip', secondsOnes);
        }
    }
    
    setFlipValue(cardId, value) {
        const card = document.getElementById(cardId);
        const front = card.querySelector('.flip-card-front span');
        const back = card.querySelector('.flip-card-back span');
        
        front.textContent = value;
        back.textContent = value;
    }
    
    flipValue(cardId, newValue) {
        const card = document.getElementById(cardId);
        const front = card.querySelector('.flip-card-front span');
        const back = card.querySelector('.flip-card-back span');
        
        // Set the new value on the back
        back.textContent = newValue;
        
        // Add flip animation
        card.classList.add('flip-down');
        
        // After animation completes, update front and reset
        setTimeout(() => {
            front.textContent = newValue;
            card.classList.remove('flip-down');
        }, 600);
    }
    
    setupWorldClock() {
        const addClockBtn = document.getElementById('add-clock-btn');
        const modal = document.getElementById('clock-modal');
        const closeModal = document.getElementById('close-modal');
        const searchInput = document.getElementById('clock-search');
        const clockList = document.getElementById('clock-list');
        
        // Current main display city (default to Kathmandu)
        this.currentMainCity = { city: 'Kathmandu', timezone: 'Asia/Kathmandu', country: 'Nepal', position: { left: '72%', top: '38%' } };
        
        // Available timezones with city names and map positions
        this.availableClocks = [
            { city: 'New York', timezone: 'America/New_York', country: 'USA', position: { left: '25%', top: '35%' } },
            { city: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA', position: { left: '15%', top: '40%' } },
            { city: 'Chicago', timezone: 'America/Chicago', country: 'USA', position: { left: '22%', top: '38%' } },
            { city: 'Denver', timezone: 'America/Denver', country: 'USA', position: { left: '20%', top: '42%' } },
            { city: 'Phoenix', timezone: 'America/Phoenix', country: 'USA', position: { left: '18%', top: '45%' } },
            { city: 'London', timezone: 'Europe/London', country: 'UK', position: { left: '50%', top: '30%' } },
            { city: 'Paris', timezone: 'Europe/Paris', country: 'France', position: { left: '52%', top: '32%' } },
            { city: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany', position: { left: '54%', top: '30%' } },
            { city: 'Rome', timezone: 'Europe/Rome', country: 'Italy', position: { left: '54%', top: '35%' } },
            { city: 'Madrid', timezone: 'Europe/Madrid', country: 'Spain', position: { left: '48%', top: '35%' } },
            { city: 'Amsterdam', timezone: 'Europe/Amsterdam', country: 'Netherlands', position: { left: '52%', top: '29%' } },
            { city: 'Stockholm', timezone: 'Europe/Stockholm', country: 'Sweden', position: { left: '56%', top: '25%' } },
            { city: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia', position: { left: '62%', top: '28%' } },
            { city: 'Istanbul', timezone: 'Europe/Istanbul', country: 'Turkey', position: { left: '58%', top: '35%' } },
            { city: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan', position: { left: '85%', top: '40%' } },
            { city: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea', position: { left: '83%', top: '38%' } },
            { city: 'Beijing', timezone: 'Asia/Shanghai', country: 'China', position: { left: '78%', top: '35%' } },
            { city: 'Shanghai', timezone: 'Asia/Shanghai', country: 'China', position: { left: '80%', top: '37%' } },
            { city: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: 'Hong Kong', position: { left: '78%', top: '42%' } },
            { city: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore', position: { left: '75%', top: '52%' } },
            { city: 'Bangkok', timezone: 'Asia/Bangkok', country: 'Thailand', position: { left: '74%', top: '45%' } },
            { city: 'Mumbai', timezone: 'Asia/Kolkata', country: 'India', position: { left: '68%', top: '42%' } },
            { city: 'Delhi', timezone: 'Asia/Kolkata', country: 'India', position: { left: '69%', top: '38%' } },
            { city: 'Kathmandu', timezone: 'Asia/Kathmandu', country: 'Nepal', position: { left: '72%', top: '38%' } },
            { city: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE', position: { left: '64%', top: '42%' } },
            { city: 'Tel Aviv', timezone: 'Asia/Jerusalem', country: 'Israel', position: { left: '60%', top: '37%' } },
            { city: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia', position: { left: '88%', top: '70%' } },
            { city: 'Melbourne', timezone: 'Australia/Melbourne', country: 'Australia', position: { left: '86%', top: '72%' } },
            { city: 'Perth', timezone: 'Australia/Perth', country: 'Australia', position: { left: '78%', top: '68%' } },
            { city: 'Auckland', timezone: 'Pacific/Auckland', country: 'New Zealand', position: { left: '92%', top: '75%' } },
            { city: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brazil', position: { left: '32%', top: '65%' } },
            { city: 'Rio de Janeiro', timezone: 'America/Sao_Paulo', country: 'Brazil', position: { left: '34%', top: '63%' } },
            { city: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', country: 'Argentina', position: { left: '30%', top: '70%' } },
            { city: 'Mexico City', timezone: 'America/Mexico_City', country: 'Mexico', position: { left: '20%', top: '48%' } },
            { city: 'Toronto', timezone: 'America/Toronto', country: 'Canada', position: { left: '26%', top: '32%' } },
            { city: 'Vancouver', timezone: 'America/Vancouver', country: 'Canada', position: { left: '18%', top: '30%' } },
            { city: 'Montreal', timezone: 'America/Toronto', country: 'Canada', position: { left: '28%', top: '32%' } },
            { city: 'Cairo', timezone: 'Africa/Cairo', country: 'Egypt', position: { left: '58%', top: '45%' } },
            { city: 'Lagos', timezone: 'Africa/Lagos', country: 'Nigeria', position: { left: '52%', top: '52%' } },
            { city: 'Johannesburg', timezone: 'Africa/Johannesburg', country: 'South Africa', position: { left: '58%', top: '65%' } },
            { city: 'Nairobi', timezone: 'Africa/Nairobi', country: 'Kenya', position: { left: '62%', top: '52%' } }
        ];
        
        addClockBtn.addEventListener('click', () => {
            modal.classList.add('active');
            this.renderClockList();
            searchInput.focus();
        });
        
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        searchInput.addEventListener('input', () => {
            this.renderClockList(searchInput.value);
        });
        
        // Setup remove clock functionality
        this.setupRemoveClocks();
        
        // Setup timezone dot clicks
        this.setupTimezoneDots();
        
        // Initialize the main display
        this.updateMainDisplay();
        this.updateOrangeDot();
        
        // Initialize current time small display
        this.updateCurrentTimeSmall();
    }
    
    renderClockList(searchTerm = '') {
        const clockList = document.getElementById('clock-list');
        const existingTimezones = Array.from(document.querySelectorAll('.additional-clock-item')).map(item => item.dataset.timezone);
        
        const filteredClocks = this.availableClocks.filter(clock => {
            const matchesSearch = clock.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                clock.country.toLowerCase().includes(searchTerm.toLowerCase());
            const notExists = !existingTimezones.includes(clock.timezone);
            return matchesSearch && notExists;
        });
        
        clockList.innerHTML = '';
        
        if (filteredClocks.length === 0) {
            clockList.innerHTML = '<div class="no-results">No cities found</div>';
            return;
        }
        
        filteredClocks.forEach(clock => {
            const clockOption = document.createElement('div');
            clockOption.className = 'clock-option';
            
            try {
                const currentTime = new Date().toLocaleTimeString('en-US', {
                    timeZone: clock.timezone,
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                clockOption.innerHTML = `
                    <div class="clock-option-info">
                        <div class="clock-option-city">${clock.city}</div>
                        <div class="clock-option-timezone">${clock.country} • Click to set as main</div>
                    </div>
                    <div class="clock-option-time">${currentTime}</div>
                `;
            } catch (error) {
                console.error(`Error getting time for ${clock.city}:`, error);
                clockOption.innerHTML = `
                    <div class="clock-option-info">
                        <div class="clock-option-city">${clock.city}</div>
                        <div class="clock-option-timezone">${clock.country} • Click to set as main</div>
                    </div>
                    <div class="clock-option-time">--:--</div>
                `;
            }
            
            clockOption.addEventListener('click', () => {
                this.addClock(clock);
            });
            
            clockList.appendChild(clockOption);
        });
    }
    
    addClock(clock) {
        // Set this as the new main city
        this.currentMainCity = clock;
        
        // Update the main display immediately
        const mainCityElement = document.getElementById('main-city');
        const mainTimeElement = document.getElementById('main-time');
        
        if (mainCityElement) {
            mainCityElement.textContent = clock.city;
        }
        
        if (mainTimeElement) {
            const now = new Date();
            const currentTime = now.toLocaleTimeString('en-US', {
                timeZone: clock.timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            mainTimeElement.textContent = currentTime;
        }
        
        // Update the orange dot position
        this.updateOrangeDot();
        
        document.getElementById('clock-modal').classList.remove('active');
    }
    
    updateMainDisplay() {
        const mainCityElement = document.getElementById('main-city');
        const mainTimeElement = document.getElementById('main-time');
        
        if (mainCityElement) {
            mainCityElement.textContent = this.currentMainCity.city;
        }
        
        if (mainTimeElement) {
            try {
                const now = new Date();
                const currentTime = now.toLocaleTimeString('en-US', {
                    timeZone: this.currentMainCity.timezone,
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
                mainTimeElement.textContent = currentTime;
            } catch (error) {
                console.error(`Error getting time for ${this.currentMainCity.city}:`, error);
                mainTimeElement.textContent = '--:--';
            }
        }
    }
    
    updateOrangeDot() {
        // Remove existing active dot
        const existingActiveDot = document.querySelector('.timezone-dot.active');
        if (existingActiveDot) {
            existingActiveDot.classList.remove('active');
        }
        
        // Find or create the dot for current main city
        let activeDot = document.querySelector(`[data-timezone="${this.currentMainCity.timezone}"]`);
        
        if (!activeDot) {
            // Create new dot if it doesn't exist
            activeDot = document.createElement('div');
            activeDot.className = 'timezone-dot';
            activeDot.dataset.timezone = this.currentMainCity.timezone;
            activeDot.style.left = this.currentMainCity.position.left;
            activeDot.style.top = this.currentMainCity.position.top;
            document.querySelector('.dotted-world-map').appendChild(activeDot);
        }
        
        // Make this dot active (highlighted)
        activeDot.classList.add('active');
    }
    
    setupTimezoneDots() {
        // Use event delegation to handle clicks on all timezone dots (existing and future)
        const worldMap = document.querySelector('.dotted-world-map');
        
        worldMap.addEventListener('click', (e) => {
            if (e.target.classList.contains('timezone-dot')) {
                const timezone = e.target.dataset.timezone;
                const clockData = this.availableClocks.find(clock => clock.timezone === timezone);
                
                if (clockData) {
                    this.currentMainCity = clockData;
                    this.updateMainDisplay();
                    this.updateOrangeDot();
                }
            }
        });
    }
    
    setupRemoveClocks() {
        const removeButtons = document.querySelectorAll('.remove-clock-btn');
        removeButtons.forEach(btn => {
            btn.replaceWith(btn.cloneNode(true)); // Remove existing listeners
        });
        
        document.querySelectorAll('.remove-clock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.closest('.clock-item').remove();
            });
        });
    }
    
    updateWorldClocks() {
        // Create a single Date object for consistency
        const now = new Date();
        
        // Update small current time (local time)
        const currentTimeSmall = document.getElementById('current-time-small');
        if (currentTimeSmall) {
            const currentTime = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            currentTimeSmall.textContent = currentTime;
        }
        
        // Update main time display (current selected city)
        this.updateMainDisplay();
        
        // Update additional clocks
        const additionalClockItems = document.querySelectorAll('.additional-clock-item');
        
        additionalClockItems.forEach(clockItem => {
            const timezone = clockItem.dataset.timezone;
            const timeElement = clockItem.querySelector('.additional-clock-time');
            
            if (timeElement && timezone) {
                try {
                    const currentTime = now.toLocaleTimeString('en-US', {
                        timeZone: timezone,
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    timeElement.textContent = currentTime;
                } catch (error) {
                    console.error(`Error updating time for timezone ${timezone}:`, error);
                    timeElement.textContent = '--:--';
                }
            }
        });
    }
    
    updateCurrentTimeSmall() {
        const currentTimeSmall = document.getElementById('current-time-small');
        if (currentTimeSmall) {
            const now = new Date();
            const currentTime = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            currentTimeSmall.textContent = currentTime;
        }
    }
    
    formatTime(milliseconds, includeHundredths = false) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const hundredths = Math.floor((milliseconds % 1000) / 10);
        
        if (includeHundredths) {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateCopyright() {
        const currentYear = new Date().getFullYear();
        const copyrightElement = document.getElementById('copyright-year');
        const footerCopyrightElement = document.getElementById('footer-copyright-year');
        
        if (copyrightElement) {
            copyrightElement.textContent = currentYear;
        }
        if (footerCopyrightElement) {
            footerCopyrightElement.textContent = currentYear;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing TimeManager...');
    
    // Set initial time immediately
    const mainTimeElement = document.getElementById('main-time');
    if (mainTimeElement) {
        const now = new Date();
        const katmanduTime = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kathmandu',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        mainTimeElement.textContent = katmanduTime;
        console.log('Initial Kathmandu time set:', katmanduTime);
    }
    
    new TimeManager();
    
    // Random circle pulse animation for world map (adapted from original map JS)
    function setRandomClass() {
        // Find the SVG in the world map background
        const svg = document.querySelector('.world-map-background svg');
        if (!svg) return;
        
        const circles = svg.querySelectorAll('circle');
        const number = circles.length;
        const random = Math.floor((Math.random() * number));
        
        // Remove previous animation class from all circles
        circles.forEach(circle => circle.classList.remove('banaan'));
        
        // Add animation class to random circle
        if (circles[random]) {
            circles[random].classList.add('banaan');
        }
    }
    
    // Start the animation immediately and set interval
    setRandomClass();
    setInterval(function () {
        setRandomClass();
    }, 2000); // number of milliseconds (2000 = 2 seconds)
});