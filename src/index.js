const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// CORS設定
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // ReplitのフロントエンドURL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// 静的ファイルの配信設定（本番環境用）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../mbti-frontend/dist')));
}

// インメモリデータストア
const answers = [];
const JWT_SECRET = process.env.JWT_SECRET || 'mbti-admin-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mbti2025';

// 認証ミドルウェア
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: '認証が必要です' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: '無効なトークンです' });
  }
};

// API エンドポイント
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({}, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'パスワードが正しくありません' });
  }
});

app.post('/api/answers', (req, res) => {
  const answer = {
    ...req.body,
    timestamp: new Date()
  };
  answers.push(answer);
  res.json({ success: true });
});

app.get('/api/statistics', authenticateAdmin, (req, res) => {
  const total = answers.length;
  const mbtiDistribution = answers.reduce((acc, answer) => {
    const type = answer.mbtiType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      total,
      mbtiDistribution
    }
  });
});

// ヘルスチェックエンドポイント
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'MBTI診断 API サーバー' });
});

// 本番環境でのフォールバック（SPA用）
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../mbti-frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`サーバーが起動しました: http://0.0.0.0:${PORT}`);
});
