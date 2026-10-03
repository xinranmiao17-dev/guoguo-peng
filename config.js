/* 九级团子；随机最高为小罗宾，6–9级只能合成。 */
window.GAME_CONFIG = {
  "boardWidth": 480,
  "boardHeight": 700,
  "dropWeights": [
    0.18,
    0.18,
    0.22,
    0.22,
    0.2,
    0,
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
      "image": "guo-01-bubble.webp",
      "fallbackImage": "guo-01-bubble-compat.png"
    },
    {
      "name": "呆呆果",
      "color": "#ead69d",
      "radius": 31,
      "image": "guo-08-daidai.webp",
      "fallbackImage": "guo-08-daidai-compat.png"
    },
    {
      "name": "福瑞果",
      "color": "#cfb3ea",
      "radius": 43,
      "image": "guo-02-bubble.webp",
      "fallbackImage": "guo-02-bubble-compat.png"
    },
    {
      "name": "萌萌果",
      "color": "#beb4df",
      "radius": 58,
      "image": "guo-03-bubble.webp",
      "fallbackImage": "guo-03-bubble-compat.png"
    },
    {
      "name": "小罗宾",
      "color": "#b7bed3",
      "radius": 77,
      "image": "guo-04-bubble.webp",
      "fallbackImage": "guo-04-bubble-compat.png"
    },
    {
      "name": "开心果",
      "color": "#f8e6a3",
      "radius": 100,
      "image": "guo-05-head.webp",
      "fallbackImage": "guo-05-head-compat.png"
    },
    {
      "name": "礼帽果",
      "color": "#cbb9de",
      "radius": 130,
      "image": "guo-09-limao.webp",
      "fallbackImage": "guo-09-limao-compat.png"
    },
    {
      "name": "团团果",
      "color": "#ead4c0",
      "radius": 168,
      "image": "guo-06-head.webp",
      "fallbackImage": "guo-06-head-compat.png"
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
