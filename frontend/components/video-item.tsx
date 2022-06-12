import { utils } from "../helpers/utils";
import { Video } from "../models/video";

function Videodata({ data, index }: { data: Video, index: number }) {
  let videoColor = "bg-secondary text-white ";
  let audioColor = "bg-secondary text-white ";
  switch (data.video_file.status) {
    case "downloaded":
      videoColor = "bg-success text-white";
      break;
    case "downloading":
      videoColor = "bg-primary text-white";
      break;
    case "retry":
    case "waiting":
      videoColor = "bg-warning text-white";
      break;
    case "error":
      videoColor = "bg-danger text-white";
      break;
  }
  switch (data.audio_file.status) {
    case "converted":
      audioColor = "bg-success text-white";
      break;
    case "converting":
      audioColor = "bg-primary text-white";
      break;
    case "retry":
    case "waiting":
      audioColor = "bg-warning text-white";
      break;
    case "error":
      audioColor = "bg-danger text-white";
      break;
  }
  return (
    <div className="card mb-3" key={data.id}>
      <div className="row g-0">
        <div className="col-md-2">
          <img
            src={data.thumbnail}
            className="img-fluid rounded-start"
            alt={data.name}
          />
        </div>
        <div className="col-md-10">
          <div className="card-body">
            <h6 className="card-title">
              {index} - {data.name}
              <small className="text-secondary"> ({data.id})</small>
            </h6>
            <div className="row">
              {data.video_file.status === "downloading" && (
                <div className="col-12">
                  <div className="progress" style={{ height: "5px" }}>
                    <div
                      className="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{
                        width: (data.video_file.percent || 0) + "%",
                      }}
                      aria-valuenow={data.video_file.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {/* {data.video_file.percent || 0}% */}
                    </div>
                  </div>
                </div>
              )}
              <div className="col-12 ">
                <small
                  className={`${videoColor} px-2 py-1 rounded-pill`}
                  style={{ fontSize: "11px" }}
                >
                  {utils.toUpperCaseFirstLetter(data.video_file.status)}
                </small>
                <small
                  className={`${audioColor} px-2 py-1 mx-1 rounded-pill`}
                  style={{ fontSize: "11px" }}
                >
                  {utils.toUpperCaseFirstLetter(data.audio_file.status)}
                </small>
                <small className="text-muted mx-2">
                  {data.audio_file.status !== "none"
                    ? data.audio_file.description
                    : data.video_file.description}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Videodata;
