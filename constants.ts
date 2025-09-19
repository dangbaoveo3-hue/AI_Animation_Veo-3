
export const LOADING_MESSAGES: string[] = [
  "Igniting the creative sparks of the AI...",
  "Teaching the AI to dream in pixels and code...",
  "Assembling the digital orchestra for your masterpiece...",
  "The AI is painting with light and shadow...",
  "Translating your vision into a cinematic sequence...",
  "Rendering the final frames, this may take a moment...",
  "Almost there, polishing the final animation...",
];

export const ANIMATION_STYLES: { name: string; prompt: string; description: string; }[] = [
    { name: 'None', prompt: '', description: 'Không áp dụng phong cách cụ thể.' },
    { name: 'Cinematic', prompt: 'Cinematic, hyper-detailed, 8k, dramatic lighting, epic scope.', description: 'Tạo ra một giao diện điện ảnh, kịch tính với chi tiết cao và ánh sáng hùng vĩ.' },
    { name: 'Anime', prompt: 'Japanese anime style, vibrant colors, sharp lines, expressive characters.', description: 'Phong cách hoạt hình Nhật Bản với màu sắc rực rỡ và các nhân vật biểu cảm.' },
    { name: '3D Animation', prompt: 'Dynamic 3D animation, complex models and environments, cinematic lighting, fluid character motion, strong sense of depth and perspective.', description: 'Hoạt hình 3D động, mô hình phức tạp và chuyển động nhân vật mượt mà.' },
    { name: 'Photorealistic 3D', prompt: 'Photorealistic CGI, ultra-realistic, 8k, Unreal Engine 5 render, cinematic lighting, ray tracing, physically-based rendering, hyper-detailed textures.', description: 'Đồ họa 3D siêu thực, tiệm cận chất lượng game bom tấn với ánh sáng ray-tracing.' },
    { name: 'Pixar Style', prompt: 'Pixar-style 3D animation, vibrant colors, expressive characters, detailed textures, cinematic quality, heartwarming storytelling.', description: 'Hoạt hình 3D theo phong cách Pixar, ấm áp với các nhân vật biểu cảm.' },
    { name: 'Disney Style', prompt: 'Disney-style 3D animation, classic fairytale aesthetic, expressive, large eyes, fluid motion, magical and enchanting atmosphere.', description: 'Thẩm mỹ cổ tích Disney cổ điển, đầy mê hoặc và huyền diệu.' },
    { name: 'Dreamworks Style', prompt: 'Dreamworks-style 3D animation, slightly stylized characters, dynamic action sequences, witty and humorous tone, expressive faces.', description: 'Phong cách Dreamworks với các pha hành động và biểu cảm hài hước.' },
    { name: '3D Cartoon', prompt: 'Stylized 3D cartoon animation, bold colors, clean outlines, expressive and simplified character models, playful and vibrant atmosphere.', description: 'Hoạt hình 3D cách điệu, vui tươi với màu sắc đậm và đường nét rõ ràng.' },
    { name: 'Pixel Art', prompt: '16-bit pixel art style, retro gaming aesthetic, limited color palette.', description: 'Thẩm mỹ game retro 16-bit với bảng màu giới hạn.' },
    { name: 'Claymation', prompt: 'Stop-motion claymation style, handcrafted look, slight imperfections.', description: 'Phong cách hoạt hình đất sét tĩnh vật, mang lại cảm giác thủ công.' },
    { name: 'Watercolor', prompt: 'Watercolor painting style, soft edges, blended colors, artistic feel.', description: 'Phong cách tranh màu nước với các cạnh mềm mại và màu sắc hòa quyện.' },
    { name: 'Cyberpunk', prompt: 'Cyberpunk style, neon-drenched cityscapes, futuristic, high-tech, dystopian feel.', description: 'Thành phố tương lai ngập trong ánh đèn neon, cảm giác công nghệ cao và phản địa đàng.' },
    { name: 'Vintage Film', prompt: 'Old-fashioned film look, grainy texture, muted colors, film scratches, 1950s aesthetic.', description: 'Giao diện phim cũ với nhiễu hạt, màu sắc trầm và thẩm mỹ thập niên 50.'}
];

export const POST_PROCESSING_EFFECTS: { id: string; name: string; prompt: string; description: string; }[] = [
  { id: 'film_grain', name: 'Film Grain (Nhiễu phim)', prompt: 'subtle film grain, cinematic texture', description: 'Thêm một lớp nhiễu hạt tinh tế để tạo cảm giác phim nhựa cổ điển.' },
  { id: 'bloom', name: 'Bloom (Ánh sáng tỏa)', prompt: 'soft bloom effect, glowing highlights, ethereal lighting', description: 'Làm cho các vùng sáng tỏa ra một cách mềm mại, tạo ra ánh sáng thơ mộng.' },
  { id: 'vignette', name: 'Vignette (Tối góc)', prompt: 'cinematic vignette, darkened corners, focus on center', description: 'Làm tối các góc của hình ảnh để tập trung sự chú ý vào trung tâm.' },
  { id: 'chromatic_aberration', name: 'Chromatic Aberration (Sai sắc)', prompt: 'slight chromatic aberration, lens distortion effect', description: 'Tạo ra hiệu ứng viền màu nhẹ ở các cạnh tương phản cao, giống như ống kính máy ảnh.' },
  { id: 'lens_flare', name: 'Lens Flare (Lóa ống kính)', prompt: 'anamorphic lens flare, cinematic light streaks', description: 'Mô phỏng các vệt sáng lóe lên khi ánh sáng mạnh chiếu vào ống kính.' },
  { id: 'dof', name: 'Depth of Field (Độ sâu trường ảnh)', prompt: 'shallow depth of field, beautiful bokeh, blurred background', description: 'Tạo ra hậu cảnh mờ ảo, làm nổi bật chủ thể chính.' },
  { id: 'teal_orange', name: 'Teal & Orange', prompt: 'teal and orange color grading, cinematic color scheme', description: 'Áp dụng tông màu xanh mòng két và cam phổ biến trong các bộ phim Hollywood.' },
  { id: 'sepia', name: 'Sepia Tone (Tông màu nâu đỏ)', prompt: 'sepia tone, vintage, old photo look', description: 'Mang lại cho hình ảnh một tông màu nâu đỏ ấm áp, cổ điển.' },
  { id: 'scanlines', name: 'Scanlines (Vạch quét)', prompt: 'CRT screen effect, visible scanlines, retro aesthetic', description: 'Tạo hiệu ứng các đường quét ngang giống như trên màn hình TV cũ.' },
];

