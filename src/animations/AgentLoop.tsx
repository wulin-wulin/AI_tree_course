function AgentLoop() {
  return (
    <div className="animation-stage loop-stage" aria-label="智能体环境闭环动画">
      <svg viewBox="0 0 420 170" role="img">
        <rect x="54" y="62" width="96" height="48" rx="18" className="anim-token" />
        <rect x="270" y="62" width="96" height="48" rx="18" className="anim-token alt" />
        <text x="102" y="92" textAnchor="middle">Agent</text>
        <text x="318" y="92" textAnchor="middle">Env</text>
        <path id="loopTop" d="M150 74C196 30 230 30 270 74" className="anim-flow-line strong" />
        <path id="loopBottom" d="M270 102C226 142 188 142 150 102" className="anim-flow-line" />
        <text x="210" y="45" textAnchor="middle">Action</text>
        <text x="210" y="143" textAnchor="middle">Reward / Observation</text>
        <circle r="6" className="flow-dot dot-a">
          <animateMotion dur="2.4s" repeatCount="indefinite">
            <mpath href="#loopTop" />
          </animateMotion>
        </circle>
        <circle r="5" className="flow-dot dot-b">
          <animateMotion dur="2.4s" begin=".8s" repeatCount="indefinite">
            <mpath href="#loopBottom" />
          </animateMotion>
        </circle>
      </svg>
    </div>
  );
}

export default AgentLoop;
