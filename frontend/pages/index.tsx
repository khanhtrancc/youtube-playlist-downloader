import { useEffect, useState } from "react";
import { MainLayout } from "../components/layout";
import { playlistApi } from "../api/playlist.api";
import { toast } from "react-toastify";
import { Playlist } from "../models/playlist";
import Link from "next/link";
import { config } from "../config";
import { ServerState } from "../models/server-state";

const Home = ({ initServerState }: { initServerState: ServerState }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    playlistApi.getPlaylists().then((data) => {
      if (data) {
        setPlaylists(data);
      } else {
        toast.error("Get playlist failure");
      }
    });
  }, []);

  const removePlaylist = (id: string) => {
    playlistApi.removePlaylist(id).then((data) => {
      if (data) {
        setPlaylists(data);
      } else {
        toast.error("Add playlist failure");
      }
    });
  };

  const addPlaylist = (id: string) => {
    playlistApi.addPlaylist(id).then((data) => {
      if (data) {
        setPlaylists(data);
      } else {
        toast.error("Add playlist failure");
      }
    });
  };

  return (
    <MainLayout serverIp={config.serverApi}>
      <div className="row mt-3">
        <div className="col-12 col-md-8">
          <div className="card">
            <div className="card-header text-center">Playlists</div>
            <div className="card-body">
              {playlists.map((item) => {
                const downloadPercent = Math.round(
                  (item.downloaded_video / (item.total_video || 1)) * 100
                );
                return (
                  <Link href={`/download?playlistId=${item.id}`} key={item.id}>
                    <div className="card mb-3" role="button">
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
                            <h5 className="card-title">{item.name}</h5>
                            <p className="card-text">{item.channel}</p>
                            {/* <div className="progress">
                              <div
                                className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                                role="progressbar"
                                style={{ width: downloadPercent + "%" }}
                                aria-valuenow={item.downloaded_video}
                                aria-valuemin={0}
                                aria-valuemax={item.total_video}
                              >
                                {downloadPercent}
                              </div>
                            </div> */}
                            <div className="row justify-content-between">
                              <div className="col-6">
                                <p className="card-text">
                                  <small className="text-muted">
                                    {`${item.total_video} videos`}
                                  </small>
                                </p>
                              </div>
                              <div className="col-6">
                                <div className="d-flex flex-row-reverse">
                                  <a
                                    className="text-danger fs-6"
                                    role="button"
                                    onClick={() => removePlaylist(item.id)}
                                  >
                                    Remove
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-header text-center">Add New Playlist</div>
            <div className="card-body">
              <form className=" mt-2">
                <div className="col-12">
                  <label htmlFor="inputPassword4" className="form-label">
                    Playlist ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={id}
                    onChange={(event) => setId(event.target.value)}
                    id="inputPassword4"
                  />
                </div>
                <div className="row mx-0 justify-content-end mt-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={(event) => {
                      event.preventDefault();
                      addPlaylist(id);
                    }}
                  >
                    Add
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
