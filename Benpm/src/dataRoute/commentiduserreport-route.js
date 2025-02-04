const express = require("express");
const router = express.Router();
const { authenticated } = require("../middleware/auth");
const uploadMiddleware = require("../middleware/upload");
const commentReportController = require("../controller/commentiduserreport-controller");

router.post(
  "/commentinreportid/:reportId",
  authenticated,
  uploadMiddleware.fields([
    { name: "image", maxCount: 3 },
    { name: "video", maxCount: 1 },
  ]),
  commentReportController.createCommentInReportId
);

router.get(
  "/datalistincommentreportid/:reportId",
  authenticated,
  commentReportController.dataCommentInReportId
);

router.get(
  "/datacommentinreportid/:reportId/:commentId",
  authenticated,
  commentReportController.getDataCommentIdInReportInReportUserId
);

router.patch(
  "/editscommentinreportid/:reportId/:commentId",
  authenticated,
  uploadMiddleware.fields([
    { name: "image", maxCount: 3 },
    { name: "video", maxCount: 1 },
  ]),
  commentReportController.editCommentInReportId
);

router.delete(
  "/deletecommentinuserreportid/:reportId/:commentId",
  authenticated,
  commentReportController.deleteCommentInReportId
);

module.exports = router;
