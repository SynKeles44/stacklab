import type { TaskOf } from '@/lib/content-schemas'

export type SimTask = TaskOf<'simulated'>
export type SimResult = { output: string; advanced: boolean; done: boolean; prompt: string }

/** Pure state machine behind the simulated terminal – testable without xterm. */
export class SimShell {
  step = 0
  prompt: string

  private readonly task: SimTask

  constructor(task: SimTask) {
    this.task = task
    this.prompt = task.prompt ?? 'du@stacklab:~$'
  }

  get done(): boolean {
    return this.step >= this.task.steps.length
  }

  get hint(): string | undefined {
    return this.task.steps[this.step]?.hint
  }

  run(input: string): SimResult {
    const command = input.trim()
    if (command === '') return this.result('', false)
    if (command === 'clear') return this.result('\u001b[2J\u001b[H', false)
    if (command === 'hint' || command === 'tipp') {
      return this.result(this.hint ? `\u001b[33mTipp:\u001b[0m ${this.hint}` : 'Für diesen Schritt gibt es keinen Tipp.', false)
    }
    if (command === 'help' || command === 'hilfe') {
      return this.result('Simuliertes Terminal: tippe die Befehle aus der Aufgabe. "tipp" zeigt einen Hinweis, "clear" leert den Bildschirm.', false)
    }

    const current = this.task.steps[this.step]
    if (current && new RegExp(current.expect).test(command)) {
      this.step++
      if (current.prompt) this.prompt = current.prompt
      return this.result(current.output ?? '', true)
    }

    for (const response of this.task.responses ?? []) {
      if (new RegExp(response.match).test(command)) return this.result(response.output, false)
    }

    const name = command.split(/\s+/)[0]
    return this.result(`${name}: In dieser Simulation nicht vorgesehen. Tippe "tipp" für einen Hinweis.`, false)
  }

  private result(output: string, advanced: boolean): SimResult {
    return { output, advanced, done: this.done, prompt: this.prompt }
  }
}
