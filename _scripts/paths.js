const path = require('path');

// resource paths
const DIR_SRC = path.join(__dirname, '..', 'src');
const DIR_DIST = path.join(__dirname, '..', 'dist');
const DIR_TEMP = path.join(__dirname, '..', 'temp');

const staticPath = '/static';

// source folders
const srcFolders = {
  assets  : '/assets/',
  html    : '/html/',
  js      : '/js/',
  markdown: '/markdown/',
  styles  : '/styles/',
  svg     : '/assets/svg/',
  fonts   : '/assets/fonts/',
  root    : '/',
};

// folders that should be public
const staticFolders = new Set([]);

// Generation

const isPublic = prop => (staticFolders.has(prop) ? staticPath : '');

const src = () => {
  const obj = {};
  Object.entries(srcFolders).forEach(
    ([key, value]) => (obj[key] = DIR_SRC + value)
  );
  return obj;
};

const dist = () => {
  const obj = {};
  Object.entries(srcFolders).forEach(
    ([key, value]) => (obj[key] = DIR_DIST + isPublic(key) + value)
  );
  return obj;
};

const temp = () => {
  const obj = {};
  Object.entries(srcFolders).forEach(
    ([key, value]) => (obj[key] = DIR_TEMP + isPublic(key) + value)
  );
  return obj;
};

exports.src = src();
exports.dist = dist();
exports.temp = temp();

exports.staticFolders = staticFolders;
exports.staticPath = staticPath;
