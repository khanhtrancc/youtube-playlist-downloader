const axios = require("axios");
const fs = require("fs");
const config = require("./config");
const htmlParser = require("node-html-parser");

/**
 * This function use with api of web: https://truyenfull.vn
 */
async function getChapterNames() {
  const list = [];
  const path = config.baseOutputPath;
  for (let chapter = 1; chapter < 28; chapter++) {
    try {
      const res = await axios.get(
        `https://truyenfull.vn/ajax.php?type=list_chapter&tid=73&tascii=pham-nhan-tu-tien&tname=Ph%C3%A0m+Nh%C3%A2n+Tu+Ti%C3%AAn&page=2&totalp=49`
      );
      const root = htmlParser.parse(res.data.chap_list);
      const chapterList = root.querySelectorAll(".list-chapter");

      const leftList = chapterList[0];
      for (
        let childIndex = 0;
        childIndex < leftList.childNodes.length;
        childIndex++
      ) {
        const name =
          leftList.childNodes[childIndex].childNodes[2].childNodes[1]._rawText;
        const nameList = name.split(":");
        list.push({ chap: nameList[0], title: nameList[1] });
      }

      const rightList = chapterList[1];
      for (
        let childIndex = 0;
        childIndex < rightList.childNodes.length;
        childIndex++
      ) {
        if (rightList.childNodes[childIndex].childNodes[2]) {
          const name =
            rightList.childNodes[childIndex].childNodes[2].childNodes[1]
              ._rawText;
          const nameList = name.split(":");
          list.push({ chap: nameList[0], title: nameList[1] });
        }
      }
      console.log("Get chapter ", chapter, " sucessfully!");
    } catch (err) {
      console.log("Get chapter ", chapter, " error", err);
      break;
    }
  }
  console.log("List", list);
  fs.writeFileSync(path + "/name.json", JSON.stringify(list));
}

/**
 * Append chapter name to video name
 */
async function mapName() {
  const path = config.baseOutputPath;
  const video = require(`${path}/videos.json`);
  const nameArr = require(`${path}/name.json`);
  const nameHash = {};
  nameArr.forEach((item) => {
    nameHash[item.chap] = item.title;
  });

  const newVideos = video.map((item) => {
    let title = item.title;
    const chapters = item.title.replace("Chương ", "").split("-");
    chapters.forEach((chap) => {
      title += "|" + nameHash[chap];
    });
    return { ...item, title };
  });
  fs.writeFileSync(`${path}/videos.json`, JSON.stringify(newVideos));
}

getChapterNames();
// mapName();
