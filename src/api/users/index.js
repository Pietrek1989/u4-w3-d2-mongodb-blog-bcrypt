import Express from "express";
import uniqid from "uniqid";

import { getAuthors, writeAuthors } from "../../lib/fs-tools.js";
import createHttpError from "http-errors";

const authorsRouter = Express.Router();

authorsRouter.post("/", async (request, response, next) => {
  try {
    const authorsArray = await getAuthors();
    const newAuthor = {
      ...request.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: uniqid(),
    };
    const alreadyEmail = authorsArray.find(
      (author) => author.email === request.body.email
    );
    if (alreadyEmail) {
      response
        .status(400)
        .send("Email already exist, please pick different one");
      return;
    }
    authorsArray.push(newAuthor);
    await writeAuthors(authorsArray);

    response.status(201).send({ id: newAuthor.id });
  } catch (error) {
    next(error);
  }
});

authorsRouter.get("/", async (request, response, next) => {
  try {
    const authorsArray = await getAuthors();

    response.send(authorsArray);
  } catch (error) {
    next(error);
  }
});

authorsRouter.get("/:authorId", async (request, response, next) => {
  try {
    const authorsArray = await getAuthors();
    const author = authorsArray.find(
      (author) => author.id === request.params.authorId
    );
    if (author) {
      response.send(author);
    } else {
      next(
        createHttpError(
          404,
          `authorS with id ${request.params.authorId} not found!`
        )
      );
    }
    response.send(author);
  } catch (error) {
    next(error);
  }
});

authorsRouter.put("/:authorId", async (request, response, next) => {
  try {
    const authorsArray = await getAuthors();
    const index = authorsArray.findIndex(
      (author) => author.id === request.params.authorId
    );
    if (index !== -1) {
      const oldAuthor = authorsArray[index];
      const updatedAuthor = {
        ...oldAuthor,
        ...request.body,
        updatedAt: new Date(),
      };
      authorsArray[index] = updatedAuthor;
      await writeAuthors(authorsArray);
      response.send(updatedAuthor);
    } else {
      next(
        createHttpError(
          404,
          `author with id ${request.params.authorId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

authorsRouter.delete("/:authorId", async (request, response, next) => {
  try {
    const authorsArray = await getAuthors();
    const remainingAuthors = authorsArray.filter(
      (author) => author.id !== request.params.authorId
    );
    if (authorsArray.length !== remainingAuthors.length) {
      await writeAuthors(remainingAuthors);
      response.status(204).send();
    } else {
      next(
        createHttpError(
          404,
          `author with id ${request.params.authorId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

export default authorsRouter;
