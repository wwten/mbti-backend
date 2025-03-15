const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();

// 開発環境用の単純なCORS設定
app.use(cors());
app.use(express.json());

// 静的ファイルの配信設定（本番環境用）
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../mbti-frontend/dist")));
}

// インメモリデータストア
const answers = [];
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

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

// API エンドポイント
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

app.post("/api/answers", (req, res) => {
  try {
    const answer = {
      ...req.body,
      timestamp: new Date(),
    };
    answers.push(answer);
    res.json({ success: true });
  } catch (err) {
    console.error('Answer error:', err);
    res.status(500).json({ 
      success: false, 
      message: "回答処理中にエラーが発生しました" 
    });
  }
});

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

// ヘルスチェックエンドポイント
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MBTI診断 API サーバー" });
});

// 本番環境でのフォールバック（SPA用）
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../mbti-frontend/dist/index.html"));
  });
}

// エラーハンドリングミドルウェア（最後に配置）
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "サーバーエラーが発生しました",
  });
});

// ポート設定
const port = 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
