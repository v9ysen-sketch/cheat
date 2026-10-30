// Composite the traced silhouette over the bled colour plate -> render/assets/logo_hd.png (8x)
const L = require('../render/lib.js');
const { loadImage, Path2D } = require('../render/node_modules/@napi-rs/canvas');
(async () => {
  const j = require('../render/assets/logo_path.json'); const plate = await loadImage(__dirname + '/../render/assets/logo_plate.png');
  const S = 8, c = L.offscreen(j.width * S, j.height * S), x = c.getContext('2d');
  x.drawImage(plate, 0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-out'; x.scale(S, S); x.fillStyle = '#000'; x.fill(new Path2D(j.path), 'evenodd');
  require('fs').writeFileSync(__dirname + '/../render/assets/logo_hd.png', c.toBuffer('image/png'));
  if (process.argv[2]) {
    const p = L.offscreen(1400, 500), px = p.getContext('2d'); L.background(px, 0, 'night'); px.drawImage(c, 60, 40, 1280, 1280 * j.height / j.width);
    require('fs').writeFileSync(process.argv[2], p.toBuffer('image/png'));
  }
  console.log('logo_hd', c.width, c.height);
})();
