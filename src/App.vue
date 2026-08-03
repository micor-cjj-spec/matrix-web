<template>
  <v-app>
    <router-view />
    <KnowledgeAclLauncher />
    <AiAssistantLauncher />
    <NotificationCenterLauncher />
  </v-app>
</template>

<script setup>
import KnowledgeAclLauncher from '@/components/ai/KnowledgeAclLauncher.vue'
import AiAssistantLauncher from '@/components/ai/AiAssistantLauncher.vue'
import NotificationCenterLauncher from '@/components/im/NotificationCenterLauncher.vue'
</script>

<style>
/* 可以加全局样式 */
</style>
