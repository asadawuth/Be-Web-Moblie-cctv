const express = require("express");
const router = express.Router();
const sosVoiceController = require("../controller/sosvoice-controller");
const uploadMiddleware = require("../middleware/upload");
const { authenticated } = require("../middleware/auth");

router.post(
  "/createdidsosvoice",
  authenticated,
  uploadMiddleware.single("audioFile"),
  sosVoiceController.createidsos
);

router.patch(
  "/editsdataidsosvoice/:sosVoiceId",
  authenticated,
  uploadMiddleware.single("audioFile"),
  sosVoiceController.changeDataIdSosvoice
);

router.patch(
  "/updatestatusidsosvoice/:sosVoiceId",
  authenticated,
  sosVoiceController.updateStatusId
);

router.get(
  "/listalldatapaginationsosvoice",
  authenticated,
  sosVoiceController.allDataList
);

router.get(
  "/datapersonsospost/:firstName/:lastName",
  authenticated,
  sosVoiceController.datapersonPost
);

router.get(
  "/totalallstatussosvoice",
  authenticated,
  sosVoiceController.totalAllStatus
);

router.get(
  "/alldatasosvocierstatusequestonly",
  authenticated,
  sosVoiceController.allDataRequestOnly
);

router.get(
  "/alldatasosvoicestatusacknowledgedonly",
  authenticated,
  sosVoiceController.allDataAcknowledgeOnly
);

router.get(
  "/alldatasosvoicestatusinprogress",
  authenticated,
  sosVoiceController.allDataInprogressOnly
);

router.get(
  "/alldatasosvicestatuscompleted",
  authenticated,
  sosVoiceController.allDataCompletedOnly
);

router.get(
  "/alldatasosviocestatuscanceled",
  authenticated,
  sosVoiceController.allDataCanceledOnly
);

module.exports = router;
