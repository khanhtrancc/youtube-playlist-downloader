export type ServerActionType =
  | 'downloading'
  | 'converting'
  | 'none'
  | 'exporting'
  | 'remove-file'
  | 'sync-state';

export interface ServerState {
  currentAction: ServerActionType;
  startIndex: number;
  endIndex: number;
  serverAddress: string;
  handlingPlaylistId: string | null;
}
