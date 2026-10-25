/* 活動花絮資料：新增相簿時複製一筆，替換文字及 photos。
 * date 填 YYYY-MM-DD，沒有正式日期請留空；demo 改 false 後不顯示示意標籤。
 * 圖片放 assets/，每張 caption 同時用於圖片替代文字。
 */
window.SAVS_ALBUMS = [
  {
    id: 'campus-walk', category: '校園生活', title: '校園走讀・山海日常',
    description: '沿著椰林、湖畔與綠蔭，留下我們一起走過的風景。',
    date: '', demo: true,
    photos: [
      { src: 'assets/campus-lake.webp', caption: '綠意環抱的校園湖景' },
      { src: 'assets/hero-campus.webp', caption: '椰林大道與校園建築' },
      { src: 'assets/campus-green.webp', caption: '陽光下的校園綠蔭' },
      { src: 'assets/hero-evening.webp', caption: '夕照裡的蘇海時光' }
    ]
  },
  {
    id: 'learning-spaces', category: '學習體驗', title: '特色工坊探索',
    description: '從特色工坊到專業教室，為每一次學習留下紀錄。',
    date: '', demo: true,
    photos: [
      { src: 'assets/campus-workshop.webp', caption: '校園裡的特色創意空間' },
      { src: 'assets/department-marine.webp', caption: '輪機科教學設備' },
      { src: 'assets/department-food.webp', caption: '水產食品科實習教室' }
    ]
  },
  {
    id: 'sports-days', category: '運動時光', title: '校園運動時光',
    description: '把奔跑、加油與一起努力的片刻，收進青春的相簿。',
    date: '', demo: true,
    photos: [
      { src: 'assets/hero-sports.webp', caption: '青山環抱的校園操場' },
      { src: 'assets/activities-court.jpg', caption: '綠蔭旁的戶外籃球場' },
      { src: 'assets/activities-track.jpg', caption: '向青山延伸的紅色跑道' }
    ]
  },
  {
    id: 'marine-learning', category: '學習體驗', title: '輪機科實習紀錄',
    description: '以輪機科教學設備照片示範實習活動相簿。', date: '', demo: true,
    photos: [{ src: 'assets/department-marine.webp', caption: '輪機科教學設備' }]
  },
  {
    id: 'food-learning', category: '學習體驗', title: '水產食品科實作紀錄',
    description: '以水產食品科教學空間示範實作活動相簿。', date: '', demo: true,
    photos: [{ src: 'assets/department-food.webp', caption: '水產食品科實習教室' }]
  },
  {
    id: 'fishery-learning', category: '學習體驗', title: '漁業科專業探索',
    description: '以漁業科實習空間照片示範專業學習相簿。', date: '', demo: true,
    photos: [{ src: 'assets/department-fishery.webp', caption: '漁業科實習與教學空間' }]
  },
  {
    id: 'aquaculture-learning', category: '學習體驗', title: '水產養殖科學習紀錄',
    description: '以水產養殖科教學場域照片示範學習活動相簿。', date: '', demo: true,
    photos: [{ src: 'assets/department-aquaculture.webp', caption: '水產養殖科實習場域' }]
  },
  {
    id: 'campus-memories', category: '校園生活', title: '蘇海光影・校園留影',
    description: '以校園光影照片示範生活紀錄相簿。', date: '', demo: true,
    photos: [
      { src: 'assets/hero-evening.webp', caption: '夕照裡的蘇海時光' },
      { src: 'assets/campus-green.webp', caption: '陽光穿過綠蔭的校園步道' }
    ]
  }
];
