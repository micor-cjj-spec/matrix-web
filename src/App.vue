<template>
  <v-app>
    <router-view />
    <AiAssistantLauncher />
  </v-app>
</template>

<script setup>
import AiAssistantLauncher from '@/components/ai/AiAssistantLauncher.vue'
</script>

<style>
/* 可以加全局样式 */
</style>
