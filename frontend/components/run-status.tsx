import { Video } from "../models/video";

function RunStatistic({
  videos,
  type,
  startIndex,
  endIndex,
  isRunning,
  onSync,
  onStop,
  onRemoveFile,
}: {
  videos: Video[];
  type: "download" | "convert";
  startIndex: number;
  endIndex: number;
  isRunning: boolean;
  onSync: () => any;
  onStop: () => any;
  onRemoveFile: () => any;
}) {
  let all = {
    total: 0,
    runned: 0,
    error: 0,
    running: 0,
    waiting: 0,
    retry: 0,
  };
  let current = {
    total: 0,
    runned: 0,
    error: 0,
    running: 0,
    waiting: 0,
    retry: 0,
  };

  const runnnedStatus = type + "ed";
  const runningStatus = type + "ing";
  const mapVideoStatusToStatisticField = {
    [runningStatus]: "running",
    [runnnedStatus]: "runned",
    error: "error",
    waiting: "waiting",
    retry: "retry",
  };

  for (let i = 0; i < videos.length; i++) {
    const videoStatusObj =
      type === "download" ? videos[i]["video_file"] : videos[i]["audio_file"];
    const field = mapVideoStatusToStatisticField[videoStatusObj.status];
    if (i >= startIndex && i <= endIndex) {
      current.total++;
      if ((current as any)[field] >= 0) {
        (current as any)[field]++;
      }
    }
    all.total++;
    if ((all as any)[field] >= 0) {
      (all as any)[field]++;
    }
  }

  const percent =
    current.total > 0 ? Math.round((current.runned / current.total) * 100) : 0;

  return (
    <>
      <div className="card ">
        <div className="card-header text-center">Session Status</div>
        <div className="card-body">
          <div className="progress">
            <div
              className="progress-bar bg-success progress-bar-striped progress-bar-animated"
              role="progressbar"
              style={{ width: percent + "%" }}
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {percent}%
            </div>
          </div>
          <div className="row">
            <div className="col-4" style={{ fontSize: "14px" }}>
              Total:{" "}
              <span className="text-success">
                <br />
                {current.total}
              </span>
            </div>
            <div className="col-4 px-0" style={{ fontSize: "14px" }}>
              Downloaded:{" "}
              <span className="text-success">
                <br />
                {current.runned}
              </span>
            </div>
            <div className="col-4" style={{ fontSize: "14px" }}>
              Failure:{" "}
              <span className="text-success">
                <br />
                {current.error}
              </span>
            </div>
            <div className="col-4" style={{ fontSize: "14px" }}>
              Waiting:{" "}
              <span className="text-success">
                <br />
                {current.waiting}
              </span>
            </div>
            <div className="col-4 px-0" style={{ fontSize: "14px" }}>
              Downloading:{" "}
              <span className="text-success">
                <br />
                {current.running}
              </span>
            </div>
            <div className="col-4" style={{ fontSize: "14px" }}>
              Retry:{" "}
              <span className="text-success">
                <br />
                {current.retry}
              </span>
            </div>
            {!isRunning && (
              <>
                <div className="col-6">
                  <a
                    href="#"
                    style={{ fontSize: "12px" }}
                    onClick={(event) => {
                      event.preventDefault();
                      onSync();
                    }}
                  >
                    Sync from file
                  </a>
                </div>
                <div className="col-6">
                  <a
                    href="#"
                    style={{ fontSize: "12px", color: 'red' }}
                    onClick={(event) => {
                      event.preventDefault();
                      onRemoveFile();
                    }}
                  >
                    Remove all files
                  </a>
                </div>
              </>
            )}
            {isRunning && (
              <div className="col-6">
                <a
                  href="#"
                  style={{ fontSize: "12px", color: "red" }}
                  onClick={(event) => {
                    event.preventDefault();
                    onStop();
                  }}
                >
                  Stop {type}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
export default RunStatistic;
