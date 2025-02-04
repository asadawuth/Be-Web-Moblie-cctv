const createError = require("../middleware/error.js");
const prisma = require("../model/prisma.js");
const fs = require("fs");
const path = require("path");

exports.createCommentInReportId = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.id;
    const { text } = req.body;

    if (!userId) {
      return next(createError("User ID is required"), 400);
    }
    if (!reportId) {
      return next(createError("Report ID is required"), 400);
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

    const dataIdUserReport = await prisma.postuserreport.findFirst({
      where: {
        id: Number(reportId),
      },
    });

    const data = await prisma.commentinpostuserreport.create({
      data: {
        userId: userId,
        text: text || null,
        image: images.length > 0 ? images.join(",") : null,
        vdo: videoUrl || null,
        status: dataIdUserReport.status,
        reportId: Number(reportId),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true || null,
            status: true,
          },
        },
      },
    });

    try {
      if (req.io) {
        req.io.emit("newComment", {
          message: `มีความคิดเห็นใหม่ในโพสต์: ${
            dataIdUserReport.texttitle || "ไม่มีหัวข้อ"
          }`,
          commentId: data.id,
        });
      } else {
        console.warn("Socket.IO is not initialized for this request");
      }
    } catch (ioError) {
      console.error("Socket.IO error:", ioError);
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
exports.dataCommentInReportId = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.id;

    if (!reportId) {
      return next(createError("Reports ID is required", 400));
    }

    if (!userId) {
      return next(createError("User ID is required", 400));
    }

    const data = await prisma.commentinpostuserreport.findMany({
      where: { reportId: parseInt(reportId) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
            status: true,
          },
        },
        postuserreport: {
          select: {
            status: true,
          },
        },
      },
    });

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
exports.getDataCommentIdInReportInReportUserId = async (req, res, next) => {
  try {
    const { reportId, commentId } = req.params;
    const userId = req.user?.id;

    if (!reportId || !commentId) {
      return next(createError("Report ID and Comment ID are required", 400));
    }
    if (!userId) {
      return next(createError("User ID is required", 400));
    }

    const dataCommentInReportIds =
      await prisma.commentinpostuserreport.findFirst({
        where: {
          id: parseInt(commentId),
          reportId: parseInt(reportId),
          userId: userId,
        },
        select: {
          id: true,
          text: true,
          image: true,
          vdo: true,
        },
      });

    if (!dataCommentInReportIds) {
      return next(createError("Comment not found", 404));
    }

    res.status(200).json(dataCommentInReportIds);
  } catch (error) {
    console.error(error);
    next(createError("Internal Server Error", 500));
  }
};
exports.editCommentInReportId = async (req, res, next) => {
  try {
    const { reportId, commentId } = req.params;
    const userId = req.user?.id;
    const { text, image, video } = req.body; // รับค่าจาก formData

    if (!reportId || !commentId) {
      return next(createError("Report ID or Comment ID are required", 400));
    }
    if (!userId) {
      return next(createError("User ID is required", 400));
    }

    console.log({ reportId, commentId, userId }); // Debug: ตรวจสอบค่าที่รับมา

    // ตรวจสอบคอมเมนต์ในฐานข้อมูล
    const editComment = await prisma.commentinpostuserreport.findFirst({
      where: {
        id: parseInt(commentId),
        reportId: parseInt(reportId),
        userId: userId,
      },
    });

    if (!editComment) {
      return next(createError("Comment not found or unauthorized", 404));
    }

    // ฟังก์ชันลบไฟล์
    const deleteFile = (fileUrl) => {
      if (fileUrl) {
        const filePath = path.join(
          __dirname,
          "../../public",
          path.basename(fileUrl.trim())
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    };

    let newImages = editComment.image ? editComment.image.split(",") : [];
    let newVideo = editComment.vdo || null;

    // ตรวจสอบการอัปโหลดรูปภาพใหม่
    if (req.files?.image) {
      newImages.forEach(deleteFile); // ลบไฟล์รูปภาพเก่า
      newImages = req.files.image.map(
        (file) => `${req.protocol}://${req.get("host")}/public/${file.filename}`
      );
    } else if (image === "null") {
      // หากผู้ใช้ต้องการลบรูปภาพทั้งหมด
      newImages.forEach(deleteFile);
      newImages = [];
    }

    // ตรวจสอบการอัปโหลดวิดีโอใหม่
    if (req.files?.video) {
      deleteFile(editComment.vdo); // ลบไฟล์วิดีโอเก่า
      newVideo = `${req.protocol}://${req.get("host")}/public/${
        req.files.video[0].filename
      }`;
    } else if (video === "null") {
      // หากผู้ใช้ต้องการลบวิดีโอ
      deleteFile(editComment.vdo);
      newVideo = null;
    }

    // อัปเดตคอมเมนต์ในฐานข้อมูล
    const updatedComment = await prisma.commentinpostuserreport.update({
      where: { id: parseInt(commentId) },
      data: {
        text: text || editComment.text || null,
        image: newImages.length > 0 ? newImages.join(",") : null,
        vdo: newVideo || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
            status: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    next(error);
  }
};
exports.deleteCommentInReportId = async (req, res, next) => {
  try {
    const { reportId, commentId } = req.params;
    const userId = req.user?.id;

    if (!reportId || !commentId) {
      return next(createError("Report ID are Comment ID are required", 400));
    }
    if (!userId) {
      return next(createError("User ID is required", 400));
    }

    const comment = await prisma.commentinpostuserreport.findFirst({
      where: {
        id: Number(commentId),
        reportId: Number(reportId),
        userId: userId,
      },
    });

    if (!comment) {
      return next(createError("Comment not found or unauthorized", 404));
    }

    const deleteFile = (fileUrl) => {
      const filePath = path.join(
        __dirname,
        "../../public",
        path.basename(fileUrl.trim())
      );
      console.log("Attempting to delete file:", filePath);

      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file ${filePath}:`, err);
          } else {
            console.log(`File deleted: ${filePath}`);
          }
        });
      } else {
        console.log(`File not found: ${filePath}`);
      }
    };

    if (comment.image) {
      const imageUrls = comment.image.split(",");
      imageUrls.forEach((imageUrl) => deleteFile(imageUrl.trim()));
    }
    if (comment.vdo) {
      deleteFile(comment.vdo.trim());
    }

    await prisma.commentinpostuserreport.delete({
      where: {
        id: Number(commentId),
      },
    });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};
