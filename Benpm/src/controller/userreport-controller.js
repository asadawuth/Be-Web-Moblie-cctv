const createError = require("../middleware/error.js");
const prisma = require("../model/prisma.js");
const fs = require("fs");
const path = require("path");
const {
  checkIdDataReportTitleSchema,
  findReportFormFirstNameLastName,
} = require("../validator/validator-userreport.js");

exports.createPostUserReport = async (req, res, next) => {
  try {
    const { texttitle, textstory, map } = req.body;

    if ((!texttitle || !texttitle.trim()) && !req.file) {
      return next(createError("texttitle is required", 400));
    }

    const images =
      req.files && req.files.image
        ? req.files.image.map(
            (file) =>
              `${req.protocol}://${req.get("host")}/public/${file.filename}`
          )
        : [];

    const videoUrl =
      req.files && req.files.video && req.files.video[0]
        ? `${req.protocol}://${req.get("host")}/public/${
            req.files.video[0].filename
          }`
        : null;

    const newPost = await prisma.postuserreport.create({
      data: {
        userId: req.user.id,
        texttitle: texttitle,
        textstory: textstory || null,
        image: images.length > 0 ? images.join(",") : null,
        map: map || null,
        vdo: videoUrl || null,
        status: "แจ้ง",
      },
      include: {
        user: true,
      },
    });

    try {
      if (req.io) {
        req.io.emit("newPost", {
          message: `มีโพสต์ใหม่: ${newPost.texttitle}`,
          postId: newPost.id,
        });
      } else {
        console.warn("Socket.IO is not initialized for this request");
      }
    } catch (ioError) {
      console.error("Socket.IO error:", ioError);
    }

    const responseData = {
      id: newPost.id,
      texttitle: newPost.texttitle,
      textstory: newPost.textstory,
      images: newPost.image ? newPost.image.split(",") : [],
      map: newPost.map,
      video: newPost.vdo,
      status: newPost.status,
      createdAt: newPost.createdAt,
      user: {
        id: newPost.user.id,
        firstName: newPost.user.firstName,
        lastName: newPost.user.lastName,
        // email: newPost.user.email,
        // phone: newPost.user.phone,
        profile: newPost.user.profile,
      },
    };
    res.status(200).json({
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

exports.reportListPagination = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 10;
    const _page = parseInt(req.query._page) || 1;
    const skip = (_page - 1) * _limit;

    const [dataAllReport, totalCount] = await prisma.$transaction([
      prisma.postuserreport.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profile: true,
            },
          },
          _count: {
            select: {
              commentinpostuserreport: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: _limit,
      }),
      prisma.postuserreport.count(),
    ]);

    const reportList = dataAllReport.map((report) => {
      const { createdAt, updatedAt, ...rest } = report;

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return { ...rest, createdAt, updatedAt, ...displayTime };
    });

    const totalPages = Math.ceil(totalCount / _limit);

    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      totalPages,
      reportList,
    });
  } catch (error) {
    next(error);
  }
};

