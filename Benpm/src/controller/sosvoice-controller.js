const createError = require("../middleware/error.js");
const prisma = require("../model/prisma.js");
const fs = require("fs");
const path = require("path");
const {
  checkIdDataSosVoice,
  findSosVoiceFormFirstNameLastName,
} = require("../validator/validator-sosvoice.js");

exports.createidsos = async (req, res, next) => {
  try {
    // console.log("File:", req.file);
    // console.log("Body:", req.body);

    const userId = req.user?.id;
    const { latitude, longtitude } = req.body;

    if (!userId) return next(createError("User ID is required", 400));
    if (!latitude || !longtitude)
      return next(createError("Latitude and Longitude are required", 400));

    const file = req.file
      ? `${req.protocol}://${req.get("host")}/public/${req.file.filename}`
      : null;

    if (!file) return next(createError("File is required", 400));

    const dataIdSos = await prisma.sosvoiceorvdo.create({
      data: {
        userId,
        file,
        latitude,
        longtitude,
        status: "แจ้ง",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    try {
      if (req.io) {
        req.io.emit("newSos", {
          message: `แจ้ง ไอดี ${dataIdSos.status}`,
          dataIdSos: dataIdSos.id,
        });
      } else {
        console.warn("Socket.IO is not initialized for this request");
      }
    } catch (ioError) {
      console.error("Socket.IO error:", ioError);
    }

    res.status(200).json(dataIdSos);
  } catch (err) {
    console.error("Error creating SoS request:", err.message);
    next(err);
  }
};

exports.changeDataIdSosvoice = async (req, res, next) => {
  try {
    const { error, value } = checkIdDataSosVoice.validate(req.params);
    if (error) {
      return next(createError(400, "Invalid sos Id"));
    }

    const userId = req.user?.id;
    const { longtitude, latitude } = req.body;

    if (!userId) {
      return next(createError(400, "User Id is Required"));
    }
    const sosVoiceToUpdate = await prisma.sosvoiceorvdo.findFirst({
      where: { id: parseInt(value.sosVoiceId), userId: userId },
    });

    if (!sosVoiceToUpdate) {
      return next(createError(404, "No SOS data found for this user"));
    }

    const deleteFile = (fileUrl) => {
      if (!fileUrl) return;
      const filePath = path.join(
        __dirname,
        "../../public",
        path.basename(fileUrl)
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    let newFile;
    if (req.file) {
      if (sosVoiceToUpdate.file) {
        deleteFile(sosVoiceToUpdate.file);
      }
      newFile = `${req.protocol}://${req.get("host")}/public/${
        req.file.filename
      }`;
    } else {
      newFile = sosVoiceToUpdate.file;
    }

    const updatedData = await prisma.sosvoiceorvdo.update({
      where: { id: parseInt(value.sosVoiceId) },
      data: {
        file: newFile,
        latitude,
        longtitude,
      },
    });

    res.status(200).json({ updatedData });
  } catch (err) {
    next(err);
  }
};

exports.updateStatusId = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataSosVoice.validate(req.params);
    if (error) {
      return next(createError("Invalid sos Id"), 400);
    }
    const sosVoiceToChangeStatus = await prisma.sosvoiceorvdo.findFirst({
      where: { id: parseInt(value.sosVoiceId) },
    });
    if (!sosVoiceToChangeStatus) {
      return next(createError("SosVoiceId not found"), 404);
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
      return next(createError("Invalid status value"), 400);
    }
    const updatedStatus = await prisma.sosvoiceorvdo.update({
      where: { id: parseInt(value.sosVoiceId) },
      data: { status },
    });
    res.status(200).json({
      data: updatedStatus,
    });
  } catch (err) {
    next(err);
  }
};

exports.allDataList = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 16; //จำนวณข้อมูล
    const _page = parseInt(req.query._page) || 1; // หน้าปัจจุบัน
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น //ex 2-1 1*16 = 16 เริ่มต้น

    const dataList = await prisma.sosvoiceorvdo.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip, // เริ่มต้น
      take: _limit, // ไปอัก 16
    });

    const totalCount = await prisma.sosvoiceorvdo.count({}); // ex  17    17/16 = 1.133  => 2
    const totalPages = Math.ceil(totalCount / _limit); // ex  17    17/16 = 1.133  => 2
    const allData = dataList.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item; // destructuring  rest ค่าต่างๆเก็บเอาไว้

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: skip + index + 1,
      }; // ...rest ข้อมูลเดิม displayTime โคลนทับ
    });
    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1), //  ex 17 17/16 = 1.133 => 2  => map  1  2
      totalPages, // 1 0-16
      allData,
    });
  } catch (error) {
    next(error);
  }
};

