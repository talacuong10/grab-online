/**
 * server.js
 * Máy chủ Node.js + Express + Socket.IO cho game Web 3D "Grab Online — Quận 1, TP.HCM".
 * - Phục vụ giao diện tĩnh trong thư mục public/
 * - Đồng bộ vị trí xe máy, tốc độ, trạng thái đơn hàng của tối đa 20 tài xế thật theo thời gian thực
 * - Hỗ trợ kênh bộ đàm tài xế và thống kê thu nhập trong phiên
 */

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const MAX_DRIVERS = 20;
const MAP_HALF_SIZE = 1200; // Bản đồ Quận 1 từ -1200..+1200 theo X và Z

// Phục vụ giao diện game: ưu tiên thư mục public/, nếu không có thì dùng index.html ở thư mục gốc
const fs = require('fs');
if (fs.existsSync(path.join(__dirname, 'public', 'index.html'))) {
  app.use(express.static(path.join(__dirname, 'public')));
} else {
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
}

// API kiểm tra trạng thái server
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeDrivers: drivers.size,
    maxDrivers: MAX_DRIVERS
  });
});

// Bộ nhớ danh sách tài xế đang trực tuyến
const drivers = new Map();

// Lọc từ ngữ thô tục cơ bản cho tên và bộ đàm
const BAD_WORDS = [
  'dm', 'dmm', 'dkm', 'vcl', 'vl', 'cc', 'cl', 'dit', 'duma', 'đụ', 'địt', 'đéo',
  'lồn', 'buồi', 'cặc', 'đĩ', 'óc chó', 'mất dạy', 'khốn nạn', 'fuck', 'shit', 'bitch'
];

function cleanText(text) {
  if (typeof text !== 'string') return '';
  let out = text.trim();
  for (const w of BAD_WORDS) {
    const regex = new RegExp(`\\b${w}\\b`, 'gi');
    out = out.replace(regex, '***');
  }
  return out;
}

const HELMET_COLORS = ['#00b14f', '#008c3e', '#10b981', '#059669', '#16a34a'];

io.on('connection', (socket) => {
  /**
   * Tài xế đăng nhập vào ca chạy Grab Quận 1
   */
  socket.on('driver:join', (payload, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};

    if (drivers.size >= MAX_DRIVERS) {
      return cb({
        ok: false,
        error: 'Khu vực Quận 1 đã đạt tối đa 20 tài xế trực tuyến. Vui lòng thử lại sau ít phút!'
      });
    }

    const rawName = payload && typeof payload.name === 'string' ? payload.name.trim() : '';
    if (rawName.length < 2 || rawName.length > 18) {
      return cb({ ok: false, error: 'Tên tài xế cần từ 2 đến 18 ký tự.' });
    }

    const driverName = cleanText(rawName);
    const vehicleCode =
      '59-' +
      ['T1', 'C1', 'D1', 'B1'][Math.floor(Math.random() * 4)] +
      ' ' +
      Math.floor(10000 + Math.random() * 89999);

    // Điểm xuất phát quanh khu vực Chợ Bến Thành / Đại lộ Lê Lợi (-390, 150)
    const spawnX = -380 + Math.floor((Math.random() - 0.5) * 80);
    const spawnZ = 150 + Math.floor((Math.random() - 0.5) * 26);

    const newDriver = {
      id: socket.id,
      name: driverName,
      vehicleCode,
      helmetColor: HELMET_COLORS[Math.floor(Math.random() * HELMET_COLORS.length)],
      x: spawnX,
      z: spawnZ,
      rotation: Math.PI / 2,
      speed: 0,
      orderStatus: 'idle', // 'idle' | 'picking' | 'delivering'
      earnings: 0,
      completedOrders: 0,
      lastChatAt: 0
    };

    drivers.set(socket.id, newDriver);

    cb({
      ok: true,
      selfId: socket.id,
      self: newDriver,
      drivers: Array.from(drivers.values()),
      maxDrivers: MAX_DRIVERS
    });

    socket.broadcast.emit('driver:joined', newDriver);
  });

  /**
   * Đồng bộ vị trí & tốc độ xe máy theo thời gian thực (~15 lần/giây từ client)
   */
  socket.on('driver:move', (data) => {
    const driver = drivers.get(socket.id);
    if (!driver || !data) return;

    const x = Number(data.x);
    const z = Number(data.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;

    driver.x = Math.max(-MAP_HALF_SIZE, Math.min(MAP_HALF_SIZE, Number(x.toFixed(1))));
    driver.z = Math.max(-MAP_HALF_SIZE, Math.min(MAP_HALF_SIZE, Number(z.toFixed(1))));
    if (Number.isFinite(Number(data.rotation))) {
      driver.rotation = Number(Number(data.rotation).toFixed(3));
    }
    if (Number.isFinite(Number(data.speed))) {
      driver.speed = Number(Number(data.speed).toFixed(1));
    }
    if (typeof data.orderStatus === 'string') {
      driver.orderStatus = data.orderStatus;
    }

    socket.broadcast.emit('driver:moved', {
      id: driver.id,
      x: driver.x,
      z: driver.z,
      rotation: driver.rotation,
      speed: driver.speed,
      orderStatus: driver.orderStatus
    });
  });

  /**
   * Thông báo khi tài xế bấm còi xe gần các tài xế khác
   */
  socket.on('driver:honk', () => {
    const driver = drivers.get(socket.id);
    if (!driver) return;
    socket.broadcast.emit('driver:honked', {
      id: driver.id,
      name: driver.name,
      x: driver.x,
      z: driver.z
    });
  });

  /**
   * Cập nhật kết quả giao đơn hàng thành công
   */
  socket.on('order:complete', (payload) => {
    const driver = drivers.get(socket.id);
    if (!driver || !payload) return;

    const reward = Math.max(0, Math.min(300000, Math.floor(Number(payload.reward) || 0)));
    driver.earnings += reward;
    driver.completedOrders += 1;
    driver.orderStatus = 'idle';

    io.emit('driver:stats', {
      id: driver.id,
      name: driver.name,
      earnings: driver.earnings,
      completedOrders: driver.completedOrders,
      destinationName: String(payload.destinationName || 'Quận 1')
    });
  });

  /**
   * Bộ đàm tài xế (Chat ngắn gọn trong ca)
   */
  socket.on('chat:send', (payload, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const driver = drivers.get(socket.id);
    if (!driver) return cb({ ok: false });

    const now = Date.now();
    if (now - driver.lastChatAt < 1000) {
      return cb({ ok: false, error: 'Đợi 1 giây trước khi nhắn tiếp nhé bác tài.' });
    }

    const raw = payload && typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!raw || raw.length > 120) {
      return cb({ ok: false, error: 'Tin nhắn từ 1 đến 120 ký tự.' });
    }

    driver.lastChatAt = now;
    io.emit('chat:message', {
      senderId: driver.id,
      senderName: driver.name,
      vehicleCode: driver.vehicleCode,
      message: cleanText(raw),
      timestamp: now
    });
    cb({ ok: true });
  });

  /**
   * Ngắt kết nối
   */
  socket.on('disconnect', () => {
    if (drivers.has(socket.id)) {
      const d = drivers.get(socket.id);
      drivers.delete(socket.id);
      socket.broadcast.emit('driver:left', { id: socket.id, name: d.name });
    }
  });
});

server.listen(PORT, () => {
  console.log('===========================================================');
  console.log(`🛵 Grab Online Quận 1 (3D) đang chạy tại: http://localhost:${PORT}`);
  console.log('===========================================================');
});

