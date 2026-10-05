/** Ilustrasi QR dekoratif (bukan QR sungguhan) untuk landing page. */
const SIZE = 21;

function cell(x: number, y: number): boolean {
  // tiga finder pattern
  const inFinder = (fx: number, fy: number) =>
    x >= fx && x < fx + 7 && y >= fy && y < fy + 7;
  const finder = (fx: number, fy: number) => {
    const dx = x - fx;
    const dy = y - fy;
    const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
    const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
    return edge || core;
  };
  if (inFinder(0, 0)) return finder(0, 0);
  if (inFinder(SIZE - 7, 0)) return finder(SIZE - 7, 0);
  if (inFinder(0, SIZE - 7)) return finder(0, SIZE - 7);
  if (
    (x === 7 && y < 8) ||
    (y === 7 && x < 8) ||
    (x === SIZE - 8 && y < 8) ||
    (y === 7 && x > SIZE - 9) ||
    (x === 7 && y > SIZE - 9) ||
    (y === SIZE - 8 && x < 8)
  )
    return false;
  // pola semu-acak deterministik
  return ((x * 31 + y * 17 + x * y * 7) ^ (x + y * 3)) % 3 === 0;
}

export default function QrVisual() {
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (cell(x, y)) {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" rx="0.15" />);
      }
    }
  }
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-black/30">
        <div className="relative overflow-hidden rounded-xl">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block w-full fill-navy" aria-hidden>
            {cells}
          </svg>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="h-1/6 animate-scan border-b-2 border-cyan-500 bg-gradient-to-b from-transparent to-cyan-500/20" />
          </div>
        </div>
      </div>
      {/* sudut penanda scan */}
      <span className="absolute -left-2 -top-2 h-6 w-6 rounded-tl-xl border-l-2 border-t-2 border-cyan-400" />
      <span className="absolute -right-2 -top-2 h-6 w-6 rounded-tr-xl border-r-2 border-t-2 border-cyan-400" />
      <span className="absolute -bottom-2 -left-2 h-6 w-6 rounded-bl-xl border-b-2 border-l-2 border-cyan-400" />
      <span className="absolute -bottom-2 -right-2 h-6 w-6 rounded-br-xl border-b-2 border-r-2 border-cyan-400" />
    </div>
  );
}
