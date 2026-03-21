export interface IllustrationItem {
  id: string;
  src: string;
  title?: string;
  caption?: string;
  aspectRatio: number; // width / height
  type?: 'image' | 'youtube' | 'soundcloud';
  videoId?: string;
  trackId?: string;
}

export type ContentType = 'image' | 'youtube' | 'soundcloud' | 'project' | 'contact' | 'empty' | 'illustration_folder' | 'about_name' | 'about_icon' | 'about_text' | 'pagination';

export interface GridItemData {
  id: string;
  type: ContentType;
  title?: string;
  description?: string;
  src?: string; // image url or project link
  videoId?: string; // youtube
  trackId?: string; // soundcloud
  width: number;  // Grid units width (1 = base size)
  height: number; // Grid units height
  depthOffset: number; // Z-axis offset for the irregular wall effect
  illustrationItems?: IllustrationItem[]; // items for the illustration folder blocks
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

// ユーザーが編集しやすいように、個々のイラストコンテンツ一覧を独立した変数に定義します。
// ローカルの画像を使う場合は、"public/illustrations/" フォルダ内に画像を配置し、
// srcの値を "/illustrations/ファイル名.png" などのように指定してください。
export const illustrationsData: IllustrationItem[] = [
  { id: "illus-1", src: "/illustrations/Outpost_Dissonance.jpg", title: "Outpost:Dissonance", caption: "楽曲『Outpost:Dissonance』ジャケット", aspectRatio: 1.0 },
  { id: "illus-2", src: "/illustrations/a_grain.png", title: "a grain", aspectRatio: 0.9949 },
  { id: "illus-3", src: "/illustrations/dropsound.jpg", title: "dropsound", aspectRatio: 1.5175 },
  { id: "illus-4", src: "/illustrations/magsafeangel.jpg", title: "magsafeangel", aspectRatio: 0.4766 },
  { id: "illus-5", src: "/illustrations/向こう側.png", title: "向こう側", aspectRatio: 0.4614 },
  { id: "illus-6", src: "/illustrations/拡散する未来.png", title: "拡散する未来", aspectRatio: 1.6667 },
  { id: "illus-7", src: "/illustrations/浮遊.png", title: "浮遊", aspectRatio: 0.4619 },
  { id: "illus-8", src: "/illustrations/狂信.PNG", title: "狂信", aspectRatio: 1.7778 },
  { id: "illus-9", src: "/illustrations/跳躍3.5.png", title: "跳躍3.5", aspectRatio: 0.5731 },
  { id: "illus-10", src: "/illustrations/風化させることなかれ.png", title: "風化させることなかれ", aspectRatio: 2.0 },
  { id: "illus-11", src: "/illustrations/風鈴.jpg", title: "風鈴", aspectRatio: 0.5933 }
];

export const discographyData: IllustrationItem[] = [
  {
    id: "disco-1",
    type: "soundcloud",
    trackId: "2284551407",
    src: "/illustrations/Outpost_Dissonance.jpg",
    title: "Outpost:Dissonance",
    caption: "SoundCloud: Outpost:Dissonance (Advance)",
    aspectRatio: 3.0
  },
  {
    id: "disco-2",
    type: "youtube",
    videoId: "_l0dadAMPww",
    src: "https://img.youtube.com/vi/_l0dadAMPww/maxresdefault.jpg",
    title: "おのれ",
    caption: "ミナモト feat.重音テト・花隈千冬 / ボカデュオ2024参加曲",
    aspectRatio: 1.7778
  },
  {
    id: "disco-3",
    type: "youtube",
    videoId: "Gsn3BRKPxps",
    src: "/illustrations/狂信.PNG",
    title: "狂信",
    caption: "ミナモト feat.花隈千冬 / 「勝手に救われてね」",
    aspectRatio: 1.7778
  }
];

// About section items (Special fixed content)
export const aboutData: GridItemData[] = [
  { 
    id: "about-name", 
    type: "about_name", 
    title: "ミナモト", 
    width: 1.2, 
    height: 1.2, 
    depthOffset: 0.5 
  },
  { 
    id: "about-icon", 
    type: "about_icon", 
    width: 1.2, 
    height: 1.2, 
    depthOffset: 0.6 
  },
  { 
    id: "about-text", 
    type: "about_text", 
    description: "デジタルアトリエへようこそ。\nここでは私の作品や実験的な\nプロジェクトを展示しています。", 
    width: 1.2, 
    height: 1.2, 
    depthOffset: 0.5 
  }
];

// Navigation items (Fixed 4 items)
export const navData: GridItemData[] = [
  { 
    id: "nav-illustration", 
    type: "illustration_folder", 
    title: "Illustration", 
    src: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5",
    width: 1.4, 
    height: 1.7, 
    depthOffset: 0.4,
    illustrationItems: illustrationsData
  },
  { 
    id: "nav-discography", 
    type: "illustration_folder", 
    title: "Discography", 
    src: "/illustrations/Outpost_Dissonance.jpg",
    width: 1.5, 
    height: 1.5, 
    depthOffset: 0.5,
    illustrationItems: discographyData
  },
  { id: "nav-products", type: "project", title: "Products", description: "オリジナルグッズやソフトウェア", src: "https://github.com", width: 1.3, height: 1.8, depthOffset: 0.3 },
  { id: "nav-contact", type: "contact", title: "Contact", description: "依頼やご相談はこちら：\nexample@portfolio.com", width: 1.4, height: 1.4, depthOffset: 0.6 }
];

// 13 Main Content Blocks with specific aspect ratios
export const contentPoolData: { content: GridItemData, desc: GridItemData, ratioType: 'horizontal' | '16:9' | 'vertical_1_1414' | 'vertical_9_21' }[] = [];

// 3 Horizontal (~3:1, specifically 1200x400) - Using SoundCloud as placeholders for now
for(let i=0; i<3; i++) {
  contentPoolData.push({
    ratioType: 'horizontal',
    content: { id: `hc-${i}`, type: 'soundcloud', trackId: "270383324", width: 3.0, height: 1.0, depthOffset: Math.random()*0.3 },
    desc: { id: `hcd-${i}`, type: 'about_text', description: `SoundCloud ${i} の詳細情報。ここには楽曲制作の背景や想いが記載されます。`, width: 1.2, height: 1.0, depthOffset: Math.random()*0.3 }
  });
}

// 6 16:9 or Square Images from illustrations
const horizontalImages = [
  illustrationsData[2], // dropsound (1.51)
  illustrationsData[5], // 拡散する未来 (1.66)
  illustrationsData[7], // 狂信 (1.77)
  illustrationsData[9], // 風化させることなかれ (2.0)
  illustrationsData[0], // Outpost_Dissonance (1.0)
  illustrationsData[1], // a_grain (0.99)
];

for(let i=0; i<6; i++) {
  const illus = horizontalImages[i] || illustrationsData[0];
  contentPoolData.push({
    ratioType: '16:9',
    content: { 
      id: `169c-${i}`, 
      type: 'image', 
      src: illus.src, 
      title: illus.title,
      width: 2.4, 
      height: 1.35, 
      depthOffset: Math.random()*0.3 
    },
    desc: { id: `169cd-${i}`, type: 'about_text', description: `${illus.title} についての解説文。作品に込めたコンセプトなどをここに記述します。`, width: 1.2, height: 1.2, depthOffset: Math.random()*0.3 }
  });
}

// 2 Vertical (1 : 1.414)
const verticalImages1 = [
  illustrationsData[8], // 跳躍3.5 (0.57)
  illustrationsData[10], // 風鈴 (0.59)
];

for(let i=0; i<2; i++) {
  const illus = verticalImages1[i] || illustrationsData[0];
  contentPoolData.push({
    ratioType: 'vertical_1_1414',
    content: { 
      id: `v1c-${i}`, 
      type: 'image', 
      src: illus.src, 
      title: illus.title,
      width: 1.414, 
      height: 2.0, 
      depthOffset: Math.random()*0.3 
    },
    desc: { id: `v1cd-${i}`, type: 'about_text', description: `${illus.title} の縦型構図に関するメモ。`, width: 1.1, height: 1.2, depthOffset: Math.random()*0.3 }
  });
}

// 2 Vertical (9:21)
const verticalImages2 = [
  illustrationsData[3], // magsafeangel (0.47)
  illustrationsData[4], // 向こう側 (0.46)
  illustrationsData[6], // 浮遊 (0.46)
];

for(let i=0; i<2; i++) {
  const illus = verticalImages2[i] || illustrationsData[0];
  contentPoolData.push({
    ratioType: 'vertical_9_21',
    content: { 
      id: `v2c-${i}`, 
      type: 'image', 
      src: illus.src, 
      title: illus.title,
      width: 1.2, 
      height: 2.8, 
      depthOffset: Math.random()*0.3 
    },
    desc: { id: `v2cd-${i}`, type: 'about_text', description: `${illus.title}。極端な縦長アスペクト比を活かした表現。`, width: 1.3, height: 1.2, depthOffset: Math.random()*0.3 }
  });
}
// 2 Square (1:1)
for(let i=0; i<2; i++) {
  const illus = illustrationsData[i] || illustrationsData[0];
  contentPoolData.push({
    ratioType: 'vertical_1_1414', // Using vertical logic but dimensions are square
    content: { 
      id: `sqc-${i}`, 
      type: 'image', 
      src: illus.src, 
      title: illus.title,
      width: 2.0, 
      height: 2.0, 
      depthOffset: Math.random()*0.3 
    },
    desc: { id: `sqcd-${i}`, type: 'about_text', description: `${illus.title}。正方形のアスペクト比を活かした作品。`, width: 1.2, height: 1.2, depthOffset: Math.random()*0.3 }
  });
}

// 1 2:1 (Horizontal)
contentPoolData.push({
  ratioType: 'horizontal',
  content: { 
    id: `21c-0`, type: 'image', src: illustrationsData[0].src, title: illustrationsData[0].title,
    width: 2.0, height: 1.0, depthOffset: Math.random()*0.3 
  },
  desc: { id: `21cd-0`, type: 'about_text', description: `2:1 アスペクト比の作品展示。`, width: 1.0, height: 1.0, depthOffset: Math.random()*0.3 }
});

// 1 additional 1:1.414 (Vertical)
contentPoolData.push({
  ratioType: 'vertical_1_1414',
  content: { 
    id: `v1c-2`, type: 'image', src: illustrationsData[1].src, title: illustrationsData[1].title,
    width: 1.414, height: 2.0, depthOffset: Math.random()*0.3 
  },
  desc: { id: `v1cd-2`, type: 'about_text', description: `追加の 1:1.414 縦型ブロック。`, width: 1.1, height: 1.2, depthOffset: Math.random()*0.3 }
});

// 1 additional 9:21 (Vertical)
contentPoolData.push({
  ratioType: 'vertical_9_21',
  content: { 
    id: `v2c-2`, type: 'image', src: illustrationsData[2].src, title: illustrationsData[2].title,
    width: 1.2, height: 2.8, depthOffset: Math.random()*0.3 
  },
  desc: { id: `v2cd-2`, type: 'about_text', description: `追加の 9:21 縦型ブロック。`, width: 1.3, height: 1.2, depthOffset: Math.random()*0.3 }
});

// 2 Vertical (1:2)
for(let i=0; i<2; i++) {
  const illus = illustrationsData[i+3] || illustrationsData[0];
  contentPoolData.push({
    ratioType: 'vertical_9_21',
    content: { 
      id: `v3c-${i}`, type: 'image', src: illus.src, title: illus.title,
      width: 1.0, height: 2.0, depthOffset: Math.random()*0.3 
    },
    desc: { id: `v3cd-${i}`, type: 'about_text', description: `1:2 の縦長ラインを活かした作品。`, width: 1.0, height: 1.0, depthOffset: Math.random()*0.3 }
  });
}

// Add 2 more 3:1 blocks (for SoundCloud)
for(let i=3; i<5; i++) {
  contentPoolData.push({
    ratioType: 'horizontal',
    content: { id: `hc-${i}`, type: 'soundcloud', trackId: "270383324", width: 3.0, height: 1.0, depthOffset: Math.random()*0.3 },
    desc: { id: `hcd-${i}`, type: 'about_text', description: `SoundCloud ${i} の詳細情報。`, width: 1.2, height: 1.0, depthOffset: Math.random()*0.3 }
  });
}

// Add 1 more 2:1 block
contentPoolData.push({
  ratioType: 'horizontal',
  content: { 
    id: `21c-1`, type: 'image', src: illustrationsData[4]?.src || illustrationsData[0].src, title: illustrationsData[4]?.title || "",
    width: 2.0, height: 1.0, depthOffset: Math.random()*0.3 
  },
  desc: { id: `21cd-1`, type: 'about_text', description: `2:1 アスペクト比の追加作品。`, width: 1.0, height: 1.0, depthOffset: Math.random()*0.3 }
});

// Add 1 more 1:1.414
contentPoolData.push({
  ratioType: 'vertical_1_1414',
  content: { 
    id: `v1c-3`, type: 'image', src: illustrationsData[5]?.src || illustrationsData[0].src, title: illustrationsData[5]?.title || "",
    width: 1.414, height: 2.0, depthOffset: Math.random()*0.3 
  },
  desc: { id: `v1cd-3`, type: 'about_text', description: `1:1.414 縦型ブロック(4つ目)。`, width: 1.1, height: 1.2, depthOffset: Math.random()*0.3 }
});

// Add 1 more 9:21
contentPoolData.push({
  ratioType: 'vertical_9_21',
  content: { 
    id: `v2c-3`, type: 'image', src: illustrationsData[6]?.src || illustrationsData[0].src, title: illustrationsData[6]?.title || "",
    width: 1.2, height: 2.8, depthOffset: Math.random()*0.3 
  },
  desc: { id: `v2cd-3`, type: 'about_text', description: `9:21 縦型ブロック(4つ目)。`, width: 1.3, height: 1.2, depthOffset: Math.random()*0.3 }
});

// Add 1 more 1:2
contentPoolData.push({
  ratioType: 'vertical_9_21',
  content: { 
    id: `v3c-2`, type: 'image', src: illustrationsData[7]?.src || illustrationsData[0].src, title: illustrationsData[7]?.title || "",
    width: 1.0, height: 2.0, depthOffset: Math.random()*0.3 
  },
  desc: { id: `v3cd-2`, type: 'about_text', description: `1:2 縦型ブロック(3つ目)。`, width: 1.0, height: 1.0, depthOffset: Math.random()*0.3 }
});

// Add 1 more 1:1
contentPoolData.push({
  ratioType: 'vertical_1_1414',
  content: { 
    id: `sqc-2`, type: 'image', src: illustrationsData[8]?.src || illustrationsData[0].src, title: illustrationsData[8]?.title || "",
    width: 2.0, height: 2.0, depthOffset: Math.random()*0.3 
  },
  desc: { id: `sqcd-2`, type: 'about_text', description: `正方形ブロック(3つ目)。`, width: 1.2, height: 1.2, depthOffset: Math.random()*0.3 }
});


// Fallback old array to avoid breaking things entirely before we replace the InfiniteWall logic
export const portfolioData: GridItemData[] = [
  ...navData,
  ...contentPoolData.map(c => c.content),
  ...contentPoolData.map(c => c.desc)
];

