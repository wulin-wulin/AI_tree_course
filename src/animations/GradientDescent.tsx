function GradientDescent() {
  return (
    <div className="animation-stage gradient-stage" aria-label="梯度下降动画">
      <svg viewBox="0 0 420 170" role="img">
        <path d="M44 128 C92 22 150 38 186 105 C220 164 282 148 362 42" className="anim-loss-curve" />
        <path id="descentPath" d="M91 43 C120 44 148 64 171 95 C195 126 223 139 252 133" fill="none" />
        <circle r="9" className="descent-ball">
          <animateMotion dur="3.6s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.82;1" calcMode="spline" keySplines=".4 0 .2 1;0 0 1 1">
            <mpath href="#descentPath" />
          </animateMotion>
        </circle>
        <text x="210" y="154" textAnchor="middle">{'theta <- theta - eta * grad J(theta)'}</text>
      </svg>
    </div>
  );
}

export default GradientDescent;
