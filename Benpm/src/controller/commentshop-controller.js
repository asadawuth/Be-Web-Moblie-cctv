const createError = require("../middleware/error.js");
const prisma = require("../model/prisma.js");
const fs = require("fs");
const path = require("path");

exports.createCommentShop = async (req, res, next) => {
  try {
    const { datashopId } = req.params;
    const userId = req.user?.id;
    const { comment, score } = req.body;

    if (!datashopId) {
      return next(createError("DataShop ID is Required"), 400);
    }
    if (!userId) {
      return next(createError("User ID is Required"), 400);
    }

    const images =
      req.files && req.files.image
        ? req.files.image.map(
            (file) =>
              `${req.protocol}://${req.get("host")}/public/${file.filename}`
          )
        : [];

    const data = await prisma.commentshop.create({
      data: {
        comment: comment,
        score: Number(score),
        image: images.length > 0 ? images.join(",") : null,
        userId: userId,
        datashopId: Number(datashopId),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
          },
        },
      },
    });

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
};

exports.editsDataCommentId = async (req, res, next) => {
  try {
    const { datashopId, commentId } = req.params;
    const userId = req.user?.id;
    if (!req.body) {
      return next(createError("Request body is missing", 400));
    }

    const { comment = null, score = null } = req.body;
    const image = req.body?.image || null;

    if (!datashopId || !commentId) {
      return next(createError("DatashopId or CommentId are required", 400));
    }
    if (!userId) {
      return next(createError("UserId is required", 400));
    }

    const editComment = await prisma.commentshop.findFirst({
      where: {
        id: parseInt(commentId),
        datashopId: parseInt(datashopId),
        userId: userId,
      },
    });

    if (!editComment) {
      return next(createError("Comment not Found or Unauthorized", 404));
    }

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

    if (req.files?.image) {
      newImages.forEach(deleteFile);
      newImages = req.files.image.map(
        (file) => `${req.protocol}://${req.get("host")}/public/${file.filename}`
      );
    } else if (image === "null") {
      newImages.forEach(deleteFile);
      newImages = [];
    }

    const updatedCommentInShopId = await prisma.commentshop.update({
      where: { id: parseInt(commentId) },
      data: {
        comment: comment || editComment.comment || null,
        score: score !== null ? Number(score) : editComment.score,
        image: newImages.length > 0 ? newImages.join(",") : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
          },
        },
      },
    });

    res.status(200).json({
      data: updatedCommentInShopId,
    });
  } catch (error) {
    console.error("Error in editsDataCommentId:", error);
    next(error);
  }
};

exports.dataRanderFontendBeforeEdits = async (req, res, next) => {
  try {
    const { datashopId, commentId } = req.params;
    const userId = req.user?.id;

    if (!datashopId || !commentId) {
      return next(createError("ShopId and CommentId are required", 400));
    }
    if (!userId) {
      return next(createError("User ID is required", 400));
    }

    const dataCommentInShopId = await prisma.commentshop.findFirst({
      where: {
        id: parseInt(commentId),
        datashopId: parseInt(datashopId),
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
          },
        },
      },
    });

    if (!dataCommentInShopId) {
      return next(createError("Comment not found", 404));
    }

    res.status(200).json(dataCommentInShopId);
  } catch (error) {
    next(error);
  }
};
exports.dataCommentInShopId = async (req, res, next) => {
  try {
    const { datashopId } = req.params;
    const userId = req.user?.id;

    if (!datashopId) {
      return next(createError("DataShop Id is Required", 400));
    }
    if (!userId) {
      return next(createError("User Id is Required", 400));
    }

    const data = await prisma.commentshop.findMany({
      where: {
        datashopId: Number(datashopId),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
};

exports.deleteIdComment = async (req, res, next) => {
  try {
    const { datashopId, commentId } = req.params;
    const userId = req.user?.id;

    if (!datashopId || !commentId) {
      return next(createError("DatashopId or CommentId are required", 400));
    }

    if (!userId) {
      return next(createError("User Id is required", 400));
    }

    const comment = await prisma.commentshop.findFirst({
      where: {
        id: parseInt(commentId),
        datashopId: parseInt(datashopId),
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

    await prisma.commentshop.delete({
      where: {
        id: parseInt(commentId),
      },
    });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error in deleteIdComment:", error);
    next(error);
  }
};
