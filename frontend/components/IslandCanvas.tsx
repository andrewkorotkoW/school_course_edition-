"use client";

import { useEffect, useRef } from "react";

// Color + feature set per growth stage (0 = dormant seed, 4 = fully grown).
// Index == Island.stage from the backend (5 stages, see models/student.py).
const STAGE_COLORS = [0xcfead1, 0x7ed695, 0x4caf7d, 0x2e8b57, 0xf2c14e];

type Props = {
  /** Current growth stage (0-4) to render at rest. */
  stage: number;
  /**
   * When given and different from `stage`, the pet is shown at `fromStage`
   * first and plays a hatch/grow animation up to `stage` - used right after
   * finishing a quest so growth feels like a reward, not a number that
   * silently changed on the next page load.
   */
  fromStage?: number;
};

export default function IslandCanvas({ stage, fromStage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let game: import("phaser").Game | undefined;
    let destroyed = false;

    import("phaser").then((Phaser) => {
      if (destroyed || !containerRef.current) return;

      const stageScale = (s: number) => 0.55 + s * 0.17;

      class IslandScene extends Phaser.Scene {
        centerX = 200;
        groundY = 230;
        pet!: Phaser.GameObjects.Container;
        aura?: Phaser.GameObjects.Particles.ParticleEmitter;

        create() {
          this.add.ellipse(this.centerX, this.groundY, 260, 60, 0xd9c48a);
          this.add.ellipse(this.centerX, this.groundY - 6, 220, 40, 0x8fd18c);

          const startStage = fromStage ?? stage;
          this.pet = this.buildPet(this.centerX, this.groundY - 40, startStage);
          this.addIdleTween(this.pet);

          if (fromStage !== undefined && fromStage !== stage) {
            this.time.delayedCall(350, () => this.growTo(stage));
          }
        }

        buildPet(x: number, y: number, petStage: number): Phaser.GameObjects.Container {
          const container = this.add.container(x, y);
          const color = STAGE_COLORS[petStage] ?? STAGE_COLORS[0];

          const body = this.add.circle(0, 0, 36, color).setStrokeStyle(3, 0x2f6e4f);
          container.add(body);

          // Stage 0 is a dormant seed - no face yet, nothing has "hatched".
          if (petStage >= 1) {
            container.add([
              this.add.circle(-12, -4, 5, 0xffffff),
              this.add.circle(12, -4, 5, 0xffffff),
              this.add.circle(-12, -4, 2.4, 0x1c1c1c),
              this.add.circle(12, -4, 2.4, 0x1c1c1c),
              this.add.ellipse(0, 10, 12, 6, 0x2f6e4f),
            ]);
          }

          if (petStage >= 2) {
            container.add([
              this.add.circle(-28, -28, 10, color).setStrokeStyle(2, 0x2f6e4f),
              this.add.circle(28, -28, 10, color).setStrokeStyle(2, 0x2f6e4f),
            ]);
          }

          if (petStage >= 3) {
            container.add([
              this.add.circle(-22, 6, 5, 0xffb6b6, 0.7),
              this.add.circle(22, 6, 5, 0xffb6b6, 0.7),
            ]);
          }

          if (petStage >= 4) {
            container.add(
              this.add.triangle(0, -40, -10, 8, 10, 8, 0, -8, 0xffd36e).setStrokeStyle(2, 0xb8860b)
            );
            this.startAura(x, y - 20);
          } else {
            this.aura?.stop();
          }

          container.setScale(stageScale(petStage));
          return container;
        }

        addIdleTween(target: Phaser.GameObjects.Container) {
          this.tweens.add({
            targets: target,
            scaleY: target.scaleY * 1.05,
            scaleX: target.scaleX * 0.97,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }

        growTo(targetStage: number) {
          const { x, y } = this.pet;
          // The idle breathing tween keeps looping on scaleX/scaleY forever -
          // without killing it first, it fights the shrink/grow tween below
          // for the same properties and the pet never visibly settles.
          this.tweens.killTweensOf(this.pet);
          this.tweens.add({
            targets: this.pet,
            scaleX: 0.05,
            scaleY: 0.05,
            duration: 180,
            ease: "Back.easeIn",
            onComplete: () => {
              this.pet.destroy();
              this.pet = this.buildPet(x, y, targetStage);
              this.pet.setScale(0.05);
              this.tweens.add({
                targets: this.pet,
                scaleX: stageScale(targetStage),
                scaleY: stageScale(targetStage),
                duration: 450,
                ease: "Back.easeOut",
                onComplete: () => this.addIdleTween(this.pet),
              });
              this.burstSparkles(x, y - 20);
            },
          });
        }

        ensureSparkleTexture() {
          if (this.textures.exists("sparkle")) return;
          const g = this.add.graphics();
          g.fillStyle(0xffe08a, 1);
          g.fillCircle(4, 4, 4);
          g.generateTexture("sparkle", 8, 8);
          g.destroy();
        }

        burstSparkles(x: number, y: number) {
          this.ensureSparkleTexture();
          const emitter = this.add.particles(x, y, "sparkle", {
            speed: { min: 60, max: 140 },
            angle: { min: 220, max: 320 },
            lifespan: 500,
            scale: { start: 1, end: 0 },
            quantity: 14,
            emitting: false,
          });
          emitter.explode(14);
          this.time.delayedCall(700, () => emitter.destroy());
        }

        startAura(x: number, y: number) {
          this.ensureSparkleTexture();
          this.aura = this.add.particles(x, y, "sparkle", {
            speed: { min: 5, max: 15 },
            angle: { min: 0, max: 360 },
            lifespan: 1200,
            scale: { start: 0.6, end: 0 },
            frequency: 300,
            quantity: 1,
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
        transparent: false,
        // Without this, Phaser pauses the game loop (and every tween/timer,
        // including the growth reveal) whenever the tab is briefly hidden
        // or unfocused - too easy to accidentally cut off the reward moment.
        disableVisibilityChange: true,
      });
    });

    return () => {
      destroyed = true;
      game?.destroy(true);
    };
  }, [stage, fromStage]);

  return <div ref={containerRef} />;
}
