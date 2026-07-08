 // --- DATA STATE ---
        let batPoints = 0; 
        let totalExp = 0;
        let isMobileMenuOpen = false;
        
        let newDifficulty = 1;
        let pomodoroStreak = parseInt(localStorage.getItem('pomodoroStreak')) || 0;
        let sessionHistory = JSON.parse(localStorage.getItem('focusHistory')) || [];
        let currentDistractions = 0;
        
        // --- SECURITY / SANITIZATION ---
        function escapeHTML(str) {
            if (typeof str !== 'string') return str;
            return str.replace(/[&<>"']/g, function(m) {
                switch (m) {
                    case '&': return '&amp;';
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '"': return '&quot;';
                    case "'": return '&#039;';
                    default: return m;
                }
            });
        }

        let progressData = { history: {}, lastLoginDate: "" };

        function getTodayString() {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }

        const canvas = document.getElementById('neural-biology-canvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        let neuronBranches = []; let animationFrameId; let nodeCount = 0;

        const tacticalComments = [
            "Don't procrastinate.", "Tasks will not complete themselves. Get to work.",
            "Focus on the 80/20 rule. Maximize efficiency.", "Train harder.",
            "Discipline equals freedom. Execute the mission.", "The city rests on your shoulders. Move.",
            "Every second counts. Make it count.", "Stay vigilant. Avoid distractions.",
            "You do not rise to the level of your goals. You fall to the level of your systems."
        ];
        
        function changeComicSpeech() { 
            document.getElementById('dynamic-speech-bubble').innerText = tacticalComments[Math.floor(Math.random() * tacticalComments.length)]; 
        }

        function handleTouchSpeech(element, event) {
            changeComicSpeech();
            element.classList.add('touch-active');
            setTimeout(() => { element.classList.remove('touch-active'); }, 2500);
        }
        
        const svgFallback = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWY0NDQ0IiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyQzcuNSAyIDQgNSA0IDljMCAxLjUuNSAzIDEuNSA0LjVsNi41IDguNSA2LjUtOC41QzE5LjUgMTIgMjAgMTAuNSAyMCA5YzAtNCAzLjUtNyA4LTd6Ii8+PC9zdmc+";

        const avatars = {
            'suit_standard': { name: 'Standard Suit', cost: 0, src: './Images/Batman.jpeg' },
            'suit_beyond': { name: 'Batman Animated', cost: 500, src: './Images/Batman_Animated.jpeg' },
            'suit_hellbat': { name: 'Hellbat Armor', cost: 1500, src: './Images/Armored_Batman.jpeg' },
            'suit_knight': { name: 'The Dark Knight', cost: 2000, src: './Images/Dark_Knight.jpeg' }
        };
        
        let inventory = ['suit_standard']; let currentSuit = 'suit_standard';

        function setNewDifficulty(d) {
            newDifficulty = d;
            document.querySelectorAll('#star-rating span').forEach((s, i) => {
                s.className = (i < d) ? 'text-yellow-500' : 'text-zinc-700';
            });
        }

        function toggleMobileMenu() {
            if(window.innerWidth >= 768) return; 

            isMobileMenuOpen = !isMobileMenuOpen;
            const sidebar = document.getElementById('mobile-sidebar');
            const overlay = document.getElementById('mobile-overlay');
            const batLogo = document.getElementById('bat-logo-svg');

            if (isMobileMenuOpen) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
                batLogo.style.transform = 'rotate(90deg)';
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
                batLogo.style.transform = 'rotate(0deg)';
            }
        }

        function switchView(v) {
            document.querySelectorAll('.hidden-view, #dashboard-view, #progress-view, #focus-view, #neural-view').forEach(el => {
                if(el.id && el.id.includes('-view')) el.classList.add('hidden-view');
            });
            document.querySelectorAll('.nav-btn').forEach(b => { 
                b.classList.remove('active-nav'); 
                b.classList.add('text-zinc-500'); 
                if (b.classList.contains('active-nav-mobile')) b.classList.remove('active-nav-mobile');
            });
            
            document.getElementById(v + '-view').classList.remove('hidden-view');
            
            if(document.getElementById('nav-' + v)) {
                document.getElementById('nav-' + v).classList.add('active-nav');
                document.getElementById('nav-' + v).classList.remove('text-zinc-500');
            }
            
            document.querySelectorAll('#mobile-sidebar .nav-btn').forEach(b => {
                if(b.innerText.toLowerCase().includes(v.replace('dashboard', 'cave').toLowerCase())) {
                    b.classList.add('active-nav');
                    b.classList.remove('text-zinc-400');
                } else {
                    b.classList.remove('active-nav');
                    b.classList.add('text-zinc-400');
                }
            });
            
            if(v === 'neural') { resizeCanvas(); buildNeuronNetwork(); }
            if(v === 'progress') { updateProgressUI(); }
        }

        function initSystem() {
            const savedBP = localStorage.getItem('batPoints'); if (savedBP) batPoints = parseInt(savedBP);
            const savedExp = localStorage.getItem('gothamExp'); if (savedExp) totalExp = parseInt(savedExp);
            document.getElementById('bp-display').innerText = batPoints;
            
            const savedInv = localStorage.getItem('gothamInventory'); if (savedInv) inventory = JSON.parse(savedInv);
            const savedSuit = localStorage.getItem('gothamCurrentSuit'); if (savedSuit) currentSuit = savedSuit;
            applySuit(currentSuit);

            const savedProg = localStorage.getItem('gothamProgress');
            if (savedProg) progressData = JSON.parse(savedProg);

            const savedSectors = localStorage.getItem('gothamSectors');
            if (savedSectors) { document.getElementById('sectors-grid-container').innerHTML = savedSectors; attachEventListeners(); } 
            else generateDefaultSectors();
            
            checkDailyReset(); 
            updateNeuronUI(); initThreeJS();
            renderHistory();
            window.addEventListener('resize', resizeCanvas);
            
            const today = getTodayString();
            if (!progressData.history[today]) { progressData.history[today] = { total: 0, sectors: {}, focusMins: 0 }; }
        }

        function saveData() {
            localStorage.setItem('batPoints', batPoints);
            localStorage.setItem('gothamExp', totalExp);
            localStorage.setItem('gothamInventory', JSON.stringify(inventory));
            localStorage.setItem('gothamCurrentSuit', currentSuit);
            localStorage.setItem('gothamProgress', JSON.stringify(progressData));
            setTimeout(() => { localStorage.setItem('gothamSectors', document.getElementById('sectors-grid-container').innerHTML); }, 100);
        }

        function checkDailyReset() {
            const today = getTodayString();
            if (progressData.lastLoginDate && progressData.lastLoginDate !== today) {
                document.querySelectorAll('.task-row').forEach(row => {
                    const cb = row.querySelector('input[type="checkbox"]');
                    const input = row.querySelector('input[type="text"]');
                    const icon = row.querySelector('svg');
                    if (cb.checked) {
                        cb.checked = false;
                        cb.removeAttribute('checked');
                        row.classList.remove('opacity-50');
                        input.classList.remove('line-through', 'text-zinc-500');
                        icon.classList.add('opacity-0', 'scale-50');
                    }
                });
                
                pomodoroStreak = 0;
                localStorage.setItem('pomodoroStreak', pomodoroStreak);
                saveData(); 
            }
            progressData.lastLoginDate = today;
            saveData();
        }

        function logTaskCompletion(sectorName, isAdding) {
            const today = getTodayString();
            if(!progressData.history[today]) progressData.history[today] = { total: 0, sectors: {}, focusMins: 0 };
            let cleanSector = sectorName.replace(/[^a-zA-Z0-9 ]/g, "").trim().toUpperCase();
            if (isAdding) {
                progressData.history[today].total++;
                progressData.history[today].sectors[cleanSector] = (progressData.history[today].sectors[cleanSector] || 0) + 1;
            } else {
                progressData.history[today].total = Math.max(0, progressData.history[today].total - 1);
                if (progressData.history[today].sectors[cleanSector]) {
                    progressData.history[today].sectors[cleanSector] = Math.max(0, progressData.history[today].sectors[cleanSector] - 1);
                }
            }
            saveData();
        }

        function updateProgressUI() {
            const today = getTodayString();
            const hist = progressData.history;
            let dailyTotal = hist[today] ? hist[today].total : 0;
            let weeklyTotal = 0; let monthlyTotal = 0; let totalFocusMins = 0;
            const now = new Date();
            
            for (const [dateStr, data] of Object.entries(hist)) {
                const d = new Date(dateStr);
                const diffTime = Math.abs(now - d);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays <= 7) weeklyTotal += data.total;
                if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthlyTotal += data.total;
                totalFocusMins += (data.focusMins || 0);
            }

            document.getElementById('hud-focus-hours').innerText = (totalFocusMins / 60).toFixed(1) + " HRS";
            const pDay = Math.min(100, Math.round((dailyTotal / 10) * 100));
            const pWeek = Math.min(100, Math.round((weeklyTotal / 50) * 100));
            const pMonth = Math.min(100, Math.round((monthlyTotal / 200) * 100));

            document.getElementById('hud-txt-day').innerText = pDay + '%';
            document.getElementById('hud-txt-week').innerText = pWeek + '%';
            document.getElementById('hud-txt-month').innerText = pMonth + '%';

            document.getElementById('hud-circ-day').style.strokeDashoffset = 251 - (251 * (pDay/100));
            document.getElementById('hud-circ-week').style.strokeDashoffset = 163 - (163 * (pWeek/100));
            document.getElementById('hud-circ-month').style.strokeDashoffset = 163 - (163 * (pMonth/100));

            const sectorDiv = document.getElementById('hud-sector-breakdown');
            sectorDiv.innerHTML = '';
            let sectorsToday = hist[today] ? hist[today].sectors : {};
            if(Object.keys(sectorsToday).length === 0) {
                sectorDiv.innerHTML = '<span class="text-xs text-zinc-600">No operational data logged today.</span>';
            } else {
                for (const [sec, count] of Object.entries(sectorsToday)) {
                    if (count > 0) {
                        sectorDiv.innerHTML += `
                            <div class="flex justify-between items-center text-xs">
                                <span class="text-zinc-300 font-medium">${escapeHTML(sec)}</span>
                                <span class="cyber-font text-red-500">${count} COMPLETED</span>
                            </div>
                        `;
                    }
                }
            }

            const calGrid = document.getElementById('hud-calendar-grid');
            calGrid.innerHTML = '';
            for (let i = 34; i >= 0; i--) {
                const targetDate = new Date();
                targetDate.setDate(now.getDate() - i);
                const tStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth()+1).padStart(2,'0')}-${String(targetDate.getDate()).padStart(2,'0')}`;
                let count = hist[tStr] ? hist[tStr].total : 0;
                let intensityClass = '';
                if(count > 0 && count <= 2) intensityClass = 'active-low';
                else if (count > 2 && count <= 5) intensityClass = 'active-med';
                else if (count > 5) intensityClass = 'active-high';
                calGrid.innerHTML += `<div class="hud-grid-cell ${intensityClass}" title="${tStr}: ${count} tasks"></div>`;
            }
        }

        function calculateLevelStats() {
            let lvl = 1; let required = Math.floor(100 * Math.pow(lvl, 1.5)); let tempExp = totalExp;
            while (tempExp >= required) { tempExp -= required; lvl++; required = Math.floor(100 * Math.pow(lvl, 1.5)); }
            return { level: lvl, expInCurrentLevel: tempExp, expForNextLevel: required };
        }
        
        function triggerFloatingExp(element, expAmount) {
            const rect = element.getBoundingClientRect();
            const floater = document.createElement('div'); floater.innerText = `+${expAmount} EXP`;
            floater.className = 'absolute text-red-500 font-bold cyber-font z-50 pointer-events-none float-exp drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
            floater.style.left = (rect.left + window.scrollX + 25) + 'px'; floater.style.top = (rect.top + window.scrollY - 10) + 'px';
            document.body.appendChild(floater); setTimeout(() => floater.remove(), 1200);
        }

        function openShop() {
            document.getElementById('shop-bp-display').innerText = batPoints + ' BP';
            const container = document.getElementById('shop-items-container'); container.innerHTML = '';
            Object.keys(avatars).forEach(key => {
                if(key === 'suit_standard') return; 
                const item = avatars[key]; const isOwned = inventory.includes(key);
                container.innerHTML += `
                    <div class="bg-black/50 border ${isOwned ? 'border-green-500/30' : 'border-white/10'} rounded-xl p-4 flex flex-col items-center text-center transition-all hover:border-yellow-500/50 relative overflow-hidden">
                        ${isOwned ? '<div class="absolute top-2 right-2 text-[9px] bg-green-900/50 text-green-400 px-2 py-1 rounded">OWNED</div>' : ''}
                        <div class="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 mb-4 overflow-hidden flex items-center justify-center"><img src="${item.src}" class="w-full h-full object-cover" onerror="this.src='${svgFallback}'"></div>
                        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-1">${escapeHTML(item.name)}</h4><p class="cyber-font text-sm font-bold text-yellow-500 mb-4">${item.cost} BP</p>
                        <button onclick="buyItem('${key}')" class="w-full ${isOwned ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-500 text-black'} py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors" ${isOwned ? 'disabled' : ''}>${isOwned ? 'Acquired' : 'Purchase'}</button>
                    </div>`;
            });
            document.getElementById('shop-modal').classList.remove('hidden');
        }
        
        function closeShop() { document.getElementById('shop-modal').classList.add('hidden'); }
        
        function buyItem(itemKey) {
            const item = avatars[itemKey]; if(inventory.includes(itemKey)) return;
            if(batPoints >= item.cost) { batPoints -= item.cost; document.getElementById('bp-display').innerText = batPoints; inventory.push(itemKey); saveData(); openShop(); } 
            else { alert("INSUFFICIENT BP FOR TRANSACTION."); }
        }
        
        function openEquipment() {
            const container = document.getElementById('equipment-container'); container.innerHTML = '';
            inventory.forEach(key => {
                const item = avatars[key]; const isEquipped = (currentSuit === key);
                container.innerHTML += `
                    <div class="bg-black/50 border ${isEquipped ? 'border-red-500' : 'border-white/10'} rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:bg-white/5" onclick="equipSuit('${key}')">
                        <div class="w-16 h-16 rounded-full bg-zinc-900 border ${isEquipped ? 'border-red-500' : 'border-zinc-700'} mb-3 overflow-hidden flex items-center justify-center"><img src="${item.src}" class="w-full h-full object-cover" onerror="this.src='${svgFallback}'"></div>
                        <h4 class="text-[10px] font-bold text-white uppercase tracking-wider">${escapeHTML(item.name)}</h4>
                        ${isEquipped ? '<span class="text-[9px] text-red-500 mt-2 uppercase tracking-widest">Equipped</span>' : ''}
                    </div>`;
            });
            document.getElementById('equipment-modal').classList.remove('hidden');
        }
        
        function closeEquipment() { document.getElementById('equipment-modal').classList.add('hidden'); }
        
        function equipSuit(key) { currentSuit = key; saveData(); applySuit(key); openEquipment(); }
        
        function applySuit(key) { const imgEl = document.getElementById('main-avatar-img'); if(imgEl && avatars[key]) imgEl.src = avatars[key].src; }

        function generateDefaultSectors() {
            const defaults = [
                { id: 'matrix1', title: 'MATRIX 1', tasks: ['Define objective...', 'Define objective...'] },
                { id: 'matrix2', title: 'MATRIX 2', tasks: ['Define objective...', 'Define objective...'] },
                { id: 'matrix3', title: 'MATRIX 3', tasks: ['Define objective...', 'Define objective...'] }
            ];
            defaults.forEach(sec => {
                const div = createSectorHTML(sec.id, sec.title);
                document.getElementById('sectors-grid-container').appendChild(div);
                sec.tasks.forEach(taskText => addTaskRowHTML(`tasks-${sec.id}`, taskText, false));
            });
            saveData();
        }

        function createSectorHTML(id, title) {
            const safeTitle = escapeHTML(title);
            const div = document.createElement('div');
            div.className = "bat-panel rounded-xl p-6 relative group"; div.id = `sector-${id}`;
            div.dataset.difficulty = newDifficulty; 
            
            div.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center space-x-3 w-3/4">
                        <img src="./Images/Bat_logo.png" class="w-5 h-5 object-contain filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" alt="Bat Icon" onerror="this.src='${svgFallback}'">
                        <input type="text" value="${safeTitle}" class="sector-title-input cyber-font font-bold text-sm text-white uppercase tracking-wider w-full">
                    </div>
                    <div class="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onclick="autoResetSector('tasks-${id}')" class="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/30 px-2 py-1 rounded">🔄</button>
                        <button onclick="deleteSector('${div.id}')" class="text-xs text-red-500 hover:text-red-400 bg-red-900/30 px-2 py-1 rounded">🗑️</button>
                    </div>
                </div>
                <div class="flex text-yellow-500 text-xs mb-4">${'★'.repeat(newDifficulty)}</div>
                <div id="tasks-${id}" class="space-y-2"></div>
                <button onclick="addTaskFromUI('tasks-${id}')" class="mt-4 w-full border border-dashed border-zinc-700 hover:border-red-500/50 hover:bg-red-900/10 text-zinc-500 text-[11px] py-2 rounded transition-all tracking-widest uppercase">+ Add Metric</button>
            `;
            return div;
        }

        function createNewSector() {
            const input = document.getElementById('new-sector-name'); if(!input.value.trim()) return;
            const id = 'custom_' + Date.now(); document.getElementById('sectors-grid-container').appendChild(createSectorHTML(id, input.value));
            input.value = ''; addTaskFromUI(`tasks-${id}`); saveData();
        }

        function addTaskFromUI(containerId) { addTaskRowHTML(containerId, '', false); saveData(); }
        
        function addTaskRowHTML(containerId, textVal, isChecked) {
            const safeText = escapeHTML(textVal);
            const row = document.createElement('div');
            row.className = `task-row flex items-center space-x-3 p-2.5 bg-black/40 rounded-lg border border-white/5 transition-all hover:bg-black/60 group/task ${isChecked ? 'opacity-50' : ''}`;
            row.innerHTML = `
                <div class="relative flex items-center justify-center">
                    <input type="checkbox" onchange="toggleTask(this, 10)" class="w-4 h-4 appearance-none rounded border border-zinc-600 checked:bg-red-500 checked:border-red-500 transition-colors cursor-pointer" ${isChecked ? 'checked' : ''}>
                    <svg class="absolute w-3 h-3 text-black pointer-events-none opacity-0 scale-50 transition-all ${isChecked ? 'opacity-100 scale-100' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <input type="text" value="${safeText}" onchange="this.setAttribute('value', this.value); saveData();" class="bg-transparent text-xs text-white w-full focus:outline-none placeholder-zinc-700 ${isChecked ? 'line-through text-zinc-500' : ''}" placeholder="Define objective...">
                <button onclick="deleteTask(this)" class="text-xs text-zinc-600 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity p-1">✕</button>
            `;
            document.getElementById(containerId).appendChild(row);
        }

        function toggleTask(cb, bpVal = 10) {
            const row = cb.closest('.task-row'); const input = row.querySelector('input[type="text"]'); const checkIcon = row.querySelector('svg');
            const sectorDiv = cb.closest('.bat-panel');
            const sectorNameInput = sectorDiv.querySelector('.sector-title-input');
            const sName = sectorNameInput ? sectorNameInput.value : "UNASSIGNED";

            const diff = parseInt(sectorDiv.dataset.difficulty) || 1;
            const xpMap = { 1: 20, 2: 50, 3: 150, 4: 200 };
            const dynamicExp = xpMap[diff] || 50;

            if(cb.checked) {
                batPoints += bpVal; totalExp += dynamicExp; triggerFloatingExp(cb, dynamicExp); 
                logTaskCompletion(sName, true); 
                row.classList.add('opacity-50'); input.classList.add('line-through', 'text-zinc-500'); cb.setAttribute('checked', 'true'); checkIcon.classList.remove('opacity-0', 'scale-50');
            } else {
                batPoints = Math.max(0, batPoints - bpVal); 
                totalExp = Math.max(0, totalExp - dynamicExp);
                logTaskCompletion(sName, false); 
                row.classList.remove('opacity-50'); input.classList.remove('line-through', 'text-zinc-500'); cb.removeAttribute('checked'); checkIcon.classList.add('opacity-0', 'scale-50');
            }
            document.getElementById('bp-display').innerText = batPoints; updateNeuronUI(); saveData();
            
            if(!document.getElementById('progress-view').classList.contains('hidden-view')) updateProgressUI();
        }

        function deleteTask(btn) {
            const row = btn.closest('.task-row'); const cb = row.querySelector('input[type="checkbox"]');
            if(cb.checked) { 
                const sectorDiv = cb.closest('.bat-panel');
                const diff = parseInt(sectorDiv.dataset.difficulty) || 1;
                const xpMap = { 1: 20, 2: 50, 3: 150, 4: 200 };
                const dynamicExp = xpMap[diff] || 50;

                batPoints = Math.max(0, batPoints - 10); 
                totalExp = Math.max(0, totalExp - dynamicExp);
                
                const sName = sectorDiv.querySelector('.sector-title-input') ? sectorDiv.querySelector('.sector-title-input').value : "UNASSIGNED";
                logTaskCompletion(sName, false);
                document.getElementById('bp-display').innerText = batPoints; updateNeuronUI(); 
            }
            row.classList.add('deleting'); setTimeout(() => { row.remove(); saveData(); }, 300);
        }
        
        function deleteSector(sectorId) { const el = document.getElementById(sectorId); el.style.opacity = '0'; el.style.transform = 'scale(0.95)'; setTimeout(() => { el.remove(); saveData(); }, 300); }
        
        function autoResetSector(containerId) {
            document.getElementById(containerId).querySelectorAll('.task-row').forEach(row => { 
                const cb = row.querySelector('input[type="checkbox"]');
                const input = row.querySelector('input[type="text"]');
                const icon = row.querySelector('svg');
                if (cb.checked) {
                    cb.checked = false; cb.removeAttribute('checked');
                    row.classList.remove('opacity-50'); input.classList.remove('line-through', 'text-zinc-500'); icon.classList.add('opacity-0', 'scale-50');
                }
            });
            saveData();
        }
        
        function attachEventListeners() { document.querySelectorAll('input[type="text"]').forEach(input => { input.addEventListener('change', function() { this.setAttribute('value', escapeHTML(this.value)); saveData(); }); }); }

        // --- FOCUS MODULE LOGIC ---
        let focusTimer; let timeLeft = 25 * 60; let isRunning = false; let loggedMins = 0;
        const display = document.getElementById('timer-display'); 
        const mInput = document.getElementById('timer-input-m'); 
        const startBtn = document.getElementById('btn-start'); 
        const distractBtn = document.getElementById('btn-distract');
        
        function updateDisplay() { 
            const m = Math.floor(timeLeft / 60); const s = timeLeft % 60; 
            display.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; 
        }
        
        function editTimer() {
            if(isRunning) return;
            display.classList.add('hidden'); mInput.classList.remove('hidden'); mInput.value = Math.floor(timeLeft / 60); mInput.focus();
            mInput.onblur = () => { let val = parseInt(mInput.value); if(isNaN(val) || val < 1) val = 25; if(val > 120) val = 120; timeLeft = val * 60; loggedMins = val; mInput.classList.add('hidden'); display.classList.remove('hidden'); updateDisplay(); document.getElementById('focus-status').innerText = `Set for ${val} minutes.`; };
            mInput.onkeypress = (e) => { if(e.key === 'Enter') mInput.blur(); };
        }
        
        function toggleTimer() {
            if(isRunning) { 
                clearInterval(focusTimer); 
                startBtn.innerText = 'Resume Glide'; 
                startBtn.classList.replace('bg-red-900', 'bg-red-600'); 
                distractBtn.classList.add('hidden');
                document.getElementById('focus-status').innerText = "Glide Suspended."; 
                document.getElementById('focus-glow').classList.remove('bg-red-900/20'); 
            } 
            else {
                if(loggedMins === 0) loggedMins = Math.floor(timeLeft / 60); 
                startBtn.innerText = 'Pause Glide'; 
                startBtn.classList.replace('bg-red-600', 'bg-red-900'); 
                distractBtn.classList.remove('hidden');
                document.getElementById('focus-status').innerText = "Glide Active. Do not leave the terminal."; 
                document.getElementById('focus-glow').classList.add('bg-red-900/20'); 
                focusTimer = setInterval(() => { timeLeft--; updateDisplay(); if(timeLeft <= 0) completeTimer(); }, 1000);
            }
            isRunning = !isRunning;
        }
        
        function resetTimer() { 
            clearInterval(focusTimer); 
            isRunning = false; 
            timeLeft = 25 * 60; 
            loggedMins = 25; 
            currentDistractions = 0;
            updateDisplay(); 
            startBtn.innerText = 'Engage'; 
            startBtn.classList.replace('bg-red-900', 'bg-red-600'); 
            distractBtn.classList.add('hidden');
            document.getElementById('focus-status').innerText = "System Ready. Click time to edit."; 
            document.getElementById('focus-glow').classList.remove('bg-red-900/20'); 
        }

        function logDistraction() {
            currentDistractions++;
            document.getElementById('focus-status').innerText = `Distractions Logged: ${currentDistractions}`;
        }

        function renderHistory() {
            const list = document.getElementById('focus-history-list');
            if (sessionHistory.length === 0) {
                list.innerHTML = `<li>No missions completed yet.</li>`;
                return;
            }
            list.innerHTML = sessionHistory.map(item => `<li>[COMPLETED] ${item.duration} MIN SESSION - ${item.distractions} DISTRACTIONS</li>`).join('');
        }

        function clearFocusHistory() {
            sessionHistory = [];
            localStorage.setItem('focusHistory', JSON.stringify([]));
            renderHistory();
        }
        
        function completeTimer() { 
            clearInterval(focusTimer); 
            isRunning = false; 
            
            sessionHistory.push({ duration: loggedMins, distractions: currentDistractions });
            
            pomodoroStreak++;
            let earnedXP = 70;
            if (pomodoroStreak >= 3) { earnedXP *= 2; }
            
            localStorage.setItem('pomodoroStreak', pomodoroStreak);
            localStorage.setItem('focusHistory', JSON.stringify(sessionHistory));
            renderHistory();

            document.getElementById('focus-status').innerText = `MISSION ACCOMPLISHED. +50 BP / +${earnedXP} EXP`; 
            startBtn.innerText = 'Engage'; 
            distractBtn.classList.add('hidden');
            document.getElementById('focus-glow').classList.replace('bg-red-900/20', 'bg-green-900/20'); 
            
            batPoints += 50; totalExp += earnedXP; 
            document.getElementById('bp-display').innerText = batPoints; 
            
            const today = getTodayString();
            if(!progressData.history[today]) progressData.history[today] = { total: 0, sectors: {}, focusMins: 0 };
            progressData.history[today].focusMins += loggedMins;
            saveData(); 
            updateNeuronUI(); 
            setTimeout(resetTimer, 5000); 
        }
        
        function failTimer() { 
            clearInterval(focusTimer); 
            isRunning = false; 
            
            document.getElementById('system-failure-overlay').style.opacity = '1';
            document.body.style.filter = 'grayscale(1) invert(0.1)';
            setTimeout(() => {
                document.getElementById('system-failure-overlay').style.opacity = '0';
                document.body.style.filter = 'none';
            }, 2000);

            pomodoroStreak = 0;
            localStorage.setItem('pomodoroStreak', pomodoroStreak);

            document.getElementById('focus-status').innerText = "GLIDE FAILED. TERMINAL ABANDONED."; 
            document.getElementById('focus-status').classList.add('text-red-500'); 
            startBtn.innerText = 'Engage'; 
            startBtn.classList.replace('bg-red-900', 'bg-red-600'); 
            distractBtn.classList.add('hidden');
            document.getElementById('focus-glow').classList.remove('bg-red-900/20'); 
        }
        
        document.addEventListener('visibilitychange', () => { if(document.hidden && isRunning) failTimer(); });

        // --- UPGRADED NEURAL NETWORK ENGINE ---
        function resizeCanvas() { if(!canvas) return; const container = canvas.parentElement; canvas.width = container.clientWidth; canvas.height = container.clientHeight; }
        
        function buildNeuronNetwork() {
            if(!ctx) return; const stats = calculateLevelStats(); const level = stats.level;
            neuronBranches = []; nodeCount = 0;
            const maxDepth = Math.min(2 + Math.floor(level / 2), 7); 
            const numTrunks = Math.min(4 + Math.floor(level / 3), 8); 
            const centerX = canvas.width / 2; const centerY = canvas.height / 2;
            for(let i=0; i<numTrunks; i++) {
                let angle = (Math.PI * 2 / numTrunks) * i; 
                let length = 40 + (level * 2); if (length > 120) length = 120;
                generateBranch(centerX, centerY, angle, length, maxDepth, maxDepth);
            }
            document.getElementById('synapse-count').innerText = `${nodeCount} Nodes`;
            document.getElementById('scale-factor').innerText = `${(1 + (level*0.15)).toFixed(2)}x Growth`;
            if(animationFrameId) cancelAnimationFrame(animationFrameId); renderNeuronLoop();
        }
        
        function generateBranch(x, y, angle, length, depth, maxDepth) {
            if(depth === 0) return; 
            
            const endX = x + Math.cos(angle) * length; 
            const endY = y + Math.sin(angle) * length; 
            nodeCount++;
            
            const cpX = x + Math.cos(angle + (Math.random() * 0.6 - 0.3)) * (length * 0.5);
            const cpY = y + Math.sin(angle + (Math.random() * 0.6 - 0.3)) * (length * 0.5);

            neuronBranches.push({ 
                x1: x, y1: y, 
                cx: cpX, cy: cpY,
                x2: endX, y2: endY, 
                depth: depth, 
                maxDepth: maxDepth, 
                pulseOffset: Math.random() * Math.PI * 2 
            });
            
            let spread = 0.4 + (Math.sin(depth) * 0.15); 
            generateBranch(endX, endY, angle - spread, length * 0.75, depth - 1, maxDepth);
            generateBranch(endX, endY, angle + spread, length * 0.75, depth - 1, maxDepth);
            
            if (depth % 2 !== 0 && depth > 2) {
                generateBranch(endX, endY, angle + (Math.random() * 0.2 - 0.1), length * 0.8, depth - 1, maxDepth);
            }
        }
        
        function renderNeuronLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            const time = Date.now() * 0.001; 
            
            neuronBranches.forEach(b => {
                ctx.lineWidth = Math.max(0.8, b.depth * 1.2); 
                let alpha = 0.5 + (Math.sin(time * 2 + b.pulseOffset) * 0.3); 
                ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`; 
                
                ctx.beginPath(); 
                ctx.moveTo(b.x1, b.y1); 
                ctx.quadraticCurveTo(b.cx, b.cy, b.x2, b.y2);
                ctx.stroke();

                let progress = ((time * 0.6) + b.pulseOffset) % 1; 
                let px = (1-progress)*(1-progress)*b.x1 + 2*(1-progress)*progress*b.cx + progress*progress*b.x2;
                let py = (1-progress)*(1-progress)*b.y1 + 2*(1-progress)*progress*b.cy + progress*progress*b.y2;
                
                ctx.beginPath(); 
                ctx.arc(px, py, 1.5 + (b.depth * 0.2), 0, Math.PI * 2); 
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
                ctx.shadowBlur = 8; 
                ctx.shadowColor = "#ffffff"; 
                ctx.fill(); 
                ctx.shadowBlur = 0;
            });

            const centerX = canvas.width / 2; 
            const centerY = canvas.height / 2; 
            let corePulse = 12 + (Math.sin(time * 4) * 3); 
            
            ctx.beginPath(); 
            ctx.arc(centerX, centerY, corePulse, 0, Math.PI * 2);
            let grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, corePulse);
            grad.addColorStop(0, "rgba(255, 255, 255, 1)"); 
            grad.addColorStop(0.2, "rgba(239, 68, 68, 1)"); 
            grad.addColorStop(1, "rgba(153, 27, 27, 0.4)");
            ctx.fillStyle = grad; 
            ctx.shadowBlur = 40 + (Math.sin(time * 4) * 15); 
            ctx.shadowColor = "#ef4444"; 
            ctx.fill(); 
            ctx.shadowBlur = 0;
            
            animationFrameId = requestAnimationFrame(renderNeuronLoop);
        }
        
        function updateNeuronUI() {
            const stats = calculateLevelStats();
            const lvlText = document.getElementById('hud-level'); const expText = document.getElementById('hud-exp-text'); const barFill = document.getElementById('exp-bar-fill');
            if(lvlText) lvlText.innerText = `LVL ${stats.level}`;
            if(expText) expText.innerText = `${stats.expInCurrentLevel} / ${stats.expForNextLevel} EXP`;
            let percentage = (stats.expInCurrentLevel / stats.expForNextLevel) * 100; if(barFill) barFill.style.width = `${percentage}%`;
            
            const bgContainer = document.getElementById('avatar-neural-bg-container');
            if (bgContainer) {
                let scaleVal = 1 + (stats.level * 0.05); if (scaleVal > 1.8) scaleVal = 1.8;
                let opacVal = 0.4 + (stats.level * 0.1); if (opacVal > 1) opacVal = 1;
                bgContainer.style.transform = `scale(${scaleVal})`; bgContainer.style.opacity = opacVal;
            }
            if(!document.getElementById('neural-view').classList.contains('hidden-view')) buildNeuronNetwork();
        }

        // --- BACKGROUND WEATHER ---
        function initThreeJS() {
            const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x050505, 0.002);
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('3d-canvas'), alpha: true}); renderer.setSize(window.innerWidth, window.innerHeight);
            const rainCount = 1500; const rainGeo = new THREE.BufferGeometry(); const rainArray = new Float32Array(rainCount * 3);
            for(let i=0; i<rainCount*3; i+=3) { rainArray[i] = Math.random() * 400 - 200; rainArray[i+1] = Math.random() * 500 - 250; rainArray[i+2] = Math.random() * 400 - 200; }
            rainGeo.setAttribute('position', new THREE.BufferAttribute(rainArray, 3));
            const rainMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.1, transparent: true, opacity: 0.6 });
            const rain = new THREE.Points(rainGeo, rainMaterial); scene.add(rain); camera.position.z = 1; camera.rotation.x = Math.PI / 2; 
            window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
            function animateRain() { requestAnimationFrame(animateRain); const positions = rainGeo.attributes.position.array; const speed = 1 + (batPoints * 0.005); for(let i=1; i<rainCount*3; i+=3) { positions[i] -= speed; if(positions[i] < -200) positions[i] = 200; } rainGeo.attributes.position.needsUpdate = true; renderer.render(scene, camera); }
            animateRain();
        }