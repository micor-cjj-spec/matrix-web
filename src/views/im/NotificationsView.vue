<template>
  <v-container fluid class="pa-6"><v-card><v-card-title class="d-flex align-center flex-wrap ga-3"><v-btn icon="mdi-arrow-left" variant="text" @click="router.back()"/><span>消息中心</span><v-spacer/><v-select v-model="readStatus" :items="statusOptions" label="状态" density="compact" hide-details clearable style="max-width:180px" @update:model-value="load(1)"/><v-btn color="primary" variant="tonal" @click="markAllRead">全部已读</v-btn><v-btn icon="mdi-refresh" variant="text" @click="load(page)"/></v-card-title><v-divider/>
    <v-list v-if="records.length" lines="three"><template v-for="item in records" :key="item.id"><v-list-item :class="{unread:item.readStatus==='UNREAD'}" @click="open(item)"><template #prepend><v-icon :color="item.readStatus==='UNREAD'?'primary':undefined">mdi-bell-ring-outline</v-icon></template><v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title><v-list-item-subtitle>{{ item.content }}</v-list-item-subtitle><v-list-item-subtitle class="text-caption">{{ item.messageType }} · {{ formatTime(item.createdTime) }}</v-list-item-subtitle><template #append><v-chip v-if="item.readStatus==='UNREAD'" size="small" color="primary">未读</v-chip></template></v-list-item><v-divider/></template></v-list>
    <v-card-text v-else-if="!loading" class="text-center text-medium-emphasis py-12">暂无消息</v-card-text><v-progress-linear v-if="loading" indeterminate/><v-card-actions class="justify-center"><v-pagination v-model="page" :length="pageCount" @update:model-value="load"/></v-card-actions></v-card></v-container>
</template>
<script setup>
import { computed,onMounted,ref } from 'vue'
import { useRouter } from 'vue-router'
import { listNotifications,markAllNotificationsRead,markNotificationRead } from '@/api/im'
import { imRealtime } from '@/services/imRealtime'
const router=useRouter(),records=ref([]),total=ref(0),page=ref(1),readStatus=ref(null),loading=ref(false),size=20
const statusOptions=[{title:'未读',value:'UNREAD'},{title:'已读',value:'READ'}],pageCount=computed(()=>Math.max(1,Math.ceil(total.value/size)))
async function load(targetPage=1){loading.value=true;try{page.value=targetPage;const result=await listNotifications({page:targetPage,size,readStatus:readStatus.value||undefined});records.value=result?.records||[];total.value=Number(result?.total||0)}finally{loading.value=false}}
async function open(item){if(item.readStatus==='UNREAD'){await markNotificationRead(item.id);imRealtime.sendReadAck(item.id);item.readStatus='READ'}if(item.actionUrl?.startsWith('/'))router.push(item.actionUrl)}
async function markAllRead(){await markAllNotificationsRead();records.value=records.value.map(item=>({...item,readStatus:'READ'}));if(readStatus.value==='UNREAD')await load(1)}
function formatTime(value){return value?new Date(value).toLocaleString():''}
onMounted(()=>{imRealtime.start();load()})
</script>
<style scoped>.unread{background:rgba(var(--v-theme-primary),.06)}</style>
