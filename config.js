/* 九级团子；半径以游戏坐标为单位。末三级只能合成。 */
window.GAME_CONFIG = {
  "boardWidth": 480,
  "boardHeight": 620,
  "dropWeights": [
    0.15,
    0.15,
    0.2,
    0.2,
    0.18,
    0.12,
    0,
    0,
    0
  ],
  "dangerLine": 56,
  "dangerSeconds": 1.75,
  "spawnGraceSeconds": 1.1,
  "dropCooldown": 0.28,
  "gravity": 1450,
  "initialFallSpeed": 130,
  "keyboardSpeed": 680,
  "levels": [
    {
      "name": "果小戒",
      "color": "#f4d884",
      "radius": 22,
      "image": "guo-01-bubble.png"
    },
    {
      "name": "呆呆果",
      "color": "#ead69d",
      "radius": 31,
      "image": "guo-08-daidai.png"
    },
    {
      "name": "福瑞果",
      "color": "#cfb3ea",
      "radius": 43,
      "image": "guo-02-bubble.png"
    },
    {
      "name": "萌萌果",
      "color": "#beb4df",
      "radius": 58,
      "image": "guo-03-bubble.png"
    },
    {
      "name": "小罗宾",
      "color": "#b7bed3",
      "radius": 77,
      "image": "guo-04-bubble.png"
    },
    {
      "name": "开心果",
      "color": "#f8e6a3",
      "radius": 100,
      "image": "guo-05-head.png"
    },
    {
      "name": "礼帽果",
      "color": "#cbb9de",
      "radius": 130,
      "image": "guo-09-limao.png"
    },
    {
      "name": "团团果",
      "color": "#ead4c0",
      "radius": 168,
      "image": "guo-06-head.png"
    },
    {
      "name": "ep果",
      "color": "#cab3ed",
      "radius": 232,
      "image": "guo-07.jpg",
      "crop": [
        0,
        660,
        1080
      ]
    }
  ]
};
