import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { playlistApi } from "../api/playlist.api";
import { MainLayout } from "../components/layout";
import { Playlist } from "../models/playlist";
import { Video } from "../models/video";
import { toast } from "react-toastify";
import { videoApi } from "../api/video.api";
import { config } from "../config";
import { io } from "socket.io-client";
import VideoItem from "../components/video-item";
import RunStatistic from "../components/run-status";
import { ServerState } from "../models/server-state";

const Home = ({ serverState }: { serverState: ServerState }) => {
  type ModeType = "download" | "convert" | "none";
  let initMode: ModeType =
    serverState.currentAction === "converting"
      ? "convert"
      : serverState.currentAction === "downloading"
      ? "download"
      : "none";
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [runningMode, setRunningMode] = useState<ModeType>(initMode);
  const [search, setSearch] = useState<string>("");
  const [replace, setReplace] = useState<string>("");
  const [start, setStart] = useState<string>("0");
  const [end, setEnd] = useState<string>("0");
  const [thread, setThread] = useState<string>("20");
  const [onlyDownload, setOnlyDownload] = useState(false);
  const [downloadPaths, setDownloadPaths] = useState<string[]>([]);

  const router = useRouter();
  const { playlistId } = router.query;

  useEffect(() => {
    if (!playlistId || typeof playlistId !== "string") {
      return;
    }
    getPlaylistInfo();
    getVideos(playlistId);

    const socket = io(config.serverApi);

    // Socket connection established, port is open
    socket.on("connect", function () {
      console.log("Connected to ws: ", config.serverApi);
    });
    socket.on("disconnect", function () {
      console.log("Disconnected to ws: ", config.serverApi);
      // toast.warning("Disconnected to server. Reloading ...");
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

    socket.on("download-state", (isRunning) => {
      console.log("Download state change", isRunning);
      if (isRunning) {
        toast.success("Download started");
      } else {
        toast.success("Download finished");
        setRunningMode((oldMode) => {
          if (oldMode === "download") {
            return "none";
          }
          return oldMode;
        });
      }
    });

    socket.on("convert-state", (isRunning) => {
      console.log("Convert state change", isRunning);
      if (isRunning) {
        toast.success("Convert started");
      } else {
        toast.success("Convert finished");
        setRunningMode((oldMode) => {
          if (oldMode === "convert") {
            return "none";
          }
          return oldMode;
        });
      }
    });

    socket.on("export", (path) => {
      toast.success("Export data success: " + path);
      console.log("Path", path);
      setDownloadPaths((oldPath) => {
        oldPath.push(path);
        return [...oldPath];
      });
    });

    socket.on("export-zip", (path) => {
      toast.success("Export and compress data success: " + path);
      console.log("Path", path);
      setDownloadPaths((oldPath) => {
        oldPath.push(path);
        return [...oldPath];
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
          if (oldEnd === "0") {
            const endIndex = data.length - 1;
            return "" + endIndex;
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

  const removeFile = () => {
    if (typeof playlistId !== "string") {
      return;
    }
    playlistApi.removeFile(playlistId).then((data) => {
      if (data) {
        setVideos(data);
        toast.success("Remove file successfully!");
      } else {
        toast.error("Remove file failure");
      }
    });
  };

  const startAction = (
    start: string,
    end: string,
    thread: string,
    action: "download" | "convert"
  ) => {
    if (typeof playlistId !== "string") {
      return;
    }

    videoApi
      .start({
        playlist_id: playlistId,
        start,
        end,
        thread,
        action,
      })
      .then((data) => {
        if (data) {
          setVideos(data);
          setRunningMode(action);
          toast.success("Start download successfully!");
        } else {
          toast.error("Start download failure");
        }
      });
  };

  const stopAction = () => {
    if (typeof playlistId !== "string") {
      return;
    }
    videoApi
      .stop({
        playlist_id: playlistId,
        action: runningMode === "convert" ? "convert" : "download",
      })
      .then((data) => {
        if (data) {
          setVideos(data);
          setRunningMode("none");
          toast.success("Stop successfully!");
        } else {
          toast.error("Stop failure");
        }
      });
  };

  const exportData = (type: "video" | "audio") => {
    if (typeof playlistId !== "string") {
      return;
    }
    playlistApi.exportData(playlistId, type).then((data) => {
      if (data) {
        toast.success("Export data successfully!");
      } else {
        toast.error("Export data failure");
      }
    });
  };

  return (
    <MainLayout serverIp={config.serverApi}>
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
                    const statusObj = item.video_file;
                    if (onlyDownload) {
                      return (
                        statusObj.status !== "none" &&
                        statusObj.status !== "downloaded"
                      );
                    }
                    return true;
                  })
                  .map((item, index) => {
                    return (
                      <VideoItem key={item.id} index={index} data={item} />
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <RunStatistic
            type={runningMode === "convert" ? "convert" : "download"}
            videos={videos}
            startIndex={parseInt(start)}
            endIndex={parseInt(end)}
            isRunning={runningMode !== "none"}
            onStop={stopAction}
            onSync={syncWithFile}
            onRemoveFile={removeFile}
          />
          <div className="card mt-3 ">
            {/* <div className="card-header text-center">Tools</div> */}
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
                  Show handling videos
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
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header text-center">Action</div>
            <div className="card-body">
              {runningMode === "none" && (
                <form className=" mt-2">
                  <div className="row">
                    <label
                      htmlFor="inputEmail4"
                      className="col-6 col-form-label"
                    >
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
                      className="col-6 col-form-label"
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
                      className="col-6 col-form-label"
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
                    <div className="col-6 row mx-0">
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        onClick={(event) => {
                          event.preventDefault();
                          startAction(start, end, thread, "download");
                        }}
                      >
                        Download
                      </button>
                    </div>
                    <div className="col-6 row mx-0">
                      <button
                        type="submit"
                        className="btn btn-success btn-sm"
                        onClick={(event) => {
                          event.preventDefault();
                          startAction(start, end, thread, "convert");
                        }}
                      >
                        Convert
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="row">
                <div className="col-6">
                  <a
                    href="#"
                    style={{ fontSize: "12px" }}
                    onClick={(event) => {
                      event.preventDefault();
                      exportData("video");
                    }}
                  >
                    Export videos
                  </a>
                </div>
                <div className="col-6">
                  <a
                    href="#"
                    style={{ fontSize: "12px" }}
                    onClick={(event) => {
                      event.preventDefault();
                      exportData("audio");
                    }}
                  >
                    Export audio
                  </a>
                </div>
              </div>

              {downloadPaths.map((link) => (
                <div key={"path" + link} className="col-12">
                  <a href={link} style={{ fontSize: "12px" }}>
                    {link}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-3 mt-3">
            <div className="card-header text-center">Name Replace Tool</div>
            <div className="card-body">
              <form className=" mt-2">
                <div className="col-12 row">
                  <label htmlFor="inputEmail4" className="col-4 col-form-label">
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
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
