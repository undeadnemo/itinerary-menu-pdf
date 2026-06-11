/**
 * 预置字体 — 放在 public/fonts/ 目录下，对所有用户可用。
 *
 * 使用方式：
 * 1. 将字体文件（.ttf / .otf / .woff / .woff2）复制到 public/fonts/
 * 2. 在此数组中添加一条记录：
 *    { name: '字魂书雅颂', file: '字魂书雅颂.ttf' }
 * 3. 重新构建项目（npm run build）
 *
 * 预置字体加载后会自动出现在样式设置的字体下拉菜单中，
 * 无需每个用户单独上传。
 */
const presetFonts = [
  { name: '字魂书雅宋-Regular', file: '字魂书雅宋-Regular.ttf' },
  { name: '字魂书雅宋-Medium', file: '字魂书雅宋-Medium.ttf' },
  { name: '字魂书雅宋-Bold', file: '字魂书雅宋-Bold.ttf' },
  { name: '字魂书雅宋-Light', file: '字魂书雅宋-Light.ttf' },
]

export default presetFonts
