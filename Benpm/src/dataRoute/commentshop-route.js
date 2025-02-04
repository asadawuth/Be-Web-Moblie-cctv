const express = require("express");
const router = express.Router();
const { authenticated } = require("../middleware/auth");
const uploadMiddleware = require("../middleware/upload");
const commentController = require("../controller/commentshop-controller");

router.post(
  "/createcomment/:datashopId",
  authenticated,
  uploadMiddleware.fields([{ name: "image", maxCount: 6 }]),
  commentController.createCommentShop
);

router.patch(
  "/editsdatacommentid/:datashopId/:commentId",
  authenticated,
  uploadMiddleware.fields([{ name: "image", maxCount: 6 }]),
  commentController.editsDataCommentId
);

router.get(
  "/datacommentinshopid/:datashopId/:commentId",
  authenticated,
  commentController.dataRanderFontendBeforeEdits
);

router.get(
  "/datalistinshopid/:datashopId",
  authenticated,
  commentController.dataCommentInShopId
);

router.delete(
  "/deletecommentid/:datashopId/:commentId",
  authenticated,
  commentController.deleteIdComment
);

module.exports = router;
