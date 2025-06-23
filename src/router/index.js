import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/login/Login.vue';
import Portal from '../views/login/Portal.vue';
import Register from '../views/login/Register.vue';
import EnterpriseModelingView from '../views/login/enterprise-modeling/EnterpriseModelingView.vue';
import PersonalView from '../views/login/enterprise-modeling/persion/PersonalView.vue';
import BusinessUnitView from '../views/login/enterprise-modeling/business-unit/BusinessUnitView.vue';
import DeptDimensionView from '../views/login/enterprise-modeling/dept-dimension/DeptDimensionView.vue';
import BaseDataView from '../views/login/base-data/BaseDataView.vue';
import MaterialView from '../views/login/base-data/material/MaterialView.vue';
import CustomerView from '../views/login/base-data/customer/CustomerView.vue';
import SupplierView from '../views/login/base-data/supplier/SupplierView.vue';
import CurrencyView from '../views/login/base-data/currency/CurrencyView.vue';
import ExchangeRateView from '../views/login/base-data/exchange-rate/ExchangeRateView.vue';
import BankInfoView from '../views/login/base-data/bank-info/BankInfoView.vue';
import CountryView from '../views/login/base-data/country/CountryView.vue';
import RegionView from '../views/login/base-data/region/RegionView.vue';
import UnitView from '../views/login/base-data/unit/UnitView.vue';

// 临时空页面组件
const EmptyView = {
    template: '<div style="padding: 20px; font-size: 18px;">这里是占位页面：{{ $route.path }}</div>'
};

// 定义路由表
const routes = [
    {
        path: '/',
        name: 'Login',
        component: Login,
        meta: { title: '登录' }
    },
    {
        path: '/login',
        name: 'LoginPage',
        component: Login,
        meta: { title: '登录' }
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
        meta: { title: '注册' }
    },
    {
        path: '/portal',
        name: 'Portal',
        component: Portal,
        meta: { title: '企业门户' }
    },

    // 以下是 PortalView 模块跳转 path 占位
    { path: '/tax-connect', component: EmptyView, meta: { title: '税企直连' } },
    { path: '/invoice', component: EmptyView, meta: { title: '开票管理' } },
    { path: '/receipt', component: EmptyView, meta: { title: '收票管理' } },

    { path: '/funds', component: EmptyView, meta: { title: '资金调度' } },
    { path: '/settlement', component: EmptyView, meta: { title: '资金结算' } },
    { path: '/bills', component: EmptyView, meta: { title: '票据管理' } },

    { path: '/travel', component: EmptyView, meta: { title: '人人差旅' } },
    { path: '/expenses', component: EmptyView, meta: { title: '人人费用' } },
    { path: '/workbench', component: EmptyView, meta: { title: '报账工作台' } },

    { path: '/ledger', component: EmptyView, meta: { title: '总账' } },
    { path: '/cost', component: EmptyView, meta: { title: '费用核算' } },
    { path: '/reports', component: EmptyView, meta: { title: '财务报表' } },

    {
        path: '/enterprise-modeling',
        name: 'EnterpriseModeling',
        component: EnterpriseModelingView,
        meta: { title: '企业建模' }
    },
    {
        path: '/base-data',
        name: 'BaseData',
        component: BaseDataView,
        meta: { title: '基础资料' }
    },

    // 人员管理 → 独立新页面
    {
        path: '/personal',
        name: 'Personal',
        component: PersonalView,
        meta: { title: '人员管理' }
    },
    {
        path: '/business-unit',
        name: 'BusinessUnit',
        component: BusinessUnitView,
        meta: { title: '业务单元管理' }
    },
    {
        path: '/department-dimension',
        name: 'DepartmentDimension',
        component: DeptDimensionView,
        meta: { title: '部门维度管理' }
    },
    { path: '/material', name: 'Material', component: MaterialView, meta: { title: '物料管理' } },
    { path: '/customer', name: 'Customer', component: CustomerView, meta: { title: '客户管理' } },
    { path: '/supplier', name: 'Supplier', component: SupplierView, meta: { title: '供应商管理' } },
    { path: '/currency', name: 'Currency', component: CurrencyView, meta: { title: '币种管理' } },
    { path: '/exchange-rate', name: 'ExchangeRate', component: ExchangeRateView, meta: { title: '汇率管理' } },
    { path: '/bank-info', name: 'BankInfo', component: BankInfoView, meta: { title: '行名行号管理' } },
    { path: '/country', name: 'Country', component: CountryView, meta: { title: '国家管理' } },
    { path: '/region', name: 'Region', component: RegionView, meta: { title: '地区管理' } },
    { path: '/unit', name: 'Unit', component: UnitView, meta: { title: '计量单位管理' } }
];

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
    // 设置页面 title
    if (to.meta?.title) {
        document.title = to.meta.title;
    }

    // 示例逻辑（后期可做鉴权）
    // if (to.path !== '/' && !localStorage.getItem('token')) {
    //     return next('/');
    // }

    next();
});

export default router;
