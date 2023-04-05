import Express from "express";
import createHttpError from "http-errors";
import { checkArticlesSchema, triggerBadRequest } from "./validation.js";
import ArticlesModel from "./model.js";
import q2m from "query-to-mongo";
import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwt.js";

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

articlesRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const authorID = req.author._id;

    // Get the articles written by the author from the database
    const articlesByAuthor = await ArticlesModel.find({ author: authorID });
    let query = {};
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.title) {
      query.title = req.query.title;
    }

    const articles = await ArticlesModel.find(query, mongoQuery.options.fields)
      .populate({
        path: "author",
        select: "name",
      })
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort);
    const total = await ArticlesModel.countDocuments(query);

    res.send({
      links: mongoQuery.links("http://localhost:3001/articles", total),
      total,
      numberOfPages: Math.ceil(total / mongoQuery.options.limit),
      articles,
    });
  } catch (error) {
    next(error);
  }
});

articlesRouter.get("/:articleId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const article = await ArticlesModel.findById(req.params.articleId)
      .populate({ path: "author", select: "name avatar" })
      .populate({ path: "likes.authorId", select: "name avatar" });
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

articlesRouter.put("/:articleId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const article = await ArticlesModel.findById(req.params.articleId).populate(
      "author"
    );

    if (!article) {
      next(
        createHttpError(
          404,
          `Article with id ${req.params.articleId} not found!`
        )
      );
    }
    console.log("article", article.author._id, "req", req.author._id);
    if (
      article.author._id.toString() !== req.author._id.toString() &&
      req.author.role !== "admin"
    ) {
      next(createHttpError(403, "You are not authorized to edit this article"));
    }

    const updatedArticle = await ArticlesModel.findByIdAndUpdate(
      req.params.articleId,
      req.body,
      { new: true, runValidators: true }
    );

    if (updatedArticle) {
      res.send(updatedArticle);
    }
  } catch (error) {
    next(error);
  }
});

articlesRouter.delete(
  "/:articleId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const article = await ArticlesModel.findById(
        req.params.articleId
      ).populate("author");

      if (!article) {
        next(
          createHttpError(
            404,
            `Article with id ${req.params.articleId} not found!`
          )
        );
      }
      if (article.author._id.toString() !== req.author._id.toString()) {
        next(
          createHttpError(403, "You are not authorized to edit this article")
        );
      }

      const deletedArticle = await ArticlesModel.findByIdAndDelete(
        req.params.articleId
      );
      if (deletedArticle) {
        res.status(204).send();
      }
    } catch (error) {
      next(error);
    }
  }
);

// ----------------------------COMMENTS ENDPOINTS---------------------------------------
articlesRouter.post(
  "/:articleId/comments",
  JWTAuthMiddleware,
  async (req, res, next) => {
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
  }
);

articlesRouter.get(
  "/:articleId/comments",
  JWTAuthMiddleware,
  async (req, res, next) => {
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
  }
);

articlesRouter.get(
  "/:articleId/comments/:commentsId",
  JWTAuthMiddleware,
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
  JWTAuthMiddleware,
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
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const updatedArticle = await ArticlesModel.findByIdAndUpdate(
        req.params.articleId,
        { $pull: { comments: { _id: req.params.commentsId } } },
        { new: true, runValidators: true }
      );

      if (updatedArticle) {
        res.send(updatedArticle);
      } else {
        createHttpError(
          404,
          `Article with id ${req.params.articleId} not found!`
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

articlesRouter.post(
  "/:articleId/likes",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const likeToUpdate = await ArticlesModel.findById(req.params.articleId);
      if (!likeToUpdate) {
        return next(
          createHttpError(
            404,
            `Article with id ${req.params.articleId} not found!`
          )
        );
      }

      if (
        likeToUpdate.likes.some(
          (like) => like.authorId.toString() === req.body.likes
        )
      ) {
        const updatedArticle = await ArticlesModel.findByIdAndUpdate(
          req.params.articleId,
          // WHO
          { $pull: { likes: { authorId: req.body.likes } } },
          // HOW
          { new: true, runValidators: true }
        ); // OPTIONS
        if (updatedArticle) {
          res
            .status(201)
            .send({ updatedArticle, likes: updatedArticle.likes.length });
        }
      } else {
        const updatedArticle = await ArticlesModel.findByIdAndUpdate(
          req.params.articleId,
          // WHO
          { $push: { likes: { authorId: req.body.likes } } },
          // HOW
          { new: true, runValidators: true }
        ); // OPTIONS

        if (updatedArticle) {
          res
            .status(201)
            .send({ updatedArticle, likes: updatedArticle.likes.length });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
);
export default articlesRouter;
