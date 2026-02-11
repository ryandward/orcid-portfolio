export default function CloudSky({ active }) {
  if (!active) return null
  return (
    <div className="cloud-sky">
      <div className="cloud-circle cloud-1" />
      <div className="cloud-circle cloud-2" />
      <div className="cloud-circle cloud-3" />
      <div className="cloud-circle cloud-4" />
      <div className="cloud-circle cloud-5" />
    </div>
  )
}
