/*
exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, "Profile image is required"));
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        profile: true,
      },
    });

    // ลบรูปเก่าออกถ้ามี
    if (user && user.profile) {
      const oldImagePath = user.profile;
      try {
        await fs.unlink(oldImagePath);
        console.log("Old image deleted successfully.");
      } catch (err) {
        console.error(`Failed to delete old image: ${err}`);
      }
    }

    const filePath = path.resolve(
      `C:/Users/taode/Desktop/cctv/backend/public/${req.file.filename}`
    );

    await prisma.user.update({
      data: {
        profile: filePath,
      },
      where: {
        id: req.user.id,
      },
    });

    // res.status(200).sendFile(filePath);
    res.status(200).json({ profile: filePath });
  } catch (error) {
    next(error);
  }
};
*/

/*
exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, "Profile image is required"));
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        profile: true,
      },
    });

    // ลบรูปเก่าออกถ้ามี
    if (user && user.profile) {
      const oldImagePath = path.resolve(
        __dirname,
        `../public/uploads/${path.basename(user.profile)}`
      );
      try {
        await fs.unlink(oldImagePath);
        console.log("Old image deleted successfully.");
      } catch (err) {
        console.error(`Failed to delete old image: ${err}`);
      }
    }

    // เก็บไฟล์รูปใหม่ไว้ที่ public/uploads
    const filePath = path.join(
      __dirname,
      `../public/uploads/${req.file.filename}`
    );

    // Update ข้อมูลโปรไฟล์ใหม่ในฐานข้อมูล โดยเก็บ URL ที่เข้าถึงได้
    const publicUrl = `/uploads/${req.file.filename}`; // ใช้ path ที่เข้าถึงได้จากเซิร์ฟเวอร์

    await prisma.user.update({
      data: {
        profile: publicUrl, // เก็บ URL ของรูปโปรไฟล์ใหม่
      },
      where: {
        id: req.user.id,
      },
    });

    // ส่งกลับ URL ที่สามารถเข้าถึงรูปได้
    res.status(200).json({ profile: publicUrl });
  } catch (error) {
    next(error);
  }
};
*/

/*
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model user {
  id                      Int                       @id @default(autoincrement())
  firstName               String
  lastName                String
  email                   String
  phone                   String
  password                String
  status                  String?
  profile                 String?
  postuserreport          postuserreport[]
  commentinpostuserreport commentinpostuserreport[]
  datashop                datashop[]
  commentshop             commentshop[]
  requestwatchcctv        requestwatchcctv[]
  sosvoiceorvdo_user      sosvoiceorvdo[]           @relation("user")
  sosvoiceorvdo_admin     sosvoiceorvdo[]           @relation("admin")
}

model otp {
  id     Int    @id @default(autoincrement())
  otp    String @db.VarChar(4)
  userId Int
}

model postuserreport {
  id                      Int                       @id @default(autoincrement())
  texttitle               String                    @db.Text
  image                   String?                   @db.Text
  textstory               String?                   @db.Text
  map                     String?                   @db.Text
  vdo                     String?                   @db.Text
  status                  String
  createdAt               DateTime                  @default(now())
  userId                  Int
  user                    user                      @relation(fields: [userId], references: [id])
  commentinpostuserreport commentinpostuserreport[]
}

model commentinpostuserreport {
  id             Int            @id @default(autoincrement())
  text           String         @db.Text
  image          String?        @db.Text
  createdAt      DateTime       @default(now())
  status         String
  vdo            String?        @db.Text
  userId         Int
  user           user           @relation(fields: [userId], references: [id])
  reportId       Int
  postuserreport postuserreport @relation(fields: [reportId], references: [id])
}

model datashop {
  id          Int           @id @default(autoincrement())
  createdAt   DateTime      @default(now())
  name        String
  address     String        @db.Text
  phone       String
  image       String        @db.Text
  category    String
  details     String        @db.Text
  status      String
  latitude    String?
  longtitude  String?
  userId      Int?
  user        user?         @relation(fields: [userId], references: [id])
  commentshop commentshop[]
}

model commentshop {
  id         Int      @id @default(autoincrement())
  comment    String   @db.Text
  image      String?  @db.Text
  score      Int?
  createdAt  DateTime @default(now())
  userId     Int?
  user       user?    @relation(fields: [userId], references: [id])
  datashopId Int
  datashop   datashop @relation(fields: [datashopId], references: [id])
}

model requestwatchcctv {
  id          Int      @id @default(autoincrement())
  firstName   String   @db.Text
  lastName    String   @db.Text
  tel         String   @db.Text
  nationalId  String   @db.VarChar(10)
  numDocument String   @db.Text
  createdAt   DateTime @default(now())
  point       String   @db.Text
  status      String   @db.Text
  remark      String?  @db.Text
  image       String   @db.Text
  userId      Int?
  user        user?    @relation(fields: [userId], references: [id])
}

model sosvoiceorvdo {
  id         Int       @id @default(autoincrement())
  statustell String?   @db.Text
  file       String?   @db.Text
  fileType   String?   @db.VarChar(10)
  process    String?   @db.Text
  callStatus String?   @db.Text
  startTime  DateTime?
  endTime    DateTime?
  createdAt  DateTime  @default(now())
  userId     Int?
  user       user?     @relation(fields: [userId], references: [id], name: "user")
  adminId    Int?
  admin      user?     @relation(fields: [adminId], references: [id], name: "admin")
}
  
  */

