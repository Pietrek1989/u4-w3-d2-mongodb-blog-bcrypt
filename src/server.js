import Express from "express";
import listEndpoints from "express-list-endpoints";
import articlesRouter from "./api/articles/index.js";
import authorsRouter from "./api/users/index.js";
import filesRouter from "./api/files/index.js";
import {
  genericErrorHandler,
  badRequestHandler,
  unauthorizedHandler,
  notfoundHandler,
  forbiddenErrorHandler,
} from "./errorsHandlers.js";
import cors from "cors";
import { join } from "path";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import googleStrategy from "./lib/auth/googleOauth.js";
import passport from "passport";

const server = Express();
const port = process.env.PORT;

passport.use("google", googleStrategy);

const publicFolderPath = join(process.cwd(), "./public");
const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];
server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        corsNext(null, true);
      } else {
        corsNext(
          createHttpError(
            400,
            `Origin ${currentOrigin} is not in the whitelist!`
          )
        );
      }
    },
  })
);

// server.use(Express.static(publicFolderPath));
server.use(Express.json());
server.use(passport.initialize());
server.use("/authors", authorsRouter);
server.use("/articles", articlesRouter);
server.use("/files", filesRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notfoundHandler);
server.use(genericErrorHandler);
server.use(forbiddenErrorHandler);
mongoose.connect(process.env.MONGO_URL);
mongoose.connection.on("connected", () => {
  console.log("✅ Successfully connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port ${port}`);
  });
});
