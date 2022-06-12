import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/globals.css";

import type { AppContext, AppProps } from "next/app";
import { configApi } from "../api/config.api";
import App from "next/app";
import { config } from "../config";
import { ServerState } from "../models/server-state";
import { MainLayout } from "../components/layout";
import ServerError from "./server-error";

function MyApp({
  Component,
  pageProps,
  ...otherProps
}: AppProps & { serverState: ServerState }) {
  // console.log("Page props", otherProps);
  if (!otherProps.serverState) {
    return (
      <MainLayout serverIp={config.serverApi}>
        <ServerError />
      </MainLayout>
    );
  }
  const state: ServerState = otherProps.serverState;
  if (state) {
    config.serverApi = state.serverAddress;
  }

  return <Component {...pageProps} initServerState={state} />;
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);

  console.log("Get state of server in _app.tsx");
  const serverState = await configApi.getServerState();
  console.log("Get state response: ", serverState);
  return {
    ...appProps,
    serverState,
  };
};

export default MyApp;
