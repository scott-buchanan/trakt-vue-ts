// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  ignores: ['shims.d.ts'],
})
