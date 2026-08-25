import { useEffect, useRef } from 'react'
import { Math as CesiumMath } from 'cesium'
import './Compass.css'

export default function Compass({ viewer }) {
  const needleRef = useRef(null)

  useEffect(() => {
    if (!viewer) return

    function update() {
      if (!needleRef.current) return
      const heading = viewer.camera.heading
      if (heading == null || !isFinite(heading)) return
      const deg = CesiumMath.toDegrees(heading)
      needleRef.current.style.transform = `rotate(${deg}deg)`
    }

    viewer.camera.changed.addEventListener(update)
    update()
    return () => viewer.camera.changed.removeEventListener(update)
  }, [viewer])

  function resetView() {
    if (!viewer) return
    viewer.camera.flyTo({
      destination: viewer.camera.positionWC,
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-90),
        roll: 0,
      },
      duration: 0.8,
    })
  }

  if (!viewer) return null

  return (
    <div className="compass" title="點擊重設視角：朝北 / 垂直俯瞰" onClick={resetView}>
      <svg ref={needleRef} viewBox="0 0 44 44" className="compass-svg">
        {/* 外圈 */}
        <circle cx="22" cy="22" r="20" className="compass-ring" />
        {/* 北（紅） */}
        <polygon points="22,4 26,22 22,19 18,22" className="compass-north" />
        {/* 南（白） */}
        <polygon points="22,40 26,22 22,25 18,22" className="compass-south" />
        {/* 中心點 */}
        <circle cx="22" cy="22" r="3" className="compass-center" />
      </svg>
      <span className="compass-label">N</span>
    </div>
  )
}
