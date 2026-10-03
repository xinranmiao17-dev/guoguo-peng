/* 原始 JPG 素材保留；bubble PNG 为重绘的透明泡泡素材。
   crop 是原图中的取景框 [左, 上, 边长]；省略时使用完整 PNG。 */
window.GAME_CONFIG = {
  finalAreaRatio: 0.70,
  dropWeights: [0.30, 0.30, 0.20, 0.20, 0, 0, 0],
  dangerLine: 56,
  dangerSeconds: 1.75,
  spawnGraceSeconds: 1.1,
  dropCooldown: 0.28,
  gravity: 1450,
  initialFallSpeed: 130,
  keyboardSpeed: 680,
  levels: [
    { name: '果小戒', color: '#f4d884', radius: 28, image: 'guo-01-bubble.png' },
    { name: '福瑞果', color: '#cfb3ea', radius: 40, image: 'guo-02-bubble.png' },
    { name: '萌萌果', color: '#beb4df', radius: 57, image: 'guo-03-bubble.png' },
    { name: '小罗宾', color: '#b7bed3', radius: 80, image: 'guo-04-bubble.png' },
    { name: '开心果', color: '#f8e6a3', radius: 113, image: 'guo-05-head.png' },
    { name: '团团果', color: '#ead4c0', radius: 159, image: 'guo-06-head.png' },
    { name: 'ep果', color: '#cab3ed', image: 'guo-07.jpg', crop: [0, 660, 1080] }
  ]
};
