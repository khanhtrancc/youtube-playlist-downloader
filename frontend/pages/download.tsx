import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { playlistApi } from "../api/playlist";
import { MainLayout } from "../components/layout";
import { Playlist } from "../models/playlist";
import { Video } from "../models/video";
import { toast } from "react-toastify";
import { videoApi } from "../api/video";
import { utils } from "../helpers/utils";

const Home: NextPage = () => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isRunning, setRunningState] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [replace, setReplace] = useState<string>("");
  const [start, setStart] = useState<string>("0");
  const [end, setEnd] = useState<string>("0");
  const [thread, setThread] = useState<string>("20");
  const [status, setStatus] = useState<{
    total: number;
    downloaded: number;
    error: number;
    downloading: number;
    waiting: number;
    retry: number;
  }>({
    total: 0,
    downloaded: 0,
    error: 0,
    downloading: 0,
    waiting: 0,
    retry: 0,
  });

  const router = useRouter();
  const { playlistId } = router.query;

  useEffect(() => {
    if (!playlistId || typeof playlistId !== "string") {
      return;
    }
    playlistApi.getPlaylists().then((data) => {
      if (data) {
        const list = data.find((item: Playlist) => item.id === playlistId);
        setPlaylist(list);
      } else {
        toast.error("Get playlist failure");
      }
    });
    getVideos(playlistId);
  }, [playlistId]);

  const updateStatus = (data: Video[]) => {
    setEnd("" + (data.length - 1));
    const status = {
      total: 0,
      downloaded: 0,
      error: 0,
      downloading: 0,
      waiting: 0,
      retry: 0,
    };
    for (let i = 0; i < data.length; i++) {
      (status as any)[data[i].video_file.status]++;
      status.total++;
    }
    setStatus(status);
  };

  const getVideos = (playlistId: string) => {
    videoApi.getVideosOfPlaylist(playlistId).then((data: Video[]) => {
      if (data) {
        setVideos(data);
        updateStatus(data);
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
        updateStatus(data);
        toast.success("Sync state successfully!");
      } else {
        toast.error("Sync state failure");
      }
    });
  };

  const download = (start: string, end: string, thread: string) => {
    if (typeof playlistId !== "string") {
      return;
    }
    videoApi.download(playlistId, start, end, thread).then((data) => {
      if (data) {
        setVideos(data);
        updateStatus(data);
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
        updateStatus(data);
        toast.success("Stop successfully!");
      } else {
        toast.error("Stop failure");
      }
    });
  };

  return (
    <MainLayout>
      <div className="row mt-3">
        <div className="col-12 col-md-8">
          <div className="card">
            <div className="card-header text-center">{playlist?.name}</div>
            <div className="card-body mx-0 px-0">
              <div
                className=" overflow-scroll px-3"
                style={{ maxHeight: "80vh" }}
              >
                {videos.map((item) => {
                  let videoColor = "bg-secondary text-white ";
                  let audioColor = "bg-secondary text-white ";
                  switch (item.video_file.status) {
                    case "downloaded":
                      videoColor = "bg-success text-white";
                      break;
                    case "downloading":
                      videoColor = "bg-primary text-white";
                      break;
                    case "retrying":
                    case "waiting":
                      videoColor = "bg-warning text-white";
                      break;
                    case "error":
                      videoColor = "bg-danger text-white";
                      break;
                  }
                  switch (item.audio_file.status) {
                    case "converting":
                      videoColor = "bg-success text-white";
                      break;
                    case "converted":
                      videoColor = "bg-primary text-white";
                      break;
                    case "retrying":
                    case "waiting":
                      videoColor = "bg-warning text-white";
                      break;
                    case "error":
                      videoColor = "bg-danger text-white";
                      break;
                  }

                  return (
                    <div className="card mb-3" key={item.id}>
                      <div className="row g-0">
                        <div className="col-md-4">
                          <img
                            src={item.thumbnail}
                            className="img-fluid rounded-start"
                            alt={item.name}
                          />
                        </div>
                        <div className="col-md-8">
                          <div className="card-body">
                            <h6 className="card-title">{item.name}</h6>
                            <div className="row">
                              {item.video_file.status === "downloading" && (
                                <div className="col-12">
                                  <div
                                    className="progress"
                                    style={{ height: "10px" }}
                                  >
                                    <div
                                      className="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                                      role="progressbar"
                                      style={{
                                        width:
                                          (item.video_file.percent || 0) + "%",
                                      }}
                                      aria-valuenow={item.video_file.percent}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    >
                                      {/* {item.video_file.percent || 0}% */}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="col-12 ">
                                <small
                                  className={`${videoColor} px-2 py-1 rounded-pill`}
                                  style={{ fontSize: "11px" }}
                                >
                                  {utils.toUpperCaseFirstLetter(
                                    item.video_file.status
                                  )}
                                </small>
                                <small className="text-muted mx-2">
                                  {item.video_file.description}
                                </small>
                              </div>
                              <div className="col-6">
                                <small
                                  className={`${audioColor} px-2 py-1 rounded-pill`}
                                  style={{ fontSize: "11px" }}
                                >
                                  {utils.toUpperCaseFirstLetter(
                                    item.audio_file.status
                                  )}
                                </small>
                                {/* <small className="text-muted">
                                  {item.audio_file.description}
                                </small> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-header text-center">Status</div>
            <div className="card-body">
              <div className="progress">
                <div
                  className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: "25%" }}
                  aria-valuenow={25}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  25%
                </div>
              </div>

              <div className="row">
                <div className="col-4" style={{ fontSize: "14px" }}>
                  Total:{" "}
                  <span className="text-success">
                    <br />
                    {status.total}
                  </span>
                </div>
                <div className="col-4 px-0" style={{ fontSize: "14px" }}>
                  Downloaded:{" "}
                  <span className="text-success">
                    <br />
                    {status.downloaded}
                  </span>
                </div>
                <div className="col-4" style={{ fontSize: "14px" }}>
                  Failure:{" "}
                  <span className="text-success">
                    <br />
                    {status.error}
                  </span>
                </div>
                <div className="col-4" style={{ fontSize: "14px" }}>
                  Waiting:{" "}
                  <span className="text-success">
                    <br />
                    {status.waiting}
                  </span>
                </div>
                <div className="col-4 px-0" style={{ fontSize: "14px" }}>
                  Downloading:{" "}
                  <span className="text-success">
                    <br />
                    {status.downloading}
                  </span>
                </div>
                <div className="col-4" style={{ fontSize: "14px" }}>
                  Retry:{" "}
                  <span className="text-success">
                    <br />
                    {status.retry}
                  </span>
                </div>
              </div>
              <div className="row mx-0 justify-content-end mt-3">
                <button
                  type="submit"
                  className="btn btn-danger"
                  onClick={(event) => {
                    event.preventDefault();
                    stop();
                  }}
                >
                  Stop
                </button>
              </div>
            </div>
          </div>

          {!isRunning && (
            <>
              <div className="card mb-3">
                <div className="card-header text-center">Name Replace Tool</div>
                <div className="card-body">
                  <form className=" mt-2">
                    <div className="col-12">
                      <label htmlFor="inputEmail4" className="form-label">
                        Search (Regex)
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="inputPassword4" className="form-label">
                        Replace (Regex)
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="inputPassword4"
                        value={replace}
                        onChange={(event) => setReplace(event.target.value)}
                      />
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

              <div className="card mb-3">
                <div className="card-header text-center">Download/Convert</div>
                <div className="card-body">
                  <form className=" mt-2">
                    <div className="col-12">
                      <label htmlFor="inputEmail4" className="form-label">
                        Start Index
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="text"
                        value={start}
                        onChange={(event) => setStart(event.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="inputPassword4" className="form-label">
                        End Index
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="inputPassword4"
                        value={end}
                        onChange={(event) => setEnd(event.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="inputPassword4" className="form-label">
                        Thread
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="inputPassword4"
                        value={thread}
                        onChange={(event) => setThread(event.target.value)}
                      />
                    </div>
                    <div className="row mx-0 mt-3">
                      <div className="col-6 row mx-0">
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
                      <div className="col-6 row mx-0">
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                        >
                          Convert
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header text-center">Sync with file</div>
                <div className="card-body">
                  <form className=" mt-2">
                    <div className="row mx-0 justify-content-end mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        onClick={(event) => {
                          event.preventDefault();
                          syncWithFile();
                        }}
                      >
                        Sync
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

export default Home;
