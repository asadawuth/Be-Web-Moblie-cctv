const createError = require("../middleware/error.js");
const prisma = require("../model/prisma.js");
const fs = require("fs");
const path = require("path");
const {
  findShopFormFirstNameLastName,
  checkIdDataShopSchema,
} = require("../validator/validator-shop.js");

exports.createPostShop = async (req, res, next) => {
  try {
    const { name, address, phone, category, details, latitude, longtitude } =
      req.body;

    if (
      !name ||
      !address ||
      !phone ||
      !category ||
      !details ||
      !latitude ||
      !longtitude
    ) {
      return next(createError("Missing required fields", 400));
    }

    const images =
      req.files && req.files.image
        ? req.files.image.map(
            (file) =>
              `${req.protocol}://${req.get("host")}/public/${file.filename}`
          )
        : [];

    if (images.length <= 0) {
      return next(createError("At least one image is required", 400));
    }

    const newPost = await prisma.datashop.create({
      data: {
        name,
        address,
        phone,
        category,
        details,
        image: images.join(","),
        latitude: latitude,
        longtitude: longtitude,
        status: "ส่งเรื่องแล้ว",
        userId: req.user.id,
      },
    });

    // io
    try {
      if (req.io) {
        req.io.emit("newShopRequest", {
          message: `ร้านค้าใหม่: ${newPost.name}`,
          postId: newPost.id,
        });
      } else {
        console.warn("Socket.IO is not initialized for this request");
      }
    } catch (ioError) {
      console.error("Socket.IO error:", ioError);
    }

    res.status(200).json(newPost);
  } catch (error) {
    console.error("Error creating shop post:", error);
    next(error);
  }
};

exports.editsPostShop = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataShopSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid shop Id", 400));
    }

    const shopIdToUpdate = await prisma.datashop.findFirst({
      where: { id: parseInt(value.datashopId) },
    });

    if (!shopIdToUpdate) {
      return next(createError("ShopId not found", 404));
    }

    if (req.user.id !== shopIdToUpdate.userId) {
      return next(
        createError("Permission denied: You cannot edit this shop", 403)
      );
    }

    const deleteFile = (fileUrl) => {
      const filePath = path.join(
        __dirname,
        "../../public",
        path.basename(fileUrl.trim())
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    if (req.files?.image && shopIdToUpdate.image) {
      shopIdToUpdate.image.split(",").forEach(deleteFile);
    }

    const newImages =
      req.files?.image?.map(
        (file) => `${req.protocol}://${req.get("host")}/public/${file.filename}`
      ) || shopIdToUpdate.image.split(",");

    const updatedShop = await prisma.datashop.update({
      where: { id: parseInt(value.datashopId) },
      data: {
        name: req.body.name || shopIdToUpdate.name,
        address: req.body.address || shopIdToUpdate.address,
        phone: req.body.phone || shopIdToUpdate.phone,
        category: req.body.category || shopIdToUpdate.category,
        details: req.body.details || shopIdToUpdate.details,
        image: newImages.join(","),
        latitude: req.body.latitude || shopIdToUpdate.latitude,
        longtitude: req.body.longtitude || shopIdToUpdate.longtitude,
        userId: req.user.id,
      },
    });

    res.status(200).json({
      message: "Shop updated successfully",
      data: updatedShop,
    });
  } catch (error) {
    next(error);
  }
};

