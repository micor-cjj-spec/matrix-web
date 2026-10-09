<template>
  <MatrixModuleHub
    app-code="base"
    module-code="enterprise-modeling"
    title="企业建模"
    eyebrow="ENTERPRISE MODELING"
    cloud-label="基础服务云"
    description="建立人员、业务单元、部门维度、组织职能和组织形态，为财务、供应链和共享服务提供统一组织口径。"
    home-path="/finance"
    search-placeholder="搜索人员、业务单元、部门维度、组织形态"
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
  Briefcase,
  Connection,
  Files,
  Grid,
  OfficeBuilding,
  Operation,
  Platform,
  SetUp,
  UserFilled,
} from '@element-plus/icons-vue'

const stats = [
  { label: '组织单元', value: '28', hint: '集团口径' },
  { label: '人员档案', value: '1,248', hint: '启用中' },
  { label: '部门维度', value: '86', hint: '核算可用' },
  { label: '管控策略', value: '3', hint: '规划中' },
]

const actions = [
  { name: '人员管理', path: '/personal', icon: UserFilled, primary: true },
  { name: '业务单元', path: '/business-unit', icon: Platform },
]

const topActions = [
  { name: '基础服务云', path: '/finance', icon: Platform },
  { name: '基础资料', path: '/base-data', icon: Grid },
]

const focusItems = [
  { name: '人员档案同步', status: '今日', path: '/personal' },
  { name: '业务单元维护', status: '可处理', path: '/business-unit' },
  { name: '部门维度检查', status: '86 项', path: '/department-dimension' },
]

const shortcuts = [
  { name: '人员', path: '/personal', icon: UserFilled },
  { name: '业务单元', path: '/business-unit', icon: Platform },
  { name: '部门维度', path: '/department-dimension', icon: Grid },
  { name: '组织形态', path: '/org-pattern', icon: OfficeBuilding },
]

const groups = [
  {
    name: '组织人员',
    summary: '组织、人员、职能',
    eyebrow: 'ORGANIZATION',
    icon: OfficeBuilding,
    modules: [
      { name: '人员', description: '人员主数据维护', path: '/personal', icon: UserFilled },
      { name: '业务单元', description: '公司、利润中心和业务单元结构', path: '/business-unit', icon: Platform },
      { name: '部门维度管理', description: '部门核算维度维护', path: '/department-dimension', icon: Grid },
      { name: '组织职能类型', description: '组织职能类型维护', path: '/org-function-type', icon: Briefcase },
      { name: '组织形态', description: '组织形态和组织模式维护', path: '/org-pattern', icon: OfficeBuilding },
      { name: '人员类型', description: '人员类型和岗位关系配置', ready: false, status: '规划中', icon: UserFilled },
      { name: '行政组织', description: '行政组织与业务组织映射', ready: false, status: '规划中', icon: Connection },
    ],
  },
  {
    name: '管控策略',
    summary: '视图、权限、主数据控制',
    eyebrow: 'GOVERNANCE',
    icon: SetUp,
    modules: [
      { name: '业务管理视图', description: '业务视图和组织授权口径', ready: false, status: '规划中', icon: Files },
      { name: '主数据控制视图', description: '主数据分发、共享和隔离策略', ready: false, status: '规划中', icon: Operation },
      { name: '基础数据管控策略', description: '基础资料创建、审核和生效规则', ready: false, status: '规划中', icon: SetUp },
    ],
  },
]
</script>
