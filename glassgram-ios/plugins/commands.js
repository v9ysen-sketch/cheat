plugin({
  id: "commands",
  name: "Команды",
  description: ".ping .time .date .calc .upper .lower .reverse .translit .coin .rand",
  version: "1.0",
  commands: {
    ".ping": function () { return "🏓 pong"; },
    ".time": function () {
      var d = new Date();
      function p(n) { return (n < 10 ? "0" : "") + n; }
      return "🕒 " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    },
    ".date": function () {
      var d = new Date();
      var months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
      return "📅 " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
    },
    ".calc": function (args) {
      var expr = args.replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
      if (!/^[0-9+\-*/().%\s*]+$/.test(expr)) { return "🧮 можно только числа и + - * / ^ ( )"; }
      try {
        var result = Function("return (" + expr + ")")();
        return "🧮 " + args + " = " + (Math.round(result * 1e10) / 1e10);
      } catch (e) { return "🧮 ошибка в выражении"; }
    },
    ".upper": function (args) { return args.toUpperCase(); },
    ".lower": function (args) { return args.toLowerCase(); },
    ".reverse": function (args) { return Array.from(args).reverse().join(""); },
    ".translit": function (args) {
      var map = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"};
      return Array.from(args).map(function (c) {
        var lower = c.toLowerCase();
        if (map[lower] === undefined) { return c; }
        var t = map[lower];
        return c === lower ? t : t.charAt(0).toUpperCase() + t.slice(1);
      }).join("");
    },
    ".coin": function () { return Math.random() < 0.5 ? "🪙 Орёл" : "🪙 Решка"; },
    ".rand": function (args) {
      var parts = args.split(/\s+/).map(Number).filter(function (n) { return !isNaN(n); });
      var min = parts.length > 1 ? parts[0] : 1;
      var max = parts.length > 1 ? parts[1] : (parts.length === 1 ? parts[0] : 100);
      return "🎲 " + (min + Math.floor(Math.random() * (max - min + 1)));
    }
  }
});
