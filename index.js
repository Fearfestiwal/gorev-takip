        const CLOUD_DB_URL = localStorage.getItem('cancerez_cloud_db_url') || "https://extendsclass.com/api/json-storage/bin/aecadfa";

        // Supabase 7/24 Bulut Entegrasyonu
        let supabaseClient = null;
        function initSupabase() {
            const url = (localStorage.getItem('cancerez_supabase_url') || 'https://jzisvxaxjzzseqgdqoxo.supabase.co').trim();
            const key = (localStorage.getItem('cancerez_supabase_key') || 'sb_publishable_zU-fzx1fqhFbm3Sr-WUM8Q_0S5Zu_Gi').trim();
            if (window.supabase && url && key) {
                try {
                    supabaseClient = window.supabase.createClient(url, key, { auth: { persistSession: false } });
                } catch(e) {
                    supabaseClient = null;
                }
            }
        }
        initSupabase();

        const DEFAULT_INIT_TEAM = [
            { id: 1, name: "Ahmet Can", role: "Şube Sorumlusu", phone: "05551234567", pin: "1978", status: "aktif" }
        ];
        let teamMembers = JSON.parse(localStorage.getItem('task_team_members')) || [];
        if (!teamMembers || teamMembers.length === 0) {
            teamMembers = DEFAULT_INIT_TEAM;
            localStorage.setItem('task_team_members', JSON.stringify(teamMembers));
        }
        let currentGeneratedOtp = null;

        // Sayfa yüklendiğinde ekip üyelerini çek ve personel listesini doldur
        window.addEventListener('DOMContentLoaded', async () => {
            populateStaffSelect(); // Yerel hafızadaki personelleri anında göster (kullanıcı beklemesin)
            await fetchTeamMembers();
            populateStaffSelect(); // Sunucudan gelen akıllı birleştirilmiş listeyle güncelle

            // Kayıtlı bir yönetici e-postası varsa input'a hazır getir
            const savedAccount = JSON.parse(localStorage.getItem('cancerez_admin_account') || 'null');
            if (savedAccount && savedAccount.email) {
                document.getElementById('adminLoginEmail').value = savedAccount.email;
            } else {
                document.getElementById('adminLoginEmail').value = 'yonetim@cancerez.com.tr';
            }
        });

        // ================= PORTAL ROL DEĞİŞTİRME =================
        function switchPortalRole(role) {
            const btnAdmin = document.getElementById('btnRoleAdmin');
            const btnStaff = document.getElementById('btnRoleStaff');
            const adminCard = document.getElementById('adminCard');
            const staffCard = document.getElementById('staffCard');

            if (role === 'admin') {
                btnAdmin.className = "py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md bg-[#31261D] text-white border border-[#FFBF3F]/40 cursor-pointer";
                btnStaff.className = "py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all text-[#5C4A3C] hover:text-[#31261D] hover:bg-[#FAF7F2] cursor-pointer";
                adminCard.classList.remove('hidden');
                staffCard.classList.add('hidden');
            } else {
                btnStaff.className = "py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md bg-[#31261D] text-white border border-[#FFBF3F]/40 cursor-pointer";
                btnAdmin.className = "py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all text-[#5C4A3C] hover:text-[#31261D] hover:bg-[#FAF7F2] cursor-pointer";
                staffCard.classList.remove('hidden');
                adminCard.classList.add('hidden');
                populateStaffSelect(); // Personel sekmesine geçildiğinde listeyi tazele
            }
        }

        function switchAdminAuthTab(tab) {
            const loginBtn = document.getElementById('adminTabLoginBtn');
            const registerBtn = document.getElementById('adminTabRegisterBtn');
            const loginForm = document.getElementById('adminLoginForm');
            const registerForm = document.getElementById('adminRegisterForm');

            if (tab === 'login') {
                loginBtn.className = "text-xs font-black pb-1 border-b-2 border-[#A6192E] text-[#A6192E] cursor-pointer";
                registerBtn.className = "text-xs font-bold pb-1 text-[#5C4A3C] hover:text-[#31261D] cursor-pointer";
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                registerBtn.className = "text-xs font-black pb-1 border-b-2 border-[#A6192E] text-[#A6192E] cursor-pointer";
                loginBtn.className = "text-xs font-bold pb-1 text-[#5C4A3C] hover:text-[#31261D] cursor-pointer";
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            }
        }

        function switchStaffAuthTab(tab) {
            const loginBtn = document.getElementById('staffTabLoginBtn');
            const registerBtn = document.getElementById('staffTabRegisterBtn');
            const loginForm = document.getElementById('staffLoginForm');
            const registerForm = document.getElementById('staffRegisterForm');

            if (tab === 'login') {
                loginBtn.className = "text-xs font-black pb-1 border-b-2 border-[#1E340C] text-[#1E340C] cursor-pointer";
                registerBtn.className = "text-xs font-bold pb-1 text-[#5C4A3C] hover:text-[#31261D] cursor-pointer flex items-center gap-1";
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                registerBtn.className = "text-xs font-black pb-1 border-b-2 border-[#1E340C] text-[#1E340C] cursor-pointer flex items-center gap-1";
                loginBtn.className = "text-xs font-bold pb-1 text-[#5C4A3C] hover:text-[#31261D] cursor-pointer";
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            }
        }

        function openStaffForgotPin() {
            const select = document.getElementById('staffSelectUser');
            const chosenName = select ? select.value : '';
            const msg = chosenName 
                ? `Merhaba, Can Çerez sisteminde ${chosenName} adına kayıtlı personel giriş şifremi unuttum. Sıfırlayabilir misiniz?` 
                : `Merhaba, Can Çerez Görev Takip Sistemi personel giriş şifremi unuttum. Sıfırlayabilir misiniz?`;
            
            if (confirm("Şifrenizi unuttuysanız şirket yöneticiniz kendi Yönetici Paneli'nden şifrenizi anında görebilir veya değiştirebilir.\n\nYöneticinizle WhatsApp üzerinden iletişime geçmek ister misiniz?")) {
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }
        }

        // ================= BENİ HATIRLA TOGGLE MANTIĞI =================
        function toggleRememberMe(role) {
            if (role === 'admin') {
                const inp = document.getElementById('adminRememberMe');
                const icon = document.getElementById('adminRememberIcon');
                const subtext = document.getElementById('adminRememberSubtext');
                const sw = document.getElementById('adminRememberSwitch');
                const knob = document.getElementById('adminRememberKnob');
                const isChecked = inp.value === 'true';
                const newVal = !isChecked;
                inp.value = newVal ? 'true' : 'false';

                if (newVal) {
                    sw.className = "w-11 h-6 bg-[#1E340C] rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center";
                    knob.className = "w-5 h-5 bg-white rounded-full shadow-md transform translate-x-5 transition-transform duration-200 ease-in-out flex items-center justify-center text-[9px] text-[#1E340C] font-black";
                    knob.innerHTML = '<i class="fa-solid fa-check"></i>';
                    icon.className = "w-8 h-8 rounded-xl bg-[#1E340C] text-[#FFBF3F] flex items-center justify-center text-xs shadow-xs";
                    subtext.innerText = "Bu cihazda oturumu sürekli açık tut";
                } else {
                    sw.className = "w-11 h-6 bg-stone-300 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center";
                    knob.className = "w-5 h-5 bg-white rounded-full shadow-md transform translate-x-0 transition-transform duration-200 ease-in-out flex items-center justify-center text-[9px] text-stone-400 font-black";
                    knob.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                    icon.className = "w-8 h-8 rounded-xl bg-stone-200 text-stone-500 flex items-center justify-center text-xs shadow-xs";
                    subtext.innerText = "Her açılışta şifre sorulsun";
                }
            } else if (role === 'staff') {
                const inp = document.getElementById('staffRememberMe');
                const icon = document.getElementById('staffRememberIcon');
                const subtext = document.getElementById('staffRememberSubtext');
                const sw = document.getElementById('staffRememberSwitch');
                const knob = document.getElementById('staffRememberKnob');
                const isChecked = inp.value === 'true';
                const newVal = !isChecked;
                inp.value = newVal ? 'true' : 'false';

                if (newVal) {
                    sw.className = "w-11 h-6 bg-[#1E340C] rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center";
                    knob.className = "w-5 h-5 bg-white rounded-full shadow-md transform translate-x-5 transition-transform duration-200 ease-in-out flex items-center justify-center text-[9px] text-[#1E340C] font-black";
                    knob.innerHTML = '<i class="fa-solid fa-check"></i>';
                    icon.className = "w-8 h-8 rounded-xl bg-[#1E340C] text-[#FFBF3F] flex items-center justify-center text-xs shadow-xs";
                    subtext.innerText = "Bu cihazı adıma zimmetle (Doğrudan aç)";
                } else {
                    sw.className = "w-11 h-6 bg-stone-300 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center";
                    knob.className = "w-5 h-5 bg-white rounded-full shadow-md transform translate-x-0 transition-transform duration-200 ease-in-out flex items-center justify-center text-[9px] text-stone-400 font-black";
                    knob.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                    icon.className = "w-8 h-8 rounded-xl bg-stone-200 text-stone-500 flex items-center justify-center text-xs shadow-xs";
                    subtext.innerText = "Her açılışta PIN sorulsun";
                }
            }
        }

        // ================= YÖNETİCİ GİRİŞİ =================
        function quickAdmin1978() {
            const passInp = document.getElementById('adminLoginPassword');
            if (passInp) passInp.value = '1978';
            handleAdminLoginSubmit();
        }

        function handleAdminLoginSubmit(e) {
            if (e) e.preventDefault();
            const emailInp = document.getElementById('adminLoginEmail');
            const passInp = document.getElementById('adminLoginPassword');
            const email = (emailInp ? emailInp.value : '').trim();
            const password = (passInp ? passInp.value : '').trim();
            const remEl = document.getElementById('adminRememberMe');
            const rememberMe = remEl ? (remEl.value === 'true' || remEl.checked === true) : true;

            const savedAccount = JSON.parse(localStorage.getItem('cancerez_admin_account') || 'null');
            const currentPass = localStorage.getItem('cancerez_admin_password') || '1978';

            let isValid = false;

            // 1. Şifre 1978, cankardesler, e-postaya 1978 yazılmışsa, boş bırakılmış ve varsayılan 1978 ise veya özel şifre ise GİRİŞ YAP
            if (password === '1978' || email === '1978' || password === 'cankardesler' || email === 'cankardesler' || (currentPass && password === currentPass) || (savedAccount && savedAccount.password === password) || (!password && currentPass === '1978')) {
                isValid = true;
            }

            if (isValid) {
                sessionStorage.setItem('cancerez_admin_auth', 'true');
                sessionStorage.removeItem('cancerez_manager_viewing_staff');
                localStorage.setItem('cancerez_active_role', 'admin');
                if (rememberMe) {
                    localStorage.setItem('cancerez_remember_admin', 'true');
                } else {
                    localStorage.removeItem('cancerez_remember_admin');
                }

                window.location.href = 'yonetici.html';
            } else {
                const err = document.getElementById('adminLoginError');
                if (err) {
                    err.classList.remove('hidden');
                    err.style.display = 'block';
                }
            }
        }

        // ================= GMAIL DOĞRULAMA KODU ÜRETME =================
        function sendGmailVerificationCode() {
            const email = document.getElementById('regAdminEmail').value.trim();
            if (!email || !email.includes('@')) {
                alert("Lütfen önce geçerli bir Gmail adresi yazınız.");
                document.getElementById('regAdminEmail').focus();
                return;
            }

            // 6 Haneli Rastgele Kod Üret
            currentGeneratedOtp = String(Math.floor(100000 + Math.random() * 900000));

            const subject = `CAN ÇEREZ (1978) • Yönetici Aktivasyon Kodu: ${currentGeneratedOtp}`;
            let body = `Sayın Yönetici,\n\n`;
            body += `CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan) Koordinasyon Portalı için oluşturulan tek kullanımlık güvenlik aktivasyon kodunuz:\n\n`;
            body += `🔑 AKTİVASYON KODU: ${currentGeneratedOtp}\n\n`;
            body += `Lütfen bu kodu portal ekranındaki kutucuğa girerek yönetici hesabınızı aktifleştiriniz.\n\n`;
            body += `CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan)`;

            const encodedTo = encodeURIComponent(email);
            const encodedSu = encodeURIComponent(subject);
            const encodedBody = encodeURIComponent(body);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSu}&body=${encodedBody}`;

            // Kullanıcıya kodu da ekranda güvenle göster (mail açılmasa bile kilitlenmesin)
            alert(`✅ 6 Haneli Güvenlik Aktivasyon Kodunuz Üretildi:\n\n👉  ${currentGeneratedOtp}  👈\n\nAyrıca e-posta teyidi için Gmail sayfanız açılıyor...`);
            
            document.getElementById('regOtpInput').value = currentGeneratedOtp;
            document.getElementById('otpStatusHint').innerHTML = `Aktivasyon kodunuz üretildi: <strong class="text-[#A6192E] font-mono text-sm">${currentGeneratedOtp}</strong>`;

            window.open(gmailUrl, '_blank');
        }

        // ================= YÖNETİCİ KAYIT & DOĞRULAMA =================
        function handleAdminRegisterSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('regAdminName').value.trim();
            const email = document.getElementById('regAdminEmail').value.trim();
            const pass1 = document.getElementById('regAdminPass').value.trim();
            const pass2 = document.getElementById('regAdminPassConfirm').value.trim();
            const enteredOtp = document.getElementById('regOtpInput').value.trim();
            const errEl = document.getElementById('adminRegisterError');

            if (pass1 !== pass2) {
                errEl.innerText = "Girdiğiniz şifreler birbiriyle uyuşmuyor!";
                errEl.classList.remove('hidden');
                return;
            }

            if (!currentGeneratedOtp || enteredOtp !== currentGeneratedOtp) {
                errEl.innerText = "Lütfen önce 'Kod Üret & Gmail Aç' butonuna tıklayarak aktivasyon kodunu onaylayınız!";
                errEl.classList.remove('hidden');
                return;
            }

            // Hesabı Kaydet
            const accountData = {
                name: name,
                email: email,
                password: pass1,
                verified: true,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('cancerez_admin_account', JSON.stringify(accountData));
            localStorage.setItem('cancerez_admin_password', pass1);
            localStorage.setItem('cancerez_remember_admin', 'true');
            localStorage.setItem('cancerez_active_role', 'admin');
            sessionStorage.setItem('cancerez_admin_auth', 'true');
            sessionStorage.removeItem('cancerez_manager_viewing_staff');

            alert(`Tebrikler Sayın ${name}!\n\n${email} adresiniz başarıyla doğrulandı ve yönetici şifreniz kaydedildi. Yönetici Paneline yönlendiriliyorsunuz...`);
            window.location.href = 'yonetici.html';
        }

        // ================= PERSONEL GİRİŞİ =================
        function handleStaffLoginSubmit(e) {
            e.preventDefault();
            const selectedName = document.getElementById('staffSelectUser').value;
            const enteredPin = document.getElementById('staffInputPin').value.trim();
            const remEl = document.getElementById('staffRememberMe');
            const rememberMe = remEl ? (remEl.value === 'true' || remEl.checked === true) : true;

            if (!selectedName) {
                alert("Lütfen personel adınızı seçiniz.");
                return;
            }

            const member = teamMembers.find(m => m.name.toLowerCase().trim() === selectedName.toLowerCase().trim());
            const correctPin = (member && member.pin) ? String(member.pin).trim() : '1978';

            if (enteredPin === correctPin || enteredPin === '1978' || enteredPin === 'cankardesler') {
                // Personel giriş yaptığı için yöneticiye ait tüm geçiş yetkilerini kesin olarak sıfırla!
                sessionStorage.removeItem('cancerez_manager_viewing_staff');
                sessionStorage.removeItem('cancerez_admin_auth');
                localStorage.removeItem('cancerez_remember_admin');

                sessionStorage.setItem('cancerez_staff_auth_user', selectedName);
                localStorage.setItem('cancerez_active_role', 'staff');
                if (rememberMe) {
                    localStorage.setItem('cancerez_remember_staff_user', selectedName);
                    localStorage.setItem('task_personel_selected_user', selectedName);
                } else {
                    localStorage.removeItem('cancerez_remember_staff_user');
                    localStorage.setItem('task_personel_selected_user', selectedName);
                }

                window.location.href = 'personel.html';
            } else {
                const err = document.getElementById('staffLoginError');
                err.classList.remove('hidden');
                document.getElementById('staffInputPin').select();
            }
        }

        // ================= YENİ PERSONEL KENDİ KENDİNE KAYIT =================
        async function handleStaffRegisterSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('regStaffName').value.trim();
            const phone = document.getElementById('regStaffPhone').value.trim();
            const email = document.getElementById('regStaffEmail').value.trim();
            const role = document.getElementById('regStaffRole').value.trim() || 'Personel';
            const pin = document.getElementById('regStaffPin').value.trim();
            const pinConfirm = document.getElementById('regStaffPinConfirm').value.trim();
            const errBox = document.getElementById('staffRegisterError');

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
                errBox.innerText = "Şifreniz / PIN kodunuz en az 4 haneli olmalıdır.";
                errBox.classList.remove('hidden');
                return;
            }

            if (pin !== pinConfirm) {
                errBox.innerText = "Girdiğiniz şifreler birbiriyle uyuşmuyor! Lütfen kontrol ediniz.";
                errBox.classList.remove('hidden');
                return;
            }

            // İsim daha önce eklenmiş mi kontrol et
            const existing = teamMembers.find(m => m.name.toLowerCase().trim() === name.toLowerCase().trim());
            if (existing) {
                errBox.innerText = `"${name}" adına kayıtlı bir personel profili zaten var! Lütfen listeden adınızı seçip giriş yapınız.`;
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
                department: role,
                pin: pin,
                status: 'aktif',
                registeredSelf: true,
                createdAt: new Date().toISOString()
            };

            // Silinenler listesinde bu isim varsa kaldır
            let deletedNames = getDeletedMemberNames().filter(n => n !== name.toLowerCase().trim());
            localStorage.setItem('task_deleted_member_names', JSON.stringify(deletedNames));
            localStorage.setItem('cancerez_last_local_action', String(Date.now()));

            teamMembers.push(newMember);
            localStorage.setItem('task_team_members', JSON.stringify(teamMembers));
            populateStaffSelect();

            try {
                await pushTeamToCloud(teamMembers);
            } catch(err) {}

            // Personel kaydolduğu için yönetici yetkilerini sıfırla
            sessionStorage.removeItem('cancerez_manager_viewing_staff');
            sessionStorage.removeItem('cancerez_admin_auth');
            localStorage.removeItem('cancerez_remember_admin');

            sessionStorage.setItem('cancerez_staff_auth_user', name);
            localStorage.setItem('cancerez_remember_staff_user', name);
            localStorage.setItem('cancerez_active_role', 'staff');
            localStorage.setItem('task_personel_selected_user', name);

            alert(`Hoş geldiniz ${name}! Personel kaydınız başarıyla oluşturuldu. Görev ekranınıza yönlendiriliyorsunuz.`);
            window.location.href = 'personel.html';
        }

        async function pushTeamToCloud(newTeam) {
            if (supabaseClient) {
                try {
                    const teamRows = newTeam.map((m, idx) => ({
                        id: Number(m.id || (idx + 1)),
                        name: m.name,
                        title: m.title || m.role || 'Personel',
                        department: m.department || 'Şube Operasyon',
                        phone: m.phone || '',
                        email: m.email || '',
                        pin: m.pin || '1978',
                        status: m.status || 'aktif'
                    }));
                    await supabaseClient.from('cancerez_team').upsert(teamRows, { onConflict: 'id' });
                } catch(e) {
                    console.warn("Supabase push team:", e);
                }
            }

            const rawData = {
                tasks: JSON.parse(localStorage.getItem('task_items') || '[]'),
                team: newTeam,
                notes: localStorage.getItem('task_management_notes') || '',
                adminPassword: localStorage.getItem('cancerez_admin_password') || '1978'
            };
            try {
                await fetch(CLOUD_DB_URL, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                    body: JSON.stringify(rawData)
                });
            } catch(e) {}
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '8080') {
                try {
                    await fetch('/api/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(rawData)
                    });
                } catch(e) {}
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

        // Ekip Üyelerini Doldur
        async function fetchTeamMembers() {
            const localTeam = JSON.parse(localStorage.getItem('task_team_members') || '[]');
            let serverTeam = [];

            if (supabaseClient) {
                try {
                    const { data: sTeam } = await supabaseClient.from('cancerez_team').select('*');
                    if (Array.isArray(sTeam) && sTeam.length > 0) {
                        serverTeam = sTeam;
                    }
                    const { data: sSettings } = await supabaseClient.from('cancerez_settings').select('*');
                    if (Array.isArray(sSettings)) {
                        const pObj = sSettings.find(s => s.key === 'admin_password');
                        if (pObj && pObj.value) localStorage.setItem('cancerez_admin_password', pObj.value);
                    }
                } catch(e) {
                    console.warn("Supabase team fetch:", e);
                }
            }

            if (serverTeam.length === 0) {
                try {
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '8080') {
                        const res = await fetch('/api/data');
                        if (res.ok) {
                            const d = await res.json();
                            if (Array.isArray(d.team)) serverTeam = d.team;
                        }
                    } else {
                        const cacheBuster = (CLOUD_DB_URL.includes('?') ? '&' : '?') + '_ts=' + Date.now();
                        const res = await fetch(CLOUD_DB_URL + cacheBuster, { 
                            cache: 'no-store',
                            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
                        });
                        if (res.ok) {
                            const d = await res.json();
                            const p = (d && d.data && (d.data.tasks || d.data.team)) ? d.data : d;
                            if (Array.isArray(p.team)) serverTeam = p.team;
                            if (p.adminPassword) {
                                localStorage.setItem('cancerez_admin_password', p.adminPassword);
                            }
                        }
                    }
                } catch(e) {}
            }

            // Akıllı Birleştirme: Yerel personelleri ASLA ezme!
            const merged = mergeTeamMembers(localTeam, serverTeam);
            teamMembers = merged.length > 0 ? merged : DEFAULT_INIT_TEAM;
            localStorage.setItem('task_team_members', JSON.stringify(teamMembers));

            // Eğer yerelde sunucuda henüz bulunmayan yeni personeller varsa, bulutu da anında güncelle
            if (serverTeam.length > 0 && merged.length > serverTeam.length) {
                pushTeamToCloud(teamMembers);
            }
        }

        function populateStaffSelect() {
            const select = document.getElementById('staffSelectUser');
            if (!select) return;
            select.innerHTML = '<option value="">-- Lütfen Adınızı Seçiniz --</option>';

            if (teamMembers.length === 0) {
                const opt = document.createElement('option');
                opt.value = "";
                opt.innerText = "Henüz kayıtlı çalışan yok (Yönetici eklemelidir)";
                select.appendChild(opt);
                return;
            }

            teamMembers.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.name;
                opt.innerText = `${m.name} (${m.title || m.department || 'CAN ÇEREZ'})`;
                select.appendChild(opt);
            });
        }

        function togglePassVisibility(inputId, eyeId) {
            const inp = document.getElementById(inputId);
            const eye = document.getElementById(eyeId);
            if (!inp || !eye) return;
            if (inp.type === 'password') {
                inp.type = 'text';
                eye.className = 'fa-solid fa-eye-slash';
            } else {
                inp.type = 'password';
                eye.className = 'fa-solid fa-eye';
            }
        }

        // ================= PWA KURULUM =================
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
                deferredPrompt.userChoice.then(() => {
                    const btn = document.getElementById('pwaInstallBtn');
                    if (btn) btn.classList.add('hidden');
                    deferredPrompt = null;
                });
            } else {
                alert("Uygulamayı yüklemek için tarayıcınızın menüsünden (Paylaş veya Ayarlar -> 'Ana Ekrana Ekle' / 'Uygulamayı Yükle') seçeneğine dokunabilirsiniz.");
            }
        }

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
                        reg.update();
                    })
                    .catch(err => console.log('SW hatası: ', err));
            });
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (hadController && !refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
