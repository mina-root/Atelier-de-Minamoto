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

export type ContentType = 'image' | 'youtube' | 'soundcloud' | 'project' | 'contact' | 'empty' | 'illustration_folder' | 'about_name' | 'about_icon' | 'about_text' | 'pagination' | 'usage_report' | 'booth_item';

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
  { id: "illus-1", src: "/illustrations/Outpost_Dissonance.jpg", title: "Outpost:Dissonance -advance-  ジャケット", caption: "楽曲『Outpost:Dissonance』ジャケット", aspectRatio: 1.0 },
  { id: "illus-2", src: "/illustrations/a_grain.png", title: "a grain", aspectRatio: 0.9949 },
  { id: "illus-3", src: "/illustrations/dropsound.jpg", title: "Dropsound.", aspectRatio: 1.5175 },
  { id: "illus-4", src: "/illustrations/magsafeangel.jpg", title: "MagsafeAngel", aspectRatio: 0.4766 },
  { id: "illus-5", src: "/illustrations/向こう側.png", title: "向こう側", aspectRatio: 0.4614 },
  { id: "illus-6", src: "/illustrations/拡散する未来.png", title: "拡散する未来", aspectRatio: 1.6667 },
  { id: "illus-7", src: "/illustrations/浮遊.png", title: "浮遊", aspectRatio: 0.4619 },
  { id: "illus-8", src: "/illustrations/狂信.PNG", title: "狂信(イラスト)", aspectRatio: 1.7778 },
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
    title: "Outpost:Dissonance  -advance-",
    caption: "",
    aspectRatio: 3.0
  },
  {
    id: "disco-2",
    type: "youtube",
    videoId: "_l0dadAMPww",
    src: "https://img.youtube.com/vi/_l0dadAMPww/maxresdefault.jpg",
    title: "おのれ / 重音テト・花隈千冬",
    caption: "ボカデュオ2024参加曲",
    aspectRatio: 1.7778
  },
  {
    id: "disco-3",
    type: "youtube",
    videoId: "Gsn3BRKPxps",
    src: "/illustrations/狂信.PNG",
    title: "狂信 / 花隈千冬",
    caption: "",
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
    description: "イラスト・音楽を中心にいろいろ作っています。\nちゃがちゃが人工言語Artcoreなど。\n", 
    width: 1.2, 
    height: 1.2, 
    depthOffset: 0.5 
  }
];

// 11 Illustrations + 3 Songs = 14 initial content block pairs
export const contentPoolData: { content: GridItemData, desc?: GridItemData }[] = [];

illustrationsData.forEach((illus, i) => {
  const targetArea = 3.5;
  const h = Math.sqrt(targetArea / illus.aspectRatio);
  const w = h * illus.aspectRatio;
  
  contentPoolData.push({
    content: {
      id: `illus-c-${i}`,
      type: 'image',
      src: illus.src,
      title: illus.title,
      width: w,
      height: h,
      depthOffset: Math.random() * 0.3,
      illustrationItems: [illus]
    },
    desc: {
      id: `illus-d-${i}`,
      type: 'about_text',
      description: illus.title || illus.caption,
      width: 1.2,
      height: 1.0,
      depthOffset: Math.random() * 0.3
    }
  });
});

discographyData.forEach((song, i) => {
  contentPoolData.push({
    content: {
      id: `song-c-${i}`,
      type: song.type || 'image',
      videoId: song.videoId,
      trackId: song.trackId,
      src: song.src,
      title: song.title,
      width: song.aspectRatio > 2 ? 3.0 : 2.4, // 3.0 for soundcloud, 2.4 for youtube
      height: song.aspectRatio > 2 ? 1.0 : 1.35,
      depthOffset: Math.random() * 0.3,
      illustrationItems: [song]
    },
    desc: {
      id: `song-d-${i}`,
      type: 'about_text',
      description: song.title || song.caption,
      width: 1.2,
      height: 1.0,
      depthOffset: Math.random() * 0.3
    }
  });
});

