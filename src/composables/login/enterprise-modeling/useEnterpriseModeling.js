import { ref } from 'vue'

export function useEnterpriseModeling() {
    const groups = ref([
        {
            name: '组织人员',
            modules: [
                { name: '人员', icon: '👤', path: '/personal' }, // 跳转人员管理
                { name: '业务单元', icon: '🏢', path: '/business-unit' },
                { name: '部门维度管理', icon: '🏬', path: '/department-dimension' },
                { name: '组织职能类型', icon: '🧩', path: '/org-function-type' },
                { name: '人员类型', icon: '👥' },
                { name: '行政组织', icon: '🔗' }
            ]
        },
        {
            name: '管控策略',
            modules: [
                { name: '业务管理视图', icon: '📄' },
                { name: '主数据控制视图', icon: '📄' },
                { name: '基础数据管控策略', icon: '📄' }
            ]
        }
    ])
    return { groups }
}
