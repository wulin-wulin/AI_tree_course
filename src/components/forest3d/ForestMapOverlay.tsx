import { Link } from 'react-router-dom';

export type OverlayProps = {
  litCount: number;
  total: number;
  viewLabel: string;
  onCycleView: () => void;
};

export default function ForestMapOverlay({ litCount, total, viewLabel, onCycleView }: OverlayProps) {
  return (
    <>
      <header className="forest3d-topbar">
        <Link to="/" className="forest3d-back">← 返回书架</Link>
        <span className="forest3d-title">知识森林地图</span>
        <button
          type="button"
          className="forest3d-viewbtn"
          onClick={onCycleView}
          aria-label={`切换俯视角度，当前：${viewLabel}`}
        >
          视角：{viewLabel}
        </button>
        <span className="forest3d-progress" aria-label={`已点亮 ${litCount} / ${total} 个知识点`}>
          已点亮 {litCount}/{total}
        </span>
      </header>
      <div className="forest3d-hint" aria-hidden="true">
        🖱 滚轮缩放 · 拖拽平移 · 点树进入小节
      </div>
    </>
  );
}
