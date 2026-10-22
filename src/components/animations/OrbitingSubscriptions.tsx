
import {
  Play,
  Music2,
  Cloud,
  Dumbbell,
  Gamepad2,
  Video,
  Sparkles,
} from "lucide-react";

import "./orbiting-subscriptions.css";

const subscriptions = [
  { id: "stream", name: "STREAMING", Icon: Play, color: "coral", position: "stream" },
  { id: "music", name: "MUSIC", Icon: Music2, color: "mint", position: "music" },
  { id: "cloud", name: "CLOUD", Icon: Cloud, color: "blue", position: "cloud" },
  { id: "fitness", name: "FITNESS", Icon: Dumbbell, color: "orange", position: "fitness" },
  { id: "gaming", name: "GAMING", Icon: Gamepad2, color: "violet", position: "gaming" },
  { id: "video", name: "VIDEO", Icon: Video, color: "pink", position: "video" },
  { id: "premium", name: "PREMIUM", Icon: Sparkles, color: "gold", position: "premium" },
];

export default function OrbitingSubscriptions() {
  return (
    <div className="orbit-subscriptions" aria-hidden="true">
      <div className="orbit-halo orbit-halo-one" />
      <div className="orbit-halo orbit-halo-two" />

      <div className="orbit-center-glow" />

      {subscriptions.map(({ id, name, Icon, color, position }, index) => (
        <div
          className={`orbit-float orbit-${position}`}
          key={id}
          style={{ "--orbit-delay": `${index * -1.35}s` } as React.CSSProperties}
        >
          <div className={`orbit-app-card orbit-color-${color}`}>
            <div className="orbit-app-icon">
              <Icon size={25} strokeWidth={1.8} />
            </div>

            <span className="orbit-app-label">{name}</span>

            <span className="orbit-app-status">
              <span />
              ACTIVE
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
