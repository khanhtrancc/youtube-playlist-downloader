import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Router, { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { playlistApi } from "../api/playlist";
import { MainLayout } from "../components/layout";
import { Playlist } from "../models/playlist";
import { Video } from "../models/video";
import { toast } from "react-toastify";
import { videoApi } from "../api/video";
import { utils } from "../helpers/utils";
import { config } from "../config";
import { io } from "socket.io-client";
import VideoItem from "../components/video-item";
import RunStatistic from "../components/run-status";

const Home = ({ serverIp }: { serverIp: string | null }) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isRunning, setRunningState] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [replace, setReplace] = useState<string>("");
  const [start, setStart] = useState<string>("0");
  const [end, setEnd] = useState<string>("0");
  const [thread, setThread] = useState<string>("20");
  const [onlyDownload, setOnlyDownload] = useState(false);

  if (serverIp) {
    config.api = `http://${serverIp}:${config.serverPort}`;
    config.ws = `http://${serverIp}:${config.socketPort}`;
  }

  const router = useRouter();
  const { playlistId } = router.query;

  useEffect(() => {
    if (!playlistId || typeof playlistId !== "string") {
      return;
    }
    getPlaylistInfo();
    getVideos(playlistId);

    const socket = io(config.ws);

    // Socket connection established, port is open
    socket.on("connect", function () {
      console.log("Connected to ws: ", config.ws);
    });
    socket.on("progress", (updatedData) => {
      if (!updatedData || updatedData.length < 1) {
        return;
      }
      setVideos((previousVideos) => {
        const newState = [...previousVideos];
        for (let i = 0; i < updatedData.length; i++) {
          const index = newState.findIndex(
            (item) => item.id === updatedData[i].id
          );
          if (index >= 0) {
            newState[index] = updatedData[i];
          }
        }
        return newState;
      });
    });
  }, [playlistId]);

  const getPlaylistInfo = () => {
    playlistApi.getPlaylists().then((data) => {
      if (data) {
        const list = data.find((item: Playlist) => item.id === playlistId);
        setPlaylist(list);
      } else {
        toast.error("Get playlist failure");
      }
    });
  };

  const getVideos = (playlistId: string) => {
    videoApi.getVideosOfPlaylist(playlistId).then((data: Video[]) => {
      if (data) {
        setVideos(data);

        setEnd((oldEnd) => {
          console.log("End index", oldEnd);
          if (oldEnd === "0") {
            const endIndex = data.length - 1;
            return("" + endIndex);
          }
          return oldEnd;
        });
      } else {
        toast.error("Get videos failure");
      }
    });
  };

  const replaceTitle = (search: string, replace: string) => {
    if (typeof playlistId !== "string") {
      return;
    }
    videoApi.replaceName(playlistId, search, replace).then((data) => {
      if (data) {
        setVideos(data);
        toast.success("Replace name successfully!");
      } else {
        toast.error("Replace name failure");
      }
    });
  };

  const syncWithFile = () => {
    if (typeof playlistId !== "string") {
      return;
    }
    videoApi.syncWithFile(playlistId).then((data) => {
      if (data) {
        setVideos(data);
        toast.success("Sync state successfully!");
      } else {
        toast.error("Sync state failure");
      }
    });
  };

  const download = (
    start: string,
    end: string,
    thread: string,
  ) => {
    if (typeof playlistId !== "string") {
      return;
    }

    videoApi
      .download(playlistId, start, end, thread)
      .then((data) => {
        if (data) {
          setVideos(data);
          toast.success("Start download successfully!");
        } else {
          toast.error("Start download failure");
        }
      });
  };

  const stop = () => {
    if (typeof playlistId !== "string") {
      return;
    }
    videoApi.stop(playlistId).then((data) => {
      if (data) {
        setVideos(data);
        toast.success("Stop successfully!");
      } else {
        toast.error("Stop failure");
      }
    });
  };

  return (
    <MainLayout serverIp={config.api}>
      <div className="row mt-3">
        <div className="col-12 col-md-8">
          <div className="card">
            <div className="card-header text-center">{playlist?.name}</div>
            <div className="card-body mx-0 px-0">
              <div
                className=" overflow-scroll px-3"
                style={{ maxHeight: "80vh" }}
              >
                {videos
                  .filter((item) => {
                    const statusObj =   item.video_file;
                    if (onlyDownload) {
                      return (
                        statusObj.status !== "none" &&
                        statusObj.status !== "downloaded"
                      );
                    }
                    return true;
                  })
                  .map((item) => {
                    return <VideoItem key={item.id} data={item} />;
                  })}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <RunStatistic
            type={"download"}
            videos={videos}
            startIndex={parseInt(start)}
            endIndex={parseInt(end)}
          />
          <div className="card mt-3 ">
            <div className="card-header text-center">Tools</div>
            <div className="card-body">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="flexRadioDefault"
                  id="flexRadioDefault1"
                  checked={onlyDownload}
                  onChange={(event) => {
                    setOnlyDownload(event.target.checked);
                  }}
                />
                <label className="form-check-label" htmlFor="flexRadioDefault1">
                  Show only downloading videos
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="flexRadioDefault"
                  id="flexRadioDefault2"
                  checked={!onlyDownload}
                  onChange={(event) => {
                    setOnlyDownload(false);
                  }}
                />
                <label className="form-check-label" htmlFor="flexRadioDefault2">
                  Show all videos
                </label>
              </div>

              <div className="row mx-0 justify-content-between mt-3">
                <div className="col-6 row">
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm"
                    onClick={(event) => {
                      event.preventDefault();
                      stop();
                    }}
                  >
                    Stop
                  </button>
                </div>
                <div className="col-6 row">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    onClick={(event) => {
                      event.preventDefault();
                      syncWithFile();
                    }}
                  >
                    Sync with file
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header text-center">Download</div>
            <div className="card-body">
              <form className=" mt-2">
                <div className="row">
                  <label htmlFor="inputEmail4" className="col-4 col-form-label">
                    Start Index
                  </label>
                  <div className="col-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="text"
                      value={start}
                      onChange={(event) => setStart(event.target.value)}
                    />
                  </div>
                </div>
                <div className="row">
                  <label
                    htmlFor="inputPassword4"
                    className="col-4 col-form-label"
                  >
                    End Index
                  </label>
                  <div className="col-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="inputPassword4"
                      value={end}
                      onChange={(event) => setEnd(event.target.value)}
                    />
                  </div>
                </div>
                <div className="row">
                  <label
                    htmlFor="inputPassword4"
                    className="col-4 col-form-label"
                  >
                    Thread
                  </label>
                  <div className="col-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="inputPassword4"
                      value={thread}
                      onChange={(event) => setThread(event.target.value)}
                    />
                  </div>
                </div>
                
                <div className="row mx-0 mt-3">
                  <div className="col-12 row mx-0">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      onClick={(event) => {
                        event.preventDefault();
                        download(start, end, thread);
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {!isRunning && (
            <>
              <div className="card mb-3">
                <div className="card-header text-center">Name Replace Tool</div>
                <div className="card-body">
                  <form className=" mt-2">
                    <div className="col-12 row">
                      <label
                        htmlFor="inputEmail4"
                        className="col-4 col-form-label"
                      >
                        Search
                      </label>
                      <div className="col-8">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          id="text"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-12 row">
                      <label
                        htmlFor="inputPassword4"
                        className="col-4 col-form-label"
                      >
                        Replace
                      </label>
                      <div className="col-8">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          id="inputPassword4"
                          value={replace}
                          onChange={(event) => setReplace(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row mx-0 justify-content-end mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        onClick={(event) => {
                          event.preventDefault();
                          replaceTitle(search, replace);
                        }}
                      >
                        Replace All
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export async function getServerSideProps() {
  console.log("Render download");
  const ip = await utils.scanServer(config.socketPort);
  return {
    props: {
      serverIp: ip,
    },
  };
}

export default Home;
