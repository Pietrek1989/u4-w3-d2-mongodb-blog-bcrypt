import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createReadStream } from "fs";

const { readJSON, writeJSON, writeFile } = fs;

const dataFolderPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../api/data"
);
const authorsJSONPath = join(dataFolderPath, "authors.json");
const articlesJSONPath = join(dataFolderPath, "articles.json");
const usersPublicFolderPath = join(process.cwd(), "./public/img/authors");
const articlesPublicFolderPath = join(process.cwd(), "./public/img/blogPosts");

export const getAuthors = () => readJSON(authorsJSONPath);
export const writeAuthors = (authorsArray) =>
  writeJSON(authorsJSONPath, authorsArray);
export const getArticles = () => readJSON(articlesJSONPath);
export const writeArticles = (articlesArray) =>
  writeJSON(articlesJSONPath, articlesArray);

export const saveAuthorsAvatars = (fileName, fileContentAsBuffer) =>
  writeFile(join(usersPublicFolderPath, fileName), fileContentAsBuffer);
export const saveArticlePic = (fileName, fileContentAsBuffer) =>
  writeFile(join(articlesPublicFolderPath, fileName), fileContentAsBuffer);

export const getAuthorsJSONReadableStream = () =>
  createReadStream(authorsJSONPath);

export const getPDFWritableStream = (filename) =>
  createWriteStream(join(dataFolderPath, filename));
