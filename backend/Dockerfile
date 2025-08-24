# ใช้ Node.js เวอร์ชัน LTS
FROM node:18-alpine

# ติดตั้ง bash
RUN apk add --no-cache bash

# ตั้งค่า working directory
WORKDIR /app

# คัดลอกไฟล์ package.json และติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# คัดลอกโค้ดทั้งหมดเข้า container
COPY . .

# คัดลอก wait-for-it.sh เข้ามา และตั้ง permission ให้รันได้
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# เปิด port 5000 (หรืdocอ port ที่ backend ใช้)
EXPOSE 5000

# คำสั่งเริ่มต้นรัน backend
CMD ["/wait-for-it.sh", "database:3306", "--", "node", "server.js"]
