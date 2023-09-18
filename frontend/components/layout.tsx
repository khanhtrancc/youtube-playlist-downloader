import Head from "next/head";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { config } from "../config";

export const MainLayout = ({
  children,
  serverIp,
  saveDir,
}: {
  serverIp: string;
  saveDir: string;
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
              src="/yt-logo.png"
              alt=""
              width="30"
              height="24"
              className="d-inline-block align-text-top mx-3"
            />
            Youtube Download Bot
          </a>
        </div>
      </nav>

      <main className="container main">{children}</main>

      <footer className="footer">
        <a target="_blank" rel="noopener noreferrer">
          Powered by Youtube Download Bot. Server
          <span style={{ color: "green", marginLeft: "8px" }}>{serverIp}</span>.
          Save dir{" "}
          <span style={{ color: "green", marginLeft: "8px" }}>{saveDir}</span>
        </a>
      </footer>
      <ToastContainer />
    </div>
  );
};
