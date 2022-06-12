import Head from "next/head";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { config } from "../config";

export const MainLayout = ({
  children,
  serverIp,
}: {
  serverIp: string;
  children: ReactElement;
}) => {

  useEffect(() => {
    config.isBrowser ? require("bootstrap/dist/js/bootstrap") : null;
  }, []);

  return (
    <div>
      <Head>
        <title>Youtube Download Bot</title>
        <meta name="description" content="Youtube Download Bot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav
        className="navbar navbar-light bg-light"
        style={{ backgroundColor: "#e3f2fd !important" }}
      >
        <div className="container-fluid">
          <a className="navbar-brand text-logo" href="/">
            <img
              src="/docs/5.0/assets/brand/bootstrap-logo.svg"
              alt=""
              width="30"
              height="24"
              className="d-inline-block align-text-top"
            />
            Youtube Download Bot
          </a>
        </div>
      </nav>

      <main className="container main">{children}</main>

      <footer className="footer">
        <a target="_blank" rel="noopener noreferrer">
          Powered by Youtube Download Bot. Server Ip: {serverIp}
        </a>
      </footer>
      <ToastContainer />
    </div>
  );
};
