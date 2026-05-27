<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import { i18n } from './i18n/index.js'

const { locale } = useI18n()

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const isDark = savedTheme ? savedTheme === 'dark' : true
  document.documentElement.setAttribute('data-theme', isDark ? 'selfhost-dark' : 'selfhost-light')

  const savedLocale = localStorage.getItem('locale')
  if (savedLocale === 'en' || savedLocale === 'vi') {
    i18n.global.locale.value = savedLocale
  }
})
</script>

<template>
  <RouterView />
</template>
