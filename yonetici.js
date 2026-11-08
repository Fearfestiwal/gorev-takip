        // ================= YÖNETİM ARAÇLARI MENÜSÜ AÇ/KAPAT =================
        function toggleAdminQuickToolsMenu(e) {
            if (e) {
                e.stopPropagation();
            }
            const menu = document.getElementById('adminQuickToolsDropdown');
            const chevron = document.getElementById('toolsMenuChevron');
            if (!menu) return;
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                menu.classList.add('hidden');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        }

        function closeAdminQuickToolsMenu() {
            const menu = document.getElementById('adminQuickToolsDropdown');
            const chevron = document.getElementById('toolsMenuChevron');
            if (menu) menu.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }

        // Tıklama menü dışındaysa otomatik kapat
        document.addEventListener('click', function(e) {
            const wrapper = document.getElementById('adminQuickToolsWrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                closeAdminQuickToolsMenu();
            }
        });

        // ESC tuşuna basıldığında menüyü kapat
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeAdminQuickToolsMenu();
            }
        });

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
                author: actorRoleName || 'Yönetici',
                role: 'system',
                text: `🔄 [${recurrenceLabel} Rutin] Görev başarıyla tamamlandı. Bir sonraki döneme ait yeni termin: ${formatTurkishDate(nextDueDate)} olarak güncellendi.`,
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

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            tasks = DEFAULT_INIT_TASKS;
            localStorage.setItem('task_items', JSON.stringify(tasks));
        }
        window.tasks = tasks;

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

        if (!team || !Array.isArray(team) || team.length === 0) {
            team = DEFAULT_INIT_TEAM;
            localStorage.setItem('task_team_members', JSON.stringify(team));
        }
        window.team = team;

        // ================= CAN ÇEREZ ŞUBELERİ & FABRİKA BİRİMLERİ =================
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

        let activePage = 1;
        let viewMode = "table";
        let currentEmailPersonName = "";

        const CLOUD_DB_URL = localStorage.getItem('cancerez_cloud_db_url') || "https://extendsclass.com/api/json-storage/bin/aecadfa";
        let lastLocalActionTime = parseInt(localStorage.getItem('cancerez_last_local_action') || '0', 10);
        let pushInProgress = false;

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
                    console.log("CAN ÇEREZ - Supabase 7/24 Bulut Motoru Başlatıldı!");
                    setupSupabaseRealtime();
                    updateSupabaseStatusUI(true);
                    return true;
                } catch(e) {
                    console.warn("Supabase başlatma hatası:", e);
                    supabaseClient = null;
                    updateSupabaseStatusUI(false);
                    return false;
                }
            } else {
                supabaseClient = null;
                updateSupabaseStatusUI(false);
                return false;
            }
        }

        function setupSupabaseRealtime() {
            if (!supabaseClient) return;
            try {
                if (supabaseRealtimeChannel) {
                    supabaseClient.removeChannel(supabaseRealtimeChannel);
                }
                supabaseRealtimeChannel = supabaseClient.channel('cancerez_manager_realtime')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'cancerez_tasks' }, (payload) => {
                        syncWithServer();
                        if (payload && payload.new && payload.new.title) {
                            triggerSystemNotification("CAN ÇEREZ (1978)", `Görev Güncellemesi: ${payload.new.title} (${payload.new.status || 'Aktif'})`);
                        }
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'cancerez_team' }, (payload) => {
                        syncWithServer();
                        if (payload && payload.new && payload.new.name) {
                            triggerSystemNotification("CAN ÇEREZ (1978)", `Personel Güncellemesi: ${payload.new.name}`);
                        }
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'cancerez_settings' }, () => {
                        syncWithServer();
                    })
                    .subscribe();
            } catch(e) {
                console.warn("Realtime abonelik hatası:", e);
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

                const deletedNames = getDeletedMemberNames();
                if (deletedNames.length > 0) {
                    await supabaseClient.from('cancerez_team').delete().in('name', deletedNames);
                }

                const settingsRows = [
                    { key: 'admin_notes', value: rawData.notes || '', updated_at: new Date().toISOString() },
                    { key: 'admin_password', value: rawData.adminPassword || '1978', updated_at: new Date().toISOString() },
                    { key: 'deleted_ids', value: JSON.stringify(rawData.deletedIds || getDeletedTaskIds()), updated_at: new Date().toISOString() },
                    { key: 'deleted_member_names', value: JSON.stringify(rawData.deletedMemberNames || getDeletedMemberNames()), updated_at: new Date().toISOString() }
                ];
                if (Array.isArray(rawData.branches) && rawData.branches.length > 0) {
                    settingsRows.push({ key: 'branches', value: JSON.stringify(rawData.branches), updated_at: new Date().toISOString() });
                }
                if (Array.isArray(rawData.departments) && rawData.departments.length > 0) {
                    settingsRows.push({ key: 'departments', value: JSON.stringify(rawData.departments), updated_at: new Date().toISOString() });
                }
                await supabaseClient.from('cancerez_settings').upsert(settingsRows, { onConflict: 'key' });

                return true;
            } catch(e) {
                console.warn("Supabase push exception:", e);
                return false;
            }
        }

        async function saveAndTestSupabaseConfig() {
            const url = (document.getElementById('supabaseUrlInput')?.value || '').trim();
            const key = (document.getElementById('supabaseKeyInput')?.value || '').trim();

            if (!url || !key) {
                alert("Lütfen hem Supabase Project URL hem de anon public key giriniz.");
                return;
            }

            try {
                if (!window.supabase) throw new Error("Supabase kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol ediniz.");
                const testClient = window.supabase.createClient(url, key, { auth: { persistSession: false } });
                const testRes = await testClient.from('cancerez_tasks').select('id').limit(1);
                
                if (testRes.error) {
                    if (testRes.error.message && testRes.error.message.includes('cancerez_tasks')) {
                        alert("⚠️ Supabase bağlantısı kuruldu ancak tablolar henüz oluşturulmamış!\n\nLütfen Supabase panelindeki SQL Editor kısmında sana verdiğim Güvenlik Duvarı SQL kodunu yapıştırıp 'Run' butonuna basınız.");
                    } else {
                        throw testRes.error;
                    }
                }

                localStorage.setItem('cancerez_supabase_url', url);
                localStorage.setItem('cancerez_supabase_key', key);
                initSupabase();
                await pushDataToServer();
                updateSupabaseStatusUI(true);
                alert("🎉 TEBRİKLER!\n\nSupabase 7/24 Bulut Veritabanı başarıyla bağlandı ve verileriniz buluta eşitlendi.\n\nArtık bilgisayarınız kapalıyken bile personeller şubelerden işlem yapabilir ve her şey canlı olarak güncellenir.");
            } catch(err) {
                alert("Supabase Bağlantı Hatası: " + (err.message || String(err)) + "\n\nLütfen URL ve Key değerlerinizi kontrol ediniz.");
            }
        }

        function copyStaffSetupLink() {
            const cfg = getSupabaseConfig();
            if (!cfg.url || !cfg.key) {
                alert("Önce geçerli bir Supabase URL ve Key girip 'Bağlan & Kaydet' butonuna basınız.");
                return;
            }
            const baseUrl = window.location.href.split('?')[0].replace(/yonetici\.html|$/, 'personel.html');
            const payload = btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
            const setupLink = `${baseUrl}#cloud_setup=${payload}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(setupLink).then(() => {
                    alert("📋 Personel Otomatik Kurulum Linki Kopyalandı!\n\nBu linki personellerinize WhatsApp'tan gönderebilir veya şube cihazlarında 1 kez açabilirsiniz. Açıldığı an o cihaz hiçbir şifre sormadan otomatik olarak bu bulut veritabanına bağlanacaktır.");
                }).catch(() => {
                    prompt("Personel Kurulum Linkini Kopyalayın:", setupLink);
                });
            } else {
                prompt("Personel Kurulum Linkini Kopyalayın:", setupLink);
            }
        }

        function disconnectSupabase() {
            if (confirm("Supabase bulut bağlantısını kaldırmak ve yerel hafıza moduna dönmek istediğinize emin misiniz?")) {
                localStorage.removeItem('cancerez_supabase_url');
                localStorage.removeItem('cancerez_supabase_key');
                if (supabaseRealtimeChannel && supabaseClient) {
                    supabaseClient.removeChannel(supabaseRealtimeChannel);
                }
                supabaseClient = null;
                const uInp = document.getElementById('supabaseUrlInput');
                const kInp = document.getElementById('supabaseKeyInput');
                if (uInp) uInp.value = '';
                if (kInp) kInp.value = '';
                updateSupabaseStatusUI(false);
                alert("Bulut bağlantısı kaldırıldı. Sistem yerel hafıza moduna geçti.");
            }
        }

        function updateSupabaseStatusUI(online) {
            const pill = document.getElementById('supabaseStatusPill');
            const urlInp = document.getElementById('supabaseUrlInput');
            const keyInp = document.getElementById('supabaseKeyInput');
            const cfg = getSupabaseConfig();

            if (urlInp && !urlInp.value && cfg.url) urlInp.value = cfg.url;
            if (keyInp && !keyInp.value && cfg.key) keyInp.value = cfg.key;

            if (pill) {
                if (online || (cfg.url && cfg.key && supabaseClient)) {
                    pill.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
                    pill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span> 7/24 Supabase Aktif';
                } else {
                    pill.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-stone-200 text-stone-600";
                    pill.innerText = "Bağlı Değil";
                }
            }
        }

        function isLocalEnvironment() {
            return window.location.protocol.startsWith('http') && 
                   (window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.port === '8080');
        }

        function updateServerStatusBadge(online) {
            const badge = document.getElementById('serverStatusBadge');
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
            // Son 6 saniye içinde yerel işlem yapıldıysa veya buluta veri gönderme işlemi devam ediyorsa ezilmeyi önle (manuel yenilemede pas geç)
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
                        // Silinmiş görevleri sunucudan tekrar gelse bile içeri alma
                        const validServerTasks = data.tasks.filter(t => !deletedIds.includes(String(t.id)));
                        const normalizedServerTasks = normalizeTasks(validServerTasks);
                        const serverTasksStr = JSON.stringify(normalizedServerTasks);
                        if (serverTasksStr !== JSON.stringify(tasks)) {
                            tasks = normalizedServerTasks;
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
                            updateTeamDatalist();
                            renderTeamCards();
                            changed = true;
                        }
                        // Yerelde olup sunucuda henüz bulunmayan üyeler varsa, bulutu da güncelle
                        if (data.team.length < team.length) {
                            pushDataToServer();
                        }
                    }

                    const noteInput = document.getElementById('managementNotes');
                    if (data.notes !== undefined && noteInput && document.activeElement !== noteInput) {
                        if (noteInput.value !== data.notes) {
                            noteInput.value = data.notes;
                            localStorage.setItem('task_management_notes', data.notes);
                        }
                    }

                    if (data.adminPassword) {
                        const localAdminPass = localStorage.getItem('cancerez_admin_password');
                        if (localAdminPass !== data.adminPassword) {
                            localStorage.setItem('cancerez_admin_password', data.adminPassword);
                        }
                    }

                    if (Array.isArray(data.branches) && data.branches.length > 0) {
                        const sBranches = data.branches;
                        if (JSON.stringify(sBranches) !== JSON.stringify(window.branches)) {
                            window.branches = sBranches;
                            branches = sBranches;
                            localStorage.setItem('task_branches', JSON.stringify(branches));
                            refreshBranchAndDepartmentSelects();
                            calculateAndRenderBranchLeague();
                            changed = true;
                        }
                    }

                    if (Array.isArray(data.departments) && data.departments.length > 0) {
                        const sDepts = data.departments;
                        if (JSON.stringify(sDepts) !== JSON.stringify(window.departments)) {
                            window.departments = sDepts;
                            departments = sDepts;
                            localStorage.setItem('task_departments', JSON.stringify(departments));
                            refreshBranchAndDepartmentSelects();
                            changed = true;
                        }
                    }

                    if (changed) {
                        renderApp();
                        if (activeCommentTaskId) {
                            const curTask = tasks.find(t => String(t.id) === String(activeCommentTaskId));
                            if (curTask) renderTaskCommentsList(curTask);
                        }
                    }
                    updateServerStatusBadge(true);
                    if (isManual) alert("Veriler başarıyla eşitlendi!");
                } else {
                    updateServerStatusBadge(false);
                    if (isManual) alert("Sunucu ile iletişim kurulamadı. Verileriniz yerel hafızada (tarayıcınızda) güvenle tutulmaktadır.");
                }
            } catch (err) {
                updateServerStatusBadge(false);
                if (isManual) alert("Eşitleme sırasında hata oluştu. Yerel verileriniz korunmaktadır.");
            }
        }

        async function pushDataToServer() {
            pushInProgress = true;
            lastLocalActionTime = Date.now();

            const rawData = {
                tasks: tasks,
                team: team,
                branches: window.branches || DEFAULT_BRANCHES,
                departments: window.departments || DEFAULT_DEPARTMENTS,
                notes: document.getElementById('managementNotes')?.value || localStorage.getItem('task_management_notes') || '',
                adminPassword: localStorage.getItem('cancerez_admin_password') || '1978',
                deletedIds: getDeletedTaskIds(),
                deletedMemberNames: getDeletedMemberNames()
            };

            if (supabaseClient) {
                try {
                    await pushToSupabase(rawData);
                    updateServerStatusBadge(true);
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
                if (res.ok) updateServerStatusBadge(true);
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

        // ================= YÖNETİCİ KİLİT & ŞİFRE SİSTEMİ =================
        function checkAdminAuth() {
            const role = localStorage.getItem('cancerez_active_role');
            const isStaff = role === 'staff';
            // Yönetici paneline girişte yetki kontrolü: Bu oturumda şifre doğrulanmamışsa şifre ekranı açık kalmalıdır
            const isAuth = !isStaff && sessionStorage.getItem('cancerez_admin_auth') === 'true';
            const overlay = document.getElementById('adminAuthOverlay');
            if (isAuth) {
                if (overlay) {
                    overlay.style.setProperty('display', 'none', 'important');
                    overlay.classList.remove('flex');
                    overlay.classList.add('hidden');
                }
            } else {
                if (overlay) {
                    overlay.style.setProperty('display', 'flex', 'important');
                    overlay.classList.remove('hidden');
                    overlay.classList.add('flex');
                    setTimeout(() => {
                        const inp = document.getElementById('adminPassInput');
                        if (inp) {
                            inp.value = '';
                            inp.focus();
                        }
                    }, 100);
                }
            }
        }

        function toggleAdminOverlayRemember() {
            const inp = document.getElementById('adminOverlayRememberMe');
            const icon = document.getElementById('adminOverlayRememberIcon');
            const subtext = document.getElementById('adminOverlayRememberSubtext');
            const sw = document.getElementById('adminOverlayRememberSwitch');
            const knob = document.getElementById('adminOverlayRememberKnob');
            const isChecked = inp.value === 'true';
            const newVal = !isChecked;
            inp.value = newVal ? 'true' : 'false';

            if (newVal) {
                sw.className = "w-10 h-5.5 bg-[#1E340C] rounded-full p-0.5 transition-colors flex items-center";
                knob.className = "w-4.5 h-4.5 bg-white rounded-full shadow-sm transform translate-x-4.5 transition-transform flex items-center justify-center text-[8px] text-[#1E340C] font-black";
                knob.innerHTML = '<i class="fa-solid fa-check"></i>';
                icon.className = "w-7 h-7 rounded-lg bg-[#1E340C] text-[#FFBF3F] flex items-center justify-center text-xs shadow-xs";
                subtext.innerText = "Bu cihazda oturumu sürekli açık tut";
            } else {
                sw.className = "w-10 h-5.5 bg-stone-600 rounded-full p-0.5 transition-colors flex items-center";
                knob.className = "w-4.5 h-4.5 bg-white rounded-full shadow-sm transform translate-x-0 transition-transform flex items-center justify-center text-[8px] text-stone-600 font-black";
                knob.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                icon.className = "w-7 h-7 rounded-lg bg-stone-700 text-stone-400 flex items-center justify-center text-xs shadow-xs";
                subtext.innerText = "Her açılışta şifre sorulsun";
            }
        }

        function handleAdminLogin(e) {
            if (e) e.preventDefault();
            const input = document.getElementById('adminPassInput');
            const entered = (input ? input.value : '').trim();
            const actualPass = localStorage.getItem('cancerez_admin_password') || '1978';

            // '1978', kullanıcının belirlediği şifre veya 'cankardesler' (kurtarma anahtarı)
            // Şifre boş girilemez; personel boş basıp geçemez!
            if (entered && (entered === actualPass || entered === '1978' || entered === 'cankardesler')) {
                const remEl = document.getElementById('adminOverlayRememberMe');
                const rememberMe = remEl ? (remEl.value === 'true') : true;

                sessionStorage.setItem('cancerez_admin_auth', 'true');
                localStorage.setItem('cancerez_active_role', 'admin');
                if (rememberMe) {
                    localStorage.setItem('cancerez_remember_admin', 'true');
                } else {
                    localStorage.removeItem('cancerez_remember_admin');
                }

                const overlay = document.getElementById('adminAuthOverlay');
                if (overlay) {
                    overlay.style.setProperty('display', 'none', 'important');
                    overlay.classList.remove('flex');
                    overlay.classList.add('hidden');
                }
                const err = document.getElementById('adminAuthError');
                if (err) {
                    err.style.setProperty('display', 'none', 'important');
                    err.classList.add('hidden');
                }
                if (input) input.value = '';
            } else {
                const err = document.getElementById('adminAuthError');
                if (err) {
                    err.innerText = entered ? "Hatalı yönetici şifresi! Lütfen tekrar deneyiniz." : "Lütfen yönetici şifrenizi giriniz.";
                    err.style.setProperty('display', 'block', 'important');
                    err.classList.remove('hidden');
                }
                if (input) input.select();
            }
        }

        function goToPersonnelScreen() {
            // Personel ekranına geçerken yönetici oturumunu sıfırla, böylece geri dönmek için her seferinde tekrar şifre istesin!
            sessionStorage.removeItem('cancerez_admin_auth');
            sessionStorage.removeItem('cancerez_manager_viewing_staff');
            localStorage.setItem('cancerez_active_role', 'staff');
            window.location.href = 'personel.html';
        }

        function toggleAdminPassVisibility() {
            const inp = document.getElementById('adminPassInput');
            const eye = document.getElementById('adminPassEye');
            if (!inp || !eye) return;
            if (inp.type === 'password') {
                inp.type = 'text';
                eye.className = 'fa-solid fa-eye-slash';
            } else {
                inp.type = 'password';
                eye.className = 'fa-solid fa-eye';
            }
        }

        function logoutAdmin() {
            if (confirm("Yönetici oturumunu kapatıp giriş portalına dönmek istiyor musunuz?")) {
                sessionStorage.removeItem('cancerez_admin_auth');
                sessionStorage.removeItem('cancerez_manager_viewing_staff');
                localStorage.removeItem('cancerez_remember_admin');
                localStorage.removeItem('cancerez_active_role');
                window.location.href = 'index.html?logout=true';
            }
        }

        // ================= YÖNETİCİ ŞİFRE DEĞİŞTİRME SİSTEMİ =================
        function openChangePasswordModal() {
            const modal = document.getElementById('changePasswordModal');
            if (!modal) return;
            document.getElementById('modalCurrentPass').value = '';
            document.getElementById('modalNewPass').value = '';
            document.getElementById('modalNewPassConfirm').value = '';
            const err = document.getElementById('modalPassError');
            if (err) err.classList.add('hidden');
            const sc = document.getElementById('modalPassSuccess');
            if (sc) sc.classList.add('hidden');
            modal.style.setProperty('display', 'flex', 'important');
            setTimeout(() => {
                const inp = document.getElementById('modalCurrentPass');
                if (inp) inp.focus();
            }, 100);
        }

        function closeChangePasswordModal() {
            const modal = document.getElementById('changePasswordModal');
            if (modal) modal.style.setProperty('display', 'none', 'important');
        }

        function promptChangeAdminPassword() {
            openChangePasswordModal();
        }

        async function handleAdminPasswordChange(e) {
            e.preventDefault();
            const curInput = document.getElementById('modalCurrentPass').value.trim();
            const newPass = document.getElementById('modalNewPass').value.trim();
            const newPassConfirm = document.getElementById('modalNewPassConfirm').value.trim();
            const errDiv = document.getElementById('modalPassError');
            const errText = document.getElementById('modalPassErrorText');
            const scDiv = document.getElementById('modalPassSuccess');

            errDiv.classList.add('hidden');
            scDiv.classList.add('hidden');

            const currentActual = localStorage.getItem('cancerez_admin_password') || '1978';

            if (curInput !== currentActual && curInput !== '1978' && curInput !== 'cankardesler') {
                errText.innerText = "Mevcut yönetici şifreniz hatalı!";
                errDiv.classList.remove('hidden');
                document.getElementById('modalCurrentPass').select();
                return;
            }

            if (newPass.length < 4) {
                errText.innerText = "Yeni şifre en az 4 karakter olmalıdır!";
                errDiv.classList.remove('hidden');
                document.getElementById('modalNewPass').focus();
                return;
            }

            if (newPass !== newPassConfirm) {
                errText.innerText = "Yeni şifreler birbiriyle uyuşmuyor! Lütfen kontrol ediniz.";
                errDiv.classList.remove('hidden');
                document.getElementById('modalNewPassConfirm').focus();
                return;
            }

            // Yerel hafızaya kaydet ve buluta / yerel sunucuya hemen eşitle
            localStorage.setItem('cancerez_admin_password', newPass);
            await pushDataToServer();

            scDiv.classList.remove('hidden');
            setTimeout(() => {
                closeChangePasswordModal();
                alert("✅ Yönetici giriş şifreniz başarıyla '" + newPass + "' olarak güncellendi ve tüm cihazlarınıza eşitlendi!");
            }, 600);
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
                        }
                    }
                } catch(e) {
                    console.warn("Cloud setup hash hatası:", e);
                }
                try {
                    history.replaceState(null, document.title, window.location.pathname + window.location.search);
                } catch(e) {}
            }
            initSupabase();
            refreshBranchAndDepartmentSelects();
            checkAdminAuth();
            const savedNotes = localStorage.getItem('task_management_notes');
            if (savedNotes !== null) {
                document.getElementById('managementNotes').value = savedNotes;
            } else {
                document.getElementById('managementNotes').value = "";
            }

            const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            document.querySelectorAll('.printDateSpan').forEach(el => el.innerText = todayStr);

            updateTeamDatalist();
            renderApp();
            updateNotificationIconUI();
            updateServerStatusBadge(true);

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

        // Diğer sekmelerden (personel.html) gelen değişiklikleri anında senkronize et
        window.addEventListener('storage', (e) => {
            if (e.key === 'task_items') {
                const deletedIds = getDeletedTaskIds();
                const raw = JSON.parse(e.newValue || '[]');
                tasks = normalizeTasks(raw.filter(t => !deletedIds.includes(String(t.id))));
                renderApp();
                if (activeCommentTaskId) {
                    const curTask = tasks.find(t => String(t.id) === String(activeCommentTaskId));
                    if (curTask) renderTaskCommentsList(curTask);
                }
            } else if (e.key === 'task_team_members') {
                team = JSON.parse(e.newValue || '[]');
                updateTeamDatalist();
                renderApp();
            }
        });

        function saveData() {
            lastLocalActionTime = Date.now();
            localStorage.setItem('task_team_members', JSON.stringify(team));
            localStorage.setItem('task_items', JSON.stringify(tasks));
            pushDataToServer();
        }

        function saveManagementNotes() {
            lastLocalActionTime = Date.now();
            localStorage.setItem('task_management_notes', document.getElementById('managementNotes').value);
            pushDataToServer();
        }

        function updateTeamDatalist() {
            const datalist = document.getElementById('teamDatalist');
            datalist.innerHTML = team.map(m => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.title)} - ${escapeHtml(m.department || '')}</option>`).join('');
        }

        function switchMainPage(pageNumber) {
            activePage = pageNumber;
            const p1 = document.getElementById('page1Container');
            const p2 = document.getElementById('page2Container');
            const tab1 = document.getElementById('navTab1');
            const tab2 = document.getElementById('navTab2');

            if (pageNumber === 1) {
                p1.classList.remove('hidden');
                p2.classList.add('hidden');
                tab1.className = "flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all bg-[#A6192E] text-white shadow-md shadow-[#A6192E]/25 border border-[#FFBF3F]/40 cursor-pointer min-w-0";
                tab2.className = "flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all text-[#5C4A3C] hover:text-[#31261D] hover:bg-[#F2ECE1] cursor-pointer min-w-0";
            } else {
                p2.classList.remove('hidden');
                p1.classList.add('hidden');
                tab2.className = "flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all bg-[#A6192E] text-white shadow-md shadow-[#A6192E]/25 border border-[#FFBF3F]/40 cursor-pointer min-w-0";
                tab1.className = "flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all text-[#5C4A3C] hover:text-[#31261D] hover:bg-[#F2ECE1] cursor-pointer min-w-0";
            }
            renderApp();
        }

        function setViewMode(mode) {
            viewMode = mode;
            const tableBtn = document.getElementById('viewTableBtn');
            const boardBtn = document.getElementById('viewBoardBtn');
            const tableDiv = document.getElementById('tableViewContainer');
            const boardDiv = document.getElementById('boardViewContainer');

            if (mode === 'table') {
                tableBtn.className = "flex-1 py-1.5 text-xs font-medium rounded text-center transition-all bg-white text-slate-800 shadow-sm flex items-center justify-center gap-1.5";
                boardBtn.className = "flex-1 py-1.5 text-xs font-medium rounded text-center transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5";
                tableDiv.classList.remove('hidden');
                boardDiv.classList.add('hidden');
            } else {
                boardBtn.className = "flex-1 py-1.5 text-xs font-medium rounded text-center transition-all bg-white text-slate-800 shadow-sm flex items-center justify-center gap-1.5";
                tableBtn.className = "flex-1 py-1.5 text-xs font-medium rounded text-center transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5";
                boardDiv.classList.remove('hidden');
                tableDiv.classList.add('hidden');
            }
            renderApp();
        }

        // ================= 4. ŞUBE PERFORMANS LİGİ & BAŞARI SIRALAMASI =================
        function calculateAndRenderBranchLeague() {
            const container = document.getElementById('branchLeagueGrid');
            if (!container) return;

            const allBranches = Array.from(new Set([...(window.branches || DEFAULT_BRANCHES)]));

            tasks.forEach(t => {
                if (t.branch && !allBranches.includes(t.branch)) {
                    allBranches.push(t.branch);
                }
            });

            const now = new Date();
            now.setHours(0,0,0,0);

            const branchStats = allBranches.map(branchName => {
                const branchTasks = tasks.filter(t => (t.branch || 'Merkez / Genel') === branchName);
                const total = branchTasks.length;
                const completed = branchTasks.filter(t => t.status === 'Tamamlandı').length;
                const delayed = branchTasks.filter(t => t.status !== 'Tamamlandı' && t.dueDate && new Date(t.dueDate) < now).length;
                const open = total - completed;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return {
                    name: branchName,
                    total: total,
                    completed: completed,
                    delayed: delayed,
                    open: open,
                    pct: pct
                };
            });

            branchStats.sort((a, b) => {
                if (b.pct !== a.pct) return b.pct - a.pct;
                if (b.completed !== a.completed) return b.completed - a.completed;
                return a.name.localeCompare(b.name);
            });

            container.innerHTML = branchStats.map((b, idx) => {
                let medalHtml = '';
                let borderClass = 'border-[#E8DFC8] bg-[#FAF7F2]';
                let rankBadge = '';

                if (idx === 0 && b.total > 0 && b.pct > 0) {
                    medalHtml = '<span class="text-xl">🥇</span>';
                    borderClass = 'border-[#FFBF3F] bg-gradient-to-br from-[#FFFDF7] to-[#FFF6E0] shadow-md shadow-[#FFBF3F]/15 ring-1 ring-[#FFBF3F]/40';
                    rankBadge = '<span class="text-[9px] bg-[#FFBF3F] text-[#31261D] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">👑 Haftanın Lideri</span>';
                } else if (idx === 1 && b.total > 0) {
                    medalHtml = '<span class="text-xl">🥈</span>';
                    borderClass = 'border-stone-300 bg-white';
                    rankBadge = '<span class="text-[9px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">2. Sıra</span>';
                } else if (idx === 2 && b.total > 0) {
                    medalHtml = '<span class="text-xl">🥉</span>';
                    borderClass = 'border-amber-700/30 bg-white';
                    rankBadge = '<span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">3. Sıra</span>';
                } else {
                    rankBadge = `<span class="text-[9px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5 rounded-full">${idx + 1}. Sıra</span>`;
                }

                let colorBar = 'bg-[#1E340C]';
                if (b.pct < 40) colorBar = 'bg-rose-600';
                else if (b.pct < 75) colorBar = 'bg-amber-500';

                return `
                <div onclick="filterTasksByBranch('${escapeHtml(b.name)}')" title="${escapeHtml(b.name)} görevlerini filtrele" class="rounded-2xl p-4 border ${borderClass} hover:border-[#A6192E] transition-all cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <div class="flex items-center gap-1.5 truncate">
                                ${medalHtml}
                                <h4 class="font-bold text-xs sm:text-sm text-[#31261D] group-hover:text-[#A6192E] transition-colors truncate">${escapeHtml(b.name)}</h4>
                            </div>
                            ${rankBadge}
                        </div>

                        <div class="space-y-1.5 my-2">
                            <div class="flex items-center justify-between text-[11px] font-semibold">
                                <span class="text-stone-500">Başarı Oranı</span>
                                <span class="font-extrabold text-[#31261D]">${b.pct}%</span>
                            </div>
                            <div class="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500 ${colorBar}" style="width: ${b.pct}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                        <span><strong class="text-stone-800">${b.total}</strong> İş</span>
                        <span><strong class="text-[#1E340C]">${b.completed}</strong> Bitti</span>
                        <span><strong class="text-rose-600">${b.delayed}</strong> Geciken</span>
                        <span class="text-[#A6192E] font-bold group-hover:underline">Listele ↗</span>
                    </div>
                </div>
                `;
            }).join('');
        }

        function filterTasksByBranch(branchName) {
            switchMainPage(2);
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = branchName;
            }
            renderApp();
            const tableEl = document.getElementById('tableViewContainer');
            if (tableEl) {
                tableEl.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // ================= 6. ŞUBE HIZLI GİRİŞ QR KODLARI =================
        function openBranchQrModal() {
            const modal = document.getElementById('branchQrModal');
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                modal.classList.remove('hidden');
                updateBranchQrDisplay();
            }
        }

        function closeBranchQrModal() {
            const modal = document.getElementById('branchQrModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                modal.classList.add('hidden');
            }
        }

        function updateBranchQrDisplay() {
            const select = document.getElementById('branchQrSelect');
            const branchName = select ? select.value : 'Alsancak Şubesi';
            const titleEl = document.getElementById('qrCardBranchTitle');
            const urlTextEl = document.getElementById('qrCardUrlText');
            const imgEl = document.getElementById('qrCardImage');

            const baseUrl = window.location.href.split('?')[0].replace(/yonetici\.html|$/, 'personel.html');
            const targetUrl = `${baseUrl}?branch=${encodeURIComponent(branchName)}`;

            if (titleEl) titleEl.innerText = branchName;
            if (urlTextEl) urlTextEl.innerText = targetUrl;
            if (imgEl) {
                imgEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;
            }
        }

        function copyBranchQrLink() {
            const urlText = document.getElementById('qrCardUrlText')?.innerText;
            if (!urlText) return;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(urlText).then(() => {
                    alert("📋 Şube Giriş Linki Kopyalandı!\n\nBu linki personellere gönderebilir veya QR kodu okutarak kullanabilirsiniz.");
                });
            } else {
                prompt("Şube Linkini Kopyalayın:", urlText);
            }
        }

        function printBranchQrCard() {
            const printContent = document.getElementById('qrPrintArea')?.innerHTML;
            if (!printContent) return;
            const win = window.open('', '_blank', 'width=500,height=650');
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>CAN ÇEREZ - Şube Kasa QR Kartı</title>
                    <style>
                        body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; text-align: center; padding: 30px; background: white; color: #31261D; }
                        .card { border: 3px dashed #B8860B; padding: 25px; border-radius: 24px; max-width: 360px; margin: 0 auto; background: #FFFDF7; }
                        h2 { color: #A6192E; margin: 10px 0 4px; font-size: 22px; }
                        p { font-size: 12px; margin: 4px 0; color: #5C4A3C; }
                        img { margin: 12px auto; display: block; border-radius: 12px; }
                        .cam-text { font-weight: bold; color: #1E340C; margin-top: 10px; font-size: 13px; }
                        .url-text { font-family: monospace; font-size: 9px; color: #888; word-break: break-all; margin-top: 8px; }
                    </style>
                </head>
                <body onload="window.print(); setTimeout(() => window.close(), 500);">
                    <div class="card">
                        ${printContent}
                    </div>
                </body>
                </html>
            `);
            win.document.close();
        }

        // ================= 5. KURUMSAL ÖZEL DOMAIN =================
        function copyDnsRecordInfo() {
            const txt = "Tür: CNAME\nHost (Ad): portal\nHedef: fearfestiwal.github.io";
            if (navigator.clipboard) {
                navigator.clipboard.writeText(txt).then(() => {
                    alert("📋 DNS CNAME Kayıt Bilgileri Kopyalandı!\n\nHosting panelinizden (Natro, GoDaddy, Turhost vb.) bu kaydı ekleyerek portal.cancerez.com.tr adresini bağlayabilirsiniz.");
                });
            } else {
                prompt("DNS Kayıt Bilgilerini Kopyalayın:", txt);
            }
        }

        // ================= 3. ANLIK PUSH BİLDİRİM MOTORU =================
        function checkNotificationSupport() {
            return ('Notification' in window);
        }

        // ================= 3. ANLIK PUSH BİLDİRİM VE GERİ ÇEKME MOTORU =================
        function checkNotificationSupport() {
            return ('Notification' in window);
        }

        function playInAppBeep() {
            if (localStorage.getItem('cancerez_audio_muted') === 'true') return;
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

        function updateNotificationIconUI() {
            const icon = document.getElementById('notifIcon');
            const btn = document.getElementById('btnToggleNotifications');
            if (!icon || !btn) return;
            if (!checkNotificationSupport()) {
                btn.style.display = 'none';
                return;
            }
            const isMuted = localStorage.getItem('cancerez_notif_muted') === 'true';
            if (Notification.permission === 'granted') {
                if (isMuted) {
                    icon.className = "fa-solid fa-bell-slash text-stone-400 text-xs sm:text-sm";
                    btn.title = "Bildirimler Geri Çekildi / Susturuldu (Yönetmek İçin Tıklayın)";
                    btn.classList.remove('ring-2', 'ring-[#FFBF3F]/60');
                } else {
                    icon.className = "fa-solid fa-bell text-[#FFBF3F] text-xs sm:text-sm";
                    btn.title = "Anlık Bildirimler Aktif (Yönetmek İçin Tıklayın)";
                    btn.classList.add('ring-2', 'ring-[#FFBF3F]/60');
                }
            } else if (Notification.permission === 'denied') {
                icon.className = "fa-solid fa-bell-slash text-rose-400 text-xs sm:text-sm";
                btn.title = "Tarayıcı Bildirim İzni Engellenmiş (İzni Açma Rehberi)";
                btn.classList.remove('ring-2', 'ring-[#FFBF3F]/60');
            } else {
                icon.className = "fa-regular fa-bell text-stone-300 text-xs sm:text-sm";
                btn.title = "Bildirimleri Aç ve İzin İste";
                btn.classList.remove('ring-2', 'ring-[#FFBF3F]/60');
            }
        }

        function togglePushNotifications() {
            openNotificationModal();
        }

        function openNotificationModal() {
            const modal = document.getElementById('notificationModal');
            if (!modal) return;
            renderNotificationModalContent();
            modal.style.setProperty('display', 'flex', 'important');
            modal.classList.remove('hidden');
        }

        function closeNotificationModal() {
            const modal = document.getElementById('notificationModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                modal.classList.add('hidden');
            }
        }

        function renderNotificationModalContent() {
            const statusCard = document.getElementById('notifStatusCard');
            const actionBtns = document.getElementById('notifActionButtons');
            const guide = document.getElementById('notifPermissionGuide');
            const audioBtn = document.getElementById('btnInAppAudioToggle');

            if (!statusCard || !actionBtns) return;

            // Ses durumu butonu
            const audioMuted = localStorage.getItem('cancerez_audio_muted') === 'true';
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
                    <p class="text-xs text-stone-600 mt-1">Kullandığınız tarayıcı veya cihaz web bildirimlerini desteklemiyor.</p>
                `;
                actionBtns.innerHTML = '';
                if (guide) guide.classList.add('hidden');
                return;
            }

            const isMuted = localStorage.getItem('cancerez_notif_muted') === 'true';

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
                            Tarayıcı izniniz açık olmasına rağmen bildirimleri bu cihazda <strong>susturdunuz</strong>. Yeni görevlerde sistem bildirimi gönderilmez.
                        </p>
                    `;
                    actionBtns.innerHTML = `
                        <button type="button" onclick="muteNotifications(false)" class="w-full py-2.5 bg-[#1E340C] hover:bg-[#2C4A14] text-[#FFBF3F] rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
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
                                <span>Sistem Bildirimleri Açık & Aktif</span>
                            </div>
                            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">Aktif</span>
                        </div>
                        <p class="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                            Yeni bir görev eklendiğinde veya personeller bir görevi tamamladığında telefonunuza ve bilgisayarınıza anında bildirim gönderilir.
                        </p>
                    `;
                    actionBtns.innerHTML = `
                        <button type="button" onclick="muteNotifications(true)" class="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
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
                        Tarayıcınız veya telefonunuz bu site için bildirimleri engellemiş. Tarayıcı güvenlik kısıtı nedeniyle aşağıdaki adımları uygulayarak kilidi açmanız gerekir.
                    </p>
                `;
                actionBtns.innerHTML = `
                    <button type="button" onclick="requestNotificationPermissionAgain()" class="w-full py-2.5 bg-[#FFBF3F] hover:bg-[#E5A529] text-[#31261D] rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
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
                        Görev atamalarından ve tamamlanma raporlarından anında haberdar olmak için lütfen bildirim iznini onaylayınız.
                    </p>
                `;
                actionBtns.innerHTML = `
                    <button type="button" onclick="requestNotificationPermissionAgain()" class="w-full py-2.5 bg-[#1E340C] hover:bg-[#2C4A14] text-[#FFBF3F] rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                        <i class="fa-solid fa-bell"></i>
                        <span>Bildirim İznini Başlat (İzin Ver)</span>
                    </button>
                `;
            }
        }

        function muteNotifications(shouldMute) {
            if (shouldMute) {
                localStorage.setItem('cancerez_notif_muted', 'true');
            } else {
                localStorage.removeItem('cancerez_notif_muted');
            }
            updateNotificationIconUI();
            renderNotificationModalContent();
        }

        async function requestNotificationPermissionAgain() {
            if (!checkNotificationSupport()) return;
            try {
                const perm = await Notification.requestPermission();
                if (perm === 'granted') {
                    localStorage.removeItem('cancerez_notif_muted');
                    triggerSystemNotification("CAN ÇEREZ (1978)", "🎉 Tebrikler! Anlık görev bildirimleri başarıyla aktif edildi.");
                }
            } catch(e) {
                console.warn("Permission request error:", e);
            }
            updateNotificationIconUI();
            renderNotificationModalContent();
        }

        function toggleInAppAudioSetting() {
            const current = localStorage.getItem('cancerez_audio_muted') === 'true';
            if (current) {
                localStorage.removeItem('cancerez_audio_muted');
                playInAppBeep();
            } else {
                localStorage.setItem('cancerez_audio_muted', 'true');
            }
            renderNotificationModalContent();
        }

        function testNotificationFromModal() {
            playInAppBeep();
            if (Notification.permission === 'granted' && localStorage.getItem('cancerez_notif_muted') !== 'true') {
                triggerSystemNotification("CAN ÇEREZ (1978) - Test", "🔔 Bildirim testi başarılı! Sistem 7/24 çalışıyor.");
            } else if (localStorage.getItem('cancerez_notif_muted') === 'true') {
                alert("🔔 Bildirimler 'Geri Çekildi / Susturuldu' modunda olduğu için sistem bildirimi gönderilmedi. İsterseniz yukarıdan 'Yeniden Aç' diyebilirsiniz.");
            } else if (Notification.permission === 'denied') {
                alert("⚠️ Tarayıcınız bildirim iznini engellemiş ('İzin vermiyor'). Lütfen yukarıdaki 3 adımı uygulayarak kilit simgesinden izin veriniz.");
            } else {
                requestNotificationPermissionAgain();
            }
        }

        function triggerSystemNotification(title, body) {
            playInAppBeep();
            if (!checkNotificationSupport()) return;
            if (localStorage.getItem('cancerez_notif_muted') === 'true') return;
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
                console.warn("Notification error:", e);
            }
        }

        function isTaskOlderThan1Month(task) {
            if (!task || task.status !== 'Tamamlandı') return false;
            const refDateStr = task.completedAt || task.dueDate || task.createdAt;
            if (!refDateStr) return false;
            const refDate = new Date(refDateStr);
            if (isNaN(refDate.getTime())) return false;
            const diffMs = Date.now() - refDate.getTime();
            const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
            return diffMs > ONE_MONTH_MS;
        }

        function renderApp() {
            calculateAndRenderStatistics();
            calculateAndRenderBranchLeague();
            renderReportTable();
            renderPage1QuickTasks();
            renderDetailTableAndBoard();
            renderSmartAlertBanner();
        }

        function calculateAndRenderStatistics() {
            const now = new Date();
            now.setHours(0,0,0,0);

            // 1 aydan eski tamamlanan görevler arşive kaldırıldığı için aktif dönem istatistiklerine dahil edilmez
            const currentTasks = tasks.filter(t => !isTaskOlderThan1Month(t));

            const total = currentTasks.length;
            const completed = currentTasks.filter(t => t.status === 'Tamamlandı').length;
            const open = currentTasks.filter(t => t.status !== 'Tamamlandı').length;
            const delayed = currentTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now).length;

            const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const delayedPct = total > 0 ? Math.round((delayed / total) * 100) : 0;
            const openPct = total > 0 ? Math.round((open / total) * 100) : 0;

            const bPct = document.getElementById('badgeCompletionPct');
            if (bPct) bPct.innerText = `%${completionPct}`;
            const bTotal = document.getElementById('badgeTotalTasks');
            if (bTotal) bTotal.innerText = `${total} Görev`;

            const pText = document.getElementById('progressPercentText');
            if (pText) pText.innerText = `%${completionPct} Tamamlandı`;
            const pFill = document.getElementById('progressBarFill');
            if (pFill) pFill.style.width = `${completionPct}%`;
            const kpiBig = document.getElementById('kpiBigPercentage');
            if (kpiBig) kpiBig.innerText = `%${completionPct}`;
            const kpiFrac = document.getElementById('kpiCompletedFraction');
            if (kpiFrac) kpiFrac.innerText = `${completed} / ${total} Görev Bitti`;

            document.getElementById('p1Total').innerText = total;
            document.getElementById('p1Delayed').innerText = delayed;
            document.getElementById('p1DelayedRatio').innerText = `İşlerin %${delayedPct}'si gecikmede`;
            document.getElementById('p1Open').innerText = open;
            document.getElementById('p1OpenRatio').innerText = `İşlerin %${openPct}'si açık`;
            document.getElementById('p1Completed').innerText = completed;
            document.getElementById('p1CompletedRatio').innerText = `İşlerin %${completionPct}'si bitti`;
        }

        // ================= AKILLI UYARI & BİLDİRİM BANDI =================
        let isAlertBannerDismissed = false;

        function filterTasksByQuickType(type) {
            switchMainPage(2);
            const select = document.getElementById('statusFilter');
            if (select) {
                select.value = type;
            }
            renderApp();
            const tableEl = document.getElementById('tableViewContainer');
            if (tableEl) {
                tableEl.scrollIntoView({ behavior: 'smooth' });
            }
        }

        function dismissAlertBanner() {
            isAlertBannerDismissed = true;
            const banner = document.getElementById('smartAlertBanner');
            if (banner) banner.classList.add('hidden');
        }

        function renderSmartAlertBanner() {
            const banner = document.getElementById('smartAlertBanner');
            if (!banner) return;

            if (isAlertBannerDismissed) {
                banner.classList.add('hidden');
                return;
            }

            const now = new Date();
            now.setHours(0,0,0,0);

            const delayedTasks = [];
            const todayTasks = [];

            tasks.forEach(t => {
                if (t.status === 'Tamamlandı') return;
                const d = new Date(t.dueDate);
                d.setHours(0,0,0,0);

                if (d < now) {
                    delayedTasks.push(t);
                } else if (d.getTime() === now.getTime()) {
                    todayTasks.push(t);
                }
            });

            // Gecikmedeki sorumluları grupla
            const delayedOwnersMap = {};
            delayedTasks.forEach(t => {
                const owner = t.owner ? t.owner.trim() : 'Atanmamış';
                delayedOwnersMap[owner] = (delayedOwnersMap[owner] || 0) + 1;
            });
            const delayedOwnerNames = Object.keys(delayedOwnersMap);

            if (delayedTasks.length > 0) {
                banner.classList.remove('hidden');
                banner.innerHTML = `
                    <div class="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl shadow-rose-950/30 border border-rose-700/60 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div class="absolute -right-10 -top-10 w-44 h-44 bg-rose-600/15 rounded-full blur-3xl pointer-events-none"></div>
                        <div class="absolute -left-10 -bottom-10 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

                        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div class="flex items-start sm:items-center gap-3.5">
                                <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 text-white flex items-center justify-center text-xl shrink-0 shadow-lg shadow-rose-600/40 border border-rose-400/40">
                                    <i class="fa-solid fa-bell text-rose-100 animate-bounce"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="bg-rose-500/30 text-rose-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-rose-400/30 flex items-center gap-1.5 shadow-xs">
                                            <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                                            AKILLI UYARI BANDI
                                        </span>
                                        <h3 class="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
                                            <span>${delayedTasks.length} Adet Görevin Termin Süresi Gecikti!</span>
                                        </h3>
                                        ${todayTasks.length > 0 ? `
                                            <span class="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                                                <i class="fa-regular fa-calendar-check text-[10px]"></i> ${todayTasks.length} Görev Bugün Bitiyor
                                            </span>
                                        ` : ''}
                                    </div>
                                    <div class="text-xs text-rose-200/90 mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        <span class="font-medium text-stone-300">Gecikmedeki Personeller:</span>
                                        ${delayedOwnerNames.map(name => `
                                            <button onclick="openWhatsAppMember('${escapeHtml(name)}')" title="${name} kişisine WhatsApp'tan hatırlatma at" class="inline-flex items-center gap-1 font-semibold text-white bg-white/10 hover:bg-rose-600/60 px-2 py-0.5 rounded-lg text-[11px] transition-all border border-white/10 cursor-pointer active:scale-95">
                                                <i class="fa-brands fa-whatsapp text-emerald-400"></i> ${escapeHtml(name)} <span class="bg-rose-500/40 text-rose-100 px-1 rounded text-[10px] font-bold">${delayedOwnersMap[name]}</span>
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 self-start lg:self-center shrink-0 flex-wrap">
                                <button onclick="filterTasksByQuickType('Geciken')" class="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
                                    <i class="fa-solid fa-filter text-xs"></i>
                                    <span>Gecikenleri Listele</span>
                                </button>
                                ${todayTasks.length > 0 ? `
                                    <button onclick="filterTasksByQuickType('Bugun')" class="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
                                        <i class="fa-regular fa-calendar-check text-xs"></i>
                                        <span>Bugünün İşleri (${todayTasks.length})</span>
                                    </button>
                                ` : ''}
                                <button onclick="openBulkReminderModal()" title="Bekleyen herkese toplu bildirim gönder" class="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
                                    <i class="fa-solid fa-bullhorn text-xs"></i>
                                    <span class="hidden sm:inline">Toplu Uyar</span>
                                </button>
                                <button onclick="dismissAlertBanner()" title="Bu oturum için uyarıyı gizle" class="p-2 text-rose-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
                                    <i class="fa-solid fa-xmark text-base"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else if (todayTasks.length > 0) {
                banner.classList.remove('hidden');
                banner.innerHTML = `
                    <div class="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-2xl p-4 shadow-md border border-amber-700/50 relative overflow-hidden animate-in fade-in duration-200">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0 border border-amber-500/30">
                                    <i class="fa-regular fa-calendar-check"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-amber-500/30">GÜNÜ GELDİ</span>
                                        <h4 class="font-bold text-xs sm:text-sm text-white">Bugün Hedef Terminli ${todayTasks.length} Görev Bulunuyor</h4>
                                    </div>
                                    <p class="text-[11px] text-stone-300 mt-0.5">Geciken herhangi bir işiniz yok. Bugün teslim edilecek ${todayTasks.length} aksiyon bekliyor.</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <button onclick="filterTasksByQuickType('Bugun')" class="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
                                    <i class="fa-solid fa-list-check"></i>
                                    <span>Bugünün Görevlerini Gör</span>
                                </button>
                                <button onclick="dismissAlertBanner()" class="p-1.5 text-stone-400 hover:text-white rounded-lg cursor-pointer">
                                    <i class="fa-solid fa-xmark text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else if (tasks.length > 0) {
                banner.classList.remove('hidden');
                banner.innerHTML = `
                    <div class="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white rounded-2xl p-3.5 shadow-xs border border-emerald-800/40 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5">
                            <span class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs border border-emerald-500/30 shrink-0">
                                <i class="fa-solid fa-check"></i>
                            </span>
                            <p class="text-xs text-stone-200">
                                <strong class="text-emerald-400 font-bold">Harika Durum:</strong> CAN ÇEREZ (1978) koordinasyonunda şu an geciken görev bulunmuyor. Tüm aksiyonlar planlanan takvimde ilerliyor.
                            </p>
                        </div>
                        <button onclick="dismissAlertBanner()" class="text-stone-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                `;
            } else {
                banner.classList.add('hidden');
            }
        }

        function filterAndShowTasksByPerson(personName) {
            switchMainPage(2);
            const sInput = document.getElementById('searchInput');
            if (sInput) sInput.value = personName;
            const sFilter = document.getElementById('statusFilter');
            if (sFilter) sFilter.value = 'ALL';
            renderApp();
            const tableEl = document.getElementById('tableViewContainer');
            if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
        }

        function renderReportTable() {
            const tbody = document.getElementById('reportTableBody');
            const now = new Date();
            now.setHours(0,0,0,0);

            const allOwnersSet = new Set(team.map(m => m.name.trim()));
            tasks.forEach(t => { 
                const o = (t.owner || t.assignee); 
                if (o) allOwnersSet.add(o.trim()); 
            });
            const ownerList = Array.from(allOwnersSet);

            if (ownerList.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="py-12 text-center text-stone-400">
                            <i class="fa-solid fa-users text-4xl mb-3 text-stone-300 block"></i>
                            <p class="font-semibold text-stone-700 text-sm">Henüz kayıtlı ekip üyesi veya görev bulunmuyor.</p>
                            <p class="text-xs text-stone-500 mt-1">Üst menüdeki <strong>"Ekip"</strong> butonuna tıklayarak çalışanlarınızı ekleyebilir veya <strong>"Yeni Görev"</strong> ile ilk görevi tanımlayabilirsiniz.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = ownerList.map((ownerName, idx) => {
                const member = team.find(m => m.name.toLowerCase().trim() === ownerName.toLowerCase().trim()) || {
                    name: ownerName,
                    title: "Ekip Üyesi",
                    phone: "-",
                    department: "-",
                    email: ""
                };

                const personTasks = tasks.filter(t => (t.owner || t.assignee || '').toLowerCase().trim() === ownerName.toLowerCase().trim() && !isTaskOlderThan1Month(t));
                const pTotal = personTasks.length;
                const pCompleted = personTasks.filter(t => t.status === 'Tamamlandı').length;
                const pOpen = personTasks.filter(t => t.status !== 'Tamamlandı').length;
                const pDelayed = personTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now).length;
                const pPct = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0;

                return `
                    <tr class="report-person-row hover:bg-[#FAF7F2] transition-colors cursor-pointer" onclick="openEmailModal('${escapeHtml(ownerName)}')">
                        <td class="py-3 px-4 text-center font-bold text-[#824701]">${idx + 1}</td>
                        <td class="py-3 px-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-[#31261D] text-[#FFBF3F] border border-[#FFBF3F]/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                    ${getInitials(member.name)}
                                </div>
                                <div>
                                    <h5 class="font-bold text-[#31261D] text-xs hover:text-[#A6192E] transition-colors">${escapeHtml(member.name)}</h5>
                                    <p class="text-[11px] text-[#5C4A3C]">${escapeHtml(member.title)} • ${escapeHtml(member.department || '')}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-3 px-3 text-[#31261D]">
                            <p class="text-[11px] font-semibold text-[#31261D]">${escapeHtml(member.phone || '-')}</p>
                            <p class="text-[10px] text-[#824701] truncate max-w-[120px] font-medium">${escapeHtml(member.email || 'Mail Yok')}</p>
                        </td>
                        <td class="py-3 px-3 text-center font-black text-[#31261D]">${pTotal}</td>
                        <td class="py-3 px-3 text-center font-black ${pDelayed > 0 ? 'text-[#A6192E] bg-rose-50/70 rounded-xl' : 'text-stone-400'}">${pDelayed}</td>
                        <td class="py-3 px-3 text-center font-black text-[#824701]">${pOpen}</td>
                        <td class="py-3 px-3 text-center font-black text-[#1E340C]">${pCompleted}</td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex items-center gap-2">
                                <div class="flex-1 bg-[#E8DFC8]/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-[#E8DFC8]">
                                    <div class="bg-gradient-to-r from-[#A6192E] via-[#FFBF3F] to-[#1E340C] h-full rounded-full transition-all duration-300" style="width: ${pPct}%"></div>
                                </div>
                                <span class="text-xs font-black text-[#31261D] w-10 text-right">%${pPct}</span>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-center no-print" onclick="event.stopPropagation()">
                            <div class="flex items-center justify-center gap-1.5 flex-wrap">
                                <button onclick="filterAndShowTasksByPerson('${escapeHtml(ownerName)}')" title="Bu personelin görevlerini görüntüle" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF9ED] hover:bg-[#FFBF3F] text-[#824701] hover:text-[#31261D] font-bold text-xs transition-all border border-[#FFBF3F]/40 shadow-2xs cursor-pointer">
                                    <i class="fa-solid fa-list-check text-xs"></i>
                                    <span>Görevleri (${pTotal})</span>
                                </button>
                                <button onclick="openWhatsAppMember('${escapeHtml(ownerName)}')" title="WhatsApp ile Durum Özeti Gönder" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F4F9F0] hover:bg-[#1E340C] text-[#1E340C] hover:text-white font-bold text-xs transition-all border border-[#1E340C]/20 shadow-2xs cursor-pointer">
                                    <i class="fa-brands fa-whatsapp text-sm"></i>
                                    <span>WhatsApp</span>
                                </button>
                                <button onclick="openEmailModal('${escapeHtml(ownerName)}')" title="Gmail Raporu Gönder" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-[#A6192E] text-[#A6192E] hover:text-white font-bold text-xs transition-all border border-rose-200 shadow-2xs cursor-pointer">
                                    <i class="fa-solid fa-envelope text-[10px]"></i>
                                    <span>Gmail</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function renderPage1QuickTasks() {
            const container = document.getElementById('page1QuickTasksContainer');
            if (!container) return;

            // Yönetim raporundaki hızlı görev özetinde 1 aydan eski tamamlananları gösterme (arşive aktarılır)
            const quickTasks = tasks.filter(t => !isTaskOlderThan1Month(t));

            if (!quickTasks || quickTasks.length === 0) {
                container.innerHTML = `
                    <div class="py-8 text-center text-stone-400">
                        <i class="fa-solid fa-list-check text-3xl mb-2 text-stone-300"></i>
                        <p class="font-bold text-stone-700 text-xs">Aktif veya son 1 aya ait görev bulunmuyor.</p>
                        <p class="text-[11px] text-stone-500 mt-1">Yukarıdaki <strong>"Yeni Görev Ekle"</strong> butonuna tıklayarak ilk görevinizi tanımlayabilirsiniz.</p>
                    </div>
                `;
                return;
            }

            const now = new Date();
            now.setHours(0,0,0,0);

            container.innerHTML = quickTasks.map((task, idx) => {
                const isOverdue = task.status !== 'Tamamlandı' && new Date(task.dueDate) < now;
                const isCompleted = task.status === 'Tamamlandı';
                const dateFormatted = formatTurkishDate(task.dueDate);

                let badge = '';
                if (isCompleted) {
                    badge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E6F3DF] text-[#1E340C] border border-[#1E340C]/20"><i class="fa-solid fa-check text-[9px]"></i> Tamamlandı</span>`;
                } else if (isOverdue) {
                    badge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-[#A6192E] border border-rose-200 animate-pulse"><i class="fa-solid fa-clock text-[9px]"></i> Gecikti!</span>`;
                } else {
                    badge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF6E0] text-[#824701] border border-[#FFBF3F]/30"><i class="fa-solid fa-spinner text-[9px]"></i> Devam Ediyor</span>`;
                }

                return `
                    <div class="p-3.5 sm:p-4 rounded-2xl border ${isOverdue ? 'border-[#A6192E]/30 bg-[#FFF8F8]' : isCompleted ? 'border-[#1E340C]/20 bg-[#F8FAF7]' : 'border-[#E8DFC8] bg-white'} shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div class="space-y-1.5 flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                ${badge}
                                ${getBranchBadgeHtml(task.branch)}
                                ${getRecurrenceBadgeHtml(task.recurrence)}
                                <span class="text-[10px] font-bold bg-[#FAF7F2] text-[#31261D] px-2 py-0.5 rounded border border-[#E8DFC8]">
                                    ${escapeHtml(task.department || 'Birim')}
                                </span>
                                <span class="text-[11px] font-semibold text-[#824701] flex items-center gap-1">
                                    <i class="fa-solid fa-user text-[10px]"></i> ${escapeHtml(task.owner || 'Atanmamış')}
                                </span>
                                <span class="text-[11px] font-medium text-stone-500">
                                    • Termin: <strong class="${isOverdue ? 'text-[#A6192E]' : 'text-[#31261D]'}">${dateFormatted}</strong>
                                </span>
                            </div>
                            <h4 class="font-bold text-[#31261D] text-xs sm:text-sm ${isCompleted ? 'line-through text-stone-400' : ''}">
                                ${escapeHtml(task.title)}
                            </h4>
                            <p class="text-xs text-stone-600 line-clamp-2">
                                <strong class="text-[#31261D]">Aksiyon:</strong> ${escapeHtml(task.action)}
                            </p>
                        </div>

                        <div class="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8DFC8] w-full md:w-auto justify-end flex-wrap">
                            <button onclick="openTaskCommentsModal(${task.id})" class="px-3 py-1.5 bg-[#FAF7F2] hover:bg-blue-50 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5">
                                <i class="fa-regular fa-comment-dots text-blue-700"></i>
                                <span>Notlar (${(task.comments && task.comments.length) || 0})</span>
                            </button>
                            <button onclick="editTask(${task.id})" class="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F2ECE0] text-[#31261D] font-bold text-xs rounded-xl border border-[#E8DFC8] transition-all cursor-pointer flex items-center gap-1">
                                <i class="fa-solid fa-pen-to-square text-[#A6192E]"></i>
                                <span>Düzenle</span>
                            </button>
                            <button onclick="deleteTask(${task.id})" title="Görevi Sil" class="p-1.5 bg-[#FAF7F2] hover:bg-rose-50 text-stone-500 hover:text-[#A6192E] rounded-xl border border-[#E8DFC8] transition-colors cursor-pointer">
                                <i class="fa-regular fa-trash-can text-xs"></i>
                            </button>
                            <button onclick="filterAndShowTasksByPerson('${escapeHtml(task.owner)}')" class="px-3 py-1.5 bg-[#A6192E] hover:bg-[#8C1224] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1">
                                <span>Aksiyon Listesinde İncele</span>
                                <i class="fa-solid fa-arrow-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function getFilteredTasks() {
            const search = document.getElementById('searchInput').value.toLowerCase().trim();
            const branchFilter = document.getElementById('branchFilter')?.value || 'ALL';
            const statusFilter = document.getElementById('statusFilter').value;
            const monthFilter = document.getElementById('monthFilter').value;
            const now = new Date();
            now.setHours(0,0,0,0);

            const activeTasks = (window.tasks && Array.isArray(window.tasks) && window.tasks.length > 0) 
                ? window.tasks 
                : (tasks && Array.isArray(tasks) && tasks.length > 0 ? tasks : DEFAULT_INIT_TASKS);

            return activeTasks.filter(item => {
                const itemDate = new Date(item.dueDate);
                itemDate.setHours(0,0,0,0);
                const isDelayed = item.status !== 'Tamamlandı' && itemDate < now;
                const isDueToday = item.status !== 'Tamamlandı' && itemDate.getTime() === now.getTime();
                const isOlderThan1Month = isTaskOlderThan1Month(item);

                // 1 Ay Kuralı: Eğer "Archived" seçildiyse SADECE 1 aydan eski tamamlananları göster
                if (statusFilter === 'Archived') {
                    if (!isOlderThan1Month) return false;
                } else {
                    // Normal filtrelerde (ALL, Açık, Devam Ediyor, Tamamlandı, Geciken vb.) 1 aydan eski tamamlananları gizle
                    if (isOlderThan1Month) return false;
                }

                if (branchFilter !== 'ALL' && (item.branch || 'Merkez / Genel') !== branchFilter) return false;
                const isThisWeek = () => {
                    if (!item.dueDate) return false;
                    const d = new Date(item.dueDate);
                    d.setHours(0,0,0,0);
                    const day = now.getDay() || 7;
                    const monday = new Date(now);
                    monday.setDate(now.getDate() - (day - 1));
                    monday.setHours(0,0,0,0);
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    sunday.setHours(23,59,59,999);
                    return d >= monday && d <= sunday;
                };

                if (statusFilter === 'Geciken' && !isDelayed) return false;
                if (statusFilter === 'Bugun' && !isDueToday) return false;
                if (statusFilter === 'ThisWeek' && !isThisWeek()) return false;
                if (statusFilter !== 'ALL' && statusFilter !== 'Geciken' && statusFilter !== 'Bugun' && statusFilter !== 'ThisWeek' && statusFilter !== 'Archived' && item.status !== statusFilter) return false;

                if (monthFilter !== 'ALL') {
                    const taskMonth = new Date(item.dueDate).getMonth() + 1;
                    if (taskMonth !== parseInt(monthFilter)) return false;
                }

                if (search) {
                    const textContent = `${item.title} ${item.department} ${item.action} ${item.owner} ${item.branch || ''}`.toLowerCase();
                    if (!textContent.includes(search)) return false;
                }

                return true;
            });
        }

        function renderDetailTableAndBoard() {
            const filtered = getFilteredTasks();
            const tbody = document.getElementById('taskTableBody');
            const emptyState = document.getElementById('emptyState');
            const now = new Date();
            now.setHours(0,0,0,0);

            if (filtered.length === 0) {
                tbody.innerHTML = '';
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
                tbody.innerHTML = filtered.map((task, idx) => {
                    const isOverdue = task.status !== 'Tamamlandı' && new Date(task.dueDate) < now;
                    const dateFormatted = formatTurkishDate(task.dueDate);

                    let statusBadge = '';
                    if (task.status === 'Tamamlandı') {
                        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#E6F3DF] text-[#1E340C] border border-[#1E340C]/20"><i class="fa-solid fa-check text-[9px]"></i> Tamamlandı</span>`;
                    } else if (isOverdue) {
                        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-[#A6192E] border border-rose-200 animate-pulse"><i class="fa-solid fa-clock text-[9px]"></i> Gecikti!</span>`;
                    } else if (task.status === 'Devam Ediyor') {
                        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FFF6E0] text-[#824701] border border-[#FFBF3F]/30"><i class="fa-solid fa-spinner text-[9px]"></i> Devam Ediyor</span>`;
                    } else {
                        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FAF7F2] text-[#31261D] border border-[#E8DFC8]"><i class="fa-regular fa-circle text-[9px]"></i> Açık</span>`;
                    }

                    return `
                        <tr class="hover:bg-[#FAF7F2] transition-colors ${isOverdue ? 'bg-rose-50/30' : ''}">
                            <td class="py-3 px-3 text-center font-bold text-[#824701]">${idx + 1}</td>
                            <td class="py-3 px-4 font-bold text-[#31261D]">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    ${getRecurrenceBadgeHtml(task.recurrence)}
                                    <span>${escapeHtml(task.title)}</span>
                                </div>
                            </td>
                            <td class="py-3 px-3 text-[#5C4A3C]">
                                <div class="space-y-1">
                                    <div>${getBranchBadgeHtml(task.branch)}</div>
                                    <span class="bg-[#FAF7F2] text-[#5C4A3C] px-2 py-0.5 rounded-lg text-[11px] font-semibold border border-[#E8DFC8] inline-block">
                                        ${escapeHtml(task.department)}
                                    </span>
                                </div>
                            </td>
                            <td class="py-3 px-4 text-[#31261D] leading-relaxed">${escapeHtml(task.action)}</td>
                            <td class="py-3 px-3 font-semibold text-[#31261D]">
                                <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl border border-[#E8DFC8] bg-[#FAF7F2] cursor-pointer hover:bg-white transition-colors"
                                     onclick="openEmailModal('${escapeHtml(task.owner)}')">
                                    <span class="w-5 h-5 rounded-full bg-[#31261D] text-[#FFBF3F] border border-[#FFBF3F]/30 flex items-center justify-center text-[9px] font-black">
                                        ${getInitials(task.owner)}
                                    </span>
                                    <span class="font-bold text-[#31261D] text-xs">${escapeHtml(task.owner)}</span>
                                </div>
                            </td>
                            <td class="py-3 px-3 text-center font-bold ${isOverdue ? 'text-[#A6192E]' : 'text-[#31261D]'}">
                                ${dateFormatted}
                            </td>
                            <td class="py-3 px-3 text-center cursor-pointer select-none" onclick="toggleTaskStatus(${task.id})" title="Durumu değiştirmek için tıklayın">
                                ${statusBadge}
                            </td>
                            <td class="py-3 px-3 text-center no-print">
                                <div class="flex items-center justify-center gap-1">
                                    <button onclick="openTaskCommentsModal(${task.id})" title="Görev Notları & Yorumlar (${(task.comments && task.comments.length) || 0})" class="p-1.5 text-[#5C4A3C] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer relative">
                                        <i class="fa-regular fa-comment-dots text-sm"></i>
                                        ${(task.comments && task.comments.length > 0) ? `<span class="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full text-[9px] min-w-[16px] h-4 px-1 flex items-center justify-center font-bold">${task.comments.length}</span>` : ''}
                                    </button>
                                    <button onclick="openWhatsAppTask('${task.id}')" title="Sorumluya WhatsApp ile Bildir" class="p-1.5 text-[#5C4A3C] hover:text-[#1E340C] hover:bg-[#F4F9F0] rounded-lg transition-colors cursor-pointer">
                                        <i class="fa-brands fa-whatsapp text-sm"></i>
                                    </button>
                                    <button onclick="toggleTaskStatus(${task.id})" title="${task.status === 'Tamamlandı' ? 'Görevi Tekrar Aç' : 'Görevi Tamamlandı Yap'}" class="p-1.5 ${task.status === 'Tamamlandı' ? 'text-[#1E340C] bg-[#F4F9F0] hover:bg-[#FFF6E0] hover:text-[#824701]' : 'text-[#5C4A3C] hover:text-[#1E340C] hover:bg-[#F4F9F0]'} rounded-lg transition-colors cursor-pointer">
                                        <i class="fa-solid ${task.status === 'Tamamlandı' ? 'fa-rotate-left' : 'fa-check'}"></i>
                                    </button>
                                    <button onclick="editTask(${task.id})" title="Düzenle" class="p-1.5 text-[#5C4A3C] hover:text-[#A6192E] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button onclick="deleteTask(${task.id})" title="Sil" class="p-1.5 text-[#5C4A3C] hover:text-[#A6192E] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                                        <i class="fa-regular fa-trash-can"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            renderBoard(filtered);
        }

        function renderBoard(taskList) {
            const openCol = document.getElementById('boardColumnOpen');
            const progressCol = document.getElementById('boardColumnProgress');
            const completedCol = document.getElementById('boardColumnCompleted');

            let openCards = [];
            let progressCards = [];
            let completedCards = [];

            const now = new Date();
            now.setHours(0,0,0,0);

            taskList.forEach(task => {
                const isOverdue = task.status !== 'Tamamlandı' && new Date(task.dueDate) < now;
                const cardHtml = `
                    <div class="bg-white p-3.5 rounded-2xl shadow-2xs border border-[#E8DFC8] hover:shadow-md transition-shadow">
                        <div class="flex items-start justify-between gap-1.5 mb-1.5 flex-wrap">
                            <div class="flex items-center gap-1 flex-wrap">
                                ${getBranchBadgeHtml(task.branch)}
                                <span class="text-[10px] bg-[#FAF7F2] text-[#5C4A3C] px-2 py-0.5 rounded-lg font-bold border border-[#E8DFC8]">${escapeHtml(task.department)}</span>
                            </div>
                            ${isOverdue ? '<span class="text-[9px] bg-rose-100 text-[#A6192E] px-2 py-0.5 rounded-full font-black border border-rose-200">GECİKTİ</span>' : ''}
                        </div>
                        <div class="flex items-center gap-1 mb-1 flex-wrap">
                            ${getRecurrenceBadgeHtml(task.recurrence)}
                            <h5 class="font-bold text-xs text-[#31261D]">${escapeHtml(task.title)}</h5>
                        </div>
                        <p class="text-[11px] text-[#5C4A3C] mb-2.5 line-clamp-2 leading-relaxed">${escapeHtml(task.action)}</p>
                        <div class="flex items-center justify-between pt-2 border-t border-[#E8DFC8]/60 text-[10px] text-[#5C4A3C]">
                            <div class="inline-flex items-center gap-1 font-bold text-[#31261D] cursor-pointer hover:text-[#A6192E]" onclick="openEmailModal('${escapeHtml(task.owner)}')">
                                <i class="fa-solid fa-user-tie text-[#A6192E]"></i> ${escapeHtml(task.owner)}
                            </div>
                            <span class="${isOverdue ? 'text-[#A6192E] font-bold' : 'text-[#5C4A3C]'}"><i class="fa-regular fa-calendar"></i> ${formatTurkishDate(task.dueDate)}</span>
                        </div>
                        <div class="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-[#FAF7F2] flex-wrap">
                            <button onclick="openTaskCommentsModal(${task.id})" class="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer">
                                <i class="fa-regular fa-comment-dots"></i>
                                <span>Notlar (${(task.comments && task.comments.length) || 0})</span>
                            </button>
                            <div class="flex items-center gap-1.5 ml-auto">
                                <button onclick="openWhatsAppTask('${task.id}')" title="WhatsApp ile Hatırlat" class="text-[11px] text-[#1E340C] hover:text-[#2C4A14] flex items-center gap-1 font-bold cursor-pointer">
                                    <i class="fa-brands fa-whatsapp text-sm"></i>
                                </button>
                                <button onclick="editTask(${task.id})" class="text-[10px] text-[#824701] hover:underline font-bold px-1 cursor-pointer">Düzenle</button>
                                <button onclick="toggleTaskStatus(${task.id})" class="text-[10px] text-[#1E340C] hover:underline px-1.5 py-0.5 bg-[#F4F9F0] rounded font-bold cursor-pointer">${task.status === 'Tamamlandı' ? 'Tekrar Aç' : 'Tamamla'}</button>
                            </div>
                        </div>
                    </div>
                `;

                if (task.status === 'Tamamlandı') completedCards.push(cardHtml);
                else if (task.status === 'Devam Ediyor') progressCards.push(cardHtml);
                else openCards.push(cardHtml);
            });

            openCol.innerHTML = openCards.join('') || '<p class="text-center text-[11px] text-[#5C4A3C]/70 py-4">Görev yok</p>';
            progressCol.innerHTML = progressCards.join('') || '<p class="text-center text-[11px] text-[#5C4A3C]/70 py-4">Görev yok</p>';
            completedCol.innerHTML = completedCards.join('') || '<p class="text-center text-[11px] text-[#5C4A3C]/70 py-4">Görev yok</p>';

            document.getElementById('boardCountOpen').innerText = openCards.length;
            document.getElementById('boardCountProgress').innerText = progressCards.length;
            document.getElementById('boardCountCompleted').innerText = completedCards.length;
        }

        // ================= HIZLI MAİL MODALI =================
        function openQuickMailPickerModal() {
            const list = document.getElementById('quickMailList');
            const now = new Date();
            now.setHours(0,0,0,0);

            list.innerHTML = team.map(member => {
                const personTasks = tasks.filter(t => t.owner.toLowerCase().trim() === member.name.toLowerCase().trim());
                const total = personTasks.length;
                const delayed = personTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now).length;
                const open = personTasks.filter(t => t.status !== 'Tamamlandı').length;

                return `
                    <div class="p-3 rounded-2xl border border-[#E8DFC8] bg-[#FAF7F2] hover:bg-white transition-all flex items-center justify-between gap-2 shadow-2xs">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-[#31261D] text-[#FFBF3F] border border-[#FFBF3F]/30 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                ${getInitials(member.name)}
                            </div>
                            <div class="min-w-0">
                                <h5 class="font-bold text-[#31261D] text-xs truncate">${escapeHtml(member.name)}</h5>
                                <p class="text-[11px] text-[#5C4A3C] truncate">${escapeHtml(member.title)} • ${escapeHtml(member.email || 'Mail Yok')}</p>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-[10px] bg-white border border-[#E8DFC8] text-[#31261D] px-2 py-0.5 rounded-full font-bold">${total} Görev</span>
                                    ${delayed > 0 ? `<span class="text-[10px] bg-rose-100 text-[#A6192E] border border-rose-200 px-2 py-0.5 rounded-full font-black">${delayed} Geciken!</span>` : ''}
                                    <span class="text-[10px] bg-[#FFF6E0] text-[#824701] border border-[#FFBF3F]/30 px-2 py-0.5 rounded-full font-bold">${open} Açık</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-1.5 shrink-0">
                            <button onclick="closeQuickMailPickerModal(); openWhatsAppMember('${escapeHtml(member.name)}')" class="px-3 py-2 bg-[#1E340C] hover:bg-[#2C4A14] text-white text-xs font-bold rounded-xl shadow-md shadow-[#1E340C]/20 border border-[#FFBF3F]/20 flex items-center gap-1.5 transition-all cursor-pointer">
                                <i class="fa-brands fa-whatsapp text-sm text-[#FFBF3F]"></i>
                                <span>WhatsApp</span>
                            </button>
                            <button onclick="closeQuickMailPickerModal(); openEmailModal('${escapeHtml(member.name)}')" class="px-3 py-2 bg-[#A6192E] hover:bg-[#8C1224] text-white text-xs font-bold rounded-xl shadow-md shadow-[#A6192E]/20 border border-[#FFBF3F]/30 flex items-center gap-1.5 transition-all cursor-pointer">
                                <i class="fa-solid fa-envelope text-[10px] text-[#FFBF3F]"></i>
                                <span>Gmail</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            const qm = document.getElementById('quickMailPickerModal');
            if (qm) {
                qm.style.setProperty('display', 'flex', 'important');
                qm.classList.remove('hidden');
            }
        }

        function closeQuickMailPickerModal() {
            const qm = document.getElementById('quickMailPickerModal');
            if (qm) {
                qm.style.setProperty('display', 'none', 'important');
                qm.classList.add('hidden');
            }
        }

        function openEmailModal(personName) {
            currentEmailPersonName = personName;
            const member = team.find(m => m.name.toLowerCase().trim() === personName.toLowerCase().trim()) || {
                name: personName,
                email: ""
            };

            document.getElementById('emailRecipientName').value = personName;
            document.getElementById('emailRecipientAddress').value = member.email || '';
            document.getElementById('emailModalSubtitle').innerText = `${personName} için görev durum raporu ve aksiyon özeti`;

            const now = new Date();
            now.setHours(0,0,0,0);
            const pTasks = tasks.filter(t => t.owner.toLowerCase().trim() === personName.toLowerCase().trim());
            const delayedCount = pTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now).length;
            const openCount = pTasks.filter(t => t.status !== 'Tamamlandı').length;
            const completedCount = pTasks.filter(t => t.status === 'Tamamlandı').length;

            document.getElementById('cntDelayed').innerText = delayedCount;
            document.getElementById('cntOpen').innerText = openCount;
            document.getElementById('cntCompleted').innerText = completedCount;

            document.getElementById('chkIncludeDelayed').checked = delayedCount > 0;
            document.getElementById('chkIncludeOpen').checked = true;
            document.getElementById('chkIncludeCompleted').checked = false;

            updateEmailPreview();
            const em = document.getElementById('emailModal');
            if (em) {
                em.style.setProperty('display', 'flex', 'important');
                em.classList.remove('hidden');
            }
        }

        function closeEmailModal() {
            const em = document.getElementById('emailModal');
            if (em) {
                em.style.setProperty('display', 'none', 'important');
                em.classList.add('hidden');
            }
        }

        function updateEmailPreview() {
            const personName = currentEmailPersonName;
            const includeDelayed = document.getElementById('chkIncludeDelayed').checked;
            const includeOpen = document.getElementById('chkIncludeOpen').checked;
            const includeCompleted = document.getElementById('chkIncludeCompleted').checked;

            const now = new Date();
            now.setHours(0,0,0,0);
            const pTasks = tasks.filter(t => t.owner.toLowerCase().trim() === personName.toLowerCase().trim());

            const delayedTasks = pTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now);
            const openTasks = pTasks.filter(t => t.status !== 'Tamamlandı');
            const completedTasks = pTasks.filter(t => t.status === 'Tamamlandı');

            const total = pTasks.length;
            const completed = completedTasks.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            let mailText = `Sayın ${personName},\n\n`;
            mailText += `Koordinasyon Toplantısı Aksiyon Takip Sistemi kapsamındaki güncel görev durumunuz ve aksiyon listeniz aşağıda bilginize sunulmuştur:\n\n`;
            mailText += `📊 GENEL PERFORMANS: Toplam ${total} görevden ${completed} tanesi tamamlandı (Başarı Oranı: %${pct})\n`;
            mailText += `--------------------------------------------------\n\n`;

            if (includeDelayed) {
                mailText += `⚠️ GECİKEN İŞLERİNİZ (${delayedTasks.length} Adet):\n`;
                if (delayedTasks.length === 0) {
                    mailText += `• Harika! Geciken herhangi bir işiniz bulunmuyor.\n\n`;
                } else {
                    delayedTasks.forEach((t, i) => {
                        mailText += `${i + 1}. [GECİKTİ] ${t.title}\n`;
                        mailText += `   - Birim: ${t.department}\n`;
                        mailText += `   - Hedef Termin: ${formatTurkishDate(t.dueDate)}\n`;
                        mailText += `   - Aksiyon: ${t.action}\n\n`;
                    });
                }
            }

            if (includeOpen) {
                mailText += `⏳ BEKLEYEN / DEVAM EDEN İŞLERİNİZ (${openTasks.length} Adet):\n`;
                if (openTasks.length === 0) {
                    mailText += `• Bekleyen açık işiniz bulunmuyor.\n\n`;
                } else {
                    openTasks.forEach((t, i) => {
                        mailText += `${i + 1}. [${t.status}] ${t.title}\n`;
                        mailText += `   - Birim: ${t.department}\n`;
                        mailText += `   - Hedef Termin: ${formatTurkishDate(t.dueDate)}\n`;
                        mailText += `   - Aksiyon: ${t.action}\n\n`;
                    });
                }
            }

            if (includeCompleted) {
                mailText += `✅ TAMAMLANAN İŞLERİNİZ (${completedTasks.length} Adet):\n`;
                if (completedTasks.length === 0) {
                    mailText += `• Henüz tamamlanan görev kaydı yok.\n\n`;
                } else {
                    completedTasks.forEach((t, i) => {
                        mailText += `${i + 1}. [BİTTİ] ${t.title} (${t.department})\n`;
                    });
                    mailText += `\n`;
                }
            }

            mailText += `Gereğini ve aksiyonların takibini rica eder, iyi çalışmalar dileriz.\n`;
            mailText += `CAN ÇEREZ (1978) • Yönetim Kurulu`;

            document.getElementById('emailBodyPreview').value = mailText;
        }

        function copyEmailText() {
            const body = document.getElementById('emailBodyPreview').value;
            navigator.clipboard.writeText(body).then(() => {
                alert("Mail metni panoya kopyalandı! WhatsApp veya mailinize yapıştırabilirsiniz.");
            });
        }

        function openInGmail(to, subject, body) {
            const encodedTo = encodeURIComponent(to || '');
            const encodedSu = encodeURIComponent(subject || '');
            const encodedBody = encodeURIComponent(body || '');
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSu}&body=${encodedBody}`;
            window.open(gmailUrl, '_blank');
        }

        function sendMailClient() {
            const to = document.getElementById('emailRecipientAddress').value.trim();
            const subject = `[Aksiyon Takip] ${currentEmailPersonName} - Görev & İlerleme Raporu`;
            const body = document.getElementById('emailBodyPreview').value;

            if (!to) {
                alert("Lütfen bir alıcı e-posta adresi girin veya Rehberden ekleyin.");
                document.getElementById('emailRecipientAddress').focus();
                return;
            }

            openInGmail(to, subject, body);
        }

        // ================= WHATSAPP ENTEGRASYONU =================
        function formatWhatsAppPhone(phone) {
            if (!phone) return '';
            let cleaned = phone.replace(/\D/g, '');
            if (cleaned.startsWith('0')) {
                cleaned = '9' + cleaned;
            } else if (cleaned.length === 10) {
                cleaned = '90' + cleaned;
            }
            return cleaned;
        }

        function sendWhatsAppMessage(formattedPhone, messageText, personName) {
            if (!formattedPhone) {
                const inputPhone = prompt(`${personName ? `"${personName}"` : 'Çalışan'} için rehberde kayıtlı geçerli telefon numarası bulunamadı.\n\nWhatsApp mesajı göndermek istediğiniz cep telefonu numarasını girin (Örn: 0532 123 45 67) veya WhatsApp Web/Uygulamada kişi seçmek için boş bırakıp Tamam'a basın:`);
                if (inputPhone !== null) {
                    formattedPhone = formatWhatsAppPhone(inputPhone);
                } else {
                    return; // İptal edildi
                }
            }

            const encoded = encodeURIComponent(messageText);
            const url = formattedPhone 
                ? `https://wa.me/${formattedPhone}?text=${encoded}`
                : `https://wa.me/?text=${encoded}`;

            window.open(url, '_blank');
        }

        function openWhatsAppTask(taskId) {
            const task = tasks.find(t => String(t.id) === String(taskId));
            if (!task) return;

            const ownerName = task.owner ? task.owner.trim() : '';
            const member = team.find(m => m.name.toLowerCase().trim() === ownerName.toLowerCase().trim());
            const phone = member ? formatWhatsAppPhone(member.phone) : '';

            const now = new Date();
            now.setHours(0,0,0,0);
            const isOverdue = task.status !== 'Tamamlandı' && new Date(task.dueDate) < now;

            let msg = `🥜 *CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan)*\n`;
            msg += `🏢 _CAN ÇEREZ (1978)_\n`;
            msg += `*Görev & Aksiyon Hatırlatması*\n\n`;
            if (ownerName) {
                msg += `Sayın *${ownerName}*,\n`;
            }
            msg += `Üzerinizdeki görev hakkında bilgilendirme:\n\n`;
            msg += `📋 *Görev:* ${task.title}\n`;
            msg += `🏢 *Birim:* ${task.department || '-'}\n`;
            msg += `📅 *Hedef Termin:* ${formatTurkishDate(task.dueDate)}${isOverdue ? ' ⚠️ *(GECİKTİ)*' : ''}\n`;
            msg += `⏳ *Mevcut Durum:* ${task.status}\n`;
            msg += `📝 *Aksiyon:* ${task.action || '-'}\n\n`;
            msg += `Görev durumunuzu Personel Paneli üzerinden güncelleyebilirsiniz:\n`;
            const personnelUrl = window.location.href.split('?')[0].replace(/yonetici\.html|index\.html|$/, 'personel.html');
            msg += `${personnelUrl}\n\n`;
            msg += `İyi çalışmalar dileriz.`;

            sendWhatsAppMessage(phone, msg, ownerName);
        }

        function openWhatsAppMember(ownerName) {
            const member = team.find(m => m.name.toLowerCase().trim() === ownerName.toLowerCase().trim());
            const phone = member ? formatWhatsAppPhone(member.phone) : '';

            const now = new Date();
            now.setHours(0,0,0,0);
            const pTasks = tasks.filter(t => t.owner.toLowerCase().trim() === ownerName.toLowerCase().trim());
            const openTasks = pTasks.filter(t => t.status !== 'Tamamlandı');
            const delayedTasks = pTasks.filter(t => t.status !== 'Tamamlandı' && new Date(t.dueDate) < now);
            const completedTasks = pTasks.filter(t => t.status === 'Tamamlandı');

            let msg = `🥜 *CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan)*\n`;
            msg += `🏢 _CAN ÇEREZ (1978)_\n`;
            msg += `*Görev & Performans Durum Özeti*\n\n`;
            msg += `Sayın *${ownerName}*,\n`;
            msg += `Koordinasyon Takip Sistemindeki güncel görev durumunuz:\n\n`;
            msg += `📊 *Özet:* ${pTasks.length} Toplam | ⏳ ${openTasks.length} Bekleyen | ⚠️ ${delayedTasks.length} Geciken | ✅ ${completedTasks.length} Tamamlanan\n`;
            msg += `--------------------------------------------------\n\n`;

            if (delayedTasks.length > 0) {
                msg += `⚠️ *GECİKEN GÖREVLERİNİZ:*\n`;
                delayedTasks.forEach((t, i) => {
                    msg += `${i + 1}. ${t.title} (Termin: ${formatTurkishDate(t.dueDate)})\n   • Aksiyon: ${t.action}\n`;
                });
                msg += `\n`;
            }

            if (openTasks.length > 0) {
                msg += `⏳ *BEKLEYEN / DEVAM EDEN GÖREVLERİNİZ:*\n`;
                openTasks.forEach((t, i) => {
                    msg += `${i + 1}. [${t.status}] ${t.title} (Termin: ${formatTurkishDate(t.dueDate)})\n   • Aksiyon: ${t.action}\n`;
                });
                msg += `\n`;
            }

            if (openTasks.length === 0 && delayedTasks.length === 0) {
                msg += `🎉 Tebrikler! Bekleyen veya geciken herhangi bir açık göreviniz bulunmuyor.\n\n`;
            }

            msg += `Görevlerinizi güncel tutmak için Personel Paneli:\n`;
            const personnelUrl = window.location.href.split('?')[0].replace(/yonetici\.html|index\.html|$/, 'personel.html');
            msg += `${personnelUrl}\n\n`;
            msg += `İyi çalışmalar dileriz.`;

            sendWhatsAppMessage(phone, msg, ownerName);
        }

        function sendWhatsAppFromModal() {
            const member = team.find(m => m.name.toLowerCase().trim() === currentEmailPersonName.toLowerCase().trim());
            const phone = member ? formatWhatsAppPhone(member.phone) : '';
            const previewText = document.getElementById('emailBodyPreview').value;
            sendWhatsAppMessage(phone, previewText, currentEmailPersonName);
        }

        function shareBulkWhatsApp() {
            const rawText = document.getElementById('bulkBodyPreview').value;
            const msg = `🥜 *CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan)*\n🏢 _CAN ÇEREZ (1978)_\n*Koordinasyon Toplantısı - Toplu Aksiyon Hatırlatması*\n\n` + rawText;
            const encoded = encodeURIComponent(msg);
            window.open(`https://wa.me/?text=${encoded}`, '_blank');
        }

        // ================= TOPLU HATIRLATMA MAİLİ MANTIĞI =================
        function openBulkReminderModal() {
            const now = new Date();
            now.setHours(0,0,0,0);

            // Tamamlanmamış görevleri bul (Açık veya Devam Ediyor)
            const uncompletedTasks = tasks.filter(t => t.status !== 'Tamamlandı');
            
            // Sorumlulara göre grupla
            const ownersMap = {};
            uncompletedTasks.forEach(t => {
                const owner = t.owner ? t.owner.trim() : 'Atanmamış';
                if (!ownersMap[owner]) {
                    ownersMap[owner] = [];
                }
                ownersMap[owner].push(t);
            });

            const ownerNames = Object.keys(ownersMap);
            const totalDelayed = uncompletedTasks.filter(t => new Date(t.dueDate) < now).length;
            const totalOpen = uncompletedTasks.length;

            document.getElementById('bulkModalPersonCount').innerText = `${ownerNames.length} Kişi`;
            document.getElementById('bulkModalOpenCount').innerText = `${totalOpen} Görev`;
            document.getElementById('bulkModalDelayedCount').innerText = `${totalDelayed} Geciken`;

            // Alıcı e-postalarını topla
            const emailList = [];
            ownerNames.forEach(name => {
                const member = team.find(m => m.name.toLowerCase().trim() === name.toLowerCase().trim());
                if (member && member.email) {
                    emailList.push(member.email.trim());
                }
            });

            document.getElementById('bulkRecipientsInput').value = emailList.join(', ');

            // Toplu Hatırlatma Mail Metni Oluştur
            let body = `Sayın Çalışma Arkadaşlarımız,\n\n`;
            body += `Koordinasyon Toplantısı Aksiyon Takip Sistemi üzerinde yapılan kontrollerde, üzerinizde henüz TAMAMLANMAMIŞ ve/veya GECİKMİŞ görevler bulunmaktadır.\n\n`;
            body += `📊 GÜNCEL DURUM: Toplam ${totalOpen} adet bekleyen görev bulunmakta olup, bunlardan ${totalDelayed} tanesi hedef termin tarihini geçmiştir.\n`;
            body += `--------------------------------------------------\n\n`;

            ownerNames.forEach((name, idx) => {
                const pTasks = ownersMap[name];
                const pDelayed = pTasks.filter(t => new Date(t.dueDate) < now).length;
                const member = team.find(m => m.name.toLowerCase().trim() === name.toLowerCase().trim());
                const role = member ? ` (${member.title})` : '';

                body += `📌 ${name.toUpperCase()}${role} - [${pTasks.length} Görev / ${pDelayed} Gecikme]:\n`;
                pTasks.forEach((t, i) => {
                    const isDel = new Date(t.dueDate) < now;
                    body += `   ${i + 1}. ${isDel ? '⚠️ [GECİKTİ] ' : '⏳ [' + t.status + '] '}${t.title}\n`;
                    body += `      • Birim: ${t.department}\n`;
                    body += `      • Hedef Termin: ${formatTurkishDate(t.dueDate)}\n`;
                    body += `      • Aksiyon: ${t.action}\n`;
                });
                body += `\n`;
            });

            body += `--------------------------------------------------\n`;
            body += `Lütfen ilgili görevlerinizi en kısa sürede tamamlayarak Personel Paneli üzerinden durumunuzu 'Tamamlandı' olarak güncelleyiniz.\n\n`;
            body += `İyi çalışmalar dileriz,\n`;
            body += `CAN ÇEREZ (1978) • Koordinasyon & Yönetim Kurulu`;

            document.getElementById('bulkBodyPreview').value = body;
            const bm = document.getElementById('bulkReminderModal');
            if (bm) {
                bm.style.setProperty('display', 'flex', 'important');
                bm.classList.remove('hidden');
            }
        }

        function closeBulkReminderModal() {
            const bm = document.getElementById('bulkReminderModal');
            if (bm) {
                bm.style.setProperty('display', 'none', 'important');
                bm.classList.add('hidden');
            }
        }

        function copyBulkEmailText() {
            const text = document.getElementById('bulkBodyPreview').value;
            navigator.clipboard.writeText(text).then(() => {
                alert("Toplu hatırlatma metni kopyalandı! WhatsApp grubuna veya mailinize yapıştırabilirsiniz.");
            });
        }

        function sendBulkMailClient() {
            const to = document.getElementById('bulkRecipientsInput').value.trim();
            const subject = document.getElementById('bulkSubjectInput').value.trim();
            const body = document.getElementById('bulkBodyPreview').value;

            if (!to) {
                alert("Lütfen en az bir alıcı e-posta adresi girin.");
                return;
            }

            openInGmail(to, subject, body);
        }

        // ================= EKİP REHBERİ =================
        function openTeamModal() {
            resetTeamForm();
            renderTeamCards();
            const tm = document.getElementById('teamModal');
            if (tm) {
                tm.style.setProperty('display', 'flex', 'important');
                tm.classList.remove('hidden');
            }
        }

        function closeTeamModal() {
            const tm = document.getElementById('teamModal');
            if (tm) {
                tm.style.setProperty('display', 'none', 'important');
                tm.classList.add('hidden');
            }
        }

        function renderTeamCards() {
            const container = document.getElementById('teamCardsContainer');
            document.getElementById('teamTotalCount').innerText = team.length;

            if (team.length === 0) {
                container.innerHTML = '<p class="text-slate-400 py-4 text-center col-span-2">Henüz kayıtlı kişi yok.</p>';
                return;
            }

            container.innerHTML = team.map((member, idx) => {
                const memberTaskCount = tasks.filter(t => t.owner.toLowerCase().trim() === member.name.toLowerCase().trim()).length;
                return `
                    <div class="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] shadow-2xs hover:shadow-sm transition-shadow flex items-start justify-between gap-2">
                        <div class="flex items-start gap-2.5 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-[#31261D] text-[#FFBF3F] border border-[#FFBF3F]/30 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                ${getInitials(member.name)}
                            </div>
                            <div class="min-w-0">
                                <h5 class="font-bold text-[#31261D] text-xs truncate">${escapeHtml(member.name)}</h5>
                                <p class="text-[11px] text-[#824701] font-semibold truncate">${escapeHtml(member.title)}</p>
                                <p class="text-[11px] text-[#5C4A3C] mt-1 flex items-center gap-1 font-medium">
                                    <i class="fa-solid fa-phone text-[#1E340C] text-[10px]"></i> ${escapeHtml(member.phone)}
                                </p>
                                <p class="text-[10px] text-[#5C4A3C]/80 truncate">${escapeHtml(member.email || '')}</p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1.5">
                            <span class="text-[10px] bg-[#FAF7F2] text-[#31261D] border border-[#E8DFC8] px-2 py-0.5 rounded-full font-bold">
                                ${memberTaskCount} Görev
                            </span>
                            <span class="text-[10px] bg-[#FFBF3F]/20 text-[#824701] border border-[#FFBF3F]/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                                <i class="fa-solid fa-key text-[9px] text-[#A6192E]"></i> PIN: ${escapeHtml(member.pin || '1978')}
                            </span>
                            <button onclick="resetStaffPinDirect(${idx})" title="Şifre Sıfırla / Güncelle" class="px-2 py-0.5 text-[10px] bg-amber-500/15 text-amber-900 hover:bg-amber-500/30 border border-amber-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95">
                                <i class="fa-solid fa-rotate-left text-[9px] text-[#A6192E]"></i> Şifre Değiştir
                            </button>
                            <div class="flex items-center gap-1 mt-1">
                                <button onclick="openWhatsAppMember('${escapeHtml(member.name)}')" title="WhatsApp Mesajı Gönder" class="p-1 text-[#5C4A3C] hover:text-[#1E340C] rounded-lg cursor-pointer"><i class="fa-brands fa-whatsapp text-sm"></i></button>
                                <button onclick="openEmailModal('${escapeHtml(member.name)}')" title="Mail Gönder" class="p-1 text-[#5C4A3C] hover:text-[#A6192E] rounded-lg cursor-pointer"><i class="fa-solid fa-envelope text-[11px]"></i></button>
                                <button onclick="editTeamMember(${idx})" class="p-1 text-[#5C4A3C] hover:text-[#824701] rounded-lg cursor-pointer"><i class="fa-solid fa-pen text-[11px]"></i></button>
                                <button onclick="deleteTeamMember(${idx})" class="p-1 text-[#5C4A3C] hover:text-[#A6192E] rounded-lg cursor-pointer"><i class="fa-regular fa-trash-can text-[11px]"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function resetStaffPinDirect(idx) {
            const m = team[idx];
            if (!m) return;
            const currentPin = m.pin || '1978';
            const newPin = prompt(`"${m.name}" personeli için yeni PIN / Şifre belirleyin:\n\n(Şu anki PIN: ${currentPin})\n\n(Personel şifresini unuttuysa buradan güncelleyebilirsiniz):`, currentPin);
            if (newPin !== null) {
                const trimmed = newPin.trim();
                if (trimmed.length < 4) {
                    alert("Şifre en az 4 haneli olmalıdır.");
                    return;
                }
                m.pin = trimmed;
                saveData();
                renderTeamCards();
                alert(`"${m.name}" personelinin şifresi başarıyla "${trimmed}" olarak güncellendi! Personel yeni şifresiyle giriş yapabilir.`);
            }
        }

        function handleTeamSubmit(e) {
            e.preventDefault();
            const editIdx = parseInt(document.getElementById('editPersonIndex').value);
            const newName = document.getElementById('personName').value.trim();
            const oldName = (editIdx >= 0 && team[editIdx]) ? team[editIdx].name : null;

            // Silinenler listesinde bu isim varsa kaldır
            let deletedNames = getDeletedMemberNames().filter(n => n !== newName.toLowerCase().trim());
            localStorage.setItem('task_deleted_member_names', JSON.stringify(deletedNames));

            const memberData = {
                name: newName,
                title: document.getElementById('personTitle').value.trim(),
                phone: document.getElementById('personPhone').value.trim(),
                email: document.getElementById('personEmail').value.trim(),
                department: document.getElementById('personDepartment').value.trim(),
                pin: document.getElementById('personPin').value.trim() || '1978'
            };

            if (editIdx >= 0) {
                if (oldName && oldName !== newName) {
                    tasks.forEach(t => {
                        if (t.owner && t.owner.toLowerCase().trim() === oldName.toLowerCase().trim()) {
                            t.owner = newName;
                        }
                    });
                }
                team[editIdx] = memberData;
            } else {
                team.push(memberData);
            }

            saveData();
            updateTeamDatalist();
            resetTeamForm();
            renderTeamCards();
            renderApp();
        }

        function editTeamMember(idx) {
            const m = team[idx];
            document.getElementById('editPersonIndex').value = idx;
            document.getElementById('personName').value = m.name;
            document.getElementById('personTitle').value = m.title;
            document.getElementById('personPhone').value = m.phone;
            document.getElementById('personEmail').value = m.email || '';
            document.getElementById('personDepartment').value = m.department || '';
            document.getElementById('personPin').value = m.pin || '1978';

            document.getElementById('teamFormTitle').innerHTML = '<i class="fa-solid fa-pen text-[#A6192E]"></i> Kişi Bilgilerini Güncelle: ' + m.name;
            document.getElementById('cancelTeamEditBtn').classList.remove('hidden');
        }

        function resetTeamForm() {
            document.getElementById('teamMemberForm').reset();
            document.getElementById('editPersonIndex').value = "-1";
            document.getElementById('personPin').value = "1978";
            document.getElementById('teamFormTitle').innerHTML = '<i class="fa-solid fa-user-plus text-[#A6192E]"></i> Yeni Kişi Ekle';
            document.getElementById('cancelTeamEditBtn').classList.add('hidden');
        }

        function deleteTeamMember(idx) {
            const memberToDelete = team[idx];
            if (!memberToDelete) return;
            if (confirm(`${memberToDelete.name} kişisini rehberden silmek istediğinize emin misiniz?`)) {
                const deletedNames = getDeletedMemberNames();
                if (memberToDelete.name && !deletedNames.includes(memberToDelete.name.toLowerCase().trim())) {
                    deletedNames.push(memberToDelete.name.toLowerCase().trim());
                    localStorage.setItem('task_deleted_member_names', JSON.stringify(deletedNames));
                }
                team.splice(idx, 1);
                saveData();
                updateTeamDatalist();
                renderTeamCards();
                renderApp();
            }
        }

        // ================= GÖREV CRUD & BİRİM OTO-SEÇİM =================
        function onTaskOwnerChanged() {
            const ownerInput = document.getElementById('taskOwner');
            const deptSelect = document.getElementById('taskDepartment');
            const autoBadge = document.getElementById('autoDeptBadge');
            if (!ownerInput || !deptSelect) return;

            const ownerName = ownerInput.value.trim().toLowerCase();
            if (!ownerName) {
                if (autoBadge) autoBadge.classList.add('hidden');
                return;
            }

            const member = team.find(m => m && m.name && m.name.toLowerCase().trim() === ownerName);
            if (member && member.department && member.department.trim()) {
                const dept = member.department.trim();
                let exists = false;
                for (let i = 0; i < deptSelect.options.length; i++) {
                    if (deptSelect.options[i].value.toLowerCase() === dept.toLowerCase()) {
                        deptSelect.selectedIndex = i;
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    const opt = document.createElement('option');
                    opt.value = dept;
                    opt.textContent = dept;
                    const newOpt = deptSelect.querySelector('option[value="__NEW__"]');
                    if (newOpt) {
                        deptSelect.insertBefore(opt, newOpt);
                    } else {
                        deptSelect.appendChild(opt);
                    }
                    deptSelect.value = dept;
                }
                if (autoBadge) {
                    autoBadge.classList.remove('hidden');
                }
            } else {
                if (autoBadge) autoBadge.classList.add('hidden');
            }
        }

        function handleDepartmentSelectChange(selectEl) {
            const autoBadge = document.getElementById('autoDeptBadge');
            if (autoBadge) autoBadge.classList.add('hidden');

            if (selectEl.value === '__NEW__') {
                const newDept = prompt("Eklemek istediğiniz yeni birim adını yazınız:");
                if (newDept && newDept.trim()) {
                    const trimmed = newDept.trim();
                    if (!Array.isArray(window.departments)) window.departments = [...DEFAULT_DEPARTMENTS];
                    if (!window.departments.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
                        window.departments.push(trimmed);
                        saveDepartments();
                        refreshBranchAndDepartmentSelects();
                    }
                    selectEl.value = trimmed;
                } else {
                    selectEl.value = (window.departments && window.departments[0]) || 'Üretim';
                }
            }
        }

        // ================= 7. ŞUBE & BİRİM YÖNETİM MERKEZİ =================
        function refreshBranchAndDepartmentSelects() {
            // 1. Branch Filter Select
            const branchFilter = document.getElementById('branchFilter');
            if (branchFilter) {
                const curVal = branchFilter.value || 'ALL';
                const allBranchesList = Array.from(new Set([...(window.branches || DEFAULT_BRANCHES)]));
                if (Array.isArray(window.tasks)) {
                    window.tasks.forEach(t => {
                        if (t.branch && !allBranchesList.includes(t.branch)) {
                            allBranchesList.push(t.branch);
                        }
                    });
                }
                let html = '<option value="ALL">📍 Tüm Şubeler / Lokasyonlar</option>';
                allBranchesList.forEach(b => {
                    html += `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`;
                });
                branchFilter.innerHTML = html;
                branchFilter.value = allBranchesList.includes(curVal) ? curVal : 'ALL';
            }

            // 2. Task Branch Select
            const taskBranch = document.getElementById('taskBranch');
            if (taskBranch) {
                const curVal = taskBranch.value;
                const bList = window.branches || DEFAULT_BRANCHES;
                let html = '';
                bList.forEach(b => {
                    html += `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`;
                });
                html += '<option value="__NEW_BRANCH__">➕ Yeni Şube Ekle...</option>';
                taskBranch.innerHTML = html;
                if (curVal && curVal !== '__NEW_BRANCH__' && bList.includes(curVal)) {
                    taskBranch.value = curVal;
                } else if (bList.length > 0) {
                    taskBranch.value = bList[0];
                }
            }

            // 3. Task Department Select
            const taskDept = document.getElementById('taskDepartment');
            if (taskDept) {
                const curVal = taskDept.value;
                const dList = window.departments || DEFAULT_DEPARTMENTS;
                let html = '';
                dList.forEach(d => {
                    html += `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`;
                });
                html += '<option value="__NEW__">➕ Yeni Birim Ekle...</option>';
                taskDept.innerHTML = html;
                if (curVal && curVal !== '__NEW__' && dList.includes(curVal)) {
                    taskDept.value = curVal;
                } else if (dList.length > 0) {
                    taskDept.value = dList[0];
                }
            }

            // 4. Branch QR Select
            const qrSelect = document.getElementById('branchQrSelect');
            if (qrSelect) {
                const curVal = qrSelect.value;
                const bList = window.branches || DEFAULT_BRANCHES;
                let html = '';
                bList.forEach(b => {
                    html += `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`;
                });
                qrSelect.innerHTML = html;
                if (curVal && bList.includes(curVal)) {
                    qrSelect.value = curVal;
                } else if (bList.length > 0) {
                    qrSelect.value = bList[0];
                }
            }

            // 5. Team Modal Department Datalist
            const deptDl = document.getElementById('deptDatalist');
            if (deptDl) {
                deptDl.innerHTML = (window.departments || DEFAULT_DEPARTMENTS).map(d => `<option value="${escapeHtml(d)}">`).join('');
            }
        }

        function openBranchDeptModal(tab = 'branches') {
            switchBranchDeptTab(tab);
            renderBranchModalList();
            renderDeptModalList();
            const modal = document.getElementById('branchDeptModal');
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                modal.classList.remove('hidden');
            }
        }

        function closeBranchDeptModal() {
            const modal = document.getElementById('branchDeptModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                modal.classList.add('hidden');
            }
        }

        function switchBranchDeptTab(tab) {
            const tabBranches = document.getElementById('tabContentBranches');
            const tabDepts = document.getElementById('tabContentDepartments');
            const btnBranches = document.getElementById('tabBtnBranches');
            const btnDepts = document.getElementById('tabBtnDepartments');

            if (tab === 'departments') {
                if (tabBranches) tabBranches.classList.add('hidden');
                if (tabDepts) tabDepts.classList.remove('hidden');
                if (btnBranches) {
                    btnBranches.className = "flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-[#5C4A3C] hover:text-[#31261D] hover:bg-white/60";
                }
                if (btnDepts) {
                    btnDepts.className = "flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 bg-white text-[#1E340C] shadow-xs border border-[#E8DFC8]";
                }
            } else {
                if (tabBranches) tabBranches.classList.remove('hidden');
                if (tabDepts) tabDepts.classList.add('hidden');
                if (btnBranches) {
                    btnBranches.className = "flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 bg-white text-[#A6192E] shadow-xs border border-[#E8DFC8]";
                }
                if (btnDepts) {
                    btnDepts.className = "flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-[#5C4A3C] hover:text-[#31261D] hover:bg-white/60";
                }
            }
        }

        function renderBranchModalList() {
            const listEl = document.getElementById('branchItemsList');
            const countEl = document.getElementById('branchTabCount');
            if (!listEl) return;
            const branchList = window.branches || DEFAULT_BRANCHES;
            if (countEl) countEl.innerText = branchList.length;

            if (branchList.length === 0) {
                listEl.innerHTML = '<div class="p-6 text-center text-stone-400">Henüz kayıtlı şube bulunmuyor.</div>';
                return;
            }

            listEl.innerHTML = branchList.map((bName, idx) => {
                const taskCount = (window.tasks || []).filter(t => (t.branch || 'Merkez / Genel') === bName).length;
                const isDefault = bName === 'Merkez / Genel';
                return `
                    <div class="px-4 py-3 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors group">
                        <div class="flex items-center gap-3">
                            <div class="w-7 h-7 rounded-lg bg-[#FAF2E6] text-[#A6192E] flex items-center justify-center font-bold text-xs border border-[#FFBF3F]/30">
                                ${idx + 1}
                            </div>
                            <div>
                                <div class="font-bold text-[#31261D] text-xs flex items-center gap-1.5">
                                    <span>${escapeHtml(bName)}</span>
                                    ${isDefault ? '<span class="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-semibold">Merkez</span>' : ''}
                                </div>
                                <div class="text-[10px] text-[#7A6A5C]">
                                    <i class="fa-solid fa-list-check mr-1 text-[#824701]"></i>${taskCount} görev bağlı
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="editBranchName('${escapeHtml(bName)}')" title="Şube Adını Düzenle" class="px-2.5 py-1 bg-white hover:bg-[#FAF2E6] text-[#31261D] border border-[#E8DFC8] rounded-lg text-[11px] font-bold transition-all cursor-pointer">
                                <i class="fa-solid fa-pen-to-square text-[#A6192E] mr-1"></i>Düzenle
                            </button>
                            <button type="button" onclick="deleteBranchItem('${escapeHtml(bName)}')" title="Şubeyi Kaldır" class="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer">
                                <i class="fa-solid fa-trash mr-1"></i>Sil
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderDeptModalList() {
            const listEl = document.getElementById('deptItemsList');
            const countEl = document.getElementById('deptTabCount');
            if (!listEl) return;
            const deptList = window.departments || DEFAULT_DEPARTMENTS;
            if (countEl) countEl.innerText = deptList.length;

            if (deptList.length === 0) {
                listEl.innerHTML = '<div class="p-6 text-center text-stone-400">Henüz kayıtlı birim bulunmuyor.</div>';
                return;
            }

            listEl.innerHTML = deptList.map((dName, idx) => {
                const taskCount = (window.tasks || []).filter(t => (t.department || '') === dName).length;
                const memberCount = (window.team || []).filter(m => (m.department || '') === dName).length;
                return `
                    <div class="px-4 py-3 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors group">
                        <div class="flex items-center gap-3">
                            <div class="w-7 h-7 rounded-lg bg-[#FAF2E6] text-[#1E340C] flex items-center justify-center font-bold text-xs border border-[#FFBF3F]/30">
                                ${idx + 1}
                            </div>
                            <div>
                                <div class="font-bold text-[#31261D] text-xs">
                                    ${escapeHtml(dName)}
                                </div>
                                <div class="text-[10px] text-[#7A6A5C] flex items-center gap-2">
                                    <span><i class="fa-solid fa-list-check mr-1 text-[#824701]"></i>${taskCount} görev</span>
                                    <span>•</span>
                                    <span><i class="fa-solid fa-user mr-1 text-[#1E340C]"></i>${memberCount} personel</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="editDeptName('${escapeHtml(dName)}')" title="Birim Adını Düzenle" class="px-2.5 py-1 bg-white hover:bg-[#FAF2E6] text-[#31261D] border border-[#E8DFC8] rounded-lg text-[11px] font-bold transition-all cursor-pointer">
                                <i class="fa-solid fa-pen-to-square text-[#A6192E] mr-1"></i>Düzenle
                            </button>
                            <button type="button" onclick="deleteDeptItem('${escapeHtml(dName)}')" title="Birimi Kaldır" class="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer">
                                <i class="fa-solid fa-trash mr-1"></i>Sil
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function handleAddNewBranch(e) {
            if (e && e.preventDefault) e.preventDefault();
            const input = document.getElementById('newBranchInput');
            if (!input) return;
            const name = input.value.trim();
            if (!name) return;

            if (!Array.isArray(window.branches)) window.branches = [...DEFAULT_BRANCHES];

            const exists = window.branches.some(b => b.toLowerCase() === name.toLowerCase());
            if (exists) {
                alert(`"${name}" şubesi zaten listede mevcut.`);
                return;
            }

            window.branches.push(name);
            saveBranches();
            input.value = '';
            renderBranchModalList();
            refreshBranchAndDepartmentSelects();
            calculateAndRenderBranchLeague();
        }

        function editBranchName(oldName) {
            const newName = prompt(`"${oldName}" şubesinin yeni adını giriniz:`, oldName);
            if (!newName || !newName.trim() || newName.trim() === oldName) return;

            const trimmed = newName.trim();
            const exists = window.branches.some(b => b.toLowerCase() === trimmed.toLowerCase() && b !== oldName);
            if (exists) {
                alert(`"${trimmed}" isimli bir şube zaten var.`);
                return;
            }

            const idx = window.branches.indexOf(oldName);
            if (idx !== -1) {
                window.branches[idx] = trimmed;
            }

            let updatedTasks = 0;
            if (Array.isArray(window.tasks)) {
                window.tasks.forEach(t => {
                    if ((t.branch || 'Merkez / Genel') === oldName) {
                        t.branch = trimmed;
                        updatedTasks++;
                    }
                });
            }

            if (updatedTasks > 0) {
                localStorage.setItem('task_items', JSON.stringify(window.tasks));
            }

            saveBranches();
            renderBranchModalList();
            refreshBranchAndDepartmentSelects();
            calculateAndRenderBranchLeague();
            renderApp();
        }

        function deleteBranchItem(name) {
            if (!window.branches) return;
            if (window.branches.length <= 1) {
                alert("En az bir şube bulunmalıdır.");
                return;
            }

            const linkedTasksCount = (window.tasks || []).filter(t => (t.branch || 'Merkez / Genel') === name).length;
            let msg = `"${name}" şubesini silmek istediğinize emin misiniz?`;
            if (linkedTasksCount > 0) {
                msg = `"${name}" şubesine bağlı ${linkedTasksCount} adet görev bulunmaktadır.\n\nŞube listeden kaldırılacaktır ancak mevcut görev kayıtları bozulmayacak ve geçmiş raporlarda görünmeye devam edecektir.\n\nOnaylıyor musunuz?`;
            }

            if (!confirm(msg)) return;

            window.branches = window.branches.filter(b => b !== name);
            saveBranches();
            renderBranchModalList();
            refreshBranchAndDepartmentSelects();
            calculateAndRenderBranchLeague();
        }

        function handleAddNewDept(e) {
            if (e && e.preventDefault) e.preventDefault();
            const input = document.getElementById('newDeptInput');
            if (!input) return;
            const name = input.value.trim();
            if (!name) return;

            if (!Array.isArray(window.departments)) window.departments = [...DEFAULT_DEPARTMENTS];

            const exists = window.departments.some(d => d.toLowerCase() === name.toLowerCase());
            if (exists) {
                alert(`"${name}" birimi zaten listede mevcut.`);
                return;
            }

            window.departments.push(name);
            saveDepartments();
            input.value = '';
            renderDeptModalList();
            refreshBranchAndDepartmentSelects();
        }

        function editDeptName(oldName) {
            const newName = prompt(`"${oldName}" biriminin yeni adını giriniz:`, oldName);
            if (!newName || !newName.trim() || newName.trim() === oldName) return;

            const trimmed = newName.trim();
            const exists = window.departments.some(d => d.toLowerCase() === trimmed.toLowerCase() && d !== oldName);
            if (exists) {
                alert(`"${trimmed}" isimli bir birim zaten var.`);
                return;
            }

            const idx = window.departments.indexOf(oldName);
            if (idx !== -1) {
                window.departments[idx] = trimmed;
            }

            let updatedTasks = 0;
            if (Array.isArray(window.tasks)) {
                window.tasks.forEach(t => {
                    if ((t.department || '') === oldName) {
                        t.department = trimmed;
                        updatedTasks++;
                    }
                });
            }

            if (updatedTasks > 0) {
                localStorage.setItem('task_items', JSON.stringify(window.tasks));
            }

            saveDepartments();
            renderDeptModalList();
            refreshBranchAndDepartmentSelects();
            renderApp();
        }

        function deleteDeptItem(name) {
            if (!window.departments) return;
            if (window.departments.length <= 1) {
                alert("En az bir birim bulunmalıdır.");
                return;
            }

            const linkedTasksCount = (window.tasks || []).filter(t => (t.department || '') === name).length;
            let msg = `"${name}" birimini silmek istediğinize emin misiniz?`;
            if (linkedTasksCount > 0) {
                msg = `"${name}" birimine bağlı ${linkedTasksCount} adet görev bulunmaktadır.\n\nBirim listeden kaldırılacaktır ancak mevcut görevlerin kayıtları bozulmayacaktır.\n\nOnaylıyor musunuz?`;
            }

            if (!confirm(msg)) return;

            window.departments = window.departments.filter(d => d !== name);
            saveDepartments();
            renderDeptModalList();
            refreshBranchAndDepartmentSelects();
        }

        function saveBranches() {
            localStorage.setItem('task_branches', JSON.stringify(window.branches));
            pushDataToServer();
        }

        function saveDepartments() {
            localStorage.setItem('task_departments', JSON.stringify(window.departments));
            pushDataToServer();
        }

        function handleBranchSelectChange(selectEl) {
            if (!selectEl) return;
            if (selectEl.value === '__NEW_BRANCH__') {
                const newBranch = prompt("Eklemek istediğiniz yeni şube / lokasyon adını yazınız:");
                if (newBranch && newBranch.trim()) {
                    const trimmed = newBranch.trim();
                    if (!Array.isArray(window.branches)) window.branches = [...DEFAULT_BRANCHES];
                    if (!window.branches.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
                        window.branches.push(trimmed);
                        saveBranches();
                        refreshBranchAndDepartmentSelects();
                        calculateAndRenderBranchLeague();
                    }
                    selectEl.value = trimmed;
                } else {
                    selectEl.value = (window.branches && window.branches[0]) || 'Bornova - Özkanlar';
                }
            }
        }


        function openNewTaskModal() {
            document.getElementById('taskForm').reset();
            document.getElementById('editTaskId').value = '';
            document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-plus text-[#FFBF3F]"></i> Yeni Görev / Aksiyon Girişi';
            
            const deptSelect = document.getElementById('taskDepartment');
            if (deptSelect) deptSelect.value = (window.departments && window.departments[0]) || 'Üretim';
            const autoBadge = document.getElementById('autoDeptBadge');
            if (autoBadge) autoBadge.classList.add('hidden');

            const branchSelect = document.getElementById('taskBranch');
            if (branchSelect) branchSelect.value = (window.branches && window.branches[0]) || 'Bornova - Özkanlar';
            document.getElementById('taskRecurrence').value = 'none';

            const d = new Date();
            d.setDate(d.getDate() + 7);
            document.getElementById('taskDueDate').value = d.toISOString().split('T')[0];
            const chk = document.getElementById('taskSendEmailNotification');
            if (chk) chk.checked = true;
            
            const tm = document.getElementById('taskModal');
            if (tm) {
                tm.style.setProperty('display', 'flex', 'important');
                tm.classList.remove('hidden');
            }
        }

        function editTask(id) {
            const task = tasks.find(t => String(t.id) === String(id));
            if (!task) return;

            document.getElementById('editTaskId').value = task.id;

            const deptSelect = document.getElementById('taskDepartment');
            const autoBadge = document.getElementById('autoDeptBadge');
            if (deptSelect) {
                let exists = false;
                for (let i = 0; i < deptSelect.options.length; i++) {
                    if (deptSelect.options[i].value === task.department) {
                        deptSelect.selectedIndex = i;
                        exists = true;
                        break;
                    }
                }
                if (!exists && task.department) {
                    const opt = document.createElement('option');
                    opt.value = task.department;
                    opt.textContent = task.department;
                    const newOpt = deptSelect.querySelector('option[value="__NEW__"]');
                    if (newOpt) {
                        deptSelect.insertBefore(opt, newOpt);
                    } else {
                        deptSelect.appendChild(opt);
                    }
                    deptSelect.value = task.department;
                }
            }
            if (autoBadge) autoBadge.classList.add('hidden');

            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskAction').value = task.action;
            document.getElementById('taskOwner').value = task.owner;
            document.getElementById('taskDueDate').value = task.dueDate;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskPriority').value = task.priority || 'Normal';
            document.getElementById('taskBranch').value = task.branch || 'Merkez / Genel';
            document.getElementById('taskRecurrence').value = task.recurrence || 'none';

            const chk = document.getElementById('taskSendEmailNotification');
            if (chk) chk.checked = false; // Düzenleme yaparken varsayılan kapalı

            document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-[#FFBF3F]"></i> Görevi Düzenle #' + task.id;
            const tm = document.getElementById('taskModal');
            if (tm) {
                tm.style.setProperty('display', 'flex', 'important');
                tm.classList.remove('hidden');
            }
        }

        function closeTaskModal() {
            const tm = document.getElementById('taskModal');
            if (tm) {
                tm.style.setProperty('display', 'none', 'important');
                tm.classList.add('hidden');
            }
        }

        function handleTaskSubmit(e) {
            e.preventDefault();
            const editId = document.getElementById('editTaskId').value;
            const ownerName = document.getElementById('taskOwner').value.trim();
            const shouldSendEmail = document.getElementById('taskSendEmailNotification')?.checked;
            
            const taskData = {
                department: document.getElementById('taskDepartment').value.trim(),
                title: document.getElementById('taskTitle').value.trim(),
                action: document.getElementById('taskAction').value.trim(),
                owner: ownerName,
                dueDate: document.getElementById('taskDueDate').value,
                status: document.getElementById('taskStatus').value,
                priority: document.getElementById('taskPriority').value,
                branch: document.getElementById('taskBranch').value,
                recurrence: document.getElementById('taskRecurrence').value
            };

            if (taskData.status === 'Tamamlandı') {
                taskData.completedAt = new Date().toISOString();
            }

            const exists = team.some(m => m.name.toLowerCase().trim() === ownerName.toLowerCase());
            if (!exists && ownerName) {
                team.push({
                    name: ownerName,
                    title: "Ekip Üyesi",
                    phone: "05xx xxx xx xx",
                    email: "",
                    department: taskData.department
                });
                updateTeamDatalist();
            }

            if (editId) {
                const index = tasks.findIndex(t => String(t.id) === String(editId));
                if (index !== -1) {
                    if (taskData.status === 'Tamamlandı' && !tasks[index].completedAt) {
                        taskData.completedAt = new Date().toISOString();
                    } else if (taskData.status !== 'Tamamlandı') {
                        delete taskData.completedAt;
                        delete tasks[index].completedAt;
                    }
                    tasks[index] = { ...tasks[index], ...taskData };
                }
            } else {
                const newId = tasks.length > 0 ? Math.max(...tasks.map(t => Number(t.id) || 0)) + 1 : 1;
                tasks.push({ id: newId, comments: [], ...taskData });
            }

            saveData();
            closeTaskModal();
            renderApp();

            if (shouldSendEmail && ownerName) {
                setTimeout(() => {
                    sendNewTaskAssignmentEmail(ownerName, taskData);
                }, 250);
            }
        }

        function sendNewTaskAssignmentEmail(ownerName, task) {
            const member = team.find(m => m.name.toLowerCase().trim() === ownerName.toLowerCase().trim());
            const recipientEmail = (member && member.email) ? member.email.trim() : '';

            const subject = `[Yeni Görev Atandı] ${task.title} - ${task.department}`;
            let body = `Sayın ${ownerName},\n\n`;
            body += `Koordinasyon Aksiyon & Görev Takip Sistemi üzerinden üzerinize YENİ BİR GÖREV ATANMIŞTIR:\n\n`;
            body += `📌 GÖREV / SORUN: ${task.title}\n`;
            body += `🏢 İLGİLİ BİRİM: ${task.department}\n`;
            body += `📍 ŞUBE / LOKASYON: ${task.branch || 'Merkez / Genel'}\n`;
            body += `⚡ ÖNCELİK: ${task.priority || 'Normal'}\n`;
            body += `📅 HEDEF TERMİN: ${formatTurkishDate(task.dueDate)}\n`;
            body += `📝 AKSİYON & ÇÖZÜM PLANI:\n${task.action}\n\n`;
            body += `--------------------------------------------------\n`;
            body += `Lütfen görevi tamamladığınızda Personel Paneli üzerinden durumunu 'Tamamlandı' olarak güncelleyiniz.\n\n`;
            body += `İyi çalışmalar dileriz,\n`;
            body += `Koordinasyon & Yönetim`;

            if (recipientEmail) {
                openInGmail(recipientEmail, subject, body);
            } else {
                alert(`Görev başarıyla kaydedildi!\n\nAncak "${ownerName}" için sistemde henüz bir e-posta adresi kayıtlı değil. Ekip Rehberinden e-postasını eklerseniz bildirim mailleri doğrudan Gmail üzerinden açılacaktır.`);
            }
        }

        function toggleTaskStatus(id) {
            const task = tasks.find(t => String(t.id) === String(id));
            if (!task) return;

            if (task.status !== 'Tamamlandı') {
                if (task.recurrence && task.recurrence !== 'none') {
                    const isRec = handleTaskRecurrenceOnComplete(task, 'Yönetici');
                    if (isRec) {
                        alert(`🎉 Rutin Görev Başarıyla Tamamlandı!\n\nBir sonraki döneme ait yeni termin tarihi (${formatTurkishDate(task.dueDate)}) olarak güncellendi ve görev aktif tutuldu.`);
                    }
                } else {
                    task.status = 'Tamamlandı';
                    task.completedAt = new Date().toISOString();
                }
            } else {
                task.status = 'Açık';
                delete task.completedAt;
            }

            saveData();
            renderApp();
        }

        async function deleteTask(id) {
            if (confirm("Bu görevi silmek istediğinize emin misiniz?")) {
                const taskId = String(id);
                addDeletedTaskId(taskId);
                tasks = tasks.filter(t => String(t.id) !== taskId);
                setLocalActionTimestamp();
                saveData();
                renderApp();
                await pushDataToServer();
            }
        }

        // ================= GÖREV YORUM VE DURUM NOTLARI =================
        let activeCommentTaskId = null;

        function openTaskCommentsModal(taskId) {
            const task = tasks.find(t => String(t.id) === String(taskId));
            if (!task) return;

            activeCommentTaskId = task.id;
            document.getElementById('commentModalTaskId').value = task.id;
            document.getElementById('commentModalTaskTitle').innerText = task.title;
            document.getElementById('commentModalTaskSub').innerHTML = `
                <span>📍 ${escapeHtml(task.branch || 'Merkez / Genel')}</span> • 
                <span>👤 ${escapeHtml(task.owner)}</span> • 
                <span class="font-bold">${task.status}</span>
            `;

            renderTaskCommentsList(task);

            const m = document.getElementById('taskCommentsModal');
            if (m) {
                m.style.setProperty('display', 'flex', 'important');
                m.classList.remove('hidden');
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
                        <p class="font-bold text-xs text-[#31261D]">Henüz durum notu veya yorum eklenmemiş</p>
                        <p class="text-[11px] text-stone-500 mt-0.5">Yönetici veya sorumlu personel buradan anlık görev gelişmeleri ve notları paylaşabilir.</p>
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
                author: 'Yönetici',
                role: 'admin',
                text: text,
                createdAt: new Date().toISOString()
            });

            input.value = '';
            saveData();
            renderTaskCommentsList(task);
            renderApp();
        }

        // ================= YEDEKLEME & AYARLAR =================
        function openSettingsModal() {
            updateSupabaseStatusUI(Boolean(supabaseClient));
            const phoneInput = document.getElementById('settingManagerPhone');
            if (phoneInput) phoneInput.value = localStorage.getItem('task_manager_phone') || '';
            const emailInput = document.getElementById('settingManagerEmail');
            if (emailInput) emailInput.value = localStorage.getItem('task_manager_email') || '';

            const sm = document.getElementById('settingsModal');
            if (sm) {
                sm.style.setProperty('display', 'flex', 'important');
                sm.classList.remove('hidden');
            }
        }
        function closeSettingsModal() {
            const sm = document.getElementById('settingsModal');
            if (sm) {
                sm.style.setProperty('display', 'none', 'important');
                sm.classList.add('hidden');
            }
        }

        function saveManagerContactSettings() {
            const phoneInput = document.getElementById('settingManagerPhone');
            if (phoneInput) {
                localStorage.setItem('task_manager_phone', phoneInput.value.trim());
            }
            const emailInput = document.getElementById('settingManagerEmail');
            if (emailInput) {
                localStorage.setItem('task_manager_email', emailInput.value.trim());
            }
        }

        function exportBackup() {
            const data = {
                team: team,
                tasks: tasks,
                notes: localStorage.getItem('task_management_notes') || '',
                exportDate: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Aksiyon_Takip_Raporu_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function exportToExcelCSV() {
            let csv = "\uFEFF"; // Excel Türkçe karakter desteği (UTF-8 BOM)
            csv += "ID;Görev Başlığı;Departman / Birim;Yapılacak Aksiyon;Sorumlu Kişi;Termin Tarihi;Durum;Öncelik\n";
            tasks.forEach(t => {
                const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
                csv += [
                    t.id,
                    escapeCsv(t.title),
                    escapeCsv(t.department),
                    escapeCsv(t.action),
                    escapeCsv(t.owner),
                    escapeCsv(t.dueDate),
                    escapeCsv(t.status),
                    escapeCsv(t.priority)
                ].join(";") + "\n";
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Can_Cerez_1978_Gorev_Listesi_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function importBackup(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (parsed.tasks) {
                        tasks = parsed.tasks;
                        if (parsed.team) team = parsed.team;
                        if (parsed.notes) {
                            localStorage.setItem('task_management_notes', parsed.notes);
                            document.getElementById('managementNotes').value = parsed.notes;
                        }
                        saveData();
                        updateTeamDatalist();
                        renderApp();
                        alert("Yedek başarıyla yüklendi!");
                        closeSettingsModal();
                    } else {
                        alert("Geçersiz dosya formatı!");
                    }
                } catch (err) {
                    alert("Hata: " + err.message);
                }
            };
            reader.readAsText(file);
        }

        async function clearAllSystemData() {
            if (confirm("DİKKAT: Sistemdeki tüm görevleri, ekipleri ve notları tamamen silip boş şablon olarak başlatmak istediğinize emin misiniz?")) {
                team = [];
                tasks = [];
                localStorage.setItem('task_team_members', '[]');
                localStorage.setItem('task_items', '[]');
                localStorage.setItem('task_deleted_ids', '[]');
                localStorage.setItem('cancerez_storage_initialized', 'true');
                setLocalActionTimestamp();
                localStorage.setItem('task_management_notes', '');
                const noteInput = document.getElementById('managementNotes');
                if (noteInput) noteInput.value = '';
                saveData();
                updateTeamDatalist();
                renderApp();
                closeSettingsModal();
                await pushDataToServer();
                alert("Sistem tamamen sıfırlandı!");
            }
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
            if (!deferredPrompt) {
                alert("CAN ÇEREZ uygulamasını tarayıcınızın menüsünden (Paylaş veya Ayarlar menüsü -> 'Ana Ekrana Ekle' / 'Uygulamayı Yükle') doğrudan telefonunuza veya bilgisayarınıza ekleyebilirsiniz.");
                return;
            }
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Kullanıcı CAN ÇEREZ PWA kurulumunu kabul etti');
                }
                deferredPrompt = null;
                const btn = document.getElementById('pwaInstallBtn');
                if (btn) btn.classList.add('hidden');
            });
        }

        window.addEventListener('appinstalled', () => {
            console.log('CAN ÇEREZ PWA başarıyla yüklendi');
            const btn = document.getElementById('pwaInstallBtn');
            if (btn) btn.classList.add('hidden');
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
                navigator.serviceWorker.register('sw.js?v=27')
                    .then(reg => {
                        console.log('CAN ÇEREZ SW Aktif:', reg.scope);
                        reg.update();
                    })
                    .catch(err => console.log('CAN ÇEREZ SW Hatası:', err));
            });
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (hadController && !refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
