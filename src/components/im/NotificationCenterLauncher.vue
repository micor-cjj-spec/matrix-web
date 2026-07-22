<template>
  <div v-if="authenticated" class="im-notification-launcher">
    <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom end">
      <template #activator="{ props }"><v-badge :content="displayUnread" :model-value="unreadCount > 0" color="error"><v-btn v-bind="props" icon="mdi-bell-outline" variant="elevated" color="primary" aria-label="消息通知" /></v-badge></template>
      <v-card width="380" max-height="520">
        <v-card-title class="d-flex align-center justify-space-between"><span>消息通知</span><v-btn v-if="unreadCount" size="small" variant="text" @click="markAllRead">全部已读</v-btn></v-card-title>
        <v-divider />
        <v-list v-if="notifications.length" lines="three" class="notification-list">
          <template v-for="item in notifications" :key="item.id">
            <v-list-item :class="{ unread: item.readStatus === 'UNREAD' }" @click="openNotification(item)"><template #prepend><v-icon :color="item.readStatus === 'UNREAD' ? 'primary' : undefined">mdi-message-alert-outline</v-icon></template><v-list-item-title>{{ item.title }}</v-list-item-title><v-list-item-subtitle>{{ item.content }}</v-list-item-subtitle><v-list-item-subtitle class="text-caption">{{ formatTime(item.createdTime) }}</v-list-item-subtitle></v-list-item><v-divider />
          </template>
        </v-list>
        <v-card-text v-else class="text-center text-medium-emphasis py-8">暂无通知</v-card-text>
        <v-card-actions><v-btn block variant="text" color="primary" @click="viewAll">查看全部消息</v-btn></v-card-actions>
      </v-card>
    </v-menu>
    <v-snackbar v-model="snackbar.visible" :timeout="6000" location="top right"><strong>{{ snackbar.title }}</strong><div class="mt-1">{{ snackbar.content }}</div><template #actions><v-btn variant="text" @click="openNotification(snackbar.notification)">查看</v-btn></template></v-snackbar>
  </div>
</template>

<script setup>
import { computed,onBeforeUnmount,onMounted,reactive,ref,watch } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { getUnreadCount,listNotifications,markAllNotificationsRead,markNotificationRead } from '@/api/im'
import { IM_EVENT_NAME,imRealtime } from '@/services/imRealtime'
const route=useRoute(),router=useRouter(),menuOpen=ref(false),unreadCount=ref(0),notifications=ref([])
const snackbar=reactive({visible:false,title:'',content:'',notification:null})
const authenticated=computed(()=>Boolean(localStorage.getItem('token'))&&!['/','/login','/register'].includes(route.path))
const displayUnread=computed(()=>unreadCount.value>99?'99+':String(unreadCount.value))
async function refresh(){if(!authenticated.value)return;try{const [countResult,listResult]=await Promise.all([getUnreadCount(),listNotifications({page:1,size:8})]);unreadCount.value=Number(countResult?.count||0);notifications.value=listResult?.records||[]}catch{}}
function handleRealtime(event){const message=event.detail;if(message?.eventType==='NOTIFICATION_CREATED'){const notification={...message.data,id:message.data?.notificationId||message.data?.id};notifications.value=[notification,...notifications.value.filter(item=>item.id!==notification.id)].slice(0,8);if(message.replayed){refresh();return}unreadCount.value+=1;snackbar.title=notification.title||'新消息';snackbar.content=notification.content||'';snackbar.notification=notification;snackbar.visible=true}else if(message?.eventType==='NOTIFICATION_READ'||message?.eventType==='NOTIFICATIONS_READ_ALL'){refresh()}}
async function openNotification(notification){if(!notification)return;menuOpen.value=false;snackbar.visible=false;if(notification.readStatus==='UNREAD'||!notification.readStatus){try{await markNotificationRead(notification.id);imRealtime.sendReadAck(notification.id);notification.readStatus='READ';unreadCount.value=Math.max(0,unreadCount.value-1)}catch{}}if(notification.actionUrl?.startsWith('/'))router.push(notification.actionUrl)}
async function markAllRead(){await markAllNotificationsRead();unreadCount.value=0;notifications.value=notifications.value.map(item=>({...item,readStatus:'READ'}))}
function viewAll(){menuOpen.value=false;router.push('/notifications')}
function formatTime(value){return value?new Date(value).toLocaleString():''}
function activate(){if(authenticated.value){imRealtime.start();refresh()}else imRealtime.stop()}
onMounted(()=>{window.addEventListener(IM_EVENT_NAME,handleRealtime);activate()});onBeforeUnmount(()=>{window.removeEventListener(IM_EVENT_NAME,handleRealtime);imRealtime.stop()});watch(()=>route.fullPath,activate)
</script>
<style scoped>.im-notification-launcher{position:fixed;top:18px;right:24px;z-index:2500}.notification-list{max-height:390px;overflow-y:auto}.unread{background:rgba(var(--v-theme-primary),.08)}</style>