export const requestFullText = `✦ ご依頼について

有償にて、イラストおよび楽曲制作を承っております。

用途・ご希望内容をご説明いただければ、それに応じたご提案をいたします。
ご予算がある場合はあわせてご提示いただけますと、内容を調整しやすくなります。

また、簡易的なご依頼については Skeb での受付も可能です。
Skebは比較的安価にご利用いただけますが、納品物について完成度に異議を申し立てることはできません。
また、打ち合わせやリテイクを行うことはできませんし、受注を確約するものでもありません。
Skebはコミッションを行うプラットフォームであるため、その点をご理解ください。
詳しい内容についてはSkebのガイドライン(https://lp.skeb.jp/client)をご確認ください。

■ 着手・納期

状況により変動しますが、おおよそ制作には以下の期間を目安としていただきます。

イラスト：1週間〜1ヶ月
楽曲制作：1ヶ月〜3ヶ月

内容・スケジュールにより前後しますので、詳細はご相談ください。

■ 料金・権利について

商用利用・法人案件は追加料金をいただきます。
著作権は原則として譲渡いたしません。

著作権譲渡をご希望の場合は、別途ご相談ください（追加料金あり）

■ ご依頼方法

上記内容に同意いただける場合、XのDMよりご連絡ください。
お気軽にご相談いただければ嬉しいです。`;

export const termsFullText = `✦ 制作物の利用について

■ 個人・非商用利用

使用報告（事後可）をいただければ、自由にご利用いただけます。
例：SNS投稿／趣味制作／学校課題 など

■ 同人・創作活動での利用

無償または小規模な活動での利用も、使用報告（事後可）のみで可能です。
ただし、クレジット表記をお願いいたします。

例：
「歌ってみた」動画へのイラスト・楽曲利用
営利を目的としない範囲での音ゲーへの収録（ユーザー投稿コンテンツなど）

※楽曲に付随するジャケットイラスト等については、原則として楽曲と一体の作品として扱ってください。
イラスト単体での利用を希望される場合は、事前にご相談ください。

■ 商用利用

商業作品・収益性の高い用途については、事前にご相談ください。
例：企業案件／商業出版／ゲーム組み込み など

■ 禁止事項

公序良俗に反する利用
政治的・宗教的な意図を含んだ利用
二次配布・再配布を主目的とした利用

■ 著作権について

すべての作品の著作権は作者（ミナモト）に帰属します。
原則として譲渡は行っておりません。

■ データ提供について

用途に応じて、元データ等の提供が可能な場合があります。
必要な場合はご相談ください。`;

export const requestTextDataArray: GridItemData[] = [
  {
    id: 'text-request-trigger',
    type: 'about_text',
    title: 'ご依頼について',
    description: requestFullText,
    width: 1.8,
    height: 0.7,
    depthOffset: 0.1
  }
];

export const termsTextDataArray: GridItemData[] = [
  {
    id: 'text-terms-trigger',
    type: 'about_text',
    title: '制作物の利用について',
    description: termsFullText,
    width: 2.4,
    height: 0.7,
    depthOffset: 0.1
  }
];

export const reportTextDataArray: GridItemData[] = [
  {
    id: 'text-report-trigger',
    type: 'usage_report',
    title: '使用報告はこちら',
    src: 'https://docs.google.com/forms/d/e/1FAIpQLSeVOAJVZB4h4BGue2ew3dOtXlSq668Pb6jgr4WrOFwbOeCutA/viewform?usp=publish-editor',
    width: 1.2,
    height: 0.4,
    depthOffset: 0.15
  }
];

export const boothDataArray: GridItemData[] = [
  {
    id: 'booth-ring',
    type: 'booth_item',
    title: '【VRChat向けアクセサリ】pair ring -chocolate & macaron-',
    src: 'https://mina-root.booth.pm/items/6719210',
    width: 2.0,
    height: 1.6,
    depthOffset: 0.2,
    illustrationItems: [
      {
        id: 'booth-ring-img',
        src: '/Booth/choco_macaron.png',
        aspectRatio: 1.0, 
      }
    ]
  }
];

// Add the Booth item to the general content pool so it has a caption and is placed like others
boothDataArray.forEach((item, i) => {
  contentPoolData.push({
    content: {
      ...item,
      id: `booth-c-${i}`,
      width: 1.8,  // Square size
      height: 1.8,
      depthOffset: Math.random() * 0.3,
    },
    desc: {
      id: `booth-d-${i}`,
      type: 'about_text',
      description: item.title,
      width: 1.2,
      height: 1.0,
      depthOffset: Math.random() * 0.3
    }
  });
});


// Fallback logic
export const portfolioData: GridItemData[] = [
  ...contentPoolData.map(c => c.content)
];


