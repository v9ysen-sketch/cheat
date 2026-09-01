/* ================================================================
   CRATER — mock Steam login. Local-only, no external requests.
   ================================================================ */

(function () {
  CRATER.boot('profile');

  const steamBtn = document.getElementById('steam-btn');
  const form = document.getElementById('form');
  const submit = document.getElementById('submit');
  const nameEl = document.getElementById('name');
  const avatarEl = document.getElementById('avatar');
  const steamIdEl = document.getElementById('steamid');

  // If already logged in, prefill
  const existing = CRATER.state.profile;
  if (existing) {
    nameEl.value = existing.name || '';
    avatarEl.value = existing.avatar || '';
    steamIdEl.value = existing.steamId || '';
    form.hidden = false;
    steamBtn.textContent = '';
    steamBtn.append(document.createTextNode('Обновить профиль'));
  }

  // Cosmetic "redirect" simulation
  steamBtn.addEventListener('click', () => {
    if (form.hidden) {
      steamBtn.disabled = true;
      steamBtn.style.opacity = '0.6';
      steamBtn.innerHTML = '<span style="letter-spacing:1px">Перенаправляем на Steam...</span>';
      // Fake redirect delay for effect
      setTimeout(() => {
        steamBtn.disabled = false;
        steamBtn.style.opacity = '1';
        steamBtn.innerHTML = 'Заполни данные ниже ↓';
        form.hidden = false;
        nameEl.focus();
      }, 900);
    } else {
      nameEl.focus();
    }
  });

  submit.addEventListener('click', (e) => {
    e.preventDefault();
    const name = (nameEl.value || '').trim();
    if (!name) { CRATER.toast('Введи ник', 'err'); return; }
    const avatar = (avatarEl.value || '').trim();
    const steamId = (steamIdEl.value || '').trim();
    const isNew = !CRATER.state.profile;
    CRATER.state.profile = {
      name: name.slice(0, 32),
      avatar: avatar || null,
      steamId: steamId || null,
      since: isNew ? Date.now() : (CRATER.state.profile.since || Date.now()),
    };
    CRATER.saveState();
    CRATER.toast(isNew ? 'Добро пожаловать, ' + name : 'Профиль обновлён');
    setTimeout(() => { location.href = 'profile.html'; }, 500);
  });
})();
