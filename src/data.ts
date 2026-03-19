export type ContentType = 'image' | 'youtube' | 'soundcloud' | 'project' | 'contact' | 'empty';

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
}

// Generate some sample data for the wall
export const generateMockData = (): GridItemData[] => {
  const items: GridItemData[] = [];
  
  // Specific content items
  items.push({ id: "content-1", type: "image", title: "Key Visual", src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe", width: 2, height: 3, depthOffset: 0.4 });
  items.push({ id: "content-2", type: "youtube", title: "Latest Track", videoId: "dQw4w9WgXcQ", width: 2, height: 1.5, depthOffset: 0.2 });
  items.push({ id: "content-3", type: "contact", title: "Contact Me", description: "依頼やご相談はこちら：\nexample@portfolio.com", width: 1.5, height: 1.5, depthOffset: 0.5 });
  items.push({ id: "content-4", type: "project", title: "Mini App", description: "作った小さなソフトウェア", src: "https://github.com", width: 2, height: 1, depthOffset: 0.3 });

  // Fill the rest with empty blocks to create the "wall"
  for(let i = 0; i < 50; i++) {
    items.push({
      id: `empty-${i}`,
      type: 'empty',
      width: Math.random() > 0.8 ? 2 : 1,
      height: Math.random() > 0.8 ? 2 : 1,
      depthOffset: Math.random() * 0.3 // Slight depth variation
    });
  }
  
  return items;
};

export const portfolioData = generateMockData();
