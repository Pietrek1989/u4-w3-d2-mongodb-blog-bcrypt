// import uniqid from "uniqid";
// import { getAuthors, writeAuthors } from "../../lib/fs-tools.js";
// import createHttpError from "http-errors";
import express from "express";
import createError from "http-errors";
import AuthorsModel from "./model.js";
import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import ArticlesModel from "../articles/model.js";
import { createAccessToken } from "../../lib/auth/tools.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwt.js";

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

authorsRouter.get("/:authorId", JWTAuthMiddleware, async (req, res, next) => {
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

authorsRouter.put("/:authorId", JWTAuthMiddleware, async (req, res, next) => {
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

authorsRouter.delete(
  "/:authorId",
  JWTAuthMiddleware,
  async (req, res, next) => {
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
  }
);

authorsRouter.get("/me/info", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const authorId = req.author._id;
    const author = await AuthorsModel.findById(authorId);

    res.send(author);
  } catch (error) {
    next(error);
  }
});
authorsRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const authorID = req.author._id;

    // Get the articles written by the author from the database
    const articlesByAuthor = await ArticlesModel.find({ author: authorID });

    // Return the articles in the response body
    res.send(articlesByAuthor);
  } catch (error) {
    next(error);
  }
});

authorsRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const author = await AuthorsModel.checkCredentials(email, password);

    if (author) {
      const payload = { _id: author._id, role: author.role };
      const accessToken = await createAccessToken(payload);

      res.send({ accessToken });
    } else {
      next(createError(401, "Credentials are not ok!"));
    }
  } catch (error) {
    next(error);
  }
});

authorsRouter.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingAuthor = await AuthorsModel.findOne({ email });
    if (existingAuthor) {
      return next(createError(409, "Email already in use"));
    }

    const newAuthor = await AuthorsModel.create({
      name,
      email,
      password,
      role,
    });
    await newAuthor.save();

    const payload = { _id: newAuthor._id, role: newAuthor.role };

    const accessToken = await createAccessToken(payload);

    res.send({ accessToken });
  } catch (error) {
    next(error);
  }
});

export default authorsRouter;
