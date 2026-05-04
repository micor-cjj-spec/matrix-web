<template>
  <MatrixModuleHub
    title="基础资料"
    eyebrow="FOUNDATION MASTER DATA"
    cloud-label="基础服务云"
    description="把物料、客户、供应商、币种、汇率、地区和计量单位沉淀为可复用的公共主数据服务。"
    home-path="/finance"
    search-placeholder="搜索物料、客户、供应商、币种、地区"
    accent="#56636f"
    warm="#b98234"
    :stats="stats"
    :groups="groups"
    :actions="actions"
    :top-actions="topActions"
    :focus-items="focusItems"
    :shortcuts="shortcuts"
  />
</template>

<script setup>
import MatrixModuleHub from '@/components/ui/MatrixModuleHub.vue'
import {
  Box,
  Briefcase,
  Collection,
  DataAnalysis,
  Files,
  Goods,
  Grid,
  Money,
  OfficeBuilding,
  Platform,
  TrendCharts,
} from '@element-plus/icons-vue'

const stats = [
  { label: '主数据对象', value: '9', hint: '当前可维护' },
  { label: '客户档案', value: '326', hint: '启用中' },
  { label: '供应商档案', value: '214', hint: '启用中' },
  { label: '币种汇率', value: '18', hint: '本月更新' },
]

const actions = [
  { name: '客户管理', path: '/customer', icon: Briefcase, primary: true },
  { name: '供应商管理', path: '/supplier', icon: Goods },
]

const topActions = [
  { name: '基础服务云', path: '/finance', icon: Platform },
  { name: '企业建模', path: '/enterprise-modeling', icon: OfficeBuilding },
]

const focusItems = [
  { name: '客户资料待补全', status: '12 条', path: '/customer' },
  { name: '供应商准入', status: '6 条', path: '/supplier' },
  { name: '汇率更新', status: '今日', path: '/exchange-rate' },
]

const shortcuts = [
  { name: '物料', path: '/material', icon: Goods },
  { name: '客户', path: '/customer', icon: Briefcase },
  { name: '供应商', path: '/supplier', icon: Goods },
  { name: '汇率', path: '/exchange-rate', icon: TrendCharts },
]

const groups = [
  {
    name: '主数据',
    summary: '业务对象基础档案',
    eyebrow: 'MASTER DATA',
    icon: Box,
    modules: [
      { name: '物料', description: '物料主数据维护', path: '/material', icon: Goods },
      { name: '客户', description: '客户档案、信用和往来基础信息', path: '/customer', icon: Briefcase },
      { name: '供应商', description: '供应商档案、准入和付款基础信息', path: '/supplier', icon: Goods },
    ],
  },
  {
    name: '公共数据',
    summary: '币种、地区、计量',
    eyebrow: 'PUBLIC DATA',
    icon: Grid,
    modules: [
      { name: '币种', description: '币种基础数据维护', path: '/currency', icon: Money },
      { name: '汇率', description: '汇率维护与生效', path: '/exchange-rate', icon: TrendCharts },
      { name: '行名行号', description: '银行信息和行名行号维护', path: '/bank-info', icon: Collection },
      { name: '国家', description: '国家基础档案', path: '/country', icon: DataAnalysis },
      { name: '地区', description: '地区层级与行政区划', path: '/region', icon: Grid },
      { name: '计量单位', description: '计量单位和换算口径', path: '/unit', icon: Files },
    ],
  },
]
</script>
