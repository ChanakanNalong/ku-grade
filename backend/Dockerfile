# ใช้ Node.js เวอร์ชัน LTS
FROM node:18-alpine

# ตั้งค่า working directory
WORKDIR /app

# คัดลอกไฟล์ package.json และติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# คัดลอกโค้ดทั้งหมดเข้า container
COPY . .

# เปิด port 5000 (หรือ port ที่ backend ใช้)
EXPOSE 5000

# คำสั่งเริ่มต้นรัน backend
CMD ["node", "index.js"]
