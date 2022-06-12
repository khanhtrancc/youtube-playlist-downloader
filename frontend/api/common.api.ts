import { AxiosError, AxiosResponse } from "axios";

export function handleResponse(axiosRequest: Promise<AxiosResponse<any, any>>) {
  return axiosRequest
    .then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      const config = res.config || {};
      console.log(
        `Request: [${config.method?.toUpperCase()}] - ${config.url} - ${
          config.data ? config.data : ""
        }\nResponse: ${res.data.data ? JSON.stringify(res.data.data) : {}}`
      );
      return null;
    })
    .catch((err: AxiosError) => {
      const config = err.config || {};

      console.log(
        `Request error: [${config.method?.toUpperCase()}] - ${config.url} ${
          config.data ? '- ' +  config.data : ""
        }\nResponse: ${
          err.response?.data ? JSON.stringify(err.response?.data) : "None"
        }`
      );
      return null;
    });
}
