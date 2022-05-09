export interface Playlist {
  id: string;
  name: string;
  thumbnail?: string;
  channel?: string;
  total_video: number;
  downloaded_video: number;
  error_video: number;
  status: 'active' | 'disabled';
}
