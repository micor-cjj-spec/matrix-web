<template>
  <main class="shell">
    <header>
      <div><small>MATRIX · O2C · P2-IMP-03</small><h1>销售报价与合同</h1>
        <p>商机 → 报价 / 投标报价 → 客户接受 → 销售合同</p></div>
      <button type="button" @click="router.push('/portal')">返回工作台</button>
    </header>
    <section class="context">
      <label>租户 ID <input v-model.trim="tenantId" placeholder="必填" /></label>
      <label>组织 ID <input v-model.trim="orgId" placeholder="必须与 JWT 授权组织一致" required /></label>
      <button @click="tab === 'grants' ? loadGrants() : reload()" :disabled="loading">刷新</button>
    </section>
    <nav><button :class="{ active: tab === 'quotes' }" @click="tab='quotes'">报价 / 投标报价</button>
      <button :class="{ active: tab === 'contracts' }" @click="tab='contracts'">销售合同</button>
      <button :class="{ active: tab === 'grants' }" @click="tab='grants'">销售权限管理（管理员）</button></nav>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="notice" role="status" class="notice">{{ notice }}</p>
    <section v-if="tab==='quotes'" class="layout">
      <article class="panel">
        <h2>报价列表 ({{ quotes.length }})</h2>
        <p v-if="!quotes.length" class="muted">暂无记录。请填写租户及授权组织后刷新。</p>
        <div v-else class="scroll"><table>
          <thead><tr><th>单号</th><th>客户</th><th>类型</th><th>含税金额</th><th>状态</th><th>操作</th></tr></thead>
          <tbody><tr v-for="q in quotes" :key="q.fid">
            <td>{{ q.fnumber }}</td><td>{{ q.fbusinessPartnerName }}</td><td>{{ q.fquoteType }}</td>
            <td>{{ fmt(q.fgrossAmount) }}</td><td>{{ q.fstatus }}</td>
            <td><button v-for="a in availableQuoteActions(q)" :key="a" :disabled="loading" @click="changeQuote(q,a)">{{ labels[a] }}</button>
              <button type="button" :disabled="loading" @click="showAudit('quotes',q)">记录</button>
              <button v-if="q.fstatus==='DRAFT'" :disabled="loading" @click="editQuote(q)">编辑</button>
              <button v-if="q.fstatus==='ACCEPTED'" @click="fromQuote(q)">转合同</button></td>
          </tr></tbody>
        </table></div>
      </article>
      <article class="panel">
        <h2>{{ editingQuoteId ? '编辑报价草稿' : '新建报价草稿' }}</h2>
        <button v-if="editingQuoteId" type="button" class="light" @click="clearEdit">取消编辑</button>
        <form @submit.prevent="saveQuote">
          <label>商机 ID <input v-model.trim="quote.fopportunityId" :disabled="Boolean(editingQuoteId)" required /></label>
          <label>客户 BusinessPartner ID <input v-model.trim="quote.fbusinessPartnerId" :disabled="Boolean(editingQuoteId)" required /></label>
          <label>报价类型 <select v-model="quote.fquoteType" :disabled="Boolean(editingQuoteId)"><option value="QUOTE">普通报价</option><option value="TENDER">投标报价</option></select></label>
          <label v-if="quote.fquoteType==='TENDER'">招标编号 <input v-model.trim="quote.ftenderReference" :disabled="Boolean(editingQuoteId)" required /></label>
          <label>币种 <input v-model.trim="quote.fcurrencyCode" :disabled="Boolean(editingQuoteId)" required /></label>
          <label>有效期 <input v-model="quote.fvalidUntil" type="date" required /></label>
          <label>交货条款 <input v-model.trim="quote.fdeliveryTermCode" placeholder="DDP" /></label>
          <label>付款条款 <input v-model.trim="quote.fpaymentTermCode" placeholder="NET30" /></label>
          <div class="item-title"><h3>报价明细（{{ quoteLines.length }} 行）</h3>
            <button type="button" class="light" @click="addLine">+ 添加明细</button></div>
          <div class="line-card" v-for="(line, index) in quoteLines" :key="line.key">
            <div class="item-title"><strong>第 {{ index + 1 }} 行</strong>
              <button type="button" class="light" :disabled="quoteLines.length === 1" @click="removeLine(index)">删除</button></div>
            <label>物料 / 服务名称 <input v-model.trim="line.fdescription" required /></label>
            <label>物料编码 <input v-model.trim="line.fmaterialCode" /></label>
            <div class="three">
              <label>数量 <input v-model.number="line.fquantity" type="number" min="0.000001" step="any" required /></label>
              <label>单价 <input v-model.number="line.funitPrice" type="number" min="0" step="any" required /></label>
              <label>税率 % <input v-model.number="line.ftaxRate" type="number" min="0" max="100" step="any" required /></label>
            </div>
          </div>
          <p class="muted">金额以服务端 Decimal 运算结果为准。</p>
          <button :disabled="loading">{{ editingQuoteId ? '保存草稿修改' : '创建报价' }}</button>
        </form>
      </article>
    </section>
    <section v-else-if="tab === 'contracts'" class="layout">
      <article class="panel">
        <h2>销售合同 ({{ contracts.length }})</h2>
        <p v-if="!contracts.length" class="muted">暂无合同，需先从已接受报价创建。</p>
        <div v-else class="scroll"><table>
          <thead><tr><th>合同编号</th><th>名称</th><th>客户</th><th>含税金额</th><th>状态</th><th>操作</th></tr></thead>
          <tbody><tr v-for="c in contracts" :key="c.fid">
            <td>{{ c.fnumber }}</td><td>{{ c.ftitle }}</td><td>{{ c.fbusinessPartnerName }}</td>
            <td>{{ fmt(c.fgrossAmount) }}</td><td>{{ c.fapprovalStatus }}</td>
            <td><button type="button" :disabled="loading" @click="showAudit('contracts',c)">记录</button>
              <button v-for="a in (contractActions[c.fapprovalStatus] || [])" :key="a" :disabled="loading"
              @click="changeContract(c,a)">{{ labels[a] }}</button></td>
          </tr></tbody>
        </table></div>
      </article>
      <article class="panel">
        <h2>从已接受报价创建合同</h2>
        <form @submit.prevent="saveContract">
          <label>报价 ID <input v-model.trim="contract.fquoteId" required /></label>
          <label>合同名称 <input v-model.trim="contract.ftitle" required /></label>
          <label>起始日期 <input v-model="contract.fstartDate" type="date" required /></label>
          <label>结束日期 <input v-model="contract.fendDate" type="date" required /></label>
          <button :disabled="loading">创建合同</button>
        </form>
      </article>
    </section>

    <section v-else class="layout">
      <article class="panel">
        <h2>销售角色授权</h2>
        <p class="muted">只有拥有当前租户、组织有效 SALES_ADMIN 权限的管理员可操作。所有更新均由服务端验证和记录审计。</p>
        <form @submit.prevent="loadGrants">
          <label>目标用户 ID <input v-model.trim="roleTarget.userId" required /></label>
          <button :disabled="loading">查询当前角色</button>
        </form>
        <p v-if="!targetRoles.length" class="muted">暂无已授权销售角色，或尚未执行查询。</p>
        <ul v-else class="role-list">
          <li v-for="role in targetRoles" :key="role">{{ role }}</li>
        </ul>
      </article>
      <article class="panel">
        <h2>变更用户角色</h2>
        <p class="muted">首次管理员需通过受控 DBA 流程初始化，不能在本页面自助创建。</p>
        <form @submit.prevent="submitRoleGrant(true)">
          <label>目标用户 ID <input v-model.trim="roleTarget.userId" required /></label>
          <label>角色
            <select v-model="roleTarget.role">
              <option value="SALES_VIEWER">销售查看</option>
              <option value="SALES_EDITOR">销售编辑</option>
              <option value="SALES_APPROVER">销售审批</option>
              <option value="SALES_ADMIN">销售管理员</option>
            </select>
          </label>
          <button :disabled="loading">授予角色</button>
          <button type="button" :disabled="loading" class="light" @click="submitRoleGrant(false)">撤销角色</button>
        </form>
        <p class="muted">目标用户已签发的旧销售授权 Token 在版本变更后会失效；需重新登录。请勿在数据库中绕过管理接口手工修改授权。</p>
      </article>
    </section>
    <section v-if="auditType===tab" class="panel audit-panel">
      <div class="audit-heading"><h2>{{ auditTitle }} · 操作历史</h2>
        <button type="button" class="light" @click="auditType='';auditEntries=[]">关闭</button></div>
      <p v-if="!auditEntries.length" class="muted">暂无操作记录。</p>
      <div v-else class="scroll"><table>
        <thead><tr><th>操作时间</th><th>动作</th><th>变更前</th><th>变更后</th><th>操作人 ID</th></tr></thead>
        <tbody><tr v-for="item in auditEntries" :key="item.fid">
          <td>{{ item.fcreateTime }}</td><td>{{ item.faction }}</td>
          <td>{{ item.fbeforeStatus || '-' }}</td><td>{{ item.fafterStatus }}</td>
          <td>{{ item.foperatorId }}</td>
        </tr></tbody>
      </table></div>
    </section>
    <p class="muted warning">开发版：服务端要求带销售角色和组织范围的有效 JWT。现有登录令牌若不包含销售角色将被拒绝，正式角色签发和工作流集成仍待完成。</p>
  </main>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { listQuotes, getQuote, createQuote, updateQuote, actQuote, listContracts, createContract, actContract,
  listSalesRoleGrants, grantSalesRole, revokeSalesRole,
  getQuoteAudit, getContractAudit } from '@/api/salesCommercial'
