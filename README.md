# Static Portfolio

เว็บเรซูเม่ภาษาไทยของ Supasek Sangket พร้อมการทดสอบอัตโนมัติบน GitHub Actions

## รันในเครื่อง

ใช้ Node.js 24 ขึ้นไป แล้วรันคำสั่งในโฟลเดอร์โปรเจกต์

```powershell
npm ci
npx playwright install chromium
npm run build
npm test
npm start
```

เปิดเว็บที่ http://127.0.0.1:4173 และกด Ctrl+C เพื่อหยุด server

แก้เนื้อหาเว็บไซต์ใน `index.html` แล้วรัน `npm run build` ก่อนทดสอบอีกครั้ง

## Automated testing และ CI

GitHub Actions รันเมื่อ push เข้า `main` หรือ `codex/**` และเมื่อเปิด Pull Request เข้า `main`
Workflow จะติดตั้ง dependency จาก lockfile, build เว็บ และรันทดสอบด้วย Chromium ทั้งขนาด desktop และ mobile

- หน้าเว็บต้องโหลดสำเร็จและแสดงครบทั้งสามโปรเจกต์
- ลิงก์อีเมล โทรศัพท์ และ URL repository ต้องมีปลายทางถูกต้องตามรูปแบบที่กำหนด
- หน้าเว็บต้องแสดงพอดีหน้าจอโดยไม่มี horizontal overflow
- `/version.json` ต้องแสดง commit SHA ที่ใช้ build และข้อมูลเวอร์ชัน

การตรวจลิงก์ repository ตรวจ URL ในหน้าเว็บ ส่วน HTTP status ของ GitHub ปลายทางยังต้องตรวจเพิ่มเติมหากต้องการ

เมื่อผ่านทุกการทดสอบ จะเก็บไฟล์ใน `dist/` เป็น artifact ชื่อ `website-<commit SHA>` พร้อม test report เก็บไว้ 7 วัน
Artifact คือชุดไฟล์เว็บที่ผ่านการทดสอบแล้วสำหรับนำไป deploy ในขั้นถัดไป

## Versioning

`package.json` กำหนดเลขเวอร์ชันเริ่มต้น `1.0.0`
Build สร้าง `dist/version.json` ที่มี `version`, `revision` และ `builtAt`
CI ใช้ `GITHUB_SHA` ส่วนการ build ในเครื่องใช้ commit ปัจจุบันจาก Git

## Deploy อัตโนมัติไปยัง S3

เพิ่ม repository secrets ชื่อ `AWS_ACCESS_KEY_ID` และ `AWS_SECRET_ACCESS_KEY` จาก IAM user สำหรับ deploy
User ใช้สิทธิ์ `s3:ListBucket`, `s3:GetBucketLocation` เฉพาะ bucket และ `s3:GetObject`, `s3:PutObject` เฉพาะไฟล์ใน bucket

เมื่อ push หรือ merge เข้า `main` workflow จะทดสอบก่อน แล้วดาวน์โหลด artifact ที่ผ่านการทดสอบจาก run เดียวกันไป deploy
เก็บชุด release ใน `releases/<commit SHA>/` จากนั้นอัปโหลด `index.html` และ `version.json` ไปที่รากของ bucket
ขั้นตอนสุดท้ายเปิด URL จริงและเทียบเนื้อหาทั้งสองไฟล์กับชุดที่ผ่านการทดสอบ หากต่างกัน workflow จะล้มเหลว
การ deploy กับ rollback ใช้ concurrency group เดียวกันเพื่อให้ทำงานทีละชุด และ workflow จะตรวจว่า deploy จาก commit ล่าสุดของ `main`

ปลายทางคือ S3 bucket `supasek-portfolio-001-461899883996-ap-southeast-2-an` ใน Region `ap-southeast-2`
เปิดเว็บที่ http://supasek-portfolio-001-461899883996-ap-southeast-2-an.s3-website-ap-southeast-2.amazonaws.com/

หาก workflow ล้มเหลวระหว่างอัปโหลด ให้แก้ปัญหาแล้วรัน workflow ของ `main` ล่าสุดซ้ำได้ ไฟล์ทั้งสองถูกอัปโหลดแยกกันและขั้นตอนตรวจเว็บจะตรวจความครบถ้วนหลังอัปโหลด

## Rollback

1. ดู full commit SHA จาก release ที่เคย deploy สำเร็จ หรือจาก `/version.json` ที่บันทึกไว้
2. ไปที่ Actions แล้วเลือก `Rollback portfolio`
3. กด Run workflow เลือก branch `main` แล้วกรอก SHA ครบ 40 ตัวในช่อง `revision`
4. Workflow จะดาวน์โหลด release ที่เก็บไว้ ตรวจ SHA จาก metadata แล้วอัปโหลดคืน พร้อมตรวจเว็บไซต์จริง

Rollback ใช้ release ที่เคยเก็บสำเร็จใน bucket และการ push เข้า `main` ครั้งถัดไปจะ deploy เวอร์ชันใหม่ตามปกติ
ไฟล์ release เก็บอยู่ใน S3 ต่อเนื่อง ส่วน artifact บน GitHub เก็บ 7 วัน และ S3 Versioning ที่เปิดไว้จะเก็บประวัติ object ตามการตั้งค่า bucket
