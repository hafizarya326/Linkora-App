const bilibili = require("./lib/bilibili");
const douyin = require("./lib/douyin");
const applemusic = require("./lib/applemusic");
const soundcloud = require("./lib/soundcloud");
const tiktok = require("./lib/tiktok");
const youtube = require("./lib/youtube");
const instagram = require("./lib/instagram");
const bandcamp = require("./lib/bandcamp");
const spotify = require("./lib/spotify");
const twitter = require("./lib/twitter");
const pinterest = require("./lib/pinterest");
const facebook = require("./lib/facebook");
const threads = require("./lib/threads");
const pixiv = require("./lib/pixiv");
const rednote = require("./lib/rednote");
const reddit = require("./lib/reddit");
const terabox = require("./lib/terabox");
const resolver = require("./lib/resolver");

const api = {
  bilibili,
  douyin,
  applemusic,
  soundcloud,
  tiktok,
  youtube,
  instagram,
  bandcamp,
  spotify,
  twitter,
  pinterest,
  facebook,
  threads,
  pixiv,
  rednote,
  reddit,
  terabox,
  resolver,
};

api.default = api;
Object.defineProperty(api, "__esModule", {
  value: true,
  enumerable: false,
  configurable: true,
});

module.exports = api;
