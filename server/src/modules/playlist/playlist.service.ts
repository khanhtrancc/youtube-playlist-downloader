import { Injectable } from '@nestjs/common';
import { DbHelper } from 'src/modules/common/db.helper';
import { Playlist } from 'src/models/playlist';

@Injectable()
export class PlaylistService {
  constructor(private dbHelper: DbHelper) {
    const model  = this.dbHelper.db.getCollection('playlist');
    if(!model){
      this.dbHelper.db.addCollection('playlist');
    }
  }

  getPlaylists(query): Playlist[] {
    const model = this.dbHelper.db.getCollection('playlist');
    return model.find(query);
  }

  getPlaylistById(id: string): Playlist | null {
    const model = this.dbHelper.db.getCollection('playlist');
    const list = model.find({ id });
    if (list.length > 0) {
      return list[0];
    }
    return null;
  }

  addPlaylist(playlist: Playlist): boolean {
    const model = this.dbHelper.db.getCollection('playlist');
    return model.insert(playlist);
  }

  delete(playlistId: string): boolean {
    const model = this.dbHelper.db.getCollection('playlist');
    return model.removeWhere((item) => item.id === playlistId);
  }
}
