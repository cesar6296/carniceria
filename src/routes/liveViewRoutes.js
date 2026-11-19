const express = require('express');
const LiveViewService = require('../services/liveViewService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const datos = await LiveViewService.obtenerLiveView(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
