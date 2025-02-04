const express = require("express");
const router = express.Router();
const { authenticated } = require("../middleware/auth");
const uploadMiddleware = require("../middleware/upload");
const requestWatchcctvController = require("../controller/requestwatchcctv-controller");

router.post(
  "/createrrequestwatchcctv",
  authenticated,
  uploadMiddleware.single("image"),
  requestWatchcctvController.createRequestWatchcctv
);
router.patch(
  "/editdatadocumentsforrequestwatchcctv/:requestId",
  authenticated,
  uploadMiddleware.single("image"),
  requestWatchcctvController.changeDocumentRequestWatchcctv
);

router.patch(
  "/changestatusrequestwatchcctv/:requestId",
  authenticated,
  requestWatchcctvController.updateStatusRequest
);

router.patch(
  "/sendtextcassdocumentnotpass/:requestId",
  authenticated,
  requestWatchcctvController.sendMessageCassNotpass
);

router.get(
  "/listpaginationquestcctv",
  authenticated,
  requestWatchcctvController.dataListNotpassAndSenddocument
);

router.get(
  "/datapersonrequest/:firstName/:lastName",
  authenticated,
  requestWatchcctvController.dataNameRequest
);

router.get(
  "/listpass",
  authenticated,
  requestWatchcctvController.dataListPassOnly
);
router.get(
  "/listnotpass",
  authenticated,
  requestWatchcctvController.dataListNotpassOnly
);
router.get(
  "/listsenddocument",
  authenticated,
  requestWatchcctvController.dataListSenddocumentOnly
);

router.get(
  "/datapersonrequestcassonly/:firstName/:lastName",
  authenticated,
  requestWatchcctvController.dataPersonCassPass
);

router.get(
  "/datatotalandcountallstatus",
  authenticated,
  requestWatchcctvController.totalAllData
);

router.get(
  "/datapassonly/:firstName/:lastName",
  authenticated,
  requestWatchcctvController.dataPersonPassOnly
);

module.exports = router;
