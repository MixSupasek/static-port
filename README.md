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

## สถานะการ deploy

ขั้นนี้เตรียมเว็บและ CI แล้ว ขั้นถัดไปจะตั้งค่า IAM OIDC สำหรับ GitHub Actions และเพิ่มการ deploy อัตโนมัติไปยัง S3
S3 bucket ที่เตรียมไว้คือ `supasek-portfolio-001-461899883996-ap-southeast-2-an` ใน Region `ap-southeast-2`
