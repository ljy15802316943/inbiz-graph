# 组件使用tsdx框架开发的npm包。

## 安装依赖

```bash
npm install inbiz-graph --save
```

## 页面引入
```bash
import { InbizGraph } from 'inbiz-graph';
```

## 参数描述

```bash
interface propsType {
  width:number;//图谱宽度
  height:number;//图谱高度
  graphUrl?: string;//图谱请求url。
  params?: {//图谱接口请求参数。
    step:number;//层级
    offset:number,//默认传0
    anchor: string | number;//关键字 | 文件id。
    type: string,//查询类型
    /**
     * type不同，anchor传值也不同。
     * type: 'file',//查询文档，anchor=文件id。
     * type: 'topic',//查询主题，anchor=节点名字
     * type: 'entity',//实体 anchor=节点名字
    */
  };
  showRightMenu?:boolean;//显示右侧菜单
  EDOC2_URL?:string;//跳转ecm预览文件地址。

  className?:string;//控制图谱样式
  children?:any;//传入自定义元素。
  //事件回调函数, 以前的函数将被替换，会执行新传入的函数逻辑, 并返回元素对象。
  optEvent?: {
    loadMore?:Function;//双击元素加载更多

    dimension?:Function;//菜单点击维度
    hierarchyClick?:Function;//菜单点击层级
    checkedClick?:any;//菜单点击边属性
    
    openFile?: Function;//弹窗打开文件
    searchDoc?: Function;//弹窗搜索文档
    setCore?: Function;//弹窗设为中心
    openMoreNode?: Function;//弹窗展开更多节点
  }
};
```
```bash
// 示例
<InbizGraph 
  width={1200}
  height={600}
  graphUrl="http://xxx/xxx/graph2.jsp"
  params={{
    anchor: '主题',
    step: 2,
    type: 'entity',
    offset: 0,
  }}
  params={
    {"anchor":"38","step":2,"type":"topic_id","offset":0}
  }
  optEvent={{
    setCore: (data:any) => {//弹窗设为中心
      console.log(data, 'data');
    }
  }}
/>
```
![image](https://github.com/ljy15802316943/inbiz-graph/blob/main/src/img/icons/excel.png)