exports.datapersonPost = async (req, res, next) => {
  try {
    const { value, error } = findSosVoiceFormFirstNameLastName.validate(
      req.params
    );
    if (error) {
      return next(createError("Invlid name", 400));
    }
    const { firstName, lastName } = value;

    const dataUser = await prisma.user.findFirst({
      where: {
        firstName: firstName,
        lastName: lastName,
      },
    });
    if (!dataUser) {
      return next(
        createError("Firstnameuser or Lastnameuser has a not found.", 400)
      );
    }
    const dataPresonSos = await prisma.sosvoiceorvdo.findMany({
      where: {
        userId: dataUser.id,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    const allDataPreson = dataPresonSos.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item;
      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };
      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: index + 1,
      };
    });

    res.status(200).json({ allDataPreson });
  } catch (error) {
    next(error);
  }
};

exports.totalAllStatus = async (req, res, next) => {
  try {
    const countStatus1 = await prisma.sosvoiceorvdo.count({
      where: { status: "แจ้ง" },
    });

    const countStatus2 = await prisma.sosvoiceorvdo.count({
      where: { status: "รับแจ้งแล้ว" },
    });

    const countStatus3 = await prisma.sosvoiceorvdo.count({
      where: { status: "กำลังดำเนินการ" },
    });

    const countStatus4 = await prisma.sosvoiceorvdo.count({
      where: { status: "จัดการเสร็จสิ้น" },
    });

    const countStatus5 = await prisma.sosvoiceorvdo.count({
      where: { status: "ยกเลิก" },
    });
    const allStatus = await prisma.sosvoiceorvdo.count();
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
    next(error);
  }
};

exports.allDataRequestOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 16; //จำนวณข้อมูล
    const _page = parseInt(req.query._page) || 1; // หน้าปัจจุบัน
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น //ex 2-1 1*16 = 16 เริ่มต้น

    const dataList = await prisma.sosvoiceorvdo.findMany({
      where: { status: "แจ้ง" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip, // เริ่มต้น
      take: _limit, // ไปอัก 16
    });

    const totalCount = await prisma.sosvoiceorvdo.count({
      where: { status: "แจ้ง" },
    }); // ex  17    17/16 = 1.133  => 2
    const totalPages = Math.ceil(totalCount / _limit); // ex  17    17/16 = 1.133  => 2
    const allData = dataList.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item; // destructuring  rest ค่าต่างๆเก็บเอาไว้

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: skip + index + 1,
      }; // ...rest ข้อมูลเดิม displayTime โคลนทับ
    });
    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1), //  ex 17 17/16 = 1.133 => 2  => map  1  2
      totalPages, // 1 0-16
      allData,
    });
  } catch (error) {
    next(error);
  }
};

exports.allDataAcknowledgeOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 16; //จำนวณข้อมูล
    const _page = parseInt(req.query._page) || 1; // หน้าปัจจุบัน
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น //ex 2-1 1*16 = 16 เริ่มต้น

    const dataList = await prisma.sosvoiceorvdo.findMany({
      where: { status: "รับแจ้งแล้ว" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip, // เริ่มต้น
      take: _limit, // ไปอัก 16
    });

    const totalCount = await prisma.sosvoiceorvdo.count({
      where: { status: "รับแจ้งแล้ว" },
    }); // ex  17    17/16 = 1.133  => 2
    const totalPages = Math.ceil(totalCount / _limit); // ex  17    17/16 = 1.133  => 2
    const allData = dataList.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item; // destructuring  rest ค่าต่างๆเก็บเอาไว้

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: skip + index + 1,
      }; // ...rest ข้อมูลเดิม displayTime โคลนทับ
    });
    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1), //  ex 17 17/16 = 1.133 => 2  => map  1  2
      totalPages, // 1 0-16
      allData,
    });
  } catch (error) {
    next(error);
  }
};

