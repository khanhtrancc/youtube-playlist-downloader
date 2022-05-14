import axios from "axios";
import { config } from "../config";

function getConfig(): Promise<{
  isDownloading: boolean;
  isConverting: boolean;
  serverAddress: string;
} | null> {
  const api = `${config.api}/api/config`;
  return axios
    .get(api)
    .then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Request", api, err);
      return null;
    });
}

export const configApi = {
  getConfig,
};
