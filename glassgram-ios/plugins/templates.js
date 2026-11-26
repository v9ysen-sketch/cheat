plugin({
  id: "templates",
  name: "Шаблоны",
  description: "Напиши :сокращение — отправится готовый текст",
  version: "1.0",
  settings: [
    { type: "input", key: "list", title: "Шаблоны (сокр=текст; через ;)", default: "пр=Привет! Как дела?;пк=Пока, на связи!;сп=Спасибо большое!;ок=Хорошо, договорились 👍" }
  ],
  onSendMessage: function (msg) {
    var t = msg.text.trim();
    if (t.charAt(0) !== ":") { return msg.text; }
    var key = t.slice(1).toLowerCase();
    var items = String(GlassGram.setting("list") || "").split(";");
    for (var i = 0; i < items.length; i++) {
      var pos = items[i].indexOf("=");
      if (pos > 0 && items[i].slice(0, pos).trim().toLowerCase() === key) {
        return items[i].slice(pos + 1).trim();
      }
    }
    return msg.text;
  }
});
