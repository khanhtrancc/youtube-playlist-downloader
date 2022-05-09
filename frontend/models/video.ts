export interface Video {
  id: string;
  name: string;
  playlist_id: string;
  thumbnail?: string;
  video_file: {
    status:
      | "downloading"
      | "downloaded"
      | "error"
      | "retrying"
      | "none"
      | "waiting";
    description: string;
    retry_count: number;
    updated_at: number;
    percent?: number;
  };
  audio_file: {
    status:
      | "converting"
      | "converted"
      | "error"
      | "retrying"
      | "none"
      | "waiting";
    description: string;
    retry_count: number;
    updated_at: number;
  };
}
