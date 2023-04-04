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
      console.log("encodedCredentials:", encodedCredentials); // add this line

      const credentials = atob(encodedCredentials);
      console.log("credentials:", credentials); // add this line

      const [name, password] = credentials.split(":");
      console.log("name:", name, "password:", password); // add this line

      const author = await AuthorsModel.checkCredentials(name, password);

      if (author) {
        // 5.a If credentials are ok --> you can go on (next)
        req.author = author;
        next();
      } else {
        // 5.b If credentials are NOT ok --> 401
        next(createHttpError(401, "Credentials are not ok!"));
      }
    }
  } catch (error) {
    console.error(error);
    next(createHttpError(400, "Invalid Authorization header"));
    return;
  }
};
