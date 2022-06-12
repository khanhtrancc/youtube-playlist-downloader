import axios from "axios";
import { config } from "../config";
import { ServerState } from "../models/server-state";
import { handleResponse } from "./common.api";

function getServerState(): Promise<ServerState | null> {
  const api = `${config.serverApi}/api/state`;
  return handleResponse(axios.get(api));
}

export const configApi = {
  getServerState,
};
