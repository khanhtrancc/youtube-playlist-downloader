import { Injectable } from '@nestjs/common';
import { db } from 'src/helpers/db';
import { Video } from 'src/models/video';
import * as lodash from 'lodash';

@Injectable()
export class VideoService {
  get(query): Video[] {
    const model = db.getCollection('video');
    return model.find(query);
  }

  where(query): Video[] {
    const model = db.getCollection('video');
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
    const model = db.getCollection('video');
    return model.insert(videos);
  }

  update(id: string, data: any): boolean {
    const model = db.getCollection('video');
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
    const model = db.getCollection('video');
    return model.update(doc);
  }

  delete(videoId: string): boolean {
    const model = db.getCollection('video');
    return model.removeWhere((item) => item.id === videoId);
  }

  deleteVideosOfPlaylist(playlistId: string): boolean {
    const model = db.getCollection('video');
    return model.removeWhere((item) => item.playlist_id === playlistId);
  }
}
