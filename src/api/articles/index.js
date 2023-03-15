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

// ----------------------------COMMENTS ENDPOINTS---------------------------------------
articlesRouter.post("/:articleId/comments", async (req, res, next) => {
  try {
    const newComment = {
      ...req.body,
      dateOfPosting: new Date(),
    };
    const updatedArticle = await ArticlesModel.findByIdAndUpdate(
      req.params.articleId, // WHO
      { $push: { comments: newComment } }, // HOW
      { new: true, runValidators: true }
    ); // OPTIONS
    if (updatedArticle) {
      res.status(201).send(newComment);
    } else {
      next(
        createHttpError(
          404,
          `Article with id ${req.params.articleId} not found!`
        )
      );
    }
  } catch (error) {
    console.log(error);
  }
});

articlesRouter.get("/:articleId/comments", async (req, res, next) => {
  try {
    const targetArticle = await ArticlesModel.findById(req.params.articleId);
    const comments = targetArticle.comments;
    if (targetArticle) {
      res.status(200).send(comments);
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

articlesRouter.get(
  "/:articleId/comments/:commentsId",
  async (req, res, next) => {
    try {
      const targetArticle = await ArticlesModel.findById(req.params.articleId);
      const targetedComment = targetArticle.comments.find(
        (comment) => comment._id.toString() === req.params.commentsId
      );

      if (targetArticle) {
      } else {
        createHttpError(
          404,
          `Article with id ${req.params.articleId} not found!`
        );
      }
      if (targetedComment) {
        res.send(targetedComment);
      } else {
        createHttpError(
          404,
          `Comment with id ${req.params.commentsId} not found!`
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

articlesRouter.put(
  "/:articleId/comments/:commentsId",
  async (req, res, next) => {
    try {
      const targetArticle = await ArticlesModel.findById(req.params.articleId);
      if (targetArticle) {
        let index = targetArticle.comments.findIndex(
          (comment) => comment._id.toString() === req.params.commentsId
        );
        if (index !== -1) {
          targetArticle.comments[index] = {
            ...targetArticle.comments[index].toObject(),
            ...req.body,
            dateOfUpdate: new Date(),
          };
          console.log(targetArticle.comments[index]);
          await targetArticle.save();
          res.send(targetArticle.comments[index]);
        } else {
          createHttpError(
            404,
            `Comment with id ${req.params.articleId} not found!`
          );
        }
      } else {
        createHttpError(
          404,
          `Article with id ${req.params.commentsId} not found!`
        );
      }
    } catch (error) {
      next(error);
    }
  }
);
articlesRouter.delete(
  "/:articleId/comments/:commentsId",
  async (req, res, next) => {
    try {
      const updatedArticle = await ArticlesModel.findByIdAndUpdate(
        req.params.articleId, // WHO
        { $pull: { comments: { _id: req.params.commentsId } } }, // HOW
        { new: true, runValidators: true } // OPTIONS
      );

      if (updatedArticle) {
        res.send(updatedArticle);
      } else {
        createHttpError(
          404,
          `Article with id ${req.params.commentsId} not found!`
        );
      }
    } catch (error) {
      next(error);
    }
  }
);
export default articlesRouter;
