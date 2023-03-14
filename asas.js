const articlesSchema = {
  title: {
    in: ["body"],
    isString: {
      errorMessage: "Title is a mandatory field and needs to be a string!",
    },
  },
  category: {
    in: ["body"],
    isString: {
      errorMessage: "Category is a mandatory field and needs to be a string!",
    },
  },
  cover: {
    in: ["body"],
    isString: {
      errorMessage:
        "Cover is a mandatory field and needs to be a link in string format!",
    },
  },
  readTime: {
    in: ["body"],
    isObject: {
      errorMessage:
        "Cover is a mandatory field and needs to be a link in string format!",
      value: {
        in: ["body"],
        isInt: {
          errorMessage:
            "time valueis a mandatory field and needs to be a link in string format!",
        },
      },
      unit: {
        in: ["body"],
        isString: {
          errorMessage:
            "unit is a mandatory field and needs to be a link in string format!",
        },
      },
    },
  },
  author: {
    in: ["body"],
    isObject: {
      errorMessage:
        "Cover is a mandatory field and needs to be a link in string format!",
      name: {
        in: ["body"],
        isString: {
          errorMessage:
            "author name is a mandatory field and needs to be a link in string format!",
        },
      },
      avatar: {
        in: ["body"],
        isString: {
          errorMessage:
            "avatar is a mandatory field and needs to be a link in string format!",
        },
      },
    },
  },
  content: {
    in: ["body"],
    isString: {
      errorMessage:
        "Content is a mandatory field and needs to be a link in string format!",
    },
  },
};
