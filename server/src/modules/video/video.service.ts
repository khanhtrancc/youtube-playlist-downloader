import { Injectable } from '@nestjs/common';
import { Video } from 'src/models/video';
import * as lodash from 'lodash';
import { DbHelper } from 'src/modules/common/db.helper';

@Injectable()
export class VideoService {
  constructor(private readonly dbHelper: DbHelper) {
    this.dbHelper.onReady(() => {
      const model = this.dbHelper.db.getCollection('video');
      if (!model) {
        this.dbHelper.db.addCollection('video');
      }
    });
  }

  get(query): Video[] {
    const model = this.dbHelper.db.getCollection('video');
    return model.find(query);
  }

  where(query): Video[] {
    const model = this.dbHelper.db.getCollection('video');
    return model.where((video) => {
      for (const key of Object.keys(query)) {
        if (lodash.get(video, key) !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  add(videos: Video[]): boolean {
    const model = this.dbHelper.db.getCollection('video');
    return model.insert(videos);
  }

  update(id: string, data: any): boolean {
    const model = this.dbHelper.db.getCollection('video');
    return model.updateWhere(
      (video) => video.id === id,
      (video) => {
        return {
          ...video,
          data,
        };
      },
    );
  }

  updateDoc(doc: Video) {
    const model = this.dbHelper.db.getCollection('video');
    return model.update(doc);
  }

  delete(videoId: string): boolean {
    const model = this.dbHelper.db.getCollection('video');
    return model.removeWhere((item) => item.id === videoId);
  }

  deleteVideosOfPlaylist(playlistId: string): boolean {
    const model = this.dbHelper.db.getCollection('video');
    return model.removeWhere((item) => item.playlist_id === playlistId);
  }
}
