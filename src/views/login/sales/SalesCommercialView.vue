<template>
  <main class="shell">
    <header>
      <div><small>MATRIX · O2C · P2-IMP-03</small><h1>销售报价与合同</h1>
        <p>商机 → 报价 / 投标报价 → 客户接受 → 销售合同</p></div>
      <button type="button" @click="router.push('/portal')">返回工作台</button>
    </header>
    <section class="context">
      <label>租户 ID <input v-model.trim="tenantId" placeholder="必填" /></label>
      <label>组织 ID <input v-model.trim="orgId" placeholder="可选" /></label>
      <button @click="reload" :disabled="loading">刷新</button>
    </section>
    <nav><button :class="{ active: tab === 'quotes' }" @click="tab='quotes'">报价 / 投标报价</button>
      <button :class="{ active: tab === 'contracts' }" @click="tab='contracts'">销售合同</button></nav>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="notice" role="status" class="notice">{{ notice }}</p>
    <section v-if="tab==='quotes'" class="layout">
      <article class="panel">
        <h2>报价列表 ({{ quotes.length }})</h2>
        <p v-if="!quotes.length" class="muted">暂无记录。请填写租户后刷新。</p>
        <div v-else class="scroll"><table>
          <thead><tr><th>单号</th><th>客户</th><th>类型</th><th>含税金额</th><th>状态</th><th>操作</th></tr></thead>
          <tbody><tr v-for="q in quotes" :key="q.fid">
            <td>{{ q.fnumber }}</td><td>{{ q.fbusinessPartnerName }}</td><td>{{ q.fquoteType }}</td>
            <td>{{ fmt(q.fgrossAmount) }}</td><td>{{ q.fstatus }}</td>
            <td><button v-for="a in (quoteActions[q.fstatus] || [])" :key="a" :disabled="loading" @click="changeQuote(q,a)">{{ labels[a] }}</button>
              <button v-if="q.fstatus==='ACCEPTED'" @click="fromQuote(q)">转合同</button></td>
          </tr></tbody>
        </table></div>
      </article>
      <article class="panel">
        <h2>新建报价草稿</h2>
        <form @submit.prevent="saveQuote">
          <label>商机 ID <input v-model.trim="quote.fopportunityId" required /></label>
          <label>客户 BusinessPartner ID <input v-model.trim="quote.fbusinessPartnerId" required /></label>
          <label>报价类型 <select v-model="quote.fquoteType"><option value="QUOTE">普通报价</option><option value="TENDER">投标报价</option></select></label>
          <label v-if="quote.fquoteType==='TENDER'">招标编号 <input v-model.trim="quote.ftenderReference" required /></label>
          <label>币种 <input v-model.trim="quote.fcurrencyCode" required /></label>
          <label>有效期 <input v-model="quote.fvalidUntil" type="date" required /></label>
          <label>付款条款 <input v-model.trim="quote.fpaymentTermCode" placeholder="NET30" /></label>
          <h3>首批报价明细（单行）</h3>
          <label>物料 / 服务名称 <input v-model.trim="quote.fdescription" required /></label>
          <label>物料编码 <input v-model.trim="quote.fmaterialCode" /></label>
          <div class="three">
            <label>数量 <input v-model.number="quote.fquantity" type="number" min="0.000001" step="any" required /></label>
            <label>单价 <input v-model.number="quote.funitPrice" type="number" min="0" step="any" required /></label>
            <label>税率 % <input v-model.number="quote.ftaxRate" type="number" min="0" max="100" step="any" required /></label>
          </div>
          <button :disabled="loading">创建报价</button>
        </form>
      </article>
    </section>
    <section v-else class="layout">
      <article class="panel">
        <h2>销售合同 ({{ contracts.length }})</h2>
        <p v-if="!contracts.length" class="muted">暂无合同，需先从已接受报价创建。</p>
        <div v-else class="scroll"><table>
          <thead><tr><th>合同编号</th><th>名称</th><th>客户</th><th>含税金额</th><th>状态</th><th>操作</th></tr></thead>
          <tbody><tr v-for="c in contracts" :key="c.fid">
            <td>{{ c.fnumber }}</td><td>{{ c.ftitle }}</td><td>{{ c.fbusinessPartnerName }}</td>
            <td>{{ fmt(c.fgrossAmount) }}</td><td>{{ c.fapprovalStatus }}</td>
            <td><button v-for="a in (contractActions[c.fapprovalStatus] || [])" :key="a" :disabled="loading"
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
    <p class="muted warning">开发版：审批授权及工作流集成尚待验收，部署到生产前须限制审批操作权限。</p>
  </main>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { listQuotes, createQuote, actQuote, listContracts, createContract, actContract } from '@/api/salesCommercial'
