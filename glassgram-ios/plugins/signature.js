plugin({
  id: "signature",
  name: "Подпись",
  description: "Добавляет подпись в конец сообщений",
  version: "1.0",
  settings: [
    { type: "input", key: "text", title: "Текст подписи", default: "— отправлено из GlassGram" },
    { type: "switch", key: "privateOnly", title: "Только в личных чатах", default: false }
  ],
  onSendMessage: function (msg) {
    var text = String(GlassGram.setting("text") || "");
    if (!text) { return msg.text; }
    if (GlassGram.setting("privateOnly") === true && !msg.isPrivate) { return msg.text; }
    if (msg.text.charAt(0) === ".") { return msg.text; }
    return msg.text + "\n\n" + text;
  }
});
