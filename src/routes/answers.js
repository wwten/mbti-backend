import express from 'express';
import Answer from '../models/Answer.js';

const router = express.Router();

// 回答を保存
router.post('/', async (req, res) => {
  try {
    const { age, gender, answers, mbtiResult } = req.body;
    
    const newAnswer = await Answer.create({
      age,
      gender,
      answers,
      mbtiResult
    });

    res.status(201).json({
      success: true,
      data: newAnswer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '回答の保存に失敗しました'
    });
  }
});

export default router;