const router=useRouter()
const tenantId=ref(''), orgId=ref(''), tab=ref('quotes'), error=ref(''), notice=ref(''), loading=ref(false)
const quotes=ref([]), contracts=ref([])
const quote=reactive({ fopportunityId:'',fbusinessPartnerId:'', fquoteType:'QUOTE',ftenderReference:'',fcurrencyCode:'CNY',fvalidUntil:'',fpaymentTermCode:'',fdescription:'',fmaterialCode:'',fquantity:1,funitPrice:0,ftaxRate:13 })
const contract=reactive({fquoteId:'',ftitle:'',fstartDate:'',fendDate:''})
const quoteActions={DRAFT:['submit'],SUBMITTED:['approve'],APPROVED:['send'],SENT:['accept','reject']}
const contractActions={DRAFT:['submit'],SUBMITTED:['approve']}
const labels={submit:'提交',approve:'审批',send:'发送',accept:'客户接受',reject:'客户拒绝'}
const fmt=(v)=>Number(v||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})
function unwrap(r){if(r?.code != null && Number(r.code)!==200)throw Error(r.message||'操作失败');return r?.data??r}
function rows(r){const d=unwrap(r);return Array.isArray(d)?d:Array.isArray(d?.records)?d.records:[]}
function id(v,label){const n=Number(v);if(!Number.isSafeInteger(n)||n<1)throw Error(label+'必须是正整数');return n}
async function run(job,message){error.value='';notice.value='';loading.value=true;try{await job();notice.value=message||''}catch(e){error.value=e?.response?.data?.message||e?.message||'请求失败'}finally{loading.value=false}}
function params(){if(!tenantId.value)throw Error('请填写租户 ID');return {tenantId:tenantId.value,orgId:orgId.value?id(orgId.value,'组织 ID'):undefined,size:100}}
async function refreshData(){const p=params();const [a,b]=await Promise.all([listQuotes(p),listContracts(p)]);quotes.value=rows(a);contracts.value=rows(b)}
async function reload(){await run(refreshData)}
async function saveQuote(){await run(async()=>{
  const p=params()
  unwrap(await createQuote({ftenantId:p.tenantId,forgId:p.orgId,
    fopportunityId:id(quote.fopportunityId,'商机 ID'),fbusinessPartnerId:id(quote.fbusinessPartnerId,'客户 ID'),
    fcurrencyCode:quote.fcurrencyCode,fquoteType:quote.fquoteType,ftenderReference:quote.fquoteType==='TENDER'?quote.ftenderReference:null,
    fvalidUntil:quote.fvalidUntil,fpaymentTermCode:quote.fpaymentTermCode,
    entries:[{fdescription:quote.fdescription,fmaterialCode:quote.fmaterialCode,fquantity:Number(quote.fquantity),funitPrice:Number(quote.funitPrice),ftaxRate:Number(quote.ftaxRate)}]}))
  quotes.value=rows(await listQuotes(p))
},'报价草稿创建成功')}
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
function fromQuote(q){contract.fquoteId=String(q.fid);contract.ftitle=q.fbusinessPartnerName+'销售合同';tab.value='contracts'}
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
.warning{font-size:12px;margin-top:20px}@media(max-width:920px){.layout{grid-template-columns:1fr}.shell{padding:16px}.three{grid-template-columns:1fr 1fr}}
</style>

