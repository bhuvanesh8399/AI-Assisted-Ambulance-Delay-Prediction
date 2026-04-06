export function EmergencyBackground() {
  return (
    <div className="emergency-bg" aria-hidden="true">
      <div className="emergency-bg__beam emergency-bg__beam--blue" />
      <div className="emergency-bg__beam emergency-bg__beam--red" />
      <div className="emergency-grid" />
    </div>
  );
}