const router=useRouter()
const tenantId=ref(''), orgId=ref(''), tab=ref('quotes'), error=ref(''), notice=ref(''), loading=ref(false)
const quotes=ref([]), contracts=ref([])
const editingQuoteId = ref('')
const auditType = ref('')
const auditTitle = ref('')
const auditEntries = ref([])
const roleTarget = reactive({ userId: '', role: 'SALES_VIEWER' })
const targetRoles = ref([])
const quote=reactive({ fopportunityId:'',fbusinessPartnerId:'', fquoteType:'QUOTE',ftenderReference:'',fcurrencyCode:'CNY',fvalidUntil:'',fdeliveryTermCode:'',fpaymentTermCode:'' })
let lineKey = 0
function newLine(){return {key:++lineKey,fdescription:'',fmaterialCode:'',fquantity:1,funitPrice:0,ftaxRate:13}}
const quoteLines = ref([newLine()])
function addLine(){if(quoteLines.value.length>=100){error.value='最多支持 100 行报价明细';return}quoteLines.value.push(newLine())}
function removeLine(index){if(quoteLines.value.length>1)quoteLines.value.splice(index,1)}
const contract=reactive({fquoteId:'',ftitle:'',fstartDate:'',fendDate:''})
const quoteActions={DRAFT:['submit','cancel'],SUBMITTED:['withdraw','approve'],APPROVED:['send'],SENT:['accept','reject'] }
function availableQuoteActions(q) {
  const actions = [...(quoteActions[q.fstatus] || [])]
  if (q.fstatus === 'SENT' && q.fvalidUntil && q.fvalidUntil < new Date().toISOString().slice(0,10)) actions.push('expire')
  return actions
}
const contractActions={DRAFT:['submit'],SUBMITTED:['approve']}
const labels={submit:'提交',approve:'审批',send:'发送',accept:'客户接受',reject:'客户拒绝',withdraw:'撤回',cancel:'作废',expire:'标记过期'}
const fmt=(v)=>Number(v||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})
function unwrap(r){if(r?.code != null && Number(r.code)!==200)throw Error(r.message||'操作失败');return r?.data??r}
function rows(r){const d=unwrap(r);return Array.isArray(d)?d:Array.isArray(d?.records)?d.records:[]}
function id(v,label){const value=String(v??'').trim();if(!/^[1-9][0-9]*$/.test(value))throw Error(label+'必须是正整数');return value}
async function run(job,message){error.value='';notice.value='';loading.value=true;try{await job();notice.value=message||''}catch(e){error.value=e?.response?.data?.message||e?.message||'请求失败'}finally{loading.value=false}}
function params(){if(!tenantId.value)throw Error('请填写租户 ID');return {tenantId:tenantId.value,orgId:id(orgId.value,'组织 ID'),size:100}}
async function refreshData(){const p=params();const [a,b]=await Promise.all([listQuotes(p),listContracts(p)]);quotes.value=rows(a);contracts.value=rows(b)}
async function reload(){await run(refreshData)}
function clearEdit(){editingQuoteId.value='';quoteLines.value=[newLine()]}
async function editQuote(q){
  await run(async()=>{
    const p=params()
    const detail=unwrap(await getQuote(q.fid,p.tenantId))
    if (String(detail?.header?.forgId) !== String(p.orgId)) throw Error('报价所属组织与当前组织不一致')
    if (detail.header.fstatus !== 'DRAFT') throw Error('只能编辑草稿报价')
    editingQuoteId.value=String(q.fid)
    Object.assign(quote,{
      fopportunityId:String(detail.header.fopportunityId),
      fbusinessPartnerId:String(detail.header.fbusinessPartnerId),
      fquoteType:detail.header.fquoteType,
      ftenderReference:detail.header.ftenderReference || '',
      fcurrencyCode:detail.header.fcurrencyCode,
      fvalidUntil:detail.header.fvalidUntil,
      fdeliveryTermCode:detail.header.fdeliveryTermCode || '',
      fpaymentTermCode:detail.header.fpaymentTermCode || '',
    })
    quoteLines.value=(detail.entries||[]).map(e=>({
      key:++lineKey,fdescription:e.fdescription,fmaterialCode:e.fmaterialCode||'',
      fquantity:Number(e.fquantity),funitPrice:Number(e.funitPrice),ftaxRate:Number(e.ftaxRate),
    }))
    if (!quoteLines.value.length) quoteLines.value=[newLine()]
  })
}
async function saveQuote(){await run(async()=>{
  const p=params()
  const payload={ftenantId:p.tenantId,forgId:p.orgId,
    fopportunityId:id(quote.fopportunityId,'商机 ID'),fbusinessPartnerId:id(quote.fbusinessPartnerId,'客户 ID'),
    fcurrencyCode:quote.fcurrencyCode,fquoteType:quote.fquoteType,ftenderReference:quote.fquoteType==='TENDER'?quote.ftenderReference:null,
    fvalidUntil:quote.fvalidUntil,fdeliveryTermCode:quote.fdeliveryTermCode,fpaymentTermCode:quote.fpaymentTermCode,
    entries:quoteLines.value.map(({ fdescription, fmaterialCode, fquantity, funitPrice, ftaxRate }) => ({
      fdescription, fmaterialCode, fquantity:Number(fquantity),
      funitPrice:Number(funitPrice), ftaxRate:Number(ftaxRate),
    }))}
  if (editingQuoteId.value) {
    unwrap(await updateQuote(editingQuoteId.value,{
      ftenantId:p.tenantId,fvalidUntil:quote.fvalidUntil,
      fdeliveryTermCode:quote.fdeliveryTermCode,fpaymentTermCode:quote.fpaymentTermCode,entries:payload.entries,
    }))
  } else {
    unwrap(await createQuote(payload))
  }
  quotes.value=rows(await listQuotes(p))
  clearEdit()
},'报价草稿已保存')}
async function saveContract(){await run(async()=>{
  const p=params()
  unwrap(await createContract({ftenantId:p.tenantId,fquoteId:id(contract.fquoteId,'报价 ID'),
    ftitle:contract.ftitle,fstartDate:contract.fstartDate,fendDate:contract.fendDate}))
  contracts.value=rows(await listContracts(p))
},'合同草稿创建成功')}
async function changeQuote(q,action){
  if(!window.confirm(`确认对 ${q.fnumber} 执行 ${labels[action]}？`))return
  await run(async()=>{const p=params();unwrap(await actQuote(q.fid,action,p.tenantId));quotes.value=rows(await listQuotes(p))},'报价状态已更新')
}
async function changeContract(c,action){
  if(!window.confirm(`确认对 ${c.fnumber} 执行 ${labels[action]}？`))return
  await run(async()=>{const p=params();unwrap(await actContract(c.fid,action,p.tenantId));contracts.value=rows(await listContracts(p))},'合同状态已更新')
}
async function showAudit(type, document) {
  await run(async () => {
    const scope = params()
    const response = type === 'quotes'
      ? await getQuoteAudit(document.fid, scope.tenantId)
      : await getContractAudit(document.fid, scope.tenantId)
    auditEntries.value = Array.isArray(unwrap(response)) ? unwrap(response) : []
    auditTitle.value = document.fnumber || ''
    auditType.value = type
  })
}
function fromQuote(q){contract.fquoteId=String(q.fid);contract.ftitle=q.fbusinessPartnerName+'销售合同';tab.value='contracts'}
function grantPayload() {
  const p=params()
  return { tenantId:p.tenantId,orgId:p.orgId,userId:id(roleTarget.userId,'目标用户 ID'),role:roleTarget.role }
}
async function loadGrants() {
  await run(async()=>{
    const { role: _role, ...query } = grantPayload()
    const result=unwrap(await listSalesRoleGrants(query))
    targetRoles.value=Array.isArray(result)?result:[]
  })
}
async function submitRoleGrant(shouldGrant){
  let payload
  try { payload=grantPayload() } catch(e){error.value=e.message;return}
  const action=shouldGrant?'授予':'撤销'
  if (!window.confirm(`确定对用户 ${payload.userId} ${action}角色 ${payload.role}？此操作将使旧销售 Token 失效。`)) return
  await run(async()=>{
    unwrap(await (shouldGrant?grantSalesRole(payload):revokeSalesRole(payload)))
    const {role: _role,...query}=payload
    const response=unwrap(await listSalesRoleGrants(query))
    targetRoles.value=Array.isArray(response)?response:[]
  },'销售角色已更新')
}
</script>
<style scoped>
.shell{min-height:100vh;padding:30px;max-width:1500px;margin:auto;background:#f4f8f7;color:#213936}
header,.context{display:flex;align-items:center;justify-content:space-between;gap:16px}header p,.muted{color:#718681}
h1{font-size:30px;margin:8px 0}h2{font-size:19px;margin:0 0 18px}h3{font-size:15px}
small{letter-spacing:.14em;color:#16806c}.context{justify-content:flex-start;flex-wrap:wrap;background:white;border-radius:14px;padding:16px;margin:24px 0}
nav{display:flex;gap:12px;margin-bottom:22px}nav button{background:#dcece8;color:#20665e}nav button.active{background:#167668;color:white}
button{cursor:pointer;background:#167668;color:white;border:0;border-radius:8px;padding:9px 13px;margin-right:4px;font-weight:600}
button:disabled{opacity:.5;cursor:not-allowed}.layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(300px,1fr);gap:18px}
.panel{background:#fff;border:1px solid #dfe9e6;border-radius:14px;padding:20px;min-width:0}
label{display:flex;flex-direction:column;gap:6px;color:#57716c;font-size:13px;font-weight:600}
input,select{border:1px solid #cbdad6;border-radius:7px;padding:10px;font:inherit;min-width:0;background:#fff}
.context input{width:190px}form{display:grid;gap:12px}form input,form select{width:100%}
.three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px;text-align:left}
td,th{border-bottom:1px solid #e5eeeb;padding:11px 7px;white-space:nowrap}th{color:#6f847f}
.error,.notice{padding:12px;border-radius:8px}.error{background:#ffefef;color:#ad3131}.notice{background:#e6f6ec;color:#1d6c3a}
.warning{font-size:12px;margin-top:20px}.audit-panel{margin-top:18px}.audit-heading{display:flex;align-items:center;justify-content:space-between}.role-list{padding:0;display:flex;gap:8px;flex-wrap:wrap;list-style:none}.role-list li{padding:8px 12px;border-radius:7px;background:#edf4f2;color:#216e62}.item-title{display:flex;justify-content:space-between;align-items:center;gap:10px}.line-card{display:grid;gap:10px;padding:14px 0;border-top:1px solid #dbe7e3}.light{background:#e0efea;color:#19695d}@media(max-width:920px){.layout{grid-template-columns:1fr}.shell{padding:16px}.three{grid-template-columns:1fr 1fr}}
</style>