exports.shopListPatination = async (req, res, next) => {
  try {
    const dataAllShop = await prisma.datashop.findMany({
      include: {
        _count: {
          select: {
            commentshop: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const deepCopyData = JSON.parse(JSON.stringify(dataAllShop));

    const sanitizedData = deepCopyData.map((shop) => {
      const { details, ...rest } = shop;
      return rest;
    });

    const _limit = 8;
    const { _page } = req.query;
    const start = (_page - 1) * _limit;
    const end = start + _limit;

    const shopList = sanitizedData.slice(start, end);
    const totalPages = Math.ceil(sanitizedData.length / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList });
  } catch (error) {
    console.error("Error fetching shop data:", error);
    next(error);
  }
};

exports.personDataPostShop = async (req, res, next) => {
  try {
    const { value, error } = findShopFormFirstNameLastName.validate(req.params);
    if (error) {
      return next(error);
    }

    const { first_name, last_name } = value;

    const dataPersonPostShop = await prisma.datashop.findMany({
      where: {
        user: {
          firstName: first_name,
          lastName: last_name,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            commentshop: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!dataPersonPostShop || dataPersonPostShop.length === 0) {
      return next(createError("DataPersonPost Shop not found", 400));
    }

    res.status(200).json(dataPersonPostShop);
  } catch (error) {
    console.log(error);
    next(createError("An error occurred.", 500));
  }
};

exports.changeStatusShopId = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataShopSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid status Id", 400));
    }

    const shopIdTochangeStatus = await prisma.datashop.findFirst({
      where: { id: parseInt(value.datashopId) },
    });

    if (!shopIdTochangeStatus) {
      return next(createError("ShopId ID Not Found", 404));
    }

    const { status } = req.body;

    const validateStatus = [
      "ส่งเรื่องแล้ว",
      "กำลังเช็คเอกสาร",
      "ขอเอกสารเพิ่ม",
      "สำเสร็จ",
      "ไม่ผ่าน",
    ];

    if (!validateStatus.includes(status)) {
      return next(createError("Invalid status", 400));
    }

    const updatedStatusShopId = await prisma.datashop.update({
      where: { id: parseInt(value.datashopId) },
      data: { status },
    });

    res.status(200).json({
      data: updatedStatusShopId,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.allDataIdShop = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataShopSchema.validate(req.params);
    if (error) {
      return next(createError("UserShopId invalid"), 400);
    }

    const dataUserShopId = await prisma.datashop.findFirst({
      where: {
        id: parseInt(value.datashopId),
      },
      include: {
        user: true,
      },
    });

    if (!dataUserShopId) {
      return next(createError("UserShopId not found"), 404);
    }
    const { user, ...shopData } = dataUserShopId;
    if (user) {
      delete user.password;
      delete user.phone;
      delete user.email;
      delete user.status;
    }

    const response = {
      ...user,
      ...shopData,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

exports.deleteIdShop = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataShopSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid shop ID", 400));
    }

    const shopIdDelete = await prisma.datashop.findFirst({
      where: { id: value.datashopId },
    });

    if (!shopIdDelete) {
      return next(createError("ShopId not found", 404));
    }

    const deleteFile = (fileUrl) => {
      try {
        const filePath = path.join(
          __dirname,
          "../../public",
          path.basename(fileUrl.trim())
        );
        console.log("Attempting to delete file:", filePath);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File deleted: ${filePath}`);
        } else {
          console.log(`File not found: ${filePath}`);
        }
      } catch (err) {
        console.error(`Error deleting file: ${fileUrl}`, err);
      }
    };

    // ลบไฟล์ใน commentshop
    const relatedComments = await prisma.commentshop.findMany({
      where: { datashopId: value.datashopId },
    });

    relatedComments.forEach((comment) => {
      if (comment.image) {
        const imageUrls = comment.image.split(",");
        console.log("Images to delete:", imageUrls);
        imageUrls.forEach((imageUrl) => deleteFile(imageUrl.trim()));
      } else {
        console.log("No images found for this comment.");
      }
    });

    await prisma.commentshop.deleteMany({
      where: { datashopId: parseInt(value.datashopId) },
    });

    // ลบไฟล์ใน datashop
    if (shopIdDelete.image) {
      const imageUrls = shopIdDelete.image.split(",");
      console.log("Shop images to delete:", imageUrls);
      imageUrls.forEach((imageUrl) => deleteFile(imageUrl.trim()));
    } else {
      console.log("No images found in shop.");
    }

    // ลบข้อมูลร้านค้า
    await prisma.datashop.delete({
      where: { id: value.datashopId },
    });

    res.status(200).json({
      message: "Deleted Shop and associated comments successfully",
    });
  } catch (error) {
    console.error("Error in deleteIdShop:", error);
    if (error.code === "P2025") {
      return next(createError("Shop not found", 404));
    }
    next(error);
  }
};

exports.totalApprove = async (req, res, next) => {
  try {
    const totalApprove = await prisma.datashop.count({
      where: { status: "สำเสร็จ" },
    });

    const totalPlace = await prisma.datashop.count({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "สถานที่" }],
      },
    });

    const totalRest = await prisma.datashop.count({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ที่พัก" }],
      },
    });

    const totalShop = await prisma.datashop.count({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ร้านค้า" }],
      },
    });

    const totalRestaurant = await prisma.datashop.count({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ร้านอาหาร" }],
      },
    });

    res.json({
      totalApprove,
      totalPlace,
      totalRest,
      totalShop,
      totalRestaurant,
    });
  } catch (error) {
    console.error("Error fetching shop data:", error);
    next(error);
  }
};

exports.dataShopOnly = async (req, res, next) => {
  try {
    const _limit = 8;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ร้านค้า" }],
      },
      include: {
        _count: {
          select: {
            commentshop: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const totalShops = await prisma.datashop.count({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ร้านค้า" }],
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList: dataAllShop });
  } catch (error) {
    next(error);
  }
};

exports.dataRestaurentOnly = async (req, res, next) => {
  try {
    const _limit = 8;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ร้านอาหาร" }],
      },
      include: {
        _count: {
          select: {
            commentshop: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const totalShops = await prisma.datashop.count({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ร้านอาหาร" }],
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList: dataAllShop });
  } catch (error) {
    next(error);
  }
};

exports.dataRestOnly = async (req, res, next) => {
  try {
    const _limit = 8;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "สถานที่" }],
      },
      include: {
        _count: {
          select: {
            commentshop: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const totalShops = await prisma.datashop.count({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "สถานที่" }],
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList: dataAllShop });
  } catch (error) {
    next(error);
  }
};

exports.dataRentAPlaceOnly = async (req, res, next) => {
  try {
    const _limit = 8;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ที่พัก" }],
      },
      include: {
        _count: {
          select: {
            commentshop: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const totalShops = await prisma.datashop.count({
      where: {
        AND: [{ status: "สำเสร็จ" }, { category: "ที่พัก" }],
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList: dataAllShop });
  } catch (error) {
    next(error);
  }
};

exports.dataSendDocumentOnly = async (req, res, next) => {
  try {
    const _limit = 12;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        status: "ส่งเรื่องแล้ว",
      },
      select: {
        id: true,
        name: true,
        status: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const shopList = dataAllShop.map((item, index) => ({
      ...item,
      rowNumber: start + index + 1,
    }));
    const totalShops = await prisma.datashop.count({
      where: {
        status: "ส่งเรื่องแล้ว",
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList });
  } catch (error) {
    next(error);
  }
};

exports.dataCheckingDocumentsOnly = async (req, res, next) => {
  try {
    const _limit = 12;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        status: "กำลังเช็คเอกสาร",
      },
      select: {
        id: true,
        name: true,
        status: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const shopList = dataAllShop.map((item, index) => ({
      ...item,
      rowNumber: start + index + 1,
    }));

    const totalShops = await prisma.datashop.count({
      where: {
        status: "กำลังเช็คเอกสาร",
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList });
  } catch (error) {
    next(error);
  }
};

exports.dataAdditionalDocumentOnly = async (req, res, next) => {
  try {
    const _limit = 12;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        status: "ขอเอกสารเพิ่ม",
      },
      select: {
        id: true,
        name: true,
        status: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const shopList = dataAllShop.map((item, index) => ({
      ...item,
      rowNumber: start + index + 1,
    }));

    const totalShops = await prisma.datashop.count({
      where: {
        status: "ขอเอกสารเพิ่ม",
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList });
  } catch (error) {
    next(error);
  }
};

exports.dataSuccessOnly = async (req, res, next) => {
  try {
    const _limit = 12;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        status: "สำเสร็จ",
      },
      select: {
        id: true,
        name: true,
        status: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const shopList = dataAllShop.map((item, index) => ({
      ...item,
      rowNumber: start + index + 1,
    }));

    const totalShops = await prisma.datashop.count({
      where: {
        status: "สำเสร็จ",
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList });
  } catch (error) {
    next(error);
  }
};

exports.dataDocumentNotPassOnly = async (req, res, next) => {
  try {
    const _limit = 12;
    const { _page } = req.query;
    const page = parseInt(_page) || 1;
    const start = (page - 1) * _limit;

    const dataAllShop = await prisma.datashop.findMany({
      where: {
        status: "ไม่ผ่าน",
      },
      select: {
        id: true,
        name: true,
        status: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: start,
      take: _limit,
    });

    const shopList = dataAllShop.map((item, index) => ({
      ...item,
      rowNumber: start + index + 1,
    }));

    const totalShops = await prisma.datashop.count({
      where: {
        status: "ไม่ผ่าน",
      },
    });

    const totalPages = Math.ceil(totalShops / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({ pages, totalPages, shopList });
  } catch (error) {
    next(error);
  }
};

exports.dataTotalAllStatus = async (req, res, next) => {
  try {
    const totalStatusDocuments = await prisma.datashop.count({
      where: {
        status: "ส่งเรื่องแล้ว",
      },
    });

    const totalStatusChecking = await prisma.datashop.count({
      where: {
        status: "กำลังเช็คเอกสาร",
      },
    });

    const totalStatusAdditional = await prisma.datashop.count({
      where: {
        status: "ขอเอกสารเพิ่ม",
      },
    });

    const totalStatusSuccess = await prisma.datashop.count({
      where: {
        status: "สำเสร็จ",
      },
    });

    const totalStatusNotPass = await prisma.datashop.count({
      where: {
        status: "ไม่ผ่าน",
      },
    });

    const totalAllStatus =
      totalStatusDocuments +
      totalStatusChecking +
      totalStatusAdditional +
      totalStatusSuccess +
      totalStatusNotPass;

    res.status(200).json({
      totalStatusDocuments,
      totalStatusChecking,
      totalStatusAdditional,
      totalStatusSuccess,
      totalStatusNotPass,
      totalAllStatus,
    });
  } catch (error) {
    next(error);
  }
};
