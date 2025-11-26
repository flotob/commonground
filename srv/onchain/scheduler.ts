// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { sleep } from '../util';

export class JobError extends Error {
  private _reason: 'timeout' | 'cancelled';
  constructor(reason: 'timeout' | 'cancelled') {
    super();
    this._reason = reason;
  }
  get reason() {
    return this._reason;
  }
}

export function handleServerError(message: string, e: unknown, ...args: any) {
  console.log(message, e, args);
}

export enum OnchainPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2
};

export class Job<T> {
  private task: () => Promise<T>;
  private timeout: NodeJS.Timeout | undefined;
  private resolve!: (val: T) => void;
  private reject!: (error?: unknown) => void;
  private _finished: boolean = false;
  private _running: boolean = false;
  private _promise: Promise<T>;
  public sleepBeforeNextJob: number = 0;

  constructor(task: () => Promise<T>, timeout?: number) {
    this.task = task;

    this._promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    if (timeout !== undefined) {
      this.timeout = setTimeout(() => {
        this.timeout = undefined;
        if (this._finished === false) {
          this._finished = true;
          this.reject(new JobError('timeout'));
        }
      }, timeout);
    }
  }

  get promise() {
    return this._promise;
  }

  get isFinished() {
    return this._finished;
  }

  get isRunning() {
    return this._running;
  }

  public async execute() {
    if (this._finished === false) {
      if (this.timeout !== undefined) {
        clearTimeout(this.timeout);
      }
      try {
        this._running = true;
        const result = await this.task();
        this._running = false;
        if (this._finished === false) {
          this._finished = true;
          this.resolve(result);
        }
      } catch (e) {
        if (this._finished === false) {
          this._finished = true;
          this.reject(e);
        }
      }
    }
  }

  public cancel() {
    if (this._finished === false) {
      this._finished = true;
      this.reject(new JobError('cancelled'));
      return true;
    }
    return false;
  }
}

export class Scheduler {
  private running = false;
  private jobs: {
    [prio in OnchainPriority]: Job<any>[]
  } = { 0: [], 1: [], 2: [] };

  get currentLoad() {
    const HIGH = this.jobs[0].length;
    const MEDIUM = this.jobs[1].length;
    const LOW = this.jobs[2].length;
    return {
      HIGH,
      MEDIUM,
      LOW,
      OVERALL: HIGH + MEDIUM + LOW
    }
  }

  public schedule<T>(task: () => Promise<T>, prio: OnchainPriority, timeout: number | undefined, sleepBeforeNextJob: number | undefined): Job<T> {
    const job = new Job(task, timeout);
    if (sleepBeforeNextJob !== undefined) {
      job.sleepBeforeNextJob = sleepBeforeNextJob;
    }
    this.jobs[prio].push(job);
    this.run();
    return job;
  }

  private getNextJob() {
    return this.jobs[0].shift() || this.jobs[1].shift() || this.jobs[2].shift();
  }

  private async run() {
    if (this.running === false) {
      this.running = true;
      let job = this.getNextJob();
      while (job) {
        job.execute();
        await sleep(job.sleepBeforeNextJob);
        job = this.getNextJob();
      }
      this.running = false;
    }
  }
}

export class ParallelScheduler {
  private jobs: Job<any>[] = [];
  private runningJobs: Job<any>[] = [];
  private maxParallel: number;

  constructor(maxParallel: number) {
    this.maxParallel = maxParallel;
  }

  public schedule<T>(task: () => Promise<T>, timeout?: number): Job<T> {
    const job = new Job(task, timeout);
    this.jobs.push(job);
    this.run();
    return job;
  }

  private run() {
    if (this.runningJobs.length < this.maxParallel) {
      let job = this.jobs.shift();
      while (job) {
        const thisJob = job;
        this.runningJobs.push(thisJob);
        thisJob.execute();
        thisJob.promise.catch(e => {
          console.log(`JOB ERROR`);
          console.log(e);
        }).finally(() => {
          const i = this.runningJobs.findIndex(j => j === thisJob);
          if (i > -1) {
            this.runningJobs.splice(i, 1);
            this.run();
          }
        });
        if (this.runningJobs.length < this.maxParallel) {
          job = this.jobs.shift();
        } else {
          job = undefined;
        }
      }
    }
  }
}