exports.allDataReportInSideBoard = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataReportTitleSchema.validate(req.params);
    if (error) {
      return next(createError("UserReportId invalid"), 400);
    }

    const dataUserReportId = await prisma.postuserreport.findFirst({
      where: {
        id: parseInt(value.reportId),
      },
      include: {
        user: true,
      },
    });

    if (!dataUserReportId) {
      return next(createError("User Report Id not Found"), 400);
    }

    const { user, ...reportData } = dataUserReportId;
    if (user) {
      delete user.password;
      delete user.phone;
      delete user.email;
      delete user.status;
    }

    const response = {
      ...reportData,
      ...user,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

exports.personPostData = async (req, res, next) => {
  try {
    const { value, error } = findReportFormFirstNameLastName.validate(
      req.params
    );
    if (error) {
      return next(createError("Invalid input parameters.", 400));
    }

    const { first_name, last_name } = value;

    const dataPersonPost = await prisma.postuserreport.findMany({
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
            profile: true,
          },
        },
        _count: {
          select: {
            commentinpostuserreport: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!dataPersonPost || dataPersonPost.length === 0) {
      return next(createError("Data not found.", 404));
    }

    const reportList = dataPersonPost.map((report) => {
      const { createdAt, updatedAt, ...rest } = report;

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 1000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return { ...rest, createdAt, updatedAt, ...displayTime };
    });

    res.status(200).json(reportList); // ส่งเป็น array ตรง ๆ
  } catch (error) {
    console.error("Error:", error);
    next(createError("An error occurred.", 500));
  }
};

exports.changeStatusReport = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataReportTitleSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid report ID", 400));
    }

    const reportToChangeStatus = await prisma.postuserreport.findFirst({
      where: { id: parseInt(value.reportId) },
    });

    if (!reportToChangeStatus) {
      return next(createError("Report ID not found", 404));
    }

    const { status } = req.body;

    const validStatuses = [
      "แจ้ง",
      "รับแจ้งแล้ว",
      "กำลังดำเนินการ",
      "จัดการเสร็จสิ้น",
      "ยกเลิก",
    ];
    if (!validStatuses.includes(status)) {
      return next(createError("Invalid status value", 400));
    }

    const updatedReport = await prisma.postuserreport.update({
      where: { id: parseInt(value.reportId) },
      data: { status },
    });

    res.status(200).json({
      data: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};

exports.changeDataIdUsereport = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataReportTitleSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid report ID", 400));
    }

    const reportToUpdate = await prisma.postuserreport.findFirst({
      where: { id: parseInt(value.reportId) },
    });

    if (!reportToUpdate) {
      return next(createError("Report ID not found", 404));
    }

    const deleteFile = (fileUrl) => {
      if (!fileUrl) return; // ป้องกัน null หรือ undefined
      const filePath = path.join(
        __dirname,
        "../../public",
        path.basename(fileUrl.trim())
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    if (req.files) {
      if (req.files.image && reportToUpdate.image) {
        reportToUpdate.image.split(",").forEach(deleteFile);
      }
      if (req.files.video && reportToUpdate.vdo) {
        deleteFile(reportToUpdate.vdo);
      }
    }

    const newImages =
      req.files?.image?.map(
        (file) => `${req.protocol}://${req.get("host")}/public/${file.filename}`
      ) || (reportToUpdate.image ? reportToUpdate.image.split(",") : []); // ตรวจสอบ null

    const newVideo =
      req.files?.video?.[0] &&
      `${req.protocol}://${req.get("host")}/public/${
        req.files.video[0].filename
      }`;

    const updatedReport = await prisma.postuserreport.update({
      where: { id: parseInt(value.reportId) },
      data: {
        texttitle: req.body.texttitle || reportToUpdate.texttitle,
        textstory: req.body.textstory || reportToUpdate.textstory,
        map: req.body.map || reportToUpdate.map,
        image: newImages.join(","),
        vdo: newVideo || reportToUpdate.vdo,
      },
    });

    res.status(200).json({
      message: "Report updated successfully",
      data: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUserReportId = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataReportTitleSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid report ID", 400));
    }

    const reportToDelete = await prisma.postuserreport.findFirst({
      where: { id: parseInt(value.reportId) },
    });
    if (!reportToDelete) {
      return next(createError("ReportId not Found", 404));
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

    const relatedComments = await prisma.commentinpostuserreport.findMany({
      where: { reportId: parseInt(value.reportId) },
    });
    console.log("Related comments to delete:", relatedComments);

    relatedComments.forEach((comment) => {
      if (comment.image) {
        const imageUrls = comment.image.split(",");
        console.log("Images to delete:", imageUrls);
        imageUrls.forEach((imageUrl) => deleteFile(imageUrl.trim()));
      } else {
        console.log("No images found for this comment.");
      }

      if (comment.vdo) {
        console.log("Video to delete:", comment.vdo);
        deleteFile(comment.vdo.trim());
      } else {
        console.log("No video found for this comment.");
      }
    });

    await prisma.commentinpostuserreport.deleteMany({
      where: { reportId: parseInt(value.reportId) },
    });

    if (reportToDelete.image) {
      const imageUrls = reportToDelete.image.split(",");
      console.log("Postuserreport images to delete:", imageUrls);
      imageUrls.forEach((imageUrl) => deleteFile(imageUrl.trim()));
    } else {
      console.log("No images found in postuserreport.");
    }

    if (reportToDelete.vdo) {
      console.log("Postuserreport video to delete:", reportToDelete.vdo);
      deleteFile(reportToDelete.vdo.trim());
    } else {
      console.log("No video found in postuserreport.");
    }

    await prisma.postuserreport.delete({
      where: { id: parseInt(value.reportId) },
    });

    res.status(200).json({
      message: "Report, associated comments, and files deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUserReportId:", error);
    if (error.code === "P2025") {
      return next(createError("Report not found", 404));
    }
    next(error);
  }
};

exports.countAllStatusReport = async (req, res, next) => {
  try {
    const countStatus1 = await prisma.postuserreport.count({
      where: { status: "แจ้ง" },
    });

    const countStatus2 = await prisma.postuserreport.count({
      where: { status: "รับแจ้งแล้ว" },
    });

    const countStatus3 = await prisma.postuserreport.count({
      where: { status: "กำลังดำเนินการ" },
    });

    const countStatus4 = await prisma.postuserreport.count({
      where: { status: "จัดการเสร็จสิ้น" },
    });

    const countStatus5 = await prisma.postuserreport.count({
      where: { status: "ยกเลิก" },
    });
    const allStatus = await prisma.postuserreport.count();
    const result = {
      reported: countStatus1,
      acknowledged: countStatus2,
      inProgress: countStatus3,
      completed: countStatus4,
      canceled: countStatus5,
      allStatus: allStatus,
    };
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error); // ส่งข้อผิดพลาดไปยัง middleware ถัดไป
  }
};

exports.dataReportedOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 10;
    const _page = parseInt(req.query._page) || 1;
    const skip = (_page - 1) * _limit;

    // ใช้ Prisma Transaction เพื่อดึงข้อมูลและนับจำนวนในคำสั่งเดียว
    const [dataAllReport, totalCount] = await prisma.$transaction([
      prisma.postuserreport.findMany({
        where: { status: "แจ้ง" }, // เฉพาะสถานะ "แจ้ง"
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profile: true,
            },
          },
          _count: {
            select: {
              commentinpostuserreport: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }], // เรียงตาม createdAt ล่าสุดไปเก่าสุด
        skip,
        take: _limit, // Pagination
      }),
      prisma.postuserreport.count({
        where: { status: "แจ้ง" }, // นับจำนวนเฉพาะสถานะ "แจ้ง"
      }),
    ]);

    // Map ข้อมูลสำหรับการแสดงผล
    const reportList = dataAllReport.map((report) => {
      const { createdAt, updatedAt, ...rest } = report;

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 1000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return { ...rest, createdAt, updatedAt, ...displayTime }; // โคลนข้อมูลพร้อม displayTime
    });

    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalCount / _limit);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    res.status(200).json({
      pages,
      totalPages,
      reportList,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.dataAcknowledgedOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 10;
    const _page = parseInt(req.query._page) || 1;
    const skip = (_page - 1) * _limit;

    const [dataAllReport, totalCount] = await prisma.$transaction([
      prisma.postuserreport.findMany({
        where: { status: "รับแจ้งแล้ว" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profile: true,
            },
          },
          _count: {
            select: {
              commentinpostuserreport: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: _limit,
      }),
      prisma.postuserreport.count({
        where: { status: "รับแจ้งแล้ว" },
      }),
    ]);

    const reportList = dataAllReport.map((report) => {
      const { createdAt, updatedAt, ...rest } = report;

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return { ...rest, createdAt, updatedAt, ...displayTime }; // โคลนข้อมูลพร้อม displayTime
    });

    const totalPages = Math.ceil(totalCount / _limit);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    res.status(200).json({
      pages,
      totalPages,
      reportList,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.dataInProgressOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 10;
    const _page = parseInt(req.query._page) || 1;
    const skip = (_page - 1) * _limit;

    const [dataAllReport, totalCount] = await prisma.$transaction([
      prisma.postuserreport.findMany({
        where: { status: "กำลังดำเนินการ" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profile: true,
            },
          },
          _count: {
            select: {
              commentinpostuserreport: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: _limit,
      }),
      prisma.postuserreport.count({
        where: { status: "กำลังดำเนินการ" },
      }),
    ]);

    const reportList = dataAllReport.map((report) => {
      const { createdAt, updatedAt, ...rest } = report;

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return { ...rest, createdAt, updatedAt, ...displayTime };
    });

    const totalPages = Math.ceil(totalCount / _limit);

    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      totalPages,
      reportList,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.dataCompletedOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 10;
    const _page = parseInt(req.query._page) || 1;
    const skip = (_page - 1) * _limit;

    const [dataAllReport, totalCount] = await prisma.$transaction([
      prisma.postuserreport.findMany({
        where: { status: "จัดการเสร็จสิ้น" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profile: true,
            },
          },
          _count: {
            select: {
              commentinpostuserreport: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: _limit,
      }),
      prisma.postuserreport.count({
        where: { status: "จัดการเสร็จสิ้น" },
      }),
    ]);

    const reportList = dataAllReport.map((report) => {
      const { createdAt, updatedAt, ...rest } = report;

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return { ...rest, createdAt, updatedAt, ...displayTime };
    });

    const totalPages = Math.ceil(totalCount / _limit);

    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      totalPages,
      reportList,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.dataCanceledOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 10;
    const _page = parseInt(req.query._page) || 1;
    const skip = (_page - 1) * _limit;

    const [dataAllReport, totalCount] = await prisma.$transaction([
      prisma.postuserreport.findMany({
        where: { status: "ยกเลิก" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profile: true,
            },
          },
          _count: {
            select: {
              commentinpostuserreport: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: _limit,
      }),
      prisma.postuserreport.count({
        where: { status: "ยกเลิก" },
      }),
    ]);

    const reportList = dataAllReport.map((report) => {
      const { createdAt, updatedAt, ...rest } = report;

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return { ...rest, createdAt, updatedAt, ...displayTime };
    });

    const totalPages = Math.ceil(totalCount / _limit);

    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      totalPages,
      reportList,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
