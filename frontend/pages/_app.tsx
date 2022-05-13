import "bootstrap/dist/css/bootstrap.min.css";

import "../styles/globals.css";
import type { AppProps } from "next/app";
import { utils } from "../helpers/utils";
import { config } from "../config";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
