import createHttpError from "http-errors";
import atob from "atob";
import AuthorsModel from "../../api/users/model.js";

export const basicAuthMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      next(
        createHttpError(
          401,
          "Please provide credentials in Authorization header"
        )
      );
    } else {
      const encodedCredentials = req.headers.authorization.replace(
        "Basic ",
        ""
      );

      const credentials = atob(encodedCredentials);

      const [name, password] = credentials.split(":");

      const author = await AuthorsModel.checkCredentials(name, password);

      if (author) {
        req.author = author;
        next();
      } else {
        next(createHttpError(401, "Credentials are not ok!"));
      }
    }
  } catch (error) {
    console.error(error);
    next(createHttpError(400, "Invalid Authorization header"));
    return;
  }
};
