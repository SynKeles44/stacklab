import { describe, expect, it } from 'vitest'
import { SimShell, type SimTask } from '@/lib/sim-shell'

const task: SimTask = {
  id: 'ssh',
  type: 'simulated',
  title: 'SSH',
  description: 'd',
  prompt: 'du@laptop:~$',
  steps: [
    { expect: '^ssh\\s+deploy@203\\.0\\.113\\.10$', output: 'Welcome', prompt: 'deploy@server:~$', hint: 'ssh benutzer@ip' },
    { expect: '^exit$', output: 'logout', prompt: 'du@laptop:~$' },
  ],
  responses: [{ match: '^ls', output: 'app  logs' }],
}

describe('SimShell', () => {
  it('advances only on matching commands and switches the prompt', () => {
    const shell = new SimShell(task)
    expect(shell.run('ssh root@203.0.113.10').advanced).toBe(false)
    const result = shell.run('ssh deploy@203.0.113.10')
    expect(result).toMatchObject({ advanced: true, done: false, prompt: 'deploy@server:~$', output: 'Welcome' })
    expect(shell.run('exit')).toMatchObject({ advanced: true, done: true })
  })

  it('answers free responses, hints and unknown commands', () => {
    const shell = new SimShell(task)
    expect(shell.run('ls -la').output).toBe('app  logs')
    expect(shell.run('tipp').output).toContain('ssh benutzer@ip')
    expect(shell.run('rm -rf /').output).toContain('nicht vorgesehen')
    expect(shell.step).toBe(0)
  })
})
