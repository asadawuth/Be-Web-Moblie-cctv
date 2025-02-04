const express = require("express");
const router = express.Router();
const reportController = require("../controller/userreport-controller");
const { authenticated } = require("../middleware/auth");
const uploadMiddleware = require("../middleware/upload");

router.post(
  "/reportpost",
  authenticated,
  uploadMiddleware.fields([
    { name: "image", maxCount: 9 },
    { name: "video", maxCount: 1 },
  ]),
  reportController.createPostUserReport
);

router.get(
  "/reportslist",
  authenticated,
  reportController.reportListPagination
);

router.get(
  "/AllDataInComment/:reportId",
  authenticated,
  reportController.allDataReportInSideBoard
);

router.get(
  "/datapersonpost/:first_name/:last_name",
  authenticated,
  reportController.personPostData
);

router.delete(
  "/deleteiduserreport/:reportId",
  authenticated,
  reportController.deleteUserReportId
);

router.patch(
  "/changestatusreport/:reportId",
  authenticated,
  reportController.changeStatusReport
);

router.patch(
  "/changedataidreport/:reportId",
  authenticated,
  uploadMiddleware.fields([
    { name: "image", maxCount: 9 },
    { name: "video", maxCount: 1 },
  ]),
  reportController.changeDataIdUsereport
);

router.get(
  "/countallstatusreport",
  authenticated,
  reportController.countAllStatusReport
);

router.get(
  "/userreporteddata",
  authenticated,
  reportController.dataReportedOnly
);

router.get(
  "/userreportstatusacknowledged",
  authenticated,
  reportController.dataAcknowledgedOnly
);

router.get(
  "/userreportstatusinprogress",
  authenticated,
  reportController.dataInProgressOnly
);

router.get(
  "/userreportstatuscompleted",
  authenticated,
  reportController.dataCompletedOnly
);

router.get(
  "/userreportstatuscanceled",
  authenticated,
  reportController.dataCanceledOnly
);

module.exports = router;
