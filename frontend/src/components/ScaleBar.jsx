import { useEffect, useState } from 'react'
import { Cartesian2, Cartesian3 } from 'cesium'
import './ScaleBar.css'

// 將任意米數化為易讀的整數刻度
function niceScale(meters) {
  const candidates = [
    1, 2, 5, 10, 20, 50, 100, 200, 500,
    1000, 2000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000,
  ]
  // 找出最接近 100px 對應距離的好看整數
  let best = candidates[0]
  for (const c of candidates) {
    if (c <= meters) best = c
  }
  if (best >= 1000) return { value: best, label: `${best / 1000} km` }
  return { value: best, label: `${best} m` }
}

export default function ScaleBar({ viewer }) {
  const [scale, setScale] = useState(null)

  useEffect(() => {
    if (!viewer) return

    const BAR_PX = 100 // 參考像素寬度

    function update() {
      const canvas = viewer.scene.canvas
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return
      const half = BAR_PX / 2

      const leftPt  = viewer.camera.pickEllipsoid(new Cartesian2(w / 2 - half, h / 2))
      const rightPt = viewer.camera.pickEllipsoid(new Cartesian2(w / 2 + half, h / 2))
      if (!leftPt || !rightPt) return

      const metersFor100px = Cartesian3.distance(leftPt, rightPt)
      if (!isFinite(metersFor100px) || metersFor100px <= 0) return

      const nice = niceScale(metersFor100px)
      const barWidth = Math.round(BAR_PX * (nice.value / metersFor100px))
      setScale({ label: nice.label, width: barWidth })
    }

    viewer.camera.moveEnd.addEventListener(update)
    update()
    return () => viewer.camera.moveEnd.removeEventListener(update)
  }, [viewer])

  if (!viewer || !scale) return null

  return (
    <div className="scalebar">
      <div className="scalebar-bar" style={{ width: scale.width }} />
      <div className="scalebar-label">{scale.label}</div>
    </div>
  )
}