exports.allDataInprogressOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 16; //จำนวณข้อมูล
    const _page = parseInt(req.query._page) || 1; // หน้าปัจจุบัน
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น //ex 2-1 1*16 = 16 เริ่มต้น

    const dataList = await prisma.sosvoiceorvdo.findMany({
      where: { status: "กำลังดำเนินการ" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip, // เริ่มต้น
      take: _limit, // ไปอัก 16
    });

    const totalCount = await prisma.sosvoiceorvdo.count({
      where: { status: "กำลังดำเนินการ" },
    }); // ex  17    17/16 = 1.133  => 2
    const totalPages = Math.ceil(totalCount / _limit); // ex  17    17/16 = 1.133  => 2
    const allData = dataList.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item; // destructuring  rest ค่าต่างๆเก็บเอาไว้

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: skip + index + 1,
      }; // ...rest ข้อมูลเดิม displayTime โคลนทับ
    });
    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1), //  ex 17 17/16 = 1.133 => 2  => map  1  2
      totalPages, // 1 0-16
      allData,
    });
  } catch (error) {
    next(error);
  }
};

exports.allDataCompletedOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 16; //จำนวณข้อมูล
    const _page = parseInt(req.query._page) || 1; // หน้าปัจจุบัน
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น //ex 2-1 1*16 = 16 เริ่มต้น

    const dataList = await prisma.sosvoiceorvdo.findMany({
      where: { status: "จัดการเสร็จสิ้น" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip, // เริ่มต้น
      take: _limit, // ไปอัก 16
    });

    const totalCount = await prisma.sosvoiceorvdo.count({
      where: { status: "จัดการเสร็จสิ้น" },
    }); // ex  17    17/16 = 1.133  => 2
    const totalPages = Math.ceil(totalCount / _limit); // ex  17    17/16 = 1.133  => 2
    const allData = dataList.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item; // destructuring  rest ค่าต่างๆเก็บเอาไว้

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: skip + index + 1,
      }; // ...rest ข้อมูลเดิม displayTime โคลนทับ
    });
    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1), //  ex 17 17/16 = 1.133 => 2  => map  1  2
      totalPages, // 1 0-16
      allData,
    });
  } catch (error) {
    next(error);
  }
};

exports.allDataCanceledOnly = async (req, res, next) => {
  try {
    const _limit = parseInt(req.query._limit) || 16; //จำนวณข้อมูล
    const _page = parseInt(req.query._page) || 1; // หน้าปัจจุบัน
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น //ex 2-1 1*16 = 16 เริ่มต้น

    const dataList = await prisma.sosvoiceorvdo.findMany({
      where: { status: "ยกเลิก" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip, // เริ่มต้น
      take: _limit, // ไปอัก 16
    });

    const totalCount = await prisma.sosvoiceorvdo.count({
      where: { status: "ยกเลิก" },
    }); // ex  17    17/16 = 1.133  => 2
    const totalPages = Math.ceil(totalCount / _limit); // ex  17    17/16 = 1.133  => 2
    const allData = dataList.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item; // destructuring  rest ค่าต่างๆเก็บเอาไว้

      const displayTime =
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: skip + index + 1,
      }; // ...rest ข้อมูลเดิม displayTime โคลนทับ
    });
    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1), //  ex 17 17/16 = 1.133 => 2  => map  1  2
      totalPages, // 1 0-16
      allData,
    });
  } catch (error) {
    next(error);
  }
};
