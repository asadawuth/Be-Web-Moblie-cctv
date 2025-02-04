const express = require("express");
const router = express.Router();
const { authenticated } = require("../middleware/auth");
const uploadMiddleware = require("../middleware/upload");
const shopController = require("../controller/shop-controller");

router.post(
  "/createshop",
  authenticated,
  uploadMiddleware.fields([{ name: "image", maxCount: 9 }]),
  shopController.createPostShop
);

router.patch(
  "/editshop/:datashopId",
  authenticated,
  uploadMiddleware.fields([{ name: "image", maxCount: 9 }]),
  shopController.editsPostShop
);

router.get("/shoplist", authenticated, shopController.shopListPatination);

router.get(
  "/datapersonshoppost/:first_name/:last_name",
  authenticated,
  shopController.personDataPostShop
);

router.patch(
  "/changestatusshopid/:datashopId",
  authenticated,
  shopController.changeStatusShopId
);

router.get(
  "/alldatausershopid/:datashopId",
  authenticated,
  shopController.allDataIdShop
);

router.delete(
  "/deletepostshopid/:datashopId",
  authenticated,
  shopController.deleteIdShop
);

router.get("/alltotalapprove", authenticated, shopController.totalApprove);

router.get("/datatshop", authenticated, shopController.dataShopOnly);

router.get("/datarestaurant", authenticated, shopController.dataRestaurentOnly);

router.get("/datarest", authenticated, shopController.dataRestOnly);

router.get("/datarentaplace", authenticated, shopController.dataRentAPlaceOnly);

router.get(
  "/datastatusdocuments",
  authenticated,
  shopController.dataSendDocumentOnly
);
router.get(
  "/datastatuschecking",
  authenticated,
  shopController.dataCheckingDocumentsOnly
);
router.get(
  "/datastatusadditional",
  authenticated,
  shopController.dataAdditionalDocumentOnly
);
router.get("/datastatussuccess", authenticated, shopController.dataSuccessOnly);
router.get(
  "/dataducumentnotpass",
  authenticated,
  shopController.dataDocumentNotPassOnly
);
router.get(
  "/datatotalallstatus",
  authenticated,
  shopController.dataTotalAllStatus
);

module.exports = router;
