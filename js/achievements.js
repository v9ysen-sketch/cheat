/* ================================================================
   CRATER — Achievements: milestone badges shown on profile.
   ================================================================ */

window.CRATER = window.CRATER || {};

CRATER.ACHIEVEMENTS = [
  { id: 'first_open',    icon: '📦', name: 'Первый кейс',      desc: 'Открой свой первый кейс',    check: s => s.stats.opened >= 1 },
  { id: 'opened_10',     icon: '📦', name: '10 кейсов',        desc: 'Открой 10 кейсов',           check: s => s.stats.opened >= 10 },
  { id: 'opened_50',     icon: '📦', name: '50 кейсов',        desc: 'Открой 50 кейсов',           check: s => s.stats.opened >= 50 },
  { id: 'opened_200',    icon: '📦', name: '200 кейсов',       desc: 'Открой 200 кейсов',          check: s => s.stats.opened >= 200 },

  { id: 'spent_100k',    icon: '💸', name: 'Крутанул на 100k', desc: 'Потрать 100 000 БП',         check: s => s.stats.spent >= 100000 },
  { id: 'spent_1M',      icon: '💸', name: 'Миллион в трубу',  desc: 'Потрать 1 000 000 БП',       check: s => s.stats.spent >= 1000000 },

  { id: 'covert_drop',   icon: '🔴', name: 'Covert-дроп',      desc: 'Выбей Covert-предмет',       check: s => (s.history || []).some(d => d.rarity === 'covert') },
  { id: 'special_drop',  icon: '🗡️', name: 'Нож/перчатки',     desc: 'Выбей Exceedingly Rare',    check: s => (s.history || []).some(d => d.rarity === 'special') },

  { id: 'best_10k',      icon: '💎', name: 'Дроп на 10k',      desc: 'Дроп ценой ≥ 10 000 БП',     check: s => (s.stats.bestPrice || 0) >= 10000 },
  { id: 'best_100k',     icon: '💎', name: 'Дроп на 100k',     desc: 'Дроп ценой ≥ 100 000 БП',    check: s => (s.stats.bestPrice || 0) >= 100000 },
  { id: 'best_500k',     icon: '💎', name: 'Дроп на 500k',     desc: 'Дроп ценой ≥ 500 000 БП',    check: s => (s.stats.bestPrice || 0) >= 500000 },

  { id: 'upgrade_first', icon: '⚙️', name: 'Первый апгрейд',   desc: 'Успешный апгрейд',          check: s => (s.stats.upgradesWon || 0) >= 1 },
  { id: 'upgrade_10',    icon: '⚙️', name: '10 апгрейдов',     desc: '10 успешных апгрейдов',     check: s => (s.stats.upgradesWon || 0) >= 10 },
  { id: 'upgrade_ratio', icon: '🎯', name: 'Мастер апгрейда',  desc: '25 удачных апгрейдов',      check: s => (s.stats.upgradesWon || 0) >= 25 },

  { id: 'contract_first',icon: '📜', name: 'Первый контракт',  desc: 'Заверши свой первый контракт', check: s => (s.stats.contracts || 0) >= 1 },
  { id: 'contract_10',   icon: '📜', name: '10 контрактов',    desc: 'Заверши 10 контрактов',     check: s => (s.stats.contracts || 0) >= 10 },

  { id: 'legendary',     icon: '👑', name: 'Легендарный кейс', desc: 'Открой кейс тира V',
    check: s => (s.history || []).some(d => {
      const c = (CRATER.CASES || []).find(cc => cc.name === d.caseName);
      return c && c.tier === 5;
    })
  },
  { id: 'inv_full',      icon: '🎒', name: 'Хомяк',            desc: 'Собери 50 предметов',       check: s => (s.inventory || []).length >= 50 },
  { id: 'inv_master',    icon: '🏆', name: 'Коллекционер',     desc: 'Собери 200 предметов',      check: s => (s.inventory || []).length >= 200 },

  { id: 'balance_1M',    icon: '💰', name: 'Миллионер',        desc: 'Накопи 1 000 000 БП на балансе', check: s => s.balance >= 1000000 },
];

CRATER.checkAchievements = function() {
  CRATER.state.unlocked = CRATER.state.unlocked || {};
  const newly = [];
  CRATER.ACHIEVEMENTS.forEach(a => {
    if (CRATER.state.unlocked[a.id]) return;
    if (a.check(CRATER.state)) {
      CRATER.state.unlocked[a.id] = Date.now();
      newly.push(a);
    }
  });
  if (newly.length) {
    CRATER.saveState();
    newly.forEach(a => {
      CRATER.toast(`🎖 Достижение: ${a.name}`);
      if (CRATER.sound) CRATER.sound.chime();
    });
  }
  // Rank promotion check
  if (typeof CRATER.getRank === 'function') {
    const currentRankKey = CRATER.getRank().current.key;
    if (CRATER.state.lastRankKey && CRATER.state.lastRankKey !== currentRankKey) {
      const r = CRATER.getRank().current;
      if (typeof CRATER.rareSplash === 'function') CRATER.rareSplash(`RANK UP: ${r.name}`, r.color);
      if (CRATER.sound) CRATER.sound.bigwin();
      if (typeof CRATER.confetti === 'function') CRATER.confetti({ count: 120, colors: [r.color, '#ffd700', '#2be07b'] });
      CRATER.toast(`⬆ Новый ранг: ${r.name}`);
    }
    CRATER.state.lastRankKey = currentRankKey;
    CRATER.saveState();
  }
  return newly;
};

CRATER.getAchievementProgress = function() {
  CRATER.state.unlocked = CRATER.state.unlocked || {};
  return CRATER.ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: !!CRATER.state.unlocked[a.id],
    unlockedAt: CRATER.state.unlocked[a.id] || 0,
  }));
};
