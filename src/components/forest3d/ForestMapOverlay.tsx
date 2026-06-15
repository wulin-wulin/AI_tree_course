import { Link } from 'react-router-dom';

export type OverlayProps = {
  litCount: number;
  total: number;
  onResetView: () => void;
};

export default function ForestMapOverlay({ litCount, total, onResetView }: OverlayProps) {
  return (
    <>
      <header className="forest3d-topbar">
        <Link to="/" className="forest3d-back">← 返回书架</Link>
        <span className="forest3d-title">知识森林地图</span>
        <button
          type="button"
          className="forest3d-viewbtn"
          onClick={onResetView}
          aria-label="回到最佳视角：正面俯视、居中、默认距离"
        >
          ↺ 回到最佳视角
        </button>
        <span className="forest3d-progress" aria-label={`已点亮 ${litCount} / ${total} 个知识点`}>
          已点亮 {litCount}/{total}
        </span>
      </header>
      <div className="forest3d-hint" aria-hidden="true">
        🖱 滚轮缩放 · 左键平移 · 右键旋转 · 点树进入小节
      </div>
    </>
  );
}
