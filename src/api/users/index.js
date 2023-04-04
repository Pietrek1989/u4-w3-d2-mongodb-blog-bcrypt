// import uniqid from "uniqid";
// import { getAuthors, writeAuthors } from "../../lib/fs-tools.js";
// import createHttpError from "http-errors";
import express from "express";
import createError from "http-errors";
import AuthorsModel from "./model.js";
import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import ArticlesModel from "../articles/model.js";

const authorsRouter = express.Router();

authorsRouter.post("/", async (req, res, next) => {
  try {
    const newAuthor = new AuthorsModel(req.body);
    const { _id } = await newAuthor.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

authorsRouter.get("/", async (req, res, next) => {
  try {
    const authors = await AuthorsModel.find();
    res.send(authors);
  } catch (error) {
    next(error);
  }
});

authorsRouter.get("/:authorId", async (req, res, next) => {
  try {
    const author = await AuthorsModel.findById(req.params.authorId);
    if (author) {
      res.send(author);
    } else {
      next(
        createError(404, `Author with id ${req.params.authorId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

authorsRouter.put("/:authorId", basicAuthMiddleware, async (req, res, next) => {
  try {
    const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
      req.params.authorId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedAuthor) {
      res.send(updatedAuthor);
    } else {
      next(
        createError(404, `Author with id ${req.params.authorId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

authorsRouter.delete("/:authorId", async (req, res, next) => {
  try {
    const deletedAuthor = await AuthorsModel.findByIdAndDelete(
      req.params.authorId
    );
    if (deletedAuthor) {
      res.status(204).send();
    } else {
      next(
        createError(404, `Author with id ${req.params.authorId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

authorsRouter.get("/me/info", basicAuthMiddleware, async (req, res, next) => {
  try {
    res.send(req.author);
  } catch (error) {
    next(error);
  }
});
authorsRouter.get(
  "/me/stories",
  basicAuthMiddleware,
  async (req, res, next) => {
    try {
      const articles = await ArticlesModel.find({}).populate("author");
      const articlesByAuthor = articles.filter((article) => {
        return article.author && article.author.name === req.author.name;
      });
      res.send(articlesByAuthor);
    } catch (error) {
      next(error);
    }
  }
);

export default authorsRouter;
