"use client";

import { useRive, useStateMachineInput } from "@rive-app/react-canvas";

export default function LoginCharacter() {
  const { rive, RiveComponent } = useRive({
    src: "/brand/animations/2244-7248-animated-login-character.riv",
    stateMachines: "State Machine 1", // راح نعدله بعدين إذا لزم
    autoplay: true,
  });

  const coverEyes = useStateMachineInput(
    rive,
    "State Machine 1",
    "coverEyes"
  );

  return (
    <div style={{ textAlign: "center", marginBottom: "20px" }}>
      <RiveComponent style={{ width: 220, height: 220 }} />
    </div>
  );
}