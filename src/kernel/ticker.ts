/**
 * One rAF ticker for the whole site. Every spring and canvas scene runs as a
 * job here; the loop sleeps when the last job settles and pauses while the
 * document is hidden. Jobs advance with a clamped dt (seconds) and return
 * false when they are done, detaching themselves.
 */

type Job = (dt: number, now: number) => boolean;

class Ticker {
  private readonly jobs = new Set<Job>();
  private frame = 0;
  private lastTime = 0;
  private paused = false;

  add(job: Job): () => void {
    this.jobs.add(job);
    this.start();
    return () => {
      this.jobs.delete(job);
    };
  }

  /** Run a job for one manual tick (scenes that only need a single settle). */
  pulse(job: Job): void {
    job(1 / 60, performance.now());
  }

  get running(): boolean {
    return this.frame !== 0;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (!paused) this.start();
  }

  private start(): void {
    if (this.frame || this.paused) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame((time) => this.tick(time));
  }

  private tick(time: number): void {
    this.frame = 0;
    const dt = Math.min(0.05, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;
    for (const job of this.jobs) {
      if (job(dt, time) === false) this.jobs.delete(job);
    }
    if (this.jobs.size) this.start();
  }
}

export const ticker = new Ticker();

document.addEventListener("visibilitychange", () => {
  ticker.setPaused(document.hidden);
});
