plugin({
  id: "weather",
  name: "Погода",
  description: ".weather Город — отправляет погоду (wttr.in)",
  version: "1.0",
  commands: {
    ".weather": function (args, msg) {
      var city = args.trim() || "Moscow";
      GlassGram.httpGet("https://wttr.in/" + encodeURIComponent(city) + "?format=3&lang=ru", function (text, error) {
        if (text && !error) {
          GlassGram.sendMessage(msg.peerId, "🌤 " + text.trim());
        } else {
          GlassGram.sendMessage(msg.peerId, "🌤 не удалось получить погоду для " + city);
        }
      });
      return null;
    }
  }
});
