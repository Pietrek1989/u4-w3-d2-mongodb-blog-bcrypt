import Express from "express";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { checkArticlesSchema, triggerBadRequest } from "./validation.js";
import { getArticles, writeArticles } from "../../lib/fs-tools.js";
import { sendsPostNoticationEmail } from "../../lib/email-tools.js";
import ArticlesModel from "./model.js";

const articlesRouter = Express.Router();

articlesRouter.post(
  "/",
  checkArticlesSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const newArticle = new ArticlesModel(req.body);
      const { _id } = await newArticle.save();

      // sendsPostNoticationEmail(newArticle);
      res.status(201).send({ id: newArticle.id });
    } catch (error) {
      console.log(error);
    }
  }
);

articlesRouter.get("/", async (req, res, next) => {
  try {
    if (req.query && req.query.category) {
      const articles = await ArticlesModel.find({
        category: req.query.category,
      });
      res.send(articles);
    } else {
      const articles = await ArticlesModel.find();
      res.send(articles);
    }
  } catch (error) {
    next(error);
  }
});

articlesRouter.get("/:articleId", async (req, res, next) => {
  try {
    const article = await ArticlesModel.findById(req.params.articleId);
    if (article) {
      res.send(article);
    } else {
      next(
        createHttpError(
          404,
          `Article with id ${req.params.articleId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
articlesRouter.put("/:articleId", async (req, res, next) => {
  try {
    const updatedArticle = await ArticlesModel.findByIdAndUpdate(
      req.params.articleId,
      req.body,
      { new: true, runValidators: true }
    );

    if (updatedArticle) {
      res.send(updatedArticle);
    } else {
      next(
        createHttpError(
          404,
          `Article with id ${req.params.articleId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

articlesRouter.delete("/:articleId", async (req, res, next) => {
  try {
    const deletedArticle = await ArticlesModel.findByIdAndDelete(
      req.params.articleId
    );
    if (deletedArticle) {
      res.status(204).send();
    } else {
      next(
        createHttpError(
          404,
          `Article with id ${req.params.articleId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

articlesRouter.post("/:articleId/comments", async (req, res, next) => {
  try {
    const newComment = {
      ...req.body,
      id: uniqid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const articleArray = await getArticles();
    const index = articleArray.findIndex(
      (article) => article.id === req.params.articleId
    );
    if (index !== -1) {
      const oldArticle = articleArray[index];
      const updatedArticle = {
        ...oldArticle,
        comments: [...oldArticle.comments, newComment],
      };
      articleArray[index] = updatedArticle;
      await writeArticles(articleArray);

      res.status(201).send({ id: newComment.id, newComment });
    }
  } catch (error) {
    console.log(error);
  }
});
articlesRouter.get("/:articleId/comments", async (req, res, next) => {
  try {
    const articleArray = await getArticles();
    const index = articleArray.findIndex(
      (article) => article.id === req.params.articleId
    );

    res.send(articleArray[index].comments);
  } catch (error) {
    next(error);
  }
});
export default articlesRouter;
