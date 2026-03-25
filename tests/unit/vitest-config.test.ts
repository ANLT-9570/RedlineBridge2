// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { configDefaults } from 'vitest/config'
import config from '../../vitest.config'

describe('vitest config', () => {
  it('extends default excludes with claude worktrees', () => {
    const exclude = config.test?.exclude ?? []

    expect(exclude).toEqual(expect.arrayContaining([...configDefaults.exclude, '.claude/**']))
  })
})
