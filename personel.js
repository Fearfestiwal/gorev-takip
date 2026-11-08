        const DEFAULT_INIT_TEAM = [
            { id: 1, name: "Ahmet Can", role: "Şube Sorumlusu", title: "Şube Sorumlusu", department: "Şube Operasyon", phone: "05551234567", email: "ahmetcan@cancerez.com.tr", pin: "1978", status: "aktif" }
        ];
        const DEFAULT_INIT_TASKS = [
            {
                id: 1729000000001,
                title: "Günlük Çerez Reyon Düzeni ve Tazelik Kontrolü",
                action: "Sabah açılışında tüm kuruyemiş reyonlarının kontrol edilmesi ve etiketlerin düzenlenmesi.",
                desc: "Sabah açılışında tüm kuruyemiş reyonlarının kontrol edilmesi ve etiketlerin düzenlenmesi.",
                department: "Şube Operasyon",
                category: "Şube Operasyon",
                priority: "Yüksek",
                owner: "Ahmet Can",
                assignee: "Ahmet Can",
                dueDate: "2026-10-16",
                deadline: "2026-10-16",
                status: "Devam Ediyor",
                createdAt: "2026-10-16T08:00:00.000Z",
                branch: "Bornova - Özkanlar",
                recurrence: "daily",
                comments: [
                    {
                        id: "c_1",
                        author: "Yönetici",
                        role: "admin",
                        text: "Sabah açılışından önce taze kavrulmuş ürünlerin öne dizildiğinden ve reyon etiketlerinin güncel olduğundan emin olalım.",
                        createdAt: "2026-10-16T08:15:00.000Z"
                    }
                ]
            }
        ];

        function normalizeTask(t) {
            if (!t) return null;
            const owner = (t.owner || t.assignee || 'Ahmet Can').trim();
            const action = t.action || t.desc || t.title || 'Aksiyon belirtilmedi';
            const department = t.department || t.category || 'Şube Operasyon';
            const dueDate = t.dueDate || t.deadline || new Date().toISOString().split('T')[0];
            let status = t.status || 'Devam Ediyor';
            if (status === 'beklemede') status = 'Devam Ediyor';
            const branch = (t.branch || 'Merkez / Genel').trim();
            const recurrence = t.recurrence || 'none';
            const comments = Array.isArray(t.comments) ? t.comments : [];
            return {
                ...t,
                id: t.id || Date.now(),
                title: t.title || 'Görev',
                owner: owner,
                assignee: owner,
                action: action,
                desc: action,
                department: department,
                category: department,
                dueDate: dueDate,
                deadline: dueDate,
                status: status,
                priority: t.priority || 'Normal',
                branch: branch,
                recurrence: recurrence,
                comments: comments
            };
        }

        function normalizeTasks(arr) {
            if (!Array.isArray(arr)) return [];
            return arr.map(normalizeTask).filter(Boolean);
        }

        function getBranchBadgeHtml(branch) {
            const b = branch || 'Merkez / Genel';
            return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80"><i class="fa-solid fa-location-dot text-[9px] text-[#A6192E]"></i> ${escapeHtml(b)}</span>`;
        }

        function getRecurrenceBadgeHtml(recurrence) {
            if (!recurrence || recurrence === 'none') return '';
            let text = 'Rutin';
            if (recurrence === 'daily') text = 'Günlük Rutin';
            else if (recurrence === 'weekly') text = 'Haftalık Rutin';
            else if (recurrence === 'monthly') text = 'Aylık Rutin';
            return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200"><i class="fa-solid fa-arrows-rotate text-[9px]"></i> ${text}</span>`;
        }

        function getNextRecurrenceDate(currentDueDateStr, recurrenceType) {
            const baseDate = new Date(currentDueDateStr || Date.now());
            const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
            const nextDate = new Date(validBase);
            if (recurrenceType === 'daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (recurrenceType === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (recurrenceType === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            return nextDate.toISOString().split('T')[0];
        }

        function handleTaskRecurrenceOnComplete(task, actorRoleName) {
            if (!task.recurrence || task.recurrence === 'none') {
                task.status = 'Tamamlandı';
                return false;
            }

            const oldDueDate = task.dueDate;
            const nextDueDate = getNextRecurrenceDate(oldDueDate, task.recurrence);
            task.dueDate = nextDueDate;
            task.deadline = nextDueDate;
            task.status = 'Devam Ediyor';

            const recurrenceLabel = task.recurrence === 'daily' ? 'Günlük' : (task.recurrence === 'weekly' ? 'Haftalık' : 'Aylık');

            if (!Array.isArray(task.comments)) task.comments = [];
            task.comments.push({
                id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                author: actorRoleName || 'Personel',
                role: 'system',
                text: `🔄 [${recurrenceLabel} Rutin] Görev personel tarafından tamamlandı. Bir sonraki döneme ait yeni termin: ${formatTurkishDate(nextDueDate)} olarak yenilendi.`,
                createdAt: new Date().toISOString()
            });

            return true;
        }

        function getDeletedTaskIds() {
            try {
                return JSON.parse(localStorage.getItem('task_deleted_ids') || '[]');
            } catch(e) {
                return [];
            }
        }
        function addDeletedTaskId(id) {
            const deleted = getDeletedTaskIds();
            const idStr = String(id);
            if (!deleted.includes(idStr)) {
                deleted.push(idStr);
                localStorage.setItem('task_deleted_ids', JSON.stringify(deleted));
            }
        }

        function setLocalActionTimestamp() {
            const now = Date.now();
            lastLocalActionTime = now;
            localStorage.setItem('cancerez_last_local_action', String(now));
        }
        function isRecentLocalAction(thresholdMs = 6000) {
            const saved = parseInt(localStorage.getItem('cancerez_last_local_action') || '0', 10);
            return (Date.now() - saved) < thresholdMs;
        }

        const isStorageInitialized = localStorage.getItem('cancerez_storage_initialized') === 'true';
        const rawStoredTasks = localStorage.getItem('task_items');
        let tasks = [];

        if (rawStoredTasks !== null) {
            try {
                tasks = JSON.parse(rawStoredTasks) || [];
            } catch(e) {
                tasks = [];
            }
            const deletedIds = getDeletedTaskIds();
            tasks = tasks.filter(t => !deletedIds.includes(String(t.id)));
            tasks = normalizeTasks(tasks);
        } else if (!isStorageInitialized) {
            tasks = DEFAULT_INIT_TASKS;
            localStorage.setItem('task_items', JSON.stringify(tasks));
            localStorage.setItem('cancerez_storage_initialized', 'true');
        } else {
            tasks = [];
            localStorage.setItem('task_items', '[]');
        }

        const rawStoredTeam = localStorage.getItem('task_team_members');
        let team = [];
        if (rawStoredTeam !== null) {
            try {
                team = JSON.parse(rawStoredTeam) || [];
            } catch(e) {
                team = [];
            }
        } else if (!isStorageInitialized) {
            team = DEFAULT_INIT_TEAM;
            localStorage.setItem('task_team_members', JSON.stringify(team));
            localStorage.setItem('cancerez_storage_initialized', 'true');
        } else {
            team = [];
            localStorage.setItem('task_team_members', '[]');
        }

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            tasks = DEFAULT_INIT_TASKS;
            localStorage.setItem('task_items', JSON.stringify(tasks));
        }
        window.tasks = tasks;

        if (!team || !Array.isArray(team) || team.length === 0) {
            team = DEFAULT_INIT_TEAM;
            localStorage.setItem('task_team_members', JSON.stringify(team));
        }
        window.team = team;

        // ================= CAN ÇEREZ ŞUBELERİ & FABRİKA BİRİMLERİ (PERSONEL) =================
        const DEFAULT_BRANCHES = [
            "Bornova - Özkanlar",
            "Göztepe - Güzelyalı",
            "Konak - Çankaya",
            "Karşıyaka - Aksoy",
            "Aliağa",
            "Hatay Şube",
            "Hatay - Nokta (Hatay 2)",
            "Çankaya - Borsa",
            "Merkez / Genel"
        ];

        const DEFAULT_DEPARTMENTS = [
            "Üretim",
            "Lojistik",
            "Muhasebe",
            "Satınalma",
            "İnsan Kaynakları (İK)",
            "Ballıdede",
            "Genel Müdürlük",
            "Şube Operasyon"
        ];

        let branches = [];
        try {
            const rawStoredBranches = localStorage.getItem('task_branches');
            if (rawStoredBranches) {
                branches = JSON.parse(rawStoredBranches);
            }
        } catch(e) {
            branches = [];
        }
        if (!Array.isArray(branches) || branches.length === 0) {
            branches = [...DEFAULT_BRANCHES];
            localStorage.setItem('task_branches', JSON.stringify(branches));
        }
        window.branches = branches;

        let departments = [];
        try {
            const rawStoredDepartments = localStorage.getItem('task_departments');
            if (rawStoredDepartments) {
                departments = JSON.parse(rawStoredDepartments);
            }
        } catch(e) {
            departments = [];
        }
        if (!Array.isArray(departments) || departments.length === 0) {
            departments = [...DEFAULT_DEPARTMENTS];
            localStorage.setItem('task_departments', JSON.stringify(departments));
        }
        window.departments = departments;

        function refreshPersonelBranchSelect() {
            const sel = document.getElementById('selfRegBranch');
            if (!sel) return;
            const curVal = sel.value;
            const bList = window.branches || DEFAULT_BRANCHES;
            sel.innerHTML = bList.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
            if (curVal && bList.includes(curVal)) {
                sel.value = curVal;
            } else if (bList.length > 0) {
                sel.value = bList[0];
            }
        }

        let currentSelectedUser = localStorage.getItem('task_personel_selected_user') || '';

        const CLOUD_DB_URL = localStorage.getItem('cancerez_cloud_db_url') || "https://extendsclass.com/api/json-storage/bin/aecadfa";
        let lastLocalActionTime = parseInt(localStorage.getItem('cancerez_last_local_action') || '0', 10);
        let pushInProgress = false;
        let lastKnownTeam = (team && team.length > 0) ? team : [];

        // ================= 7/24 SUPABASE BULUT MOTORU =================
        let supabaseClient = null;
        let supabaseRealtimeChannel = null;

        function getSupabaseConfig() {
            return {
                url: (localStorage.getItem('cancerez_supabase_url') || 'https://jzisvxaxjzzseqgdqoxo.supabase.co').trim(),
                key: (localStorage.getItem('cancerez_supabase_key') || 'sb_publishable_zU-fzx1fqhFbm3Sr-WUM8Q_0S5Zu_Gi').trim()
            };
        }

        function initSupabase() {
            const cfg = getSupabaseConfig();
            if (window.supabase && cfg.url && cfg.key) {
                try {
                    supabaseClient = window.supabase.createClient(cfg.url, cfg.key, {
                        auth: { persistSession: false }
                    });
                    console.log("CAN ÇEREZ (Personel) - Supabase 7/24 Bulut Motoru Başlatıldı!");
                    setupSupabaseRealtime();
                    updatePersonelServerBadge(true);
                    return true;
                } catch(e) {
                    console.warn("Supabase başlatma hatası:", e);
                    supabaseClient = null;
                    return false;
                }
            } else {
                supabaseClient = null;
                return false;
            }
        }

        function setupSupabaseRealtime() {
            if (!supabaseClient) return;
            try {
                if (supabaseRealtimeChannel) {
                    supabaseClient.removeChannel(supabaseRealtimeChannel);
                }
                supabaseRealtimeChannel = supabaseClient.channel('cancerez_staff_realtime')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'cancerez_tasks' }, (payload) => {
                        if (payload && payload.eventType === 'INSERT') {
                            const newTask = payload.new;
                            if (newTask && (!currentSelectedUser || (newTask.owner || newTask.assignee || '').toLowerCase().trim() === currentSelectedUser.toLowerCase().trim())) {
                                triggerStaffSystemNotification("📌 Yeni Görev Atandı!", `"${newTask.title || 'Görev'}" görevi üzerinize tanımlandı.`);
                            }
                        } else if (payload && payload.eventType === 'UPDATE') {
                            const updated = payload.new;
                            if (updated && currentSelectedUser && (updated.owner || updated.assignee || '').toLowerCase().trim() === currentSelectedUser.toLowerCase().trim()) {
                                triggerStaffSystemNotification("🔔 Görev Güncellendi", `"${updated.title || 'Görev'}" durumu: ${updated.status}`);
                            }
                        }
                        syncWithServer();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'cancerez_team' }, () => {
                        syncWithServer();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'cancerez_settings' }, () => {
                        syncWithServer();
                    })
                    .subscribe();
            } catch(e) {
                console.warn("Realtime abonelik hatası:", e);
            }
        }

        // ================= 3. ANLIK PUSH BİLDİRİM VE GERİ ÇEKME MOTORU (PERSONEL) =================
        function checkNotificationSupport() {
            return ('Notification' in window);
        }

        function playStaffInAppBeep() {
            if (localStorage.getItem('cancerez_staff_audio_muted') === 'true') return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } catch(e) {}
        }

        function updateStaffNotificationIconUI() {
            const icon = document.getElementById('staffNotifIcon');
            const btn = document.getElementById('btnStaffToggleNotif');
            if (!icon || !btn) return;
            if (!checkNotificationSupport()) {
                btn.style.display = 'none';
                return;
            }
            const isMuted = localStorage.getItem('cancerez_staff_notif_muted') === 'true';
            if (Notification.permission === 'granted') {
                if (isMuted) {
                    icon.className = "fa-solid fa-bell-slash text-stone-400 text-xs";
                    btn.title = "Bildirimler Geri Çekildi / Susturuldu (Yönetmek İçin Tıklayın)";
                    btn.classList.remove('ring-2', 'ring-[#FFBF3F]/60');
                } else {
                    icon.className = "fa-solid fa-bell text-[#FFBF3F] text-xs";
                    btn.title = "Anlık Bildirimler Aktif (Yönetmek İçin Tıklayın)";
                    btn.classList.add('ring-2', 'ring-[#FFBF3F]/60');
                }
            } else if (Notification.permission === 'denied') {
                icon.className = "fa-solid fa-bell-slash text-rose-400 text-xs";
                btn.title = "Tarayıcı Bildirim İzni Engellenmiş (İzni Açma Rehberi)";
                btn.classList.remove('ring-2', 'ring-[#FFBF3F]/60');
            } else {
                icon.className = "fa-regular fa-bell text-[#EFE8DE] text-xs";
                btn.title = "Anlık Görev Bildirimlerini Aç";
                btn.classList.remove('ring-2', 'ring-[#FFBF3F]/60');
            }
        }

        function toggleStaffPushNotifications() {
            openStaffNotificationModal();
        }

        function openStaffNotificationModal() {
            const modal = document.getElementById('staffNotificationModal');
            if (!modal) return;
            renderStaffNotificationModalContent();
            modal.style.setProperty('display', 'flex', 'important');
            modal.classList.remove('hidden');
        }

        function closeStaffNotificationModal() {
            const modal = document.getElementById('staffNotificationModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                modal.classList.add('hidden');
            }
        }

        function renderStaffNotificationModalContent() {
            const statusCard = document.getElementById('staffNotifStatusCard');
            const actionBtns = document.getElementById('staffNotifActionButtons');
            const guide = document.getElementById('staffNotifPermissionGuide');
            const audioBtn = document.getElementById('btnStaffInAppAudioToggle');

            if (!statusCard || !actionBtns) return;

            // Ses durumu butonu
            const audioMuted = localStorage.getItem('cancerez_staff_audio_muted') === 'true';
            if (audioBtn) {
                if (audioMuted) {
                    audioBtn.className = "px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer bg-stone-200 text-stone-700";
                    audioBtn.innerText = "Kapalı";
                } else {
                    audioBtn.className = "px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer bg-[#1E340C] text-[#FFBF3F]";
                    audioBtn.innerText = "Açık";
                }
            }

            if (!checkNotificationSupport()) {
                statusCard.className = "p-4 rounded-2xl border bg-stone-100 border-stone-300 text-stone-800";
                statusCard.innerHTML = `
                    <div class="flex items-center gap-2.5 font-bold text-sm text-stone-900">
                        <i class="fa-solid fa-triangle-exclamation text-amber-600"></i>
                        <span>Desteklenmiyor</span>
                    </div>
                    <p class="text-xs text-stone-600 mt-1">Kullandığınız tarayıcı web bildirimlerini desteklemiyor.</p>
                `;
                actionBtns.innerHTML = '';
                if (guide) guide.classList.add('hidden');
                return;
            }

            const isMuted = localStorage.getItem('cancerez_staff_notif_muted') === 'true';

            if (Notification.permission === 'granted') {
                if (guide) guide.classList.add('hidden');
                if (isMuted) {
                    statusCard.className = "p-4 rounded-2xl border bg-stone-100 border-stone-300 text-stone-800";
                    statusCard.innerHTML = `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 font-black text-sm text-stone-800">
                                <i class="fa-solid fa-bell-slash text-stone-500"></i>
                                <span>Bildirimler Geri Çekildi (Kapalı)</span>
                            </div>
                            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-stone-300 text-stone-800">Susturuldu</span>
                        </div>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">
                            Bildirimleri bu cihazda <strong>susturdunuz</strong>. Yeni görev atandığında sistem bildirimi gönderilmez.
                        </p>
                    `;
                    actionBtns.innerHTML = `
                        <button type="button" onclick="muteStaffNotifications(false)" class="w-full py-2.5 bg-[#1E340C] hover:bg-[#2C4A14] text-[#FFBF3F] rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                            <i class="fa-solid fa-bell"></i>
                            <span>Bildirimleri Yeniden Aç</span>
                        </button>
                    `;
                } else {
                    statusCard.className = "p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-950";
                    statusCard.innerHTML = `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 font-black text-sm text-emerald-900">
                                <i class="fa-solid fa-circle-check text-emerald-600"></i>
                                <span>Görev Bildirimleri Açık & Aktif</span>
                            </div>
                            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">Aktif</span>
                        </div>
                        <p class="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                            Yöneticiniz size yeni bir görev tanımladığında veya görev güncellendiğinde anında bildirim alırsınız.
                        </p>
                    `;
                    actionBtns.innerHTML = `
                        <button type="button" onclick="muteStaffNotifications(true)" class="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                            <i class="fa-solid fa-bell-slash text-rose-600"></i>
                            <span>Bildirimleri Geri Çek (Kapat / Sustur)</span>
                        </button>
                    `;
                }
            } else if (Notification.permission === 'denied') {
                if (guide) guide.classList.remove('hidden');
                statusCard.className = "p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-950";
                statusCard.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 font-black text-sm text-[#A6192E]">
                            <i class="fa-solid fa-ban text-[#A6192E]"></i>
                            <span>Tarayıcı İzin Vermiyor (Engellendi)</span>
                        </div>
                        <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-200 text-[#A6192E]">Engelli</span>
                    </div>
                    <p class="text-xs text-rose-800 mt-1.5 leading-relaxed">
                        Tarayıcınız veya telefonunuz bildirimleri engellemiş. Güvenlik kuralları gereği kilidi aşağıdaki 3 adımı izleyerek açabilirsiniz.
                    </p>
                `;
                actionBtns.innerHTML = `
                    <button type="button" onclick="requestStaffNotificationPermissionAgain()" class="w-full py-2.5 bg-[#FFBF3F] hover:bg-[#E5A529] text-[#31261D] rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                        <i class="fa-solid fa-rotate-right"></i>
                        <span>İzni Yeniden Kontrol Et</span>
                    </button>
                `;
            } else {
                if (guide) guide.classList.add('hidden');
                statusCard.className = "p-4 rounded-2xl border bg-amber-50 border-amber-200 text-amber-950";
                statusCard.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 font-black text-sm text-amber-900">
                            <i class="fa-solid fa-bell"></i>
                            <span>Bildirim İzni Bekleniyor</span>
                        </div>
                        <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">Beklemede</span>
                    </div>
                    <p class="text-xs text-amber-800 mt-1.5 leading-relaxed">
                        Yeni görev atandığında telefonunuza veya bilgisayarınıza anında bildirim gelmesi için lütfen izin veriniz.
                    </p>
                `;
                actionBtns.innerHTML = `
                    <button type="button" onclick="requestStaffNotificationPermissionAgain()" class="w-full py-2.5 bg-[#1E340C] hover:bg-[#2C4A14] text-[#FFBF3F] rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                        <i class="fa-solid fa-bell"></i>
                        <span>Bildirim İznini Başlat (İzin Ver)</span>
                    </button>
                `;
            }
        }

        function muteStaffNotifications(shouldMute) {
            if (shouldMute) {
                localStorage.setItem('cancerez_staff_notif_muted', 'true');
            } else {
                localStorage.removeItem('cancerez_staff_notif_muted');
            }
            updateStaffNotificationIconUI();
            renderStaffNotificationModalContent();
        }

        async function requestStaffNotificationPermissionAgain() {
            if (!checkNotificationSupport()) return;
            try {
                const perm = await Notification.requestPermission();
                if (perm === 'granted') {
                    localStorage.removeItem('cancerez_staff_notif_muted');
                    triggerStaffSystemNotification("CAN ÇEREZ (1978)", "🎉 Tebrikler! Anlık görev bildirimleri başarıyla aktif edildi.");
                }
            } catch(e) {
                console.warn("Staff permission request error:", e);
            }
            updateStaffNotificationIconUI();
            renderStaffNotificationModalContent();
        }

        function toggleStaffInAppAudioSetting() {
            const current = localStorage.getItem('cancerez_staff_audio_muted') === 'true';
            if (current) {
                localStorage.removeItem('cancerez_staff_audio_muted');
                playStaffInAppBeep();
            } else {
                localStorage.setItem('cancerez_staff_audio_muted', 'true');
            }
            renderStaffNotificationModalContent();
        }

        function testStaffNotificationFromModal() {
            playStaffInAppBeep();
            if (Notification.permission === 'granted' && localStorage.getItem('cancerez_staff_notif_muted') !== 'true') {
                triggerStaffSystemNotification("CAN ÇEREZ (1978) - Test", "🔔 Bildirim testi başarılı! Görevler 7/24 cebinizde.");
            } else if (localStorage.getItem('cancerez_staff_notif_muted') === 'true') {
                alert("🔔 Bildirimler 'Geri Çekildi / Susturuldu' modunda. Yeniden almak için 'Yeniden Aç' butonuna basabilirsiniz.");
            } else if (Notification.permission === 'denied') {
                alert("⚠️ Tarayıcınız bildirim iznini engellemiş ('İzin vermiyor'). Lütfen yukarıdaki 3 adımı uygulayarak kilit simgesinden izin veriniz.");
            } else {
                requestStaffNotificationPermissionAgain();
            }
        }

        function triggerStaffSystemNotification(title, body) {
            playStaffInAppBeep();
            if (!checkNotificationSupport()) return;
            if (localStorage.getItem('cancerez_staff_notif_muted') === 'true') return;
            if (Notification.permission !== 'granted') return;

            try {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.showNotification(title, {
                            body: body,
                            icon: 'icon-192.svg',
                            badge: 'icon-192.svg',
                            vibrate: [200, 100, 200]
                        });
                    });
                } else {
                    new Notification(title, {
                        body: body,
                        icon: 'icon-192.svg'
                    });
                }
            } catch(e) {
                console.warn("Staff notification error:", e);
            }
        }

        // ================= 6. ŞUBE HIZLI ERİŞİM KONTROLÜ =================
        let currentBranchFilter = null;

        function initBranchFromUrl() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const branchParam = urlParams.get('branch');
                if (branchParam && branchParam.trim()) {
                    currentBranchFilter = branchParam.trim();
                    const banner = document.getElementById('branchQuickAccessBanner');
                    const titleEl = document.getElementById('branchBannerTitle');
                    if (banner && titleEl) {
                        titleEl.innerText = currentBranchFilter;
                        banner.classList.remove('hidden');
                    }
                }
            } catch(e) {
                console.warn("Branch URL parse hatası:", e);
            }
        }

        function clearBranchFilter() {
            currentBranchFilter = null;
            const banner = document.getElementById('branchQuickAccessBanner');
            if (banner) banner.classList.add('hidden');
            try {
                const url = new URL(window.location.href);
                url.searchParams.delete('branch');
                window.history.replaceState({}, document.title, url.toString());
            } catch(e) {}
            if (!currentSelectedUser) {
                showUserSelectionScreen();
            } else {
                renderPersonalDashboard(currentSelectedUser);
            }
        }

        async function fetchFromSupabase() {
            if (!supabaseClient) return null;
            try {
                const [tasksRes, teamRes, settingsRes] = await Promise.all([
                    supabaseClient.from('cancerez_tasks').select('*'),
                    supabaseClient.from('cancerez_team').select('*'),
                    supabaseClient.from('cancerez_settings').select('*')
                ]);

                if (tasksRes.error || teamRes.error) {
                    console.warn("Supabase veri çekme:", tasksRes.error || teamRes.error);
                    return null;
                }

                let notes = '';
                let adminPassword = '1978';
                let branchesData = null;
                let departmentsData = null;
                let deletedIdsData = null;
                let deletedMemberNamesData = null;
                if (settingsRes && Array.isArray(settingsRes.data)) {
                    const nObj = settingsRes.data.find(s => s.key === 'admin_notes');
                    if (nObj) notes = nObj.value || '';
                    const pObj = settingsRes.data.find(s => s.key === 'admin_password');
                    if (pObj) adminPassword = pObj.value || '1978';
                    const bObj = settingsRes.data.find(s => s.key === 'branches');
                    if (bObj && bObj.value) {
                        try { branchesData = JSON.parse(bObj.value); } catch(e){}
                    }
                    const dObj = settingsRes.data.find(s => s.key === 'departments');
                    if (dObj && dObj.value) {
                        try { departmentsData = JSON.parse(dObj.value); } catch(e){}
                    }
                    const delTaskObj = settingsRes.data.find(s => s.key === 'deleted_ids');
                    if (delTaskObj && delTaskObj.value) {
                        try { deletedIdsData = JSON.parse(delTaskObj.value); } catch(e){}
                    }
                    const delMemObj = settingsRes.data.find(s => s.key === 'deleted_member_names');
                    if (delMemObj && delMemObj.value) {
                        try { deletedMemberNamesData = JSON.parse(delMemObj.value); } catch(e){}
                    }
                }

                return {
                    tasks: tasksRes.data || [],
                    team: teamRes.data || [],
                    notes: notes,
                    adminPassword: adminPassword,
                    branches: branchesData,
                    departments: departmentsData,
                    deletedIds: deletedIdsData,
                    deletedMemberNames: deletedMemberNamesData
                };
            } catch(e) {
                console.warn("Supabase fetch exception:", e);
                return null;
            }
        }

        async function pushToSupabase(rawData) {
            if (!supabaseClient) return false;
            try {
                if (Array.isArray(rawData.tasks) && rawData.tasks.length > 0) {
                    const rows = rawData.tasks.map(t => ({
                        id: Number(t.id),
                        title: t.title || 'Görev',
                        department: t.department || 'Şube Operasyon',
                        action: t.action || '',
                        owner: t.owner || '',
                        dueDate: t.dueDate || '',
                        status: t.status || 'Açık',
                        priority: t.priority || 'Normal',
                        branch: t.branch || 'Merkez / Genel',
                        recurrence: t.recurrence || 'none',
                        comments: Array.isArray(t.comments) ? t.comments : [],
                        updated_at: new Date().toISOString()
                    }));
                    await supabaseClient.from('cancerez_tasks').upsert(rows, { onConflict: 'id' });
                }

                const deletedIds = getDeletedTaskIds();
                if (deletedIds.length > 0) {
                    await supabaseClient.from('cancerez_tasks').delete().in('id', deletedIds.map(Number));
                }

                if (Array.isArray(rawData.team) && rawData.team.length > 0) {
                    const teamRows = rawData.team.map((m, idx) => ({
                        id: Number(m.id || (idx + 1)),
                        name: m.name,
                        title: m.title || 'Personel',
                        department: m.department || 'Şube Operasyon',
                        phone: m.phone || '',
                        email: m.email || '',
                        pin: m.pin || '1978',
                        status: m.status || 'aktif'
                    }));
                    await supabaseClient.from('cancerez_team').upsert(teamRows, { onConflict: 'id' });
                }

                return true;
            } catch(e) {
                console.warn("Supabase push exception:", e);
                return false;
            }
        }

        function isLocalEnvironment() {
            return window.location.protocol.startsWith('http') && 
                   (window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.port === '8080');
        }

        function updatePersonelServerBadge(online) {
            const badge = document.getElementById('personelServerBadge');
            if (!badge) return;
            badge.classList.remove('hidden');
            if (online) {
                badge.className = "text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300 flex items-center gap-1.5 whitespace-nowrap shrink-0";
                badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span><span class="hidden md:inline">7/24 Bulut </span>Canlı';
            } else {
                badge.className = "text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-300 flex items-center gap-1.5 whitespace-nowrap shrink-0";
                badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span><span class="hidden md:inline">Çevrimdışı </span>(Yerel)';
            }
        }

        function getDeletedMemberNames() {
            try {
                return JSON.parse(localStorage.getItem('task_deleted_member_names') || '[]');
            } catch(e) {
                return [];
            }
        }

        // AKILLI BİRLEŞTİRME (Smart Merge):
        // Sunucudan gelen liste, yerelde kayıt edilmiş personelleri ASLA silemez!
        function mergeTeamMembers(localList, serverList) {
            if (!Array.isArray(localList)) localList = [];
            if (!Array.isArray(serverList)) serverList = [];
            const deletedNames = getDeletedMemberNames();
            const map = new Map();

            // 1. Önce sunucudaki personelleri ekle (silinmemiş olanlar)
            serverList.forEach(m => {
                if (m && m.name) {
                    const key = m.name.toLowerCase().trim();
                    if (!deletedNames.includes(key)) {
                        map.set(key, { ...m });
                    }
                }
            });

            // 2. Ardından yerel personelleri ekle / birleştir (yerel personeller daima korunur)
            localList.forEach(m => {
                if (m && m.name) {
                    const key = m.name.toLowerCase().trim();
                    if (!deletedNames.includes(key)) {
                        if (map.has(key)) {
                            const existing = map.get(key);
                            map.set(key, {
                                ...existing,
                                ...m,
                                pin: m.pin || existing.pin || '1978',
                                phone: m.phone || existing.phone || '',
                                email: m.email || existing.email || '',
                                title: m.title || existing.title || m.role || existing.role || 'Personel',
                                role: m.role || existing.role || m.title || existing.title || 'Personel',
                                status: m.status || existing.status || 'aktif'
                            });
                        } else {
                            map.set(key, { ...m });
                        }
                    }
                }
            });

            return Array.from(map.values());
        }

        async function syncWithServer(isManual = false) {
            // Son 6 saniye içinde personel bir durum değiştirdiyse veya gönderme sürüyorsa ezilmeyi engelle (manuel yenilemede pas geç)
            if (!isManual && (pushInProgress || isRecentLocalAction(6000))) {
                return;
            }

            try {
                let data = null;
                if (supabaseClient) {
                    try {
                        data = await fetchFromSupabase();
                    } catch(e) {
                        console.warn("Supabase sync hatası:", e);
                    }
                }

                if (!data && isLocalEnvironment()) {
                    try {
                        const localRes = await fetch('/api/data');
                        if (localRes.ok) data = await localRes.json();
                    } catch(e) {}
                }

                if (!data) {
                    try {
                        const cacheBuster = (CLOUD_DB_URL.includes('?') ? '&' : '?') + '_ts=' + Date.now();
                        const cloudRes = await fetch(CLOUD_DB_URL + cacheBuster, { 
                            cache: 'no-store',
                            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
                        });
                        if (cloudRes.ok) {
                            const cloudJson = await cloudRes.json();
                            data = (cloudJson && cloudJson.data && typeof cloudJson.data === 'object' && (Array.isArray(cloudJson.data.tasks) || Array.isArray(cloudJson.data.team))) ? cloudJson.data : cloudJson;
                        }
                    } catch(e) {}
                }

                // Buluta ulaşılamadıysa ve yerel hafıza henüz hiç başlatılmamışsa github'daki veriler.json dosyasını çek
                if (!data && !isStorageInitialized && tasks.length === 0 && team.length === 0) {
                    try {
                        const repoRes = await fetch('./veriler.json', { cache: 'no-store' });
                        if (repoRes.ok) data = await repoRes.json();
                    } catch(e) {}
                }

                if (data) {
                    if (!isManual && (pushInProgress || isRecentLocalAction(6000))) {
                        return;
                    }

                    let changed = false;

                    if (Array.isArray(data.deletedIds) && data.deletedIds.length > 0) {
                        const localDelIds = getDeletedTaskIds();
                        const mergedDelIds = Array.from(new Set([...localDelIds, ...data.deletedIds.map(String)]));
                        if (mergedDelIds.length !== localDelIds.length) {
                            localStorage.setItem('task_deleted_ids', JSON.stringify(mergedDelIds));
                        }
                    }

                    if (Array.isArray(data.deletedMemberNames) && data.deletedMemberNames.length > 0) {
                        const localDelNames = getDeletedMemberNames();
                        const mergedDelNames = Array.from(new Set([...localDelNames, ...data.deletedMemberNames.map(n => String(n).toLowerCase().trim())]));
                        if (mergedDelNames.length !== localDelNames.length) {
                            localStorage.setItem('task_deleted_member_names', JSON.stringify(mergedDelNames));
                        }
                    }

                    if (Array.isArray(data.tasks)) {
                        const deletedIds = getDeletedTaskIds();
                        const validServerTasks = data.tasks.filter(t => !deletedIds.includes(String(t.id)));
                        const normalizedServerTasks = normalizeTasks(validServerTasks);
                        const serverTasksStr = JSON.stringify(normalizedServerTasks);
                        if (serverTasksStr !== JSON.stringify(tasks)) {
                            tasks = normalizedServerTasks;
                            window.tasks = tasks;
                            localStorage.setItem('task_items', serverTasksStr);
                            changed = true;
                        }
                    }

                    if (Array.isArray(data.team)) {
                        // Akıllı Birleştirme: Server'dan gelen liste yereldeki personelleri ASLA silemez!
                        const mergedTeam = mergeTeamMembers(team, data.team);
                        const mergedStr = JSON.stringify(mergedTeam);
                        if (mergedStr !== JSON.stringify(team)) {
                            team = mergedTeam;
                            localStorage.setItem('task_team_members', mergedStr);
                            changed = true;
                        }
                        if (team.length > 0) lastKnownTeam = team;

                        // Yerelde olup sunucuda henüz bulunmayan üyeler varsa, bulutu da güncelle
                        if (data.team.length < team.length) {
                            pushDataToServer();
                        }
                    }

                    if (data.notes !== undefined) {
                        localStorage.setItem('task_management_notes', data.notes);
                    }

                    if (data.adminPassword) {
                        localStorage.setItem('cancerez_admin_password', data.adminPassword);
                    }

                    if (Array.isArray(data.branches) && data.branches.length > 0) {
                        const sBranches = data.branches;
                        if (JSON.stringify(sBranches) !== JSON.stringify(window.branches)) {
                            window.branches = sBranches;
                            branches = sBranches;
                            localStorage.setItem('task_branches', JSON.stringify(branches));
                            refreshPersonelBranchSelect();
                        }
                    }

                    if (Array.isArray(data.departments) && data.departments.length > 0) {
                        const sDepts = data.departments;
                        if (JSON.stringify(sDepts) !== JSON.stringify(window.departments)) {
                            window.departments = sDepts;
                            departments = sDepts;
                            localStorage.setItem('task_departments', JSON.stringify(departments));
                        }
                    }

                    if (changed) {
                        if (currentSelectedUser) {
                            renderPersonalDashboard(currentSelectedUser);
                        } else {
                            showUserSelectionScreen();
                        }
                        if (activeCommentTaskId) {
                            const curTask = tasks.find(t => String(t.id) === String(activeCommentTaskId));
                            if (curTask) renderTaskCommentsList(curTask);
                        }
                    }
                    updatePersonelServerBadge(true);
                    if (isManual) alert("Görevler başarıyla eşitlendi!");
                } else {
                    updatePersonelServerBadge(false);
                    if (isManual) alert("Sunucu ile iletişim kurulamadı. Görevleriniz yerel hafızanızda güvenle tutulmaktadır.");
                }
            } catch (err) {
                updatePersonelServerBadge(false);
                if (isManual) alert("Eşitleme sırasında hata oluştu. Yerel verileriniz korunmaktadır.");
            }
        }

        async function pushDataToServer() {
            pushInProgress = true;
            lastLocalActionTime = Date.now();

            const safeTeam = (team && team.length > 0) ? team : (lastKnownTeam && lastKnownTeam.length > 0 ? lastKnownTeam : (JSON.parse(localStorage.getItem('task_team_members')) || []));

            const rawData = {
                tasks: tasks,
                team: safeTeam,
                branches: window.branches || DEFAULT_BRANCHES,
                departments: window.departments || DEFAULT_DEPARTMENTS,
                notes: localStorage.getItem('task_management_notes') || '',
                adminPassword: localStorage.getItem('cancerez_admin_password') || '1978',
                deletedIds: getDeletedTaskIds(),
                deletedMemberNames: getDeletedMemberNames()
            };

            if (supabaseClient) {
                try {
                    await pushToSupabase(rawData);
                    updatePersonelServerBadge(true);
                } catch(e) {
                    console.warn("Supabase push hatası:", e);
                }
            }

            const cloudPayload = JSON.stringify(rawData);

            try {
                const res = await fetch(CLOUD_DB_URL, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                    body: cloudPayload
                });
                if (res.ok) updatePersonelServerBadge(true);
            } catch (err) {
                console.warn("Buluta gönderilemedi:", err);
            } finally {
                pushInProgress = false;
                lastLocalActionTime = Date.now();
            }

            if (isLocalEnvironment()) {
                try {
                    await fetch('/api/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(rawData)
                    });
                } catch(e) {}
            }
        }

        function updateManagerReturnButton() {
            const btn = document.getElementById('btnOpenManagerAccess');
            if (!btn) return;
            btn.innerHTML = `<i class="fa-solid fa-crown text-[#FFBF3F] text-xs"></i><span class="hidden sm:inline">Yönetici Girişi</span><span class="sm:hidden">Yönetici</span>`;
            btn.title = "Yönetici Paneline Geçiş Yap (Şifreli)";
        }

        function handleManagerAccessClick() {
            // Yönetici paneline geçiş için HER ZAMAN şifre sorulmalıdır (güvenlik gereği otomatik atlama engellendi)
            openManagerAccessModal();
        }

        function openManagerAccessModal() {
            const m = document.getElementById('managerAccessModal');
            const inp = document.getElementById('managerAccessPassInput');
            const err = document.getElementById('managerAccessError');
            if (inp) inp.value = '';
            if (err) err.classList.add('hidden');
            if (m) {
                m.style.setProperty('display', 'flex', 'important');
                m.classList.remove('hidden');
                m.classList.add('flex');
            }
            setTimeout(() => {
                if (inp) inp.focus();
            }, 100);
        }

        function closeManagerAccessModal() {
            const m = document.getElementById('managerAccessModal');
            if (m) {
                m.style.setProperty('display', 'none', 'important');
                m.classList.remove('flex');
                m.classList.add('hidden');
            }
        }

        function toggleManagerAccessPassVisibility() {
            const inp = document.getElementById('managerAccessPassInput');
            const eye = document.getElementById('managerAccessPassEye');
            if (!inp || !eye) return;
            if (inp.type === 'password') {
                inp.type = 'text';
                eye.className = 'fa-solid fa-eye-slash';
            } else {
                inp.type = 'password';
                eye.className = 'fa-solid fa-eye';
            }
        }

        function submitManagerAccess(e) {
            e.preventDefault();
            const inp = document.getElementById('managerAccessPassInput');
            const entered = (inp ? inp.value : '').trim();
            const actualPass = localStorage.getItem('cancerez_admin_password') || '1978';

            if (entered && (entered === actualPass || entered === '1978' || entered === 'cankardesler')) {
                sessionStorage.setItem('cancerez_admin_auth', 'true');
                sessionStorage.setItem('cancerez_manager_viewing_staff', 'true');
                localStorage.setItem('cancerez_active_role', 'admin');
                closeManagerAccessModal();
                window.location.href = 'yonetici.html';
            } else {
                const err = document.getElementById('managerAccessError');
                const errText = document.getElementById('managerAccessErrorText');
                if (err && errText) {
                    errText.innerText = entered ? "Hatalı yönetici şifresi! Personeller yönetici paneline erişemez." : "Lütfen yönetici şifrenizi giriniz.";
                    err.classList.remove('hidden');
                }
                if (inp) inp.select();
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            if (window.location.hash && window.location.hash.includes('cloud_setup=')) {
                try {
                    const match = window.location.hash.match(/cloud_setup=([^&]+)/);
                    if (match && match[1]) {
                        const jsonStr = decodeURIComponent(escape(atob(match[1])));
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.url && parsed.key) {
                            localStorage.setItem('cancerez_supabase_url', parsed.url);
                            localStorage.setItem('cancerez_supabase_key', parsed.key);
                            console.log("Supabase bulut yapılandırması link üzerinden otomatik yüklendi!");
                        }
                    }
                } catch(e) {
                    console.warn("Cloud setup hash hatası:", e);
                }
                try {
                    history.replaceState(null, document.title, window.location.pathname + window.location.search);
                } catch(e) {}
            }
            refreshPersonelBranchSelect();
            initBranchFromUrl();
            updateStaffNotificationIconUI();
            initSupabase();
            updateManagerReturnButton();
            const rememberedStaff = localStorage.getItem('cancerez_remember_staff_user');
            const authUser = sessionStorage.getItem('cancerez_staff_auth_user') || rememberedStaff;
            if (authUser) {
                sessionStorage.setItem('cancerez_staff_auth_user', authUser);
                currentSelectedUser = authUser;
                renderPersonalDashboard(authUser);
            } else {
                showUserSelectionScreen();
            }
            updatePersonelServerBadge(true);

            // Otomatik Senkronizasyon:
            // Şirket içi yerel sunucuda (sunucu.py) kotasızdır, her 3 saniyede bir kontrol eder.
            // Bulut bağlantısında (GitHub Pages) ise kota tasarrufu için her 60 saniyede bir veya sayfaya odaklanıldığında çeker.
            syncWithServer();
            if (isLocalEnvironment()) {
                setInterval(syncWithServer, 3000);
            } else {
                setInterval(syncWithServer, 60000);
                window.addEventListener('focus', () => syncWithServer());
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') syncWithServer();
                });
            }
        });

        // Yönetici sekmesinde bir görev eklendiğinde veya değiştiğinde anında güncelle
        window.addEventListener('storage', (e) => {
            if (e.key === 'task_items') {
                const deletedIds = getDeletedTaskIds();
                const raw = JSON.parse(e.newValue || '[]');
                tasks = normalizeTasks(raw.filter(t => !deletedIds.includes(String(t.id))));
                window.tasks = tasks;
                if (currentSelectedUser) renderPersonalDashboard(currentSelectedUser);
                if (activeCommentTaskId) {
                    const curTask = tasks.find(t => String(t.id) === String(activeCommentTaskId));
                    if (curTask) renderTaskCommentsList(curTask);
                }
            } else if (e.key === 'task_team_members') {
                team = JSON.parse(e.newValue || '[]');
                if (!currentSelectedUser) showUserSelectionScreen();
            }
        });

        function saveTasks() {
            setLocalActionTimestamp();
            const activeTasks = (window.tasks && Array.isArray(window.tasks) && window.tasks.length > 0) ? window.tasks : tasks;
            tasks = activeTasks;
            window.tasks = tasks;
            localStorage.setItem('task_items', JSON.stringify(tasks));
            pushDataToServer();
        }

        // 1. KULLANICI SEÇİM EKRANI
        function showUserSelectionScreen() {
            currentSelectedUser = '';
            localStorage.removeItem('task_personel_selected_user');

            document.getElementById('userSelectionScreen').classList.remove('hidden');
            document.getElementById('personalDashboardScreen').classList.add('hidden');
            document.getElementById('headerUserActions').classList.add('hidden');

            // Ekip listesini daima localStorage'dan en güncel haliyle çek
            try {
                const storedTeam = JSON.parse(localStorage.getItem('task_team_members') || '[]');
                if (Array.isArray(storedTeam) && storedTeam.length > 0) {
                    team = storedTeam;
                }
            } catch(e) {}

            if (!team || !Array.isArray(team) || team.length === 0) team = DEFAULT_INIT_TEAM;
            if (!tasks) tasks = [];

            const list = document.getElementById('selectionCardsList');
            const now = new Date();
            now.setHours(0,0,0,0);

            if (team.length === 0) {
                list.innerHTML = `
                    <div class="p-6 text-center text-[#5C4A3C] space-y-2">
                        <i class="fa-solid fa-users text-3xl text-[#E8DFC8]"></i>
                        <p class="text-sm font-bold text-[#31261D]">Henüz Kayıtlı Personel Bulunmuyor</p>
                        <p class="text-xs text-[#5C4A3C] max-w-sm mx-auto">
                            Aşağıdaki yeşil <strong>"Aramıza Yeni Katıldım"</strong> butonuna tıklayarak ilk personel kaydınızı hemen oluşturabilirsiniz.
                        </p>
                    </div>
                `;
                return;
            }

            let sortedTeam = [...team];
            if (currentBranchFilter) {
                sortedTeam.sort((a, b) => {
                    const aMatch = (a.department || '').toLowerCase().includes(currentBranchFilter.toLowerCase());
                    const bMatch = (b.department || '').toLowerCase().includes(currentBranchFilter.toLowerCase());
                    if (aMatch && !bMatch) return -1;
                    if (!aMatch && bMatch) return 1;
                    return 0;
                });
            }

            list.innerHTML = sortedTeam.map(member => {
                const userTasks = tasks.filter(t => (t.owner || t.assignee || '').toLowerCase().trim() === member.name.toLowerCase().trim());
                const total = userTasks.length;
                const delayed = userTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now).length;
                const open = userTasks.filter(t => t.status !== 'Tamamlandı').length;
                const isBranchMember = currentBranchFilter && (member.department || '').toLowerCase().includes(currentBranchFilter.toLowerCase());
                const cardBorder = isBranchMember 
                    ? 'border-[#FFBF3F] bg-gradient-to-r from-[#FFFDF7] to-white ring-1 ring-[#FFBF3F]/40 hover:border-[#A6192E]' 
                    : 'border-[#E8DFC8] bg-white hover:border-[#A6192E] hover:bg-[#FAF7F2]';

                return `
                    <div onclick="selectPerson('${escapeHtml(member.name)}')" class="p-4 rounded-2xl border ${cardBorder} cursor-pointer transition-all flex items-center justify-between group shadow-2xs hover:shadow-md">
                        <div class="flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#31261D] text-[#FFBF3F] border border-[#FFBF3F]/30 flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                                ${getInitials(member.name)}
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <h4 class="font-bold text-[#31261D] text-sm group-hover:text-[#A6192E] transition-colors">${escapeHtml(member.name)}</h4>
                                    ${isBranchMember ? '<span class="text-[9px] bg-[#FFBF3F] text-[#31261D] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">📍 Bu Şube</span>' : ''}
                                </div>
                                <p class="text-xs text-[#824701] font-semibold">${escapeHtml(member.title)} • ${escapeHtml(member.department || '')}</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            ${delayed > 0 ? `<span class="text-[11px] font-black bg-rose-100 text-[#A6192E] border border-rose-200 px-2.5 py-0.5 rounded-full animate-pulse">${delayed} Geciken!</span>` : ''}
                            <span class="text-xs font-bold bg-[#FAF7F2] group-hover:bg-[#FFF6E0] text-[#31261D] group-hover:text-[#824701] border border-[#E8DFC8] px-3 py-1 rounded-full transition-colors">
                                ${open} Bekleyen İş
                            </span>
                            <i class="fa-solid fa-lock text-[#E8DFC8] group-hover:text-[#A6192E] text-xs ml-1 transition-colors"></i>
                        </div>
                    </div>
                `;
            }).join('');
        }

        let pendingPinPerson = null;

        function selectPerson(name) {
            if (!name) return;
            // Eğer bu kullanıcı için zaten oturum açılmışsa doğrudan dashboard'a geç
            const currentAuth = sessionStorage.getItem('cancerez_staff_auth_user');
            if (currentAuth && currentAuth.toLowerCase().trim() === name.toLowerCase().trim()) {
                currentSelectedUser = name;
                renderPersonalDashboard(name);
                return;
            }

            // Değilse PIN doğrulama modalını aç
            pendingPinPerson = name;
            const member = team.find(m => m && m.name && m.name.toLowerCase().trim() === name.toLowerCase().trim());
            document.getElementById('modalPinUserName').innerText = name;
            document.getElementById('modalPinUserDept').innerText = member ? `${member.title} • ${member.department || 'CAN ÇEREZ'}` : 'CAN ÇEREZ Personeli';
            document.getElementById('modalPinAvatar').innerText = getInitials(name);
            document.getElementById('staffPinInput').value = '';
            document.getElementById('staffPinError').classList.add('hidden');
            const modal = document.getElementById('userPinModal');
            modal.style.setProperty('display', 'flex', 'important');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => {
                const inp = document.getElementById('staffPinInput');
                if (inp) inp.focus();
            }, 100);
        }

        function closeUserPinModal() {
            const modal = document.getElementById('userPinModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }
            pendingPinPerson = null;
        }

        function togglePinRemember() {
            const inp = document.getElementById('pinRememberMe');
            const icon = document.getElementById('pinRememberIcon');
            const subtext = document.getElementById('pinRememberSubtext');
            const sw = document.getElementById('pinRememberSwitch');
            const knob = document.getElementById('pinRememberKnob');
            const isChecked = inp.value === 'true';
            const newVal = !isChecked;
            inp.value = newVal ? 'true' : 'false';

            if (newVal) {
                sw.className = "w-10 h-5.5 bg-[#1E340C] rounded-full p-0.5 transition-colors flex items-center";
                knob.className = "w-4.5 h-4.5 bg-white rounded-full shadow-sm transform translate-x-4.5 transition-transform flex items-center justify-center text-[8px] text-[#1E340C] font-black";
                knob.innerHTML = '<i class="fa-solid fa-check"></i>';
                icon.className = "w-7 h-7 rounded-lg bg-[#1E340C] text-[#FFBF3F] flex items-center justify-center text-xs shadow-xs";
                subtext.innerText = "Bu cihazda tekrar PIN sorma";
            } else {
                sw.className = "w-10 h-5.5 bg-stone-600 rounded-full p-0.5 transition-colors flex items-center";
                knob.className = "w-4.5 h-4.5 bg-white rounded-full shadow-sm transform translate-x-0 transition-transform flex items-center justify-center text-[8px] text-stone-600 font-black";
                knob.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                icon.className = "w-7 h-7 rounded-lg bg-stone-700 text-stone-400 flex items-center justify-center text-xs shadow-xs";
                subtext.innerText = "Her açılışta PIN sorulsun";
            }
        }

        function handlePinSubmit(e) {
            e.preventDefault();
            if (!pendingPinPerson) return;
            const personName = pendingPinPerson;
            const entered = document.getElementById('staffPinInput').value.trim();
            const member = team.find(m => m && m.name && m.name.toLowerCase().trim() === personName.toLowerCase().trim());
            const correctPin = (member && member.pin) ? member.pin : '1978';

            // Doğru PIN, varsayılan 1978 veya acil durum 'cankardesler'
            if (entered === correctPin || entered === '1978' || entered === 'cankardesler') {
                const remEl = document.getElementById('pinRememberMe');
                const rememberMe = remEl ? (remEl.value === 'true') : true;

                // Personel giriş yaptığı için yöneticiye ait tüm geçiş yetkilerini kesin olarak sıfırla!
                sessionStorage.removeItem('cancerez_manager_viewing_staff');
                sessionStorage.removeItem('cancerez_admin_auth');
                localStorage.removeItem('cancerez_remember_admin');

                sessionStorage.setItem('cancerez_staff_auth_user', personName);
                if (rememberMe) {
                    localStorage.setItem('cancerez_remember_staff_user', personName);
                    localStorage.setItem('cancerez_active_role', 'staff');
                    localStorage.setItem('task_personel_selected_user', personName);
                } else {
                    localStorage.removeItem('cancerez_remember_staff_user');
                    localStorage.setItem('cancerez_active_role', 'staff');
                    localStorage.setItem('task_personel_selected_user', personName);
                }

                updateManagerReturnButton();
                closeUserPinModal();
                renderPersonalDashboard(personName);
            } else {
                const err = document.getElementById('staffPinError');
                if (err) err.classList.remove('hidden');
                document.getElementById('staffPinInput').select();
            }
        }

        // ================= YENİ PERSONEL KENDİ KENDİNE KAYIT =================
        function openStaffSelfRegisterModal() {
            const errBox = document.getElementById('selfRegError');
            if (errBox) errBox.classList.add('hidden');
            const fields = ['selfRegName', 'selfRegPhone', 'selfRegEmail', 'selfRegPin', 'selfRegPinConfirm'];
            fields.forEach(f => {
                const el = document.getElementById(f);
                if (el) el.value = '';
            });
            if (currentBranchFilter) {
                const branchEl = document.getElementById('selfRegBranch');
                if (branchEl) branchEl.value = currentBranchFilter;
            }
            const m = document.getElementById('staffSelfRegisterModal');
            if (m) {
                m.style.setProperty('display', 'flex', 'important');
                m.classList.remove('hidden');
                m.classList.add('flex');
            }
        }

        function closeStaffSelfRegisterModal() {
            const m = document.getElementById('staffSelfRegisterModal');
            if (m) {
                m.style.setProperty('display', 'none', 'important');
                m.classList.remove('flex');
                m.classList.add('hidden');
            }
        }

        async function handleSelfRegisterSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('selfRegName').value.trim();
            const phone = document.getElementById('selfRegPhone').value.trim();
            const email = document.getElementById('selfRegEmail').value.trim();
            const role = document.getElementById('selfRegRole').value.trim() || 'Personel';
            const branch = document.getElementById('selfRegBranch')?.value.trim() || 'Merkez / Genel';
            const pin = document.getElementById('selfRegPin').value.trim();
            const pinConfirm = document.getElementById('selfRegPinConfirm').value.trim();
            const errBox = document.getElementById('selfRegError');

            errBox.classList.add('hidden');

            if (!name) {
                errBox.innerText = "Lütfen adınızı ve soyadınızı giriniz.";
                errBox.classList.remove('hidden');
                return;
            }
            if (!phone) {
                errBox.innerText = "Lütfen telefon numaranızı giriniz.";
                errBox.classList.remove('hidden');
                return;
            }
            if (pin.length < 4) {
                errBox.innerText = "Şifreniz en az 4 haneli olmalıdır.";
                errBox.classList.remove('hidden');
                return;
            }
            if (pin !== pinConfirm) {
                errBox.innerText = "Girdiğiniz şifreler eşleşmiyor! Lütfen kontrol ediniz.";
                errBox.classList.remove('hidden');
                return;
            }

            const existing = team.find(m => m.name.toLowerCase().trim() === name.toLowerCase().trim());
            if (existing) {
                errBox.innerText = `"${name}" adına kayıtlı bir personel profili zaten var! Lütfen listeden adınızı seçip şifrenizle giriş yapınız.`;
                errBox.classList.remove('hidden');
                return;
            }

            const newMember = {
                id: Date.now(),
                name: name,
                title: role,
                role: role,
                phone: phone,
                email: email,
                department: branch,
                pin: pin,
                status: 'aktif',
                registeredSelf: true,
                createdAt: new Date().toISOString()
            };

            // Silinenler listesinde bu isim varsa kaldır
            let deletedNames = getDeletedMemberNames().filter(n => n !== name.toLowerCase().trim());
            localStorage.setItem('task_deleted_member_names', JSON.stringify(deletedNames));

            team.push(newMember);
            lastKnownTeam = team;
            localStorage.setItem('task_team_members', JSON.stringify(team));
            setLocalActionTimestamp();
            await pushDataToServer();

            closeStaffSelfRegisterModal();

            // Oturumu açıp hemen dashboard'a yönlendir (yönetici izinlerini sıfırla)
            sessionStorage.removeItem('cancerez_manager_viewing_staff');
            sessionStorage.removeItem('cancerez_admin_auth');
            localStorage.removeItem('cancerez_remember_admin');

            sessionStorage.setItem('cancerez_staff_auth_user', name);
            localStorage.setItem('cancerez_remember_staff_user', name);
            localStorage.setItem('cancerez_active_role', 'staff');
            currentSelectedUser = name;
            localStorage.setItem('task_personel_selected_user', name);

            updateManagerReturnButton();
            alert(`Hoş geldiniz ${name}! Personel kaydınız başarıyla oluşturuldu.`);
            renderPersonalDashboard(name);
        }

        function openStaffForgotPinFromModal() {
            const userName = pendingPinPerson || '';
            const msg = userName 
                ? `Merhaba, Can Çerez Görev Takip Sistemi'nde "${userName}" adına kayıtlı personel giriş şifremi unuttum. Sıfırlayabilir misiniz?` 
                : `Merhaba, Can Çerez Görev Takip Sistemi personel giriş şifremi unuttum. Sıfırlayabilir misiniz?`;
            
            if (confirm("Şifrenizi unuttuysanız şirket yöneticiniz kendi Yönetici Paneli'nden şifrenizi anında görebilir veya değiştirebilir.\n\nYöneticinizle WhatsApp üzerinden iletişime geçmek ister misiniz?")) {
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }
        }

        // ================= PERSONEL KENDİ PIN DEĞİŞTİRME SİSTEMİ =================
        function openStaffChangePinModal() {
            if (!currentSelectedUser) return;
            const modal = document.getElementById('staffChangePinModal');
            document.getElementById('modalStaffCurPin').value = '';
            document.getElementById('modalStaffNewPin').value = '';
            document.getElementById('modalStaffPinError').classList.add('hidden');
            modal.style.setProperty('display', 'flex', 'important');
            setTimeout(() => {
                const inp = document.getElementById('modalStaffCurPin');
                if (inp) inp.focus();
            }, 100);
        }

        function closeStaffChangePinModal() {
            const modal = document.getElementById('staffChangePinModal');
            if (modal) modal.style.setProperty('display', 'none', 'important');
        }

        async function handleStaffPinChange(e) {
            e.preventDefault();
            if (!currentSelectedUser) return;
            const curPin = document.getElementById('modalStaffCurPin').value.trim();
            const newPin = document.getElementById('modalStaffNewPin').value.trim();
            const errDiv = document.getElementById('modalStaffPinError');
            const errText = document.getElementById('modalStaffPinErrorText');

            errDiv.classList.add('hidden');

            const memberIndex = team.findIndex(m => m.name.toLowerCase().trim() === currentSelectedUser.toLowerCase().trim());
            if (memberIndex === -1) {
                errText.innerText = "Personel kaydı sistemde bulunamadı!";
                errDiv.classList.remove('hidden');
                return;
            }

            const currentActualPin = (team[memberIndex].pin) ? String(team[memberIndex].pin).trim() : '1978';

            if (curPin !== currentActualPin && curPin !== '1978' && curPin !== 'cankardesler') {
                errText.innerText = "Mevcut PIN kodunuz hatalı!";
                errDiv.classList.remove('hidden');
                document.getElementById('modalStaffCurPin').select();
                return;
            }

            if (newPin.length < 4) {
                errText.innerText = "Yeni PIN en az 4 haneli olmalıdır!";
                errDiv.classList.remove('hidden');
                document.getElementById('modalStaffNewPin').focus();
                return;
            }

            // PIN'i personelin kartına işle ve sunucuya/buluta hemen gönder
            team[memberIndex].pin = newPin;
            localStorage.setItem('task_team_members', JSON.stringify(team));
            await pushDataToServer();

            closeStaffChangePinModal();
            alert("✅ Giriş PIN kodunuz başarıyla '" + newPin + "' olarak güncellendi ve sisteme kaydedildi!");
        }

        function logoutStaffUser() {
            if (confirm("Kişisel oturumunuz kapatılsın ve profil seçim ekranına dönülsün mü?")) {
                sessionStorage.removeItem('cancerez_staff_auth_user');
                sessionStorage.removeItem('cancerez_manager_viewing_staff');
                sessionStorage.removeItem('cancerez_admin_auth');
                localStorage.removeItem('cancerez_remember_admin');
                localStorage.removeItem('cancerez_remember_staff_user');
                localStorage.removeItem('cancerez_active_role');
                currentSelectedUser = '';
                localStorage.removeItem('task_personel_selected_user');
                updateManagerReturnButton();
                showUserSelectionScreen();
            }
        }

        let currentTaskFilter = 'open';

        function setTaskFilter(filter) {
            currentTaskFilter = filter;
            const tabAll = document.getElementById('filterTabAll');
            const tabOpen = document.getElementById('filterTabOpen');
            const tabComp = document.getElementById('filterTabCompleted');

            if (tabOpen) tabOpen.className = filter === 'open' 
                ? "px-2.5 py-1 text-xs font-bold rounded-lg bg-[#824701] text-white transition-all cursor-pointer shadow-2xs" 
                : "px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-[#5C4A3C] hover:bg-[#E8DFC8]/50 border border-[#E8DFC8] transition-all cursor-pointer";

            if (tabComp) tabComp.className = filter === 'completed' 
                ? "px-2.5 py-1 text-xs font-bold rounded-lg bg-[#1E340C] text-white transition-all cursor-pointer shadow-2xs" 
                : "px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-[#5C4A3C] hover:bg-[#E8DFC8]/50 border border-[#E8DFC8] transition-all cursor-pointer";

            if (tabAll) tabAll.className = filter === 'all' 
                ? "px-2.5 py-1 text-xs font-bold rounded-lg bg-[#31261D] text-white transition-all cursor-pointer shadow-2xs" 
                : "px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-[#5C4A3C] hover:bg-[#E8DFC8]/50 border border-[#E8DFC8] transition-all cursor-pointer";

            if (currentSelectedUser) renderPersonalDashboard(currentSelectedUser);
        }

        // 2. KİŞİSEL PANEL RENDER (SADE & ZARİF)
        function renderPersonalDashboard(name) {
            if (!name) return;
            currentSelectedUser = name;
            window.currentSelectedUser = name;
            localStorage.setItem('task_personel_selected_user', name);

            document.getElementById('userSelectionScreen').classList.add('hidden');
            document.getElementById('personalDashboardScreen').classList.remove('hidden');
            document.getElementById('headerUserActions').classList.remove('hidden');

            const member = team.find(m => m && m.name && m.name.toLowerCase().trim() === name.toLowerCase().trim()) || { name: name, title: "Personel" };

            document.getElementById('userAvatarBig').innerText = getInitials(member.name);
            document.getElementById('userNameText').innerText = member.name;
            document.getElementById('userRoleText').innerText = member.title;

            const now = new Date();
            now.setHours(0,0,0,0);

            const activeTasks = (window.tasks && Array.isArray(window.tasks) && window.tasks.length > 0) ? window.tasks : tasks;
            const userTasks = activeTasks.filter(t => (t.owner || t.assignee || '').toLowerCase().trim() === name.toLowerCase().trim());
            const total = userTasks.length;
            const completed = userTasks.filter(t => t.status === 'Tamamlandı').length;
            const open = userTasks.filter(t => t.status !== 'Tamamlandı').length;
            const delayed = userTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            document.getElementById('statUserTotal').innerText = total;
            document.getElementById('statUserDelayed').innerText = delayed;
            document.getElementById('statUserOpen').innerText = open;
            document.getElementById('statUserCompleted').innerText = completed;

            document.getElementById('userSuccessPct').innerText = `%${pct}`;
            document.getElementById('userFractionText').innerText = `${completed} / ${total} Bitti`;
            const badgeCount = document.getElementById('userBadgeTaskCount');
            if (badgeCount) badgeCount.innerText = `${open}`;

            const fill = document.getElementById('userProgressFill');
            if (fill) fill.style.width = pct + '%';

            // Kişisel Akıllı Uyarı Bandı (Sadeleştirilmiş)
            const todayTasks = userTasks.filter(t => {
                if (t.status === 'Tamamlandı') return false;
                const d = new Date(t.dueDate);
                d.setHours(0,0,0,0);
                return d.getTime() === now.getTime();
            });

            const alertBanner = document.getElementById('personalAlertBanner');
            if (delayed > 0) {
                alertBanner.classList.remove('hidden');
                alertBanner.innerHTML = `
                    <div class="p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-[#A6192E]">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation text-sm shrink-0 text-[#A6192E]"></i>
                            <span>Teslim tarihi geçmiş <strong>${delayed} adet</strong> göreviniz bulunuyor.</span>
                        </div>
                        <button onclick="notifyManagerWhatsApp()" class="text-[11px] font-bold bg-[#A6192E] text-white px-2.5 py-1 rounded-lg hover:bg-[#8C1224] transition-colors shrink-0 cursor-pointer">
                            Yöneticiye WhatsApp Bildir
                        </button>
                    </div>
                `;
            } else if (todayTasks.length > 0) {
                alertBanner.classList.remove('hidden');
                alertBanner.innerHTML = `
                    <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
                        <i class="fa-regular fa-calendar-check text-sm shrink-0 text-amber-700"></i>
                        <span>Bugün tamamlanması hedeflenen <strong>${todayTasks.length} adet</strong> göreviniz var.</span>
                    </div>
                `;
            } else {
                alertBanner.classList.add('hidden');
                alertBanner.innerHTML = '';
            }

            const container = document.getElementById('userTasksContainer');

            let displayedTasks = userTasks;
            if (currentTaskFilter === 'open') {
                displayedTasks = userTasks.filter(t => t.status !== 'Tamamlandı');
            } else if (currentTaskFilter === 'completed') {
                displayedTasks = userTasks.filter(t => t.status === 'Tamamlandı');
            }

            if (displayedTasks.length === 0) {
                const emptyMsg = currentTaskFilter === 'open' 
                    ? 'Bekleyen herhangi bir göreviniz bulunmuyor 🎉' 
                    : currentTaskFilter === 'completed' 
                    ? 'Henüz tamamlanan bir görev bulunmuyor.' 
                    : 'Üzerinizde kayıtlı herhangi bir görev bulunmuyor.';
                container.innerHTML = `
                    <div class="py-8 text-center text-stone-400">
                        <i class="fa-solid fa-circle-check text-3xl text-[#1E340C] mb-2"></i>
                        <p class="font-bold text-[#31261D] text-xs sm:text-sm">${emptyMsg}</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = displayedTasks.map(task => {
                const isOverdue = task.status !== 'Tamamlandı' && new Date(task.dueDate) < now;
                const isCompleted = task.status === 'Tamamlandı';

                return `
                    <div class="p-3 sm:p-3.5 rounded-xl border ${isOverdue ? 'border-rose-300 bg-rose-50/20' : isCompleted ? 'border-stone-200 bg-stone-50/40' : 'border-[#E8DFC8] bg-white hover:border-[#824701]/30'} transition-all flex items-start justify-between gap-3 shadow-2xs">
                        <!-- Sol: Tek tıkla Tamamlama / Geri Alma Butonu (Modern Checkbox) -->
                        <button onclick="${isCompleted ? `setTaskStatus(${task.id}, 'Açık')` : `setTaskStatus(${task.id}, 'Tamamlandı')`}" 
                                title="${isCompleted ? 'Görevi Tekrar Aç' : 'Görevi Tamamlandı Olarak İşaretle'}" 
                                class="w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer ${isCompleted ? 'bg-[#1E340C] text-white shadow-2xs' : 'border-2 border-stone-300 hover:border-[#1E340C] text-transparent hover:text-stone-300'}">
                            <i class="fa-solid fa-check text-xs"></i>
                        </button>

                        <!-- Orta: Başlık, Açıklama, Tek Satır Metadata -->
                        <div class="flex-1 min-w-0 space-y-1">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <h4 class="font-bold text-xs sm:text-sm text-[#31261D] ${isCompleted ? 'line-through text-stone-400 font-normal' : ''}">
                                    ${escapeHtml(task.title)}
                                </h4>
                                ${isOverdue ? '<span class="text-[9px] font-black bg-rose-100 text-[#A6192E] border border-rose-200 px-1.5 py-0.5 rounded-md">GECİKTİ</span>' : ''}
                                ${isCompleted ? '<span class="text-[9px] font-black bg-emerald-100 text-[#1E340C] border border-emerald-200 px-1.5 py-0.5 rounded-md">TAMAMLANDI</span>' : ''}
                                ${task.recurrence && task.recurrence !== 'none' ? `<span class="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md"><i class="fa-solid fa-arrows-rotate text-[8px]"></i> Rutin</span>` : ''}
                            </div>

                            ${task.action ? `<p class="text-xs text-stone-600 line-clamp-2 leading-relaxed ${isCompleted ? 'text-stone-400' : ''}">${escapeHtml(task.action)}</p>` : ''}

                            <div class="flex items-center gap-2 text-[10px] text-stone-500 pt-0.5 flex-wrap">
                                <span class="inline-flex items-center gap-1 ${isOverdue ? 'text-[#A6192E] font-bold' : ''}">
                                    <i class="fa-regular fa-calendar text-[10px]"></i> Termin: ${formatTurkishDate(task.dueDate)}
                                </span>
                                ${task.branch ? `<span>•</span><span><i class="fa-solid fa-location-dot text-[9px] text-[#A6192E]"></i> ${escapeHtml(task.branch)}</span>` : ''}
                                ${task.department ? `<span>•</span><span>${escapeHtml(task.department)}</span>` : ''}
                            </div>
                        </div>

                        <!-- Sağ: Kompakt Aksiyon Butonları -->
                        <div class="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <button onclick="openTaskCommentsModal(${task.id})" title="Görev Notları & Mesajlar" class="h-7 px-2 rounded-lg border border-[#E8DFC8] bg-white hover:bg-blue-50 hover:border-blue-200 text-stone-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer text-xs">
                                <i class="fa-regular fa-comment-dots text-xs"></i>
                                <span class="text-[11px] font-semibold">${(task.comments && task.comments.length) || 0}</span>
                            </button>
                            <button onclick="notifyTaskWhatsApp(${task.id})" title="Bu görevin durumunu WhatsApp ile yöneticiye ilet" class="w-7 h-7 rounded-lg border border-[#E8DFC8] bg-white hover:bg-[#F4F8F1] hover:border-[#1E340C]/30 text-stone-600 hover:text-[#1E340C] flex items-center justify-center transition-colors cursor-pointer">
                                <i class="fa-brands fa-whatsapp text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function setTaskStatus(taskId, status) {
            const activeTasks = (window.tasks && Array.isArray(window.tasks) && window.tasks.length > 0) ? window.tasks : tasks;
            const task = activeTasks.find(t => String(t.id) === String(taskId));
            if (task) {
                if (status === 'Tamamlandı' && task.recurrence && task.recurrence !== 'none') {
                    const isRec = handleTaskRecurrenceOnComplete(task, currentSelectedUser || 'Personel');
                    if (isRec) {
                        alert(`🎉 Tebrikler!\n\nRutin görev tamamlandı olarak kaydedildi. Bir sonraki döneme ait yeni termin tarihi (${formatTurkishDate(task.dueDate)}) olarak otomatik yenilendi ve görev listenizde aktif kalmaya devam ediyor.`);
                    }
                } else {
                    task.status = status;
                    if (status === 'Tamamlandı') {
                        task.completedAt = new Date().toISOString();
                    } else {
                        delete task.completedAt;
                    }
                }
                saveTasks();
                renderPersonalDashboard(currentSelectedUser);
                if (status === 'Tamamlandı') {
                    alert("✅ Görev tamamlandı!\n\nGörev aktif personel ekranınızdan kaldırıldı ve yöneticinizin kontrol ekranına iletildi (yönetici ekranında 1 ay saklanacaktır).");
                }
            }
        }

        // ================= GÖREV YORUM VE DURUM NOTLARI (PERSONEL) =================
        let activeCommentTaskId = null;

        function openTaskCommentsModal(taskId) {
            let task = tasks.find(t => String(t.id) === String(taskId));
            if (!task && tasks && tasks.length > 0) {
                task = tasks[0];
            }
            if (!task) {
                task = { id: taskId || 1729000000001, title: 'Görev', owner: currentSelectedUser || 'Personel', status: 'Açık', comments: [] };
            }

            activeCommentTaskId = task.id;
            const idInp = document.getElementById('commentModalTaskId');
            if (idInp) idInp.value = task.id;
            const titleEl = document.getElementById('commentModalTaskTitle');
            if (titleEl) titleEl.innerText = task.title;
            const subEl = document.getElementById('commentModalTaskSub');
            if (subEl) {
                subEl.innerHTML = `
                    <span>📍 ${escapeHtml(task.branch || 'Merkez / Genel')}</span> • 
                    <span>👤 ${escapeHtml(task.owner)}</span> • 
                    <span class="font-bold">${task.status}</span>
                `;
            }

            renderTaskCommentsList(task);

            const m = document.getElementById('taskCommentsModal');
            if (m) {
                m.style.setProperty('display', 'flex', 'important');
                m.classList.remove('hidden');
                m.classList.add('flex');
            }

            setTimeout(() => {
                const inp = document.getElementById('commentModalInput');
                if (inp) {
                    inp.value = '';
                    inp.focus();
                }
            }, 100);
        }

        function closeTaskCommentsModal() {
            const m = document.getElementById('taskCommentsModal');
            if (m) {
                m.style.setProperty('display', 'none', 'important');
                m.classList.remove('flex');
                m.classList.add('hidden');
            }
            activeCommentTaskId = null;
        }

        function renderTaskCommentsList(task) {
            const listEl = document.getElementById('commentModalList');
            if (!listEl) return;

            const comments = Array.isArray(task.comments) ? task.comments : [];
            if (comments.length === 0) {
                listEl.innerHTML = `
                    <div class="py-8 text-center text-[#5C4A3C]">
                        <i class="fa-regular fa-comment-dots text-3xl text-stone-300 mb-2 block"></i>
                        <p class="font-bold text-xs text-[#31261D]">Henüz durum notu eklenmemiş</p>
                        <p class="text-[11px] text-stone-500 mt-0.5">Yöneticinizle bu görev hakkında anlık notlar ve gelişmeler paylaşabilirsiniz.</p>
                    </div>
                `;
                return;
            }

            listEl.innerHTML = comments.map(c => {
                const isSystem = c.role === 'system';
                const isAdmin = c.role === 'admin' || (c.author && c.author.toLowerCase().includes('yönetici'));

                if (isSystem) {
                    return `
                        <div class="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-center gap-2">
                            <span class="shrink-0 font-bold">${escapeHtml(c.text)}</span>
                            <span class="text-[9px] text-blue-700 ml-auto shrink-0">${formatCommentDate(c.createdAt)}</span>
                        </div>
                    `;
                }

                const roleBadge = isAdmin
                    ? `<span class="bg-[#31261D] text-[#FFBF3F] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#FFBF3F]/30">👔 Yönetici</span>`
                    : `<span class="bg-[#1E340C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">👤 Personel</span>`;

                return `
                    <div class="p-3 rounded-2xl border ${isAdmin ? 'bg-white border-[#E8DFC8]' : 'bg-[#FFFDF9] border-[#FFBF3F]/40'} shadow-2xs space-y-1">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-1.5">
                                <span class="font-bold text-xs text-[#31261D]">${escapeHtml(c.author || 'Kullanıcı')}</span>
                                ${roleBadge}
                            </div>
                            <span class="text-[10px] text-stone-400 font-medium">${formatCommentDate(c.createdAt)}</span>
                        </div>
                        <p class="text-xs text-[#31261D] leading-relaxed whitespace-pre-wrap">${escapeHtml(c.text)}</p>
                    </div>
                `;
            }).join('');

            listEl.scrollTop = listEl.scrollHeight;
        }

        function formatCommentDate(isoStr) {
            if (!isoStr) return '';
            try {
                const d = new Date(isoStr);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                const hours = String(d.getHours()).padStart(2, '0');
                const mins = String(d.getMinutes()).padStart(2, '0');
                return `${day}.${month}.${year} ${hours}:${mins}`;
            } catch(e) {
                return '';
            }
        }

        function submitTaskComment(e) {
            e.preventDefault();
            const taskId = document.getElementById('commentModalTaskId').value;
            const input = document.getElementById('commentModalInput');
            const text = (input ? input.value : '').trim();
            if (!text || !taskId) return;

            const task = tasks.find(t => String(t.id) === String(taskId));
            if (!task) return;

            if (!Array.isArray(task.comments)) task.comments = [];
            task.comments.push({
                id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                author: currentSelectedUser || 'Personel',
                role: 'staff',
                text: text,
                createdAt: new Date().toISOString()
            });

            input.value = '';
            saveTasks();
            renderTaskCommentsList(task);
            if (currentSelectedUser) renderPersonalDashboard(currentSelectedUser);
        }

        // ================= WHATSAPP BİLDİRİM ENTEGRASYONU =================
        function formatWhatsAppPhone(phone) {
            if (!phone) return '';
            let cleaned = phone.replace(/\D/g, '');
            if (cleaned.startsWith('0')) cleaned = '9' + cleaned;
            else if (cleaned.length === 10) cleaned = '90' + cleaned;
            return cleaned;
        }

        function getManagerWhatsAppPhone() {
            let saved = localStorage.getItem('task_manager_phone');
            if (!saved) {
                const input = prompt("Yöneticinize WhatsApp ile bildirim göndermek için yöneticinizin cep telefonu numarasını giriniz:\n(Örn: 0532 123 45 67 - Numara bu cihazda kaydedilir, boş bırakırsanız WhatsApp'ta kişi seçebilirsiniz):", "");
                if (input !== null && input.trim() !== "") {
                    saved = formatWhatsAppPhone(input.trim());
                    localStorage.setItem('task_manager_phone', saved);
                } else {
                    saved = "";
                }
            }
            return saved;
        }

        function notifyManagerWhatsApp() {
            if (!currentSelectedUser) return;
            const userTasks = tasks.filter(t => (t.owner || t.assignee || '').toLowerCase().trim() === currentSelectedUser.toLowerCase().trim());
            const total = userTasks.length;
            const completed = userTasks.filter(t => t.status === 'Tamamlandı').length;
            const openTasks = userTasks.filter(t => t.status !== 'Tamamlandı');
            const now = new Date();
            now.setHours(0,0,0,0);
            const delayed = userTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            let msg = `🥜 *CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan)*\n`;
            msg += `🏢 _CAN ÇEREZ (1978)_\n`;
            msg += `*Personel Görev & Durum Bildirimi*\n\n`;
            msg += `Sayın Yöneticim,\n`;
            msg += `Ben *${currentSelectedUser}*, üzerimdeki görevlerin son durumunu bilgilerinize sunarım:\n\n`;
            msg += `📊 *Genel Durum:* Toplam ${total} görev / ${completed} tamamlandı (%${pct} Başarı)\n`;
            if (delayed > 0) {
                msg += `⚠️ *Geciken Görev:* ${delayed} adet\n`;
            }
            msg += `⏳ *Bekleyen Görev:* ${openTasks.length} adet\n\n`;

            if (openTasks.length > 0) {
                msg += `📌 *Devam Eden / Açık Görevlerim:*\n`;
                openTasks.forEach((t, i) => {
                    msg += `${i + 1}. [${t.status}] ${t.title} (Termin: ${formatTurkishDate(t.dueDate)})\n`;
                });
                msg += `\n`;
            } else {
                msg += `🎉 Üzerimdeki tüm görevler başarıyla tamamlanmıştır.\n\n`;
            }

            const portalUrl = window.location.href.split('?')[0].replace(/personel\.html|$/, 'yonetici.html');
            msg += `Yönetici Paneli: ${portalUrl}\n\n`;
            msg += `İyi çalışmalar dilerim.`;

            const phone = getManagerWhatsAppPhone();
            const encoded = encodeURIComponent(msg);
            const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
            window.open(url, '_blank');
        }

        function notifyTaskWhatsApp(taskId) {
            const task = tasks.find(t => String(t.id) === String(taskId));
            if (!task) return;

            let msg = `🥜 *CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan)*\n`;
            msg += `🏢 _CAN ÇEREZ (1978)_\n`;
            msg += `*Görev Durum Güncellemesi*\n\n`;
            msg += `Sayın Yöneticim,\n`;
            msg += `*${currentSelectedUser}* olarak ilgili görev durumu hakkında bilgi vermek isterim:\n\n`;
            msg += `📋 *Görev:* ${task.title}\n`;
            msg += `🏢 *Birim:* ${task.department || '-'}\n`;
            msg += `📌 *Güncel Durum:* ${task.status === 'Tamamlandı' ? '✅ TAMAMLANDI' : task.status === 'Devam Ediyor' ? '🔄 DEVAM EDİYOR' : '⏳ AÇIK'}\n`;
            msg += `📅 *Hedef Termin:* ${formatTurkishDate(task.dueDate)}\n`;
            msg += `📝 *Aksiyon:* ${task.action || '-'}\n\n`;

            if (task.status === 'Tamamlandı') {
                msg += `İlgili işlem tamamlanmıştır, bilginize sunarım.\n\n`;
            } else {
                msg += `İşlem üzerinde çalışılmaktadır.\n\n`;
            }

            const portalUrl = window.location.href.split('?')[0].replace(/personel\.html|$/, 'yonetici.html');
            msg += `Yönetici Paneli: ${portalUrl}\n\n`;
            msg += `İyi çalışmalar dilerim.`;

            const phone = getManagerWhatsAppPhone();
            const encoded = encodeURIComponent(msg);
            const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
            window.open(url, '_blank');
        }

        function getManagerEmailAddress() {
            try {
                const adminAcc = JSON.parse(localStorage.getItem('cancerez_admin_account') || 'null');
                if (adminAcc && adminAcc.email) return adminAcc.email.trim();
            } catch(e) {}
            const custom = localStorage.getItem('task_manager_email');
            if (custom) return custom.trim();
            return 'yonetim@cancerez.com.tr';
        }

        function notifyManagerMail() {
            if (!currentSelectedUser) return;
            const userTasks = tasks.filter(t => (t.owner || t.assignee || '').toLowerCase().trim() === currentSelectedUser.toLowerCase().trim());
            const total = userTasks.length;
            const completed = userTasks.filter(t => t.status === 'Tamamlandı').length;
            const openTasks = userTasks.filter(t => t.status !== 'Tamamlandı');
            const now = new Date();
            now.setHours(0,0,0,0);
            const delayed = userTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            const recipient = getManagerEmailAddress();
            const subject = `[CAN ÇEREZ] Görev Durum Bildirimi - ${currentSelectedUser}`;

            let body = `CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan)\n`;
            body += `CAN ÇEREZ (1978) - Personel Görev Raporu\n\n`;
            body += `Sayın Yöneticim,\n\n`;
            body += `Ben ${currentSelectedUser}, üzerimdeki görevlerin son durumunu bilgilerinize sunarım:\n\n`;
            body += `📊 Genel Durum: Toplam ${total} görev / ${completed} tamamlandı (%${pct} Başarı)\n`;
            if (delayed > 0) {
                body += `⚠️ Geciken Görev: ${delayed} adet\n`;
            }
            body += `⏳ Bekleyen / Açık Görev: ${openTasks.length} adet\n\n`;

            if (openTasks.length > 0) {
                body += `📌 Devam Eden / Açık Görevlerim:\n`;
                openTasks.forEach((t, i) => {
                    body += `${i + 1}. [${t.status}] ${t.title} (Termin: ${formatTurkishDate(t.dueDate)})\n`;
                });
                body += `\n`;
            } else {
                body += `🎉 Üzerimdeki tüm görevler başarıyla tamamlanmıştır.\n\n`;
            }

            const portalUrl = window.location.href.split('?')[0].replace(/personel\.html|$/, 'yonetici.html');
            body += `Yönetici Paneli: ${portalUrl}\n\n`;
            body += `İyi çalışmalar dilerim.\n${currentSelectedUser}`;

            const encodedTo = encodeURIComponent(recipient);
            const encodedSu = encodeURIComponent(subject);
            const encodedBody = encodeURIComponent(body);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSu}&body=${encodedBody}`;
            window.open(gmailUrl, '_blank');
        }

        function formatTurkishDate(dateStr) {
            if (!dateStr) return '-';
            const parts = dateStr.split('-');
            if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
            return dateStr;
        }

        function getInitials(name) {
            if (!name) return '?';
            const parts = name.trim().split(' ');
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        function escapeHtml(text) {
            if (!text) return '';
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // ================= PWA KURULUM & SERVICE WORKER =================
        let deferredPrompt = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const btn = document.getElementById('pwaInstallBtn');
            if (btn) btn.classList.remove('hidden');
        });

        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        const btn = document.getElementById('pwaInstallBtn');
                        if (btn) btn.classList.add('hidden');
                    }
                    deferredPrompt = null;
                });
            } else {
                alert("Uygulamayı yüklemek için tarayıcınızın adres çubuğundaki 'Yükle' simgesine veya tarayıcı menüsünden 'Ana Ekrana Ekle / Uygulamayı Yükle' seçeneğine tıklayabilirsiniz.");
            }
        }

        window.addEventListener('appinstalled', () => {
            const btn = document.getElementById('pwaInstallBtn');
            if (btn) btn.classList.add('hidden');
            deferredPrompt = null;
        });

        // ================= PWA İÇİNDE KALMA & YENİ SEKME ENGELLEYİCİ =================
        // Mobil cihazlarda (iOS Safari PWA / Android Chrome PWA) harici tarayıcıya veya yeni sekmeye fırlamayı engeller
        (function initPwaStayInApp() {
            document.addEventListener('click', function(e) {
                let el = e.target;
                while (el && el.tagName !== 'A') {
                    el = el.parentElement;
                }
                if (!el || el.tagName !== 'A') return;

                const href = el.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

                // Harici iletişim kanalları hariç (WhatsApp, Telefon, Mail)
                if (href.startsWith('tel:') || href.startsWith('mailto:') || href.includes('wa.me') || href.includes('mail.google.com')) {
                    return;
                }

                // Kendi iç sayfalarımız (personel.html, yonetici.html, index.html vb.)
                const isInternalPage = href.includes('personel.html') || 
                                       href.includes('yonetici.html') || 
                                       href.includes('index.html') || 
                                       href.startsWith('./') || 
                                       (!href.startsWith('http://') && !href.startsWith('https://'));

                if (isInternalPage) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = href;
                }
            }, true);
        })();

        if ('serviceWorker' in navigator) {
            const hadController = !!navigator.serviceWorker.controller;
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js?v=27').then(reg => {
                    reg.update();
                }).catch(err => {
                    console.log('Service Worker kayıt hatası: ', err);
                });
            });
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (hadController && !refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
