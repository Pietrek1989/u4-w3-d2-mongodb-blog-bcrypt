import Express from "express";
import multer from "multer";
import {
  getArticles,
  getAuthors,
  getAuthorsJSONReadableStream,
  writeArticles,
  writeAuthors,
} from "../../lib/fs-tools.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { getPDFReadableStream } from "../../lib/pdf-tools.js";
import { pipeline } from "stream";
import { sendsRegistrationEmail } from "../../lib/email-tools.js";
import { Transform } from "json2csv";
import ArticlesModel from "../articles/model.js";

const filesRouter = Express.Router();
const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "articles/img",
    },
  }),
}).single("avatar");
const cloudinaryUploaderArticle = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "articles/posts",
    },
  }),
}).single("postPic");

filesRouter.post(
  "/:authorId/authorSingle",
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      console.log("FILE:", req.file);
      // const originalFileExtension = extname(req.file.originalname);
      // const fileName = req.params.authorId + originalFileExtension;
      // await saveAuthorsAvatars(fileName, req.file.buffer);

      const authorsArray = await getAuthors();
      const index = authorsArray.findIndex(
        (author) => author.id === req.params.authorId
      );
      if (index !== -1) {
        const oldAuthor = authorsArray[index];
        const updatedAuthor = {
          ...oldAuthor,
          avatar: `${req.file.path}`,
        };
        authorsArray[index] = updatedAuthor;
        await writeAuthors(authorsArray);
        res.send({ updatedAuthor, message: "file uploaded" });
      } else {
        next(
          createHttpError(
            404,
            `author with id ${req.params.authorId} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

filesRouter.post(
  "/:articleId/articleSingle",
  cloudinaryUploaderArticle,
  async (req, res, next) => {
    try {
      console.log("FILE:", req.file);
      const article = await ArticlesModel.findById(req.params.articleId);
      article.cover = req.file.path;
      await article.save();
      if (article) {
        res.send({ article, message: "file uploaded" });
      } else {
        next(
          createHttpError(
            404,
            `article with id ${req.params.articleId} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

filesRouter.get("/:articleId/pdf", async (req, res, next) => {
  try {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${req.params.articleId}.pdf`
    );
    const articleArray = await getArticles();
    const index = articleArray.findIndex(
      (article) => article.id === req.params.articleId
    );
    if (index !== -1) {
      const targetedArticle = articleArray[index];

      const source = await getPDFReadableStream(targetedArticle);
      const destination = res;

      pipeline(source, destination, (err) => {
        if (err) console.log(err);
      });
    } else {
      next(
        createHttpError(
          404,
          `article with id ${req.params.articleId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

filesRouter.post("/email", async (req, res, next) => {
  try {
    // 1. Receive user's data in req.body
    const { email } = req.body;
    // 2. Save him/her in db
    // 3. Send email to new user
    await sendsRegistrationEmail(email);
    res.send({ message: "email sent to" + email });
  } catch (error) {
    next(error);
  }
});

filesRouter.get("/csv", (req, res, next) => {
  try {
    res.setHeader("Content-Disposition", "attachment; filename=authors.csv");
    const source = getAuthorsJSONReadableStream();
    const transform = new Transform({ fields: ["name", "surname", "email"] });
    const destination = res;
    pipeline(source, transform, destination, (err) => {
      if (err) console.log(err);
    });
  } catch (error) {
    next(error);
  }
});

export default filesRouter;
