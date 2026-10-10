"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal Phaser scaffold: one scene that draws a circle whose size reflects
 * the island's growth stage (0-4). Replace with real sprites/animations once
 * art direction for the 1-4 grade island is settled - this only proves the
 * wiring between backend growth_points and the game layer.
 */
export default function IslandCanvas({ stage }: { stage: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let game: import("phaser").Game | undefined;
    let destroyed = false;

    import("phaser").then((Phaser) => {
      if (destroyed || !containerRef.current) return;

      class IslandScene extends Phaser.Scene {
        create() {
          const radius = 20 + stage * 15;
          const circle = this.add.circle(200, 150, radius, 0x4caf7d);
          this.tweens.add({
            targets: circle,
            scale: { from: 0.9, to: 1 },
            duration: 600,
            yoyo: true,
            repeat: -1,
          });
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 400,
        height: 300,
        parent: containerRef.current,
        scene: IslandScene,
        backgroundColor: "#bfe3ff",
      });
    });

    return () => {
      destroyed = true;
      game?.destroy(true);
    };
  }, [stage]);

  return <div ref={containerRef} />;
}
