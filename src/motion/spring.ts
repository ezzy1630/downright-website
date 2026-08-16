export const SPRING_WINDUP = 4.744;
export const MAX_SETTLE_BAND = 0.5;
export const MIN_SETTLE_BAND = 0.0006;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class SpringScalar {
  value: number;
  velocity: number;
  readonly angularFrequency: number;
  readonly dampingRatio: number;
  private targetValue: number;
  private settleBand = MIN_SETTLE_BAND;

  constructor(value = 0, perceptualDuration = 0.2, bounce = 0) {
    this.value = value;
    this.velocity = 0;
    this.angularFrequency = SPRING_WINDUP / Math.max(0.02, perceptualDuration);
    this.dampingRatio = Math.max(0, 1 - bounce * 0.7);
    this.targetValue = value;
  }

  get target(): number { return this.targetValue; }

  retune(perceptualDuration: number, bounce?: number): void {
    if (perceptualDuration <= 0.02) return;
    const target = this.targetValue;
    const heldBounce = bounce ?? (this.dampingRatio < 1 ? (1 - this.dampingRatio) / 0.7 : 0);
    const replacement = new SpringScalar(this.value, perceptualDuration, heldBounce);
    this.value = replacement.value;
    this.velocity = replacement.velocity;
    this.targetValue = target;
    this.settleBand = replacement.settleBand;
  }

  snap(target: number): void {
    this.value = target;
    this.velocity = 0;
    this.targetValue = target;
    this.settleBand = MIN_SETTLE_BAND;
  }

  setTarget(target: number): void {
    if (target === this.targetValue) return;
    this.settleBand = clamp(Math.abs(target - this.value) * 0.008, MIN_SETTLE_BAND, MAX_SETTLE_BAND);
    this.targetValue = target;
  }

  kick(impulse: number): void { this.velocity += impulse; }

  advance(dt: number): boolean {
    const omega = this.angularFrequency;
    const zeta = this.dampingRatio;
    const x0 = this.value - this.targetValue;
    const v0 = this.velocity;
    const damped = zeta * omega;
    const exponent = Math.exp(-damped * Math.max(0, dt));
    const time = Math.max(0, dt);
    let x: number;
    let velocity: number;

    if (zeta >= 1 - 0.000001) {
      const a = x0;
      const b = v0 + omega * x0;
      x = exponent * (a + b * time);
      velocity = exponent * (b - omega * (a + b * time));
    } else {
      const omegaD = omega * Math.sqrt(Math.max(0, 1 - zeta * zeta));
      const a = x0;
      const b = omegaD > 0.000001 ? (v0 + damped * x0) / omegaD : 0;
      const cosine = Math.cos(omegaD * time);
      const sine = Math.sin(omegaD * time);
      x = exponent * (a * cosine + b * sine);
      velocity = exponent * ((b * omegaD - a * damped) * cosine - (a * omegaD + b * damped) * sine);
    }

    if (Math.abs(x) < this.settleBand && Math.abs(velocity) < this.settleBand * omega) {
      this.value = this.targetValue;
      this.velocity = 0;
      return false;
    }
    this.value = this.targetValue + x;
    this.velocity = velocity;
    return true;
  }
}