export const ASPECT_RATIOS: { id: string; name: string; prompt: string }[] = [
    { id: '16:9', name: 'Landscape (16:9)', prompt: ', cinematic widescreen, 16:9 aspect ratio' },
    { id: '9:16', name: 'Portrait (9:16)', prompt: ', vertical format, 9:16 aspect ratio' },
    { id: '1:1', name: 'Square (1:1)', prompt: ', square format, 1:1 aspect ratio' },
    { id: '4:3', name: 'Standard (4:3)', prompt: ', standard 4:3 aspect ratio' },
    { id: '21:9', name: 'Cinematic (21:9)', prompt: ', ultra-widescreen, 21:9 aspect ratio, anamorphic look' }
];

export const IMAGE_ASPECT_RATIOS: { id: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'; name: string; }[] = [
    { id: '1:1', name: 'Vuông' },
    { id: '16:9', name: 'Ngang' },
    { id: '9:16', name: 'Dọc' },
    { id: '4:3', name: 'Ảnh' },
    { id: '3:4', name: 'Chân dung' }
];

export const QUALITY_LEVELS: { value: number; label: string; prompt: string }[] = [
    { value: 144, label: '144p', prompt: ', 144p resolution, low quality' },
    { value: 360, label: '360p', prompt: ', 360p resolution' },
    { value: 480, label: '480p', prompt: ', 480p resolution, SD quality' },
    { value: 720, label: '720p', prompt: ', 720p resolution, HD quality' },
    { value: 1080, label: '1080p', prompt: ', 1080p resolution, Full HD quality, sharp details' }
];

export const MOTION_BLUR_LEVELS: { id: string; name: string; prompt: string }[] = [
    { id: 'none', name: 'None', prompt: '' },
    { id: 'low', name: 'Low', prompt: ', low motion blur' },
    { id: 'medium', name: 'Medium', prompt: ', medium motion blur' },
    { id: 'high', name: 'High', prompt: ', high motion blur, cinematic' }
];

export const CAMERA_SHOTS: { name: string; prompt: string }[] = [
  { name: 'Default (Mặc định)', prompt: '' },
  { name: 'Full Shot (Toàn cảnh)', prompt: 'Full shot' },
  { name: 'Medium Shot (Trung cảnh)', prompt: 'Medium shot' },
  { name: 'Close-up (Cận cảnh)', prompt: 'Close-up shot' },
  { name: 'Extreme Close-up (Đặc tả)', prompt: 'Extreme close-up' },
  { name: 'Long Shot (Viễn cảnh)', prompt: 'Long shot' },
  { name: 'Establishing Shot (Cảnh thiết lập)', prompt: 'Establishing shot' },
  { name: 'Point of View (Góc nhìn)', prompt: 'POV shot' },
];

export const CAMERA_ANGLES: { name: string; prompt: string }[] = [
  { name: 'Default (Mặc định)', prompt: '' },
  { name: 'Eye-Level (Ngang tầm mắt)', prompt: 'Eye-level angle' },
  { name: 'High Angle (Góc cao)', prompt: 'High angle' },
  { name: 'Low Angle (Góc thấp)', prompt: 'Low angle' },
  { name: 'Dutch Angle (Góc nghiêng)', prompt: 'Dutch angle' },
  { name: 'Over-the-Shoulder (Qua vai)', prompt: 'Over-the-shoulder shot' },
];

export const CAMERA_MOTIONS: { name: string; prompt: string }[] = [
  { name: 'Default (Mặc định)', prompt: '' },
  { name: 'Static (Tĩnh)', prompt: 'Static shot' },
  { name: 'Pan Left (Lia trái)', prompt: 'Camera pan left' },
  { name: 'Pan Right (Lia phải)', prompt: 'Camera pan right' },
  { name: 'Tilt Up (Nghiêng lên)', prompt: 'Camera tilt up' },
  { name: 'Tilt Down (Nghiêng xuống)', prompt: 'Camera tilt down' },
  { name: 'Dolly In (Tiến vào)', prompt: 'Dolly in' },
  { name: 'Dolly Out (Lùi ra)', prompt: 'Dolly out' },
  { name: 'Tracking Shot (Theo dõi)', prompt: 'Tracking shot' },
];

export const CAMERA_LENSES: { name: string; prompt: string }[] = [
  { name: 'Default (Mặc định)', prompt: '' },
  { name: 'Wide Angle (Góc rộng)', prompt: 'Wide-angle lens' },
  { name: 'Telephoto (Chụp xa)', prompt: 'Telephoto lens' },
  { name: 'Fisheye (Mắt cá)', prompt: 'Fisheye lens' },
  { name: 'Macro (Cận cảnh)', prompt: 'Macro lens' },
];