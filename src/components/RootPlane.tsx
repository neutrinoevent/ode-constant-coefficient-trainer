import { fNum } from '../lib/frac'
import type { RootSet } from '../lib/roots'

/**
 * Roots drawn in the complex plane.
 *
 * The picture is the case taxonomy: everything on the real axis is Case I or
 * II, anything off it is Case III, left half means decay and right half means
 * growth, and a ring marks a repeated root — the one feature that changes the
 * basis rather than the numbers in it.
 */
export function RootPlane({ roots, range = 5 }: { roots: RootSet; range?: number }) {
  const size = 240
  const pad = 18
  const span = size - 2 * pad
  const toX = (re: number) => pad + ((re + range) / (2 * range)) * span
  const toY = (im: number) => pad + ((range - im) / (2 * range)) * span

  const points: { re: number; im: number; mult: number }[] = []
  for (const r of roots) {
    if (r.kind === 'real') points.push({ re: fNum(r.m), im: 0, mult: r.mult })
    else {
      points.push({ re: fNum(r.a), im: fNum(r.b), mult: r.mult })
      points.push({ re: fNum(r.a), im: -fNum(r.b), mult: r.mult })
    }
  }

  const ticks = Array.from({ length: 2 * range + 1 }, (_, i) => i - range).filter((v) => v !== 0)

  return (
    <svg
      className="root-plane"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Roots plotted in the complex plane: ${points
        .map((p) => `${p.re} ${p.im >= 0 ? '+' : '-'} ${Math.abs(p.im)}i`)
        .join(', ')}`}
    >
      {ticks.map((v) => (
        <g key={v}>
          <line className="plane-grid" x1={toX(v)} y1={pad} x2={toX(v)} y2={size - pad} />
          <line className="plane-grid" x1={pad} y1={toY(v)} x2={size - pad} y2={toY(v)} />
        </g>
      ))}
      <line className="plane-axis" x1={pad} y1={toY(0)} x2={size - pad} y2={toY(0)} />
      <line className="plane-axis" x1={toX(0)} y1={pad} x2={toX(0)} y2={size - pad} />
      <text className="plane-label" x={size - pad + 2} y={toY(0) - 4}>
        Re
      </text>
      <text className="plane-label" x={toX(0) + 4} y={pad - 5}>
        Im
      </text>
      {[-range + 1, range - 1].map((v) => (
        <text key={v} className="plane-label" x={toX(v) - 3} y={toY(0) + 11}>
          {v}
        </text>
      ))}

      {points.map((p, i) => (
        <g key={i}>
          {p.mult > 1 ? <circle className="plane-ring" cx={toX(p.re)} cy={toY(p.im)} r={8} /> : null}
          <circle className="plane-root" cx={toX(p.re)} cy={toY(p.im)} r={4.5} />
          {p.mult > 1 ? (
            <text className="plane-mult" x={toX(p.re)} y={toY(p.im) - 12}>
              ×{p.mult}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  )
}