/*
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model user {
  id                      Int                       @id @default(autoincrement())
  firstName               String
  lastName                String
  email                   String
  phone                   String
  password                String
  status                  String?
  profile                 String?
  postuserreport          postuserreport[]
  commentinpostuserreport commentinpostuserreport[]
  datashop                datashop[]
  commentshop             commentshop[]
  requestwatchcctv        requestwatchcctv[]
  sosvoiceorvdo_user      sosvoiceorvdo[]           @relation("user")
  sosvoiceorvdo_admin     sosvoiceorvdo[]           @relation("admin")
}

model otp {
  id     Int    @id @default(autoincrement())
  otp    String @db.VarChar(4)
  userId Int
}

model postuserreport {
  id                      Int                       @id @default(autoincrement())
  texttitle               String                    @db.Text
  image                   String?                   @db.Text
  textstory               String?                   @db.Text
  map                     String?                   @db.Text
  vdo                     String?                   @db.Text
  status                  String
  createdAt               DateTime                  @default(now())
  userId                  Int
  user                    user                      @relation(fields: [userId], references: [id])
  commentinpostuserreport commentinpostuserreport[]
}

model commentinpostuserreport {
  id             Int            @id @default(autoincrement())
  text           String         @db.Text
  image          String?        @db.Text
  createdAt      DateTime       @default(now())
  status         String
  vdo            String?        @db.Text
  userId         Int
  user           user           @relation(fields: [userId], references: [id])
  reportId       Int
  postuserreport postuserreport @relation(fields: [reportId], references: [id])
}

model datashop {
  id          Int           @id @default(autoincrement())
  createdAt   DateTime      @default(now())
  name        String
  address     String        @db.Text
  phone       String
  image       String        @db.Text
  category    String
  details     String        @db.Text
  status      String
  latitude    String?
  longtitude  String?
  userId      Int?
  user        user?         @relation(fields: [userId], references: [id])
  commentshop commentshop[]
}

model commentshop {
  id         Int      @id @default(autoincrement())
  comment    String   @db.Text
  image      String?  @db.Text
  score      Int?
  createdAt  DateTime @default(now())
  userId     Int?
  user       user?    @relation(fields: [userId], references: [id])
  datashopId Int
  datashop   datashop @relation(fields: [datashopId], references: [id])
}

model requestwatchcctv {
  id          Int      @id @default(autoincrement())
  firstName   String   @db.Text
  lastName    String   @db.Text
  tel         String   @db.Text
  nationalId  String   @db.VarChar(13)
  numDocument String   @db.Text
  createdAt   DateTime @default(now())
  point       String   @db.Text
  status      String   @db.Text
  remark      String?  @db.Text
  image       String   @db.Text
  userId      Int?
  user        user?    @relation(fields: [userId], references: [id])
}

model sosvoiceorvdo {
  id         Int       @id @default(autoincrement())
  statustell String?   @db.Text
  file       String?   @db.Text
  fileType   String?   @db.Text
  process    String?   @db.Text
  callStatus String?   @db.Text
  startTime  DateTime?
  endTime    DateTime?
  createdAt  DateTime  @default(now())
  userId     Int?
  user       user?     @relation(fields: [userId], references: [id], name: "user")
  adminId    Int?
  admin      user?     @relation(fields: [adminId], references: [id], name: "admin")
}
*/
