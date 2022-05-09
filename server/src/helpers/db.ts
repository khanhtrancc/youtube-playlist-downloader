const loki = require('lokijs')

const adapter = new loki.LokiFsAdapter();

export const db = new loki('data.lokidb',{
    autoload: true,
    autoloadCallback : init,
    autosave: true, 
    autosaveInterval: 4000,
    adapter
});

export function init() {
  const playlistModel = db.getCollection('playlist');
  if (!playlistModel) {
    db.addCollection('playlist');
  }

  const videoModel = db.getCollection('video');
  if (!videoModel) {
    db.addCollection('video');
  }
}