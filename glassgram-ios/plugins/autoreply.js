plugin({
  id: "autoreply",
  name: "Автоответчик",
  description: "Отвечает в личных чатах, пока включён (раз в час на каждый чат)",
  version: "1.0",
  settings: [
    { type: "switch", key: "on", title: "Отвечать автоматически", default: false },
    { type: "input", key: "text", title: "Текст ответа", default: "Привет! Я сейчас не на связи, отвечу позже 🙂" }
  ],
  onIncomingMessage: function (msg) {
    if (GlassGram.setting("on") !== true || !msg.isPrivate) { return; }
    var key = "last_" + msg.peerId;
    var last = Number(GlassGram.storageGet(key) || 0);
    var now = Math.floor(Date.now() / 1000);
    if (now - last < 3600) { return; }
    GlassGram.storageSet(key, String(now));
    GlassGram.sendMessage(msg.peerId, String(GlassGram.setting("text")));
  }
});
