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

// 統計データの取得（管理者用）
router.get('/statistics', async (req, res) => {
  try {
    // MBTI タイプごとの集計
    const results = await Answer.findAll({
      attributes: [
        'mbtiResult',
        [sequelize.fn('COUNT', sequelize.col('mbtiResult')), 'count']
      ],
      group: ['mbtiResult']
    });

    // 年齢層ごとの集計
    const ageGroups = await Answer.findAll({
      attributes: [
        [sequelize.literal('CASE WHEN age < 20 THEN "10代" WHEN age < 30 THEN "20代" WHEN age < 40 THEN "30代" ELSE "40代以上" END'), 'ageGroup'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.literal('ageGroup')]
    });

    res.json({
      success: true,
      data: {
        mbtiDistribution: results,
        ageDistribution: ageGroups
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '統計データの取得に失敗しました'
    });
  }
});

export default router;
