import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  // correctness 规则集（格式统一交给 Prettier，避免双头管理）
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    ignores: ['dist', 'dist-ssr', 'node_modules', 'public/sw.js'],
  },
)
