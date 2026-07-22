import { syncNotificationEvents } from '@/api/im'

const VERSION_KEY = 'matrix.im.lastVersion'
const DEVICE_KEY = 'matrix.im.deviceId'
const EVENT_NAME = 'matrix-im-event'

function createDeviceId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID().replaceAll('-', '')
  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
function getDeviceId() { let value = localStorage.getItem(DEVICE_KEY); if (!value) { value = createDeviceId(); localStorage.setItem(DEVICE_KEY, value) } return value }
function websocketUrl(token) { const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'; const query = new URLSearchParams({ access_token: token, deviceId: getDeviceId(), clientType: 'WEB' }); return `${protocol}//${window.location.host}/api/im/ws?${query}` }

class ImRealtimeClient {
  constructor() { this.socket=null; this.stopped=true; this.reconnectTimer=null; this.heartbeatTimer=null; this.reconnectAttempt=0; this.syncing=null }
  start() { const token=localStorage.getItem('token'); if(!token){this.stop();return} this.stopped=false; if(this.socket?.readyState===WebSocket.OPEN||this.socket?.readyState===WebSocket.CONNECTING)return; this.connect(token) }
  stop() { this.stopped=true; clearTimeout(this.reconnectTimer); clearInterval(this.heartbeatTimer); this.reconnectTimer=null; this.heartbeatTimer=null; if(this.socket){this.socket.onclose=null;this.socket.close();this.socket=null} }
  sendReadAck(notificationId) { this.send({eventType:'READ_ACK',notificationId}) }
  async sync() { if(this.syncing)return this.syncing; this.syncing=this.runSync().finally(()=>{this.syncing=null}); return this.syncing }
  connect(token) {
    try {
      const socket=new WebSocket(websocketUrl(token)); this.socket=socket
      socket.onopen=()=>{this.reconnectAttempt=0;this.startHeartbeat()}
      socket.onmessage=message=>this.handleMessage(message.data)
      socket.onerror=()=>socket.close()
      socket.onclose=()=>{clearInterval(this.heartbeatTimer);this.heartbeatTimer=null;if(!this.stopped)this.scheduleReconnect()}
    } catch { this.scheduleReconnect() }
  }
  handleMessage(raw) { let event; try{event=JSON.parse(raw)}catch{return} if(event.eventType==='SYSTEM_CONNECTED'){this.sync();this.emit(event);return} if(event.eventType==='SYSTEM_PONG')return; this.processPersistedEvent(event) }
  async processPersistedEvent(event,fromSync=false) {
    const version=Number(event.version||0), current=this.lastVersion()
    if(!fromSync&&version>current+1){await this.sync();if(version<=this.lastVersion())return}
    if(version>0&&version<=this.lastVersion()){if(event.eventType==='NOTIFICATION_CREATED')this.sendDeliveryAck(event);return}
    if(version>0)this.saveVersion(version)
    this.emit({...event,replayed:fromSync})
    if(event.eventType==='NOTIFICATION_CREATED')this.sendDeliveryAck(event)
  }
  async runSync() {
    let afterVersion=this.lastVersion(),hasMore=true
    while(hasMore&&!this.stopped){const response=await syncNotificationEvents(afterVersion,100);const events=response?.events??[];for(const event of events){await this.processPersistedEvent(event,true);afterVersion=Math.max(afterVersion,Number(event.version||0))}hasMore=Boolean(response?.hasMore)&&events.length>0;if(!events.length&&Number(response?.currentVersion||0)>afterVersion){afterVersion=Number(response.currentVersion);this.saveVersion(afterVersion)}}
  }
  sendDeliveryAck(event) { const notificationId=event?.data?.notificationId||event?.data?.id;if(!notificationId)return;this.send({eventType:'DELIVER_ACK',eventId:event.eventId,notificationId}) }
  send(payload) { if(this.socket?.readyState!==WebSocket.OPEN)return false;this.socket.send(JSON.stringify(payload));return true }
  startHeartbeat() { clearInterval(this.heartbeatTimer);this.heartbeatTimer=setInterval(()=>this.send({eventType:'SYSTEM_PING',lastVersion:this.lastVersion()}),25000) }
  scheduleReconnect() { clearTimeout(this.reconnectTimer);const delays=[1000,2000,5000,10000,30000],delay=delays[Math.min(this.reconnectAttempt,delays.length-1)];this.reconnectAttempt+=1;this.reconnectTimer=setTimeout(()=>this.start(),delay) }
  emit(event) { window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:event})) }
  lastVersion() { return Number(localStorage.getItem(VERSION_KEY)||0) }
  saveVersion(version) { localStorage.setItem(VERSION_KEY,String(version)) }
}
export const imRealtime=new ImRealtimeClient()
export const IM_EVENT_NAME=EVENT_NAME
