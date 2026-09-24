# 材料申报原型交接合同

本合同仅描述仓库虚构教学案例中的数据结构和原型边界，供前后端讨论。标记“已确认（虚构案例）”仅代表教学设定；所有服务端接口细节均待双方确认。

## 已确认的原型数据

```ts
type MaterialId = 'project-note' | 'space-sketch' | 'schedule'

interface MaterialItem {
  id: MaterialId
  name: string
  description: string
  required: boolean
}

interface ApplicationDraft {
  description: string
  checkedMaterials: MaterialId[]
  submitted: boolean
}
```

材料清单固定由 `pages/apply/mock.ts` 提供。草稿目前由 `data/browser-storage.ts` 保存到当前浏览器。规则 BR-002 至 BR-007 以 `facts/module/BUSINESS_RULES.md` 为准。

## 待后端确认

当前没有已经确认的生产接口。对接前需要共同确定：

| 项目 | 状态 |
| --- | --- |
| API URL、HTTP 方法、版本和环境 | 待确认；不可从本原型推断 |
| 认证方式、身份上下文和权限 | 待确认 |
| 创建、读取、暂存、提交和清除接口 | 待确认；当前按钮仅操作本地示例状态 |
| 文件上传、存储位置、格式/大小限制 | 待确认；当前不上传文件 |
| 后端字段、枚举、时间与标识格式 | 待确认 |
| 分页、排序、并发更新和幂等策略 | 待确认 |
| 错误码、校验错误结构和重试策略 | 待确认 |
| 服务端持久化、审计和数据保留规则 | 待确认 |

不得将浏览器存储结果描述为服务端办理成功。确认以上事项后，前后端共同更新合同，并将页面数据访问替换为独立适配器；页面消费的数据类型应保持稳定，mock 也应继续符合已确认的类型。
