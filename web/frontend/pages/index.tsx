import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { MainLayout } from "../components/layout";

const Home: NextPage = () => {
  return (
    <MainLayout>
      <div className="row mt-3">
        <div className="col-12 col-md-8">
          <div className="card">
            <div className="card-header text-center">Playlists</div>
            <div className="card-body">
              <div className="card mb-3">
                <div className="row g-0">
                  <div className="col-md-4">
                    <img
                      src="..."
                      className="img-fluid rounded-start"
                      alt="..."
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="card-body">
                      <h5 className="card-title">Card title</h5>
                      <p className="card-text">
                        This is a wider card with supporting text below as a
                        natural lead-in to additional content. This content is a
                        little bit longer.
                      </p>
                      <p className="card-text">
                        <small className="text-muted">
                          Last updated 3 mins ago
                        </small>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-header text-center">Add New Playlist</div>
            <div className="card-body">
              <form className=" mt-2">
                <div className="col-12">
                  <label htmlFor="inputEmail4" className="form-label">
                    Playlist Name
                  </label>
                  <input type="text" className="form-control" id="text" />
                </div>
                <div className="col-12">
                  <label htmlFor="inputPassword4" className="form-label">
                    Playlist ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="inputPassword4"
                  />
                </div>
                <div className="row mx-0 justify-content-end mt-3">
                  <button type="submit" className="btn btn-primary">
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
