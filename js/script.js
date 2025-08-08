document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONFIG ---
    let state = { 
        currentPage: 'login', 
        currentAppScreen: 'profile',
        onboardingStep: 0, 
        player: null,
        currentQuestTab: 'daily'
    };
    const pages = { 
        login: document.getElementById('page-login'), 
        popup: document.getElementById('page-universal-popup'), 
        onboarding: document.getElementById('page-onboarding'), 
        app: document.getElementById('page-app') 
    };
    const appScreenContainer = pages.app.querySelector('.page-content');
    const popupBox = document.getElementById('popup-box');
    
    // --- TEMPLATES ---
    const onboardingSteps = [
        { title: 'Create Your Profile', content: `<div><label for="name" class="block mb-1 text-sm">Name</label><input type="text" id="name" class="form-input w-full p-2 rounded-sm" placeholder="Player_01"></div><div class="grid grid-cols-2 gap-4 mt-4"><div><label for="age" class="block mb-1 text-sm">Age</label><input type="number" id="age" class="form-input w-full p-2 rounded-sm" placeholder="25"></div><div><label for="weight" class="block mb-1 text-sm">Weight (kg)</label><input type="number" id="weight" class="form-input w-full p-2 rounded-sm" placeholder="75"></div></div>` },
        { title: 'Choose Your Path', content: `<div class="space-y-3"><div class="class-card p-3 rounded-lg" data-class="Assassin"><h3 class="font-bold text-lg"><i class="fas fa-running mr-2"></i>Assassin</h3><p class="text-sm text-gray-400">Focus on agility and HIIT.</p></div><div class="class-card p-3 rounded-lg" data-class="Tank"><h3 class="font-bold text-lg"><i class="fas fa-shield-alt mr-2"></i>Tank</h3><p class="text-sm text-gray-400">Focus on strength and endurance.</p></div><div class="class-card p-3 rounded-lg" data-class="Mage"><h3 class="font-bold text-lg"><i class="fas fa-brain mr-2"></i>Mage</h3><p class="text-sm text-gray-400">Focus on flexibility and skill.</p></div></div>` },
        { title: 'Assess Your Power', content: `<p class="text-center text-sm text-gray-400 -mt-2 mb-4">Enter your max reps in a single set.</p><div class="space-y-2"><div><label for="pushups" class="block mb-1 text-sm">Push-ups</label><input type="number" id="pushups" class="form-input w-full p-2 rounded-sm" placeholder="10"></div><div><label for="situps" class="block mb-1 text-sm">Sit-ups</label><input type="number" id="situps" class="form-input w-full p-2 rounded-sm" placeholder="20"></div><div><label for="squats" class="block mb-1 text-sm">Squats</label><input type="number" id="squats" class="form-input w-full p-2 rounded-sm" placeholder="25"></div><div><label for="run" class="block mb-1 text-sm">Max Run (km)</label><input type="number" id="run" class="form-input w-full p-2 rounded-sm" placeholder="2"></div></div>` }
    ];
     const shopItems = [
        { id: 'xp_boost', name: 'XP Boost', icon: 'fa-flask-potion', color: 'text-purple-400', desc: 'Doubles XP from your next workout.', price: 500 },
        { id: 'dungeon_key', name: 'Dungeon Key', icon: 'fa-key', color: 'text-yellow-400', desc: 'Unlocks a random special quest.', price: 1000 },
        { id: 'monarch_theme', name: 'Monarch Theme', icon: 'fa-palette', color: 'text-indigo-400', desc: 'Unlock the purple UI theme.', price: 5000 },
    ];
    
    // --- FUNCTIONS ---
    function createNewPlayerState() {
        return { 
            name: 'Player_01', level: 1, xp: 0, gold: 1000, statPoints: 0,
            xpForNextLevel: 100,
            class: 'None', 
            stats: { str: 10, agi: 10, sta: 10, int: 10 }, 
            baseline: { pushups: 15, situps: 20, squats: 25, run: 2 },
            inventory: {}
        };
    }

    function switchPage(pageName) {
        state.currentPage = pageName;
        Object.keys(pages).forEach(key => pages[key].classList.toggle('active', key === pageName));
    }
    
    function showModal(content, onConfirm) {
        document.getElementById('universal-popup-content').innerHTML = content;
        switchPage('popup');

        const confirmButton = document.getElementById('popup-confirm');
        if (confirmButton && onConfirm) {
            confirmButton.onclick = () => {
                switchPage('app');
                onConfirm();
            };
        }

        const closeButton = document.getElementById('popup-close');
        if (closeButton) {
            closeButton.onclick = () => switchPage('app');
        }
    }

    function showAutoPopup(content, duration = 2000) {
        return new Promise(resolve => {
            document.getElementById('universal-popup-content').innerHTML = content;
            switchPage('popup');
            
            setTimeout(() => {
                popupBox.style.opacity = '0';
                popupBox.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    popupBox.style.opacity = '1';
                    popupBox.style.transform = 'translateY(0)';
                    resolve();
                }, 500);
            }, duration);
        });
    }

     function showPopup(content) {
        return new Promise(resolve => {
            document.getElementById('universal-popup-content').innerHTML = content;
            switchPage('popup');
            
            const okButton = document.getElementById('popup-ok');
            if (okButton) {
                okButton.onclick = () => {
                    popupBox.style.opacity = '0';
                    popupBox.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        popupBox.style.opacity = '1';
                        popupBox.style.transform = 'translateY(0)';
                        resolve();
                    }, 500);
                };
            }
        });
    }
    
    function renderAppScreen() {
        let content = '';
        if (state.currentAppScreen === 'profile') content = getProfileHTML();
        if (state.currentAppScreen === 'shop') content = getShopHTML();
        if (state.currentAppScreen === 'inventory') content = getInventoryHTML();
        if (state.currentAppScreen === 'quests') content = getQuestsHTML();
        appScreenContainer.innerHTML = content;
        
        if (state.currentAppScreen === 'profile') {
            updateDashboardUI();
            generateQuests();
            startCountdown();
        } else if (state.currentAppScreen === 'shop') {
            updateShopUI();
        } else if (state.currentAppScreen === 'inventory') {
            updateInventoryUI();
        } else if (state.currentAppScreen === 'quests') {
            updateQuestsUI();
        }
    }
    
    function getProfileHTML() {
        return `<div class="w-full max-w-lg mx-auto space-y-6">
            <div class="box-bg p-4 rounded-lg text-center"><h1 class="text-2xl font-bold text-glow-purple">Project: Ascend</h1><p class="text-sm text-gray-400">System Interface</p></div>
            <div class="box-bg p-4 rounded-lg">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center border-2 border-purple-500"><i class="fa-solid fa-user-secret text-3xl text-purple-400"></i></div>
                    <div><h2 id="player-name" class="text-xl font-bold text-white"></h2><p id="player-title" class="text-blue-400 text-glow-blue"></p></div>
                </div>
                <div class="mt-4">
                    <div class="flex justify-between text-sm mb-1"><span class="font-semibold" id="level-text"></span><span id="xp-text" class="text-gray-400"></span></div>
                    <div class="w-full progress-bar-bg rounded-full h-2.5"><div id="xp-bar" class="progress-bar-fill h-2.5 rounded-full"></div></div>
                </div>
            </div>
            <div class="box-bg p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-3 border-b border-gray-700 pb-2 text-glow-blue flex justify-between"><span>Player Stats</span><span id="stat-points-display" class="hidden">Points: <span id="stat-points-value"></span></span></h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center"><span class="font-medium"><i class="fa-solid fa-dumbbell mr-2 text-red-400"></i>Strength</span><div class="flex items-center space-x-3"><span id="stat-str" class="font-bold text-lg"></span><button data-stat="str" class="btn-plus w-7 h-7 rounded-md text-white"><i class="fa-solid fa-plus"></i></button></div></div>
                    <div class="flex justify-between items-center"><span class="font-medium"><i class="fa-solid fa-person-running mr-2 text-green-400"></i>Agility</span><div class="flex items-center space-x-3"><span id="stat-agi" class="font-bold text-lg"></span><button data-stat="agi" class="btn-plus w-7 h-7 rounded-md text-white"><i class="fa-solid fa-plus"></i></button></div></div>
                    <div class="flex justify-between items-center"><span class="font-medium"><i class="fa-solid fa-heart-pulse mr-2 text-yellow-400"></i>Stamina</span><div class="flex items-center space-x-3"><span id="stat-sta" class="font-bold text-lg"></span><button data-stat="sta" class="btn-plus w-7 h-7 rounded-md text-white"><i class="fa-solid fa-plus"></i></button></div></div>
                    <div class="flex justify-between items-center"><span class="font-medium"><i class="fa-solid fa-brain mr-2 text-blue-400"></i>Intelligence</span><div class="flex items-center space-x-3"><span id="stat-int" class="font-bold text-lg"></span><button data-stat="int" class="btn-plus w-7 h-7 rounded-md text-white"><i class="fa-solid fa-plus"></i></button></div></div>
                </div>
            </div>
            <div class="box-bg p-4 rounded-lg">
                <div class="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                    <h3 class="text-lg font-semibold text-glow-blue">Daily Quests</h3>
                    <div class="text-right">
                        <p class="text-xs text-gray-400">Time until reset</p>
                        <p id="countdown-timer" class="font-orbitron text-red-400 text-glow-red">23:59:59</p>
                    </div>
                </div>
                <div id="quest-list" class="space-y-3"></div>
                <p class="text-yellow-400 text-sm mt-4 text-center"><i class="fas fa-exclamation-triangle mr-2"></i>Failure to complete will result in a penalty.</p>
                <div id="claim-container" class="mt-4 hidden"><button id="claim-button" class="btn-claim w-full font-bold py-2 rounded-md">Claim Reward</button></div>
            </div>
        </div>`;
    }

    function getShopHTML() {
        const itemsHTML = shopItems.map(item => `
            <div class="item-card rounded-lg p-3 text-center flex flex-col box-bg">
                <div class="text-5xl ${item.color} my-3"><i class="fas ${item.icon}"></i></div>
                <h3 class="font-semibold text-white">${item.name}</h3>
                <p class="text-xs text-gray-400 flex-grow">${item.desc}</p>
                <button data-item-id="${item.id}" class="btn-purchase w-full font-bold py-2 mt-3 rounded-md">
                    <i class="fas fa-coins mr-1"></i> ${item.price}
                </button>
            </div>`).join('');

        return `<div class="w-full max-w-lg mx-auto space-y-4">
            <div class="box-bg p-4 rounded-lg text-center"><h1 class="text-2xl font-bold text-glow-purple">SHOP</h1></div>
            <div class="box-bg p-3 rounded-lg flex justify-between items-center">
                <span class="font-semibold text-lg">Your Balance:</span>
                <span id="gold-balance" class="font-bold text-2xl text-yellow-400"></span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">${itemsHTML}</div>
        </div>`;
    }

    function getInventoryHTML() {
        let itemsHTML = '';
        const playerItems = Object.keys(state.player.inventory);

        if (playerItems.length === 0) {
            itemsHTML = `<p class="text-center text-gray-400 col-span-full">Your inventory is empty.</p>`;
        } else {
            itemsHTML = playerItems.map(itemId => {
                const item = shopItems.find(i => i.id === itemId);
                const quantity = state.player.inventory[itemId];
                if (!item) return '';
                const sellPrice = Math.floor(item.price / 2);

                return `<div class="item-card rounded-lg p-3 text-center flex flex-col box-bg">
                    <div class="text-5xl ${item.color} my-3"><i class="fas ${item.icon}"></i></div>
                    <h3 class="font-semibold text-white">${item.name}</h3>
                    <p class="text-xs text-gray-400 flex-grow">Quantity: ${quantity}</p>
                    <button data-item-id="${item.id}" class="btn-sell w-full font-bold py-2 mt-3 rounded-md">
                        SELL (<i class="fas fa-coins mr-1"></i> ${sellPrice})
                    </button>
                </div>`;
            }).join('');
        }

        return `<div class="w-full max-w-lg mx-auto space-y-4">
            <div class="box-bg p-4 rounded-lg text-center"><h1 class="text-2xl font-bold text-glow-purple">INVENTORY</h1></div>
             <div class="box-bg p-3 rounded-lg flex justify-between items-center">
                <span class="font-semibold text-lg">Your Balance:</span>
                <span id="gold-balance-inv" class="font-bold text-2xl text-yellow-400"></span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">${itemsHTML}</div>
        </div>`;
    }

    function getQuestsHTML() {
        return `<div class="w-full max-w-lg mx-auto space-y-4">
            <div class="box-bg p-4 rounded-lg text-center"><h1 class="text-2xl font-bold text-glow-purple">QUESTS</h1></div>
            <div class="box-bg p-2 rounded-lg flex justify-around">
                <button data-tab="daily" class="quest-tab active flex-1 py-2 font-semibold">Daily</button>
                <button data-tab="weekly" class="quest-tab flex-1 py-2 font-semibold">Weekly</button>
                <button data-tab="main" class="quest-tab flex-1 py-2 font-semibold">Main</button>
            </div>
            <div id="quest-list-detailed" class="space-y-3"></div>
        </div>`;
    }

    function updateDashboardUI() {
        const p = state.player;
        document.getElementById('player-name').textContent = p.name;
        document.getElementById('player-title').textContent = `[${p.class}]`;
        document.getElementById('level-text').textContent = `LEVEL ${p.level}`;
        document.getElementById('xp-text').textContent = `XP: ${p.xp} / ${p.xpForNextLevel}`;
        document.getElementById('xp-bar').style.width = `${(p.xp / p.xpForNextLevel) * 100}%`;
        
        Object.keys(p.stats).forEach(key => {
            document.getElementById(`stat-${key}`).textContent = p.stats[key];
        });

        const statPointsDisplay = document.getElementById('stat-points-display');
        document.getElementById('stat-points-value').textContent = p.statPoints;
        statPointsDisplay.classList.toggle('hidden', p.statPoints <= 0);
        
        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.disabled = p.statPoints <= 0;
            btn.onclick = handleStatIncrease;
        });
    }

    function updateShopUI() {
        appScreenContainer.querySelector('#gold-balance').innerHTML = `<i class="fas fa-coins mr-2"></i>${state.player.gold} G`;
        appScreenContainer.querySelectorAll('.btn-purchase').forEach(btn => btn.onclick = handlePurchase);
    }
    
    function updateInventoryUI() {
        appScreenContainer.querySelector('#gold-balance-inv').innerHTML = `<i class="fas fa-coins mr-2"></i>${state.player.gold} G`;
        appScreenContainer.querySelectorAll('.btn-sell').forEach(btn => btn.onclick = handleSell);
    }
    
    function updateQuestsUI() {
        const questList = appScreenContainer.querySelector('#quest-list-detailed');
        let content = '';
        if (state.currentQuestTab === 'daily') {
            content = `<div class="quest-card rounded-lg p-4">
                <h3 class="font-semibold text-lg text-white">Daily Training</h3>
                <p class="text-sm text-gray-400 mb-3">Complete your required physical conditioning.</p>
                <p class="text-gray-300 text-sm">View on Profile tab.</p>
            </div>`;
        } else if (state.currentQuestTab === 'weekly') {
             content = `<div class="quest-card rounded-lg p-4">
                <h3 class="font-semibold text-lg text-white">Weekly Consistency</h3>
                <p class="text-sm text-gray-400 mb-3">Complete Daily Quests 5 times this week.</p>
                <div class="w-full progress-bar-bg rounded-full h-2.5"><div class="bg-blue-500 h-2.5 rounded-full" style="width: 40%"></div></div>
                <div class="border-t border-gray-600 mt-3 pt-3 flex justify-between items-center">
                    <div class="text-sm"><span class="font-semibold text-yellow-400">Rewards: </span>1 Dungeon Key</div>
                    <button class="btn-claim font-bold py-1 px-4 rounded-md" disabled>Claim</button>
                </div>
            </div>`;
        } else if (state.currentQuestTab === 'main') {
             content = `<div class="quest-card rounded-lg p-4">
                <h3 class="font-semibold text-lg text-white">The First Step</h3>
                <p class="text-sm text-gray-400 mb-3">Reach Level 5.</p>
                <div class="w-full progress-bar-bg rounded-full h-2.5"><div class="bg-blue-500 h-2.5 rounded-full" style="width: ${ (state.player.level / 5) * 100 }% "></div></div>
                <div class="border-t border-gray-600 mt-3 pt-3 flex justify-between items-center">
                    <div class="text-sm"><span class="font-semibold text-yellow-400">Rewards: </span>500 XP, 250 G</div>
                    <button id="claim-level-5" class="btn-claim font-bold py-1 px-4 rounded-md" ${state.player.level < 5 ? 'disabled' : ''}>Claim</button>
                </div>
            </div>`;
        }
        questList.innerHTML = content;

        const claimLevel5Btn = document.getElementById('claim-level-5');
        if (claimLevel5Btn) {
            claimLevel5Btn.onclick = async () => {
                await addXp(500);
                state.player.gold += 250;
                await showAutoPopup(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4">Rewards Claimed</h2><p class="text-xl">You received 500 XP and 250 Gold.</p>`, 2000);
                switchPage('app');
                renderAppScreen();
            };
        }

        appScreenContainer.querySelectorAll('.quest-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === state.currentQuestTab);
            tab.onclick = (e) => {
                state.currentQuestTab = e.currentTarget.dataset.tab;
                updateQuestsUI();
            };
        });
    }

    function generateQuests() {
        const questList = document.getElementById('quest-list');
        const goals = {
            pushups: Math.max(10, Math.ceil(state.player.baseline.pushups) || 10),
            situps: Math.max(10, Math.ceil(state.player.baseline.situps) || 15),
            squats: Math.max(10, Math.ceil(state.player.baseline.squats) || 15),
            run: Math.max(1, Math.ceil(state.player.baseline.run) || 1)
        };
        questList.innerHTML = `
            <div class="flex items-center space-x-3 quest-item"><input type="checkbox" class="quest-checkbox"><label class="flex-1">Push-ups [ 0 / ${goals.pushups} ]</label></div>
            <div class="flex items-center space-x-3 quest-item"><input type="checkbox" class="quest-checkbox"><label class="flex-1">Sit-ups [ 0 / ${goals.situps} ]</label></div>
            <div class="flex items-center space-x-3 quest-item"><input type="checkbox" class="quest-checkbox"><label class="flex-1">Squats [ 0 / ${goals.squats} ]</label></div>
            <div class="flex items-center space-x-3 quest-item"><input type="checkbox" class="quest-checkbox"><label class="flex-1">Run [ 0 / ${goals.run}km ]</label></div>`;
        
        questList.querySelectorAll('.quest-checkbox').forEach(cb => cb.addEventListener('change', checkQuestsCompletion));
        document.getElementById('claim-container').classList.add('hidden');
        document.getElementById('claim-button').disabled = true;
        document.getElementById('claim-button').onclick = handleClaim;
    }
    
    function checkQuestsCompletion() {
        const allChecked = [...document.querySelectorAll('#quest-list .quest-checkbox')].every(cb => cb.checked);
        if (allChecked) {
            document.getElementById('claim-container').classList.remove('hidden');
            document.getElementById('claim-button').disabled = false;
        }
    }

    async function addXp(amount) {
        state.player.xp += amount;
        let leveledUp = false;
        while (state.player.xp >= state.player.xpForNextLevel) {
            leveledUp = true;
            state.player.level++;
            state.player.xp -= state.player.xpForNextLevel;
            state.player.xpForNextLevel = Math.floor(state.player.xpForNextLevel * 1.2);
            state.player.statPoints += 5;
        }
        if (leveledUp) {
            const levelUpPopupContent = `<h2 class="font-garamond text-2xl text-glow-subtle mb-4">LEVEL UP!</h2><p class="text-xl mb-6">You have reached Level ${state.player.level}.</p><p>You have gained 5 Stat Points.</p><button id="popup-ok" class="btn-system font-bold py-2 px-12 rounded-sm text-lg mt-6">OK</button>`;
            await showPopup(levelUpPopupContent);
        }
        if (state.currentAppScreen === 'profile') {
            updateDashboardUI();
        }
    }

    function startCountdown() {
        const timerEl = document.getElementById('countdown-timer');
        let time = 24 * 60 * 60; // 24 hours in seconds
        setInterval(() => {
            time--;
            const hours = Math.floor(time / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
            const seconds = (time % 60).toString().padStart(2, '0');
            if(timerEl) timerEl.textContent = `${hours}:${minutes}:${seconds}`;
            if (time <= 0) {
                time = 24 * 60 * 60; // Reset timer
                generateQuests(); // Reset quests
            }
        }, 1000);
    }

    // --- EVENT HANDLERS ---
    async function handleClaim() {
        state.player.gold += 100;
        await showAutoPopup(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4">Rewards Claimed</h2><p class="text-xl">You received 150 XP and 100 Gold.</p>`, 2000);
        await addXp(150); // Add XP after showing the reward popup
        switchPage('app');
        generateQuests();
    }

    function handleStatIncrease(e) {
        const stat = e.currentTarget.dataset.stat;
        if (state.player.statPoints > 0) {
            state.player.statPoints--;
            state.player.stats[stat]++;
            updateDashboardUI();
        }
    }
    
    async function initializeApp() {
        state.player = createNewPlayerState();
        await showPopup(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4"><i class="fas fa-exclamation-circle mr-2"></i>Alert</h2><p class="text-xl mb-8 font-semibold text-white">[ Welcome, player. ]</p><button id="popup-ok" class="btn-system font-bold py-2 px-12 rounded-sm text-lg">OK</button>`);
        switchPage('onboarding');
        renderOnboardingStep();
    }

    function renderOnboardingStep() {
        const step = onboardingSteps[state.onboardingStep];
        document.getElementById('onboarding-content').innerHTML = `<h2 class="font-garamond text-2xl text-glow-subtle mb-4 text-center">${step.title}</h2>${step.content}`;
        if (state.onboardingStep === 1) {
            document.querySelectorAll('.class-card').forEach(card => card.addEventListener('click', handleClassSelection));
        }
        document.getElementById('next-button').textContent = state.onboardingStep === onboardingSteps.length - 1 ? 'Begin' : 'Next';
    }

     document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form').classList.add('hidden'); document.getElementById('signup-form').classList.remove('hidden'); });
    document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signup-form').classList.add('hidden'); document.getElementById('login-form').classList.remove('hidden'); });

    document.getElementById('login-button').addEventListener('click', initializeApp);
    document.getElementById('signup-button').addEventListener('click', initializeApp);
    
    document.getElementById('next-button').addEventListener('click', async () => {
        if (state.onboardingStep === 2) {
            await showAutoPopup(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4"><i class="fas fa-scroll mr-2"></i>Notice</h2><p class="text-xl mb-8 font-semibold text-white">[ A Daily Quest has arrived. ]</p>`, 2500);
            switchPage('app');
            renderAppScreen();
        } else {
            state.onboardingStep++;
            renderOnboardingStep();
        }
    });

    function handleClassSelection(e) {
        document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        state.player.class = e.currentTarget.dataset.class;
    }

    function handlePurchase(e) {
        const itemId = e.currentTarget.dataset.itemId;
        const item = shopItems.find(i => i.id === itemId);
        if (!item) return;

        const onConfirm = () => {
            if (state.player.gold >= item.price) {
                state.player.gold -= item.price;
                state.player.inventory[item.id] = (state.player.inventory[item.id] || 0) + 1;
                showAutoPopup(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4">Purchase Successful</h2><p class="text-xl">You bought ${item.name}.</p>`, 2000).then(() => switchPage('app'));
                updateShopUI();
            } else {
                showAutoPopup(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4">Insufficient Funds</h2><p class="text-xl">You don't have enough Gold.</p>`, 2000).then(() => switchPage('app'));
            }
        };
        
        showModal(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4">Confirm Purchase</h2><p class="text-xl mb-6">Buy ${item.name} for ${item.price} G?</p><div class="flex justify-center space-x-4"><button id="popup-close" class="btn-system font-bold py-2 px-8 rounded-sm">Cancel</button><button id="popup-confirm" class="btn-purchase font-bold py-2 px-8 rounded-sm">Confirm</button></div>`, onConfirm);
    }

    function handleSell(e) {
        const itemId = e.currentTarget.dataset.itemId;
        const item = shopItems.find(i => i.id === itemId);
        if (!item) return;
        const sellPrice = Math.floor(item.price / 2);

        const onConfirm = () => {
            if (state.player.inventory[item.id] > 0) {
                state.player.inventory[item.id]--;
                if (state.player.inventory[item.id] === 0) {
                    delete state.player.inventory[item.id];
                }
                state.player.gold += sellPrice;
                showAutoPopup(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4">Item Sold</h2><p class="text-xl">You sold ${item.name} for ${sellPrice} G.</p>`, 2000).then(() => {
                    switchPage('app');
                    renderAppScreen();
                });
            }
        };

        showModal(`<h2 class="font-garamond text-2xl text-glow-subtle mb-4">Confirm Sale</h2><p class="text-xl mb-6">Sell ${item.name} for ${sellPrice} G?</p><div class="flex justify-center space-x-4"><button id="popup-close" class="btn-system font-bold py-2 px-8 rounded-sm">Cancel</button><button id="popup-confirm" class="btn-sell font-bold py-2 px-8 rounded-sm">Confirm</button></div>`, onConfirm);
    }
    
    pages.app.querySelectorAll('.nav-item').forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            pages.app.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.currentAppScreen = e.currentTarget.hash.substring(1);
            renderAppScreen();
        });
    });
});
