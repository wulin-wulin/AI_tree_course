function AttentionFlow() {
  return (
    <div className="animation-stage attention-stage" aria-label="注意力机制动画">
      <svg viewBox="0 0 420 170" role="img">
        {['Query', 'Key', 'Value', 'Context'].map((token, index) => (
          <g key={token} transform={`translate(${28 + index * 96}, 104)`}>
            <rect width="76" height="34" rx="14" className="anim-token" />
            <text x="38" y="22" textAnchor="middle">{token}</text>
          </g>
        ))}
        <path id="attentionArcA" d="M66 104C96 30 228 30 258 104" className="anim-flow-line strong" />
        <path id="attentionArcB" d="M162 104C184 62 236 62 258 104" className="anim-flow-line" />
        <circle r="5" className="flow-dot dot-a">
          <animateMotion dur="2.7s" repeatCount="indefinite">
            <mpath href="#attentionArcA" />
          </animateMotion>
        </circle>
        <circle r="4" className="flow-dot dot-b">
          <animateMotion dur="2s" repeatCount="indefinite">
            <mpath href="#attentionArcB" />
          </animateMotion>
        </circle>
      </svg>
    </div>
  );
}

export default AttentionFlow;
