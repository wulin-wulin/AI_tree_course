const searchCells = [
  'start', 'frontier', 'frontier', '', '',
  'visited', 'wall', 'frontier', '', '',
  'visited', 'visited', 'path', 'frontier', '',
  '', 'wall', 'path', 'path', 'goal',
];

function SearchExpansion() {
  return (
    <div className="animation-stage search-stage" aria-label="A星搜索动画">
      <div className="search-grid-animation">
        {searchCells.map((cell, index) => (
          <span
            key={`${cell}-${index}`}
            className={`search-cell ${cell}`}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            {cell === 'start' ? 'S' : cell === 'goal' ? 'G' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export default SearchExpansion;
