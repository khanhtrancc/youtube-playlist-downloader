import { Injectable } from '@nestjs/common';
import { db } from 'src/helpers/db';
import { Playlist } from 'src/models/playlist';

@Injectable()
export class PlaylistService {
  getPlaylists(query): Playlist[] {
    const model = db.getCollection('playlist');
    return model.find(query);
  }

  getPlaylistById(id: string): Playlist | null {
    const model = db.getCollection('playlist');
    const list = model.find({ id });
    if (list.length > 0) {
      return list[0];
    }
    return null;
  }

  addPlaylist(playlist: Playlist): boolean {
    const model = db.getCollection('playlist');
    return model.insert(playlist);
  }

  delete(playlistId: string): boolean {
    const model = db.getCollection('playlist');
    return model.removeWhere((item) => item.id === playlistId);
  }
}
