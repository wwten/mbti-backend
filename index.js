import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();

// CORS設定
app.use(cors());
app.use(express.json());

// ルート設定
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'MBTI診断 API サーバー' });
});

// インメモリデータストア
const answers = [];
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// 回答を保存するAPIエンドポイント
app.post('/api/answers', (req, res) => {
  try {
    const { age, gender, answers, mbtiResult } = req.body;
    
    const newAnswer = {
      id: answers.length + 1,
      age,
      gender,
      answers,
      mbtiResult,
      createdAt: new Date()
    };
    
    answers.push(newAnswer);
    
    res.status(201).json({
      success: true,
      data: newAnswer
    });
  } catch (error) {
    console.error('回答の保存に失敗しました:', error);
    res.status(500).json({
      success: false,
      error: '回答の保存に失敗しました'
    });
  }
});

// 認証ミドルウェア
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "認証が必要です" });
  }

  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "無効なトークンです" });
  }
};

// 管理者ログインAPI
app.post("/api/admin/login", (req, res) => {
  try {
    const { password } = req.body;
    console.log('Received login request');
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "パスワードが必要です"
      });
    }
    
    if (password === ADMIN_PASSWORD) {
      const token = jwt.sign({}, JWT_SECRET, { expiresIn: "24h" });
      console.log('Login successful');
      res.json({ success: true, token });
    } else {
      console.log('Login failed: incorrect password');
      res.status(401).json({
        success: false,
        message: "パスワードが正しくありません"
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: "エラーが発生しました"
    });
  }
});

// 統計情報API
app.get("/api/statistics", authenticateAdmin, (req, res) => {
  try {
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
        mbtiDistribution,
      },
    });
  } catch (err) {
    console.error('Statistics error:', err);
    res.status(500).json({
      success: false,
      message: "統計処理中にエラーが発生しました"
    });
  }
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "サーバーエラーが発生しました",
  });
});

// サーバー起動
app.listen(3000, '0.0.0.0', () => {
  console.log('Express server initialized on port 3000');
});