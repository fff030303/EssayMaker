"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// 示例数据
const areaData = [
  { name: '1月', 访问量: 4000, 用户数: 2400 },
  { name: '2月', 访问量: 3000, 用户数: 1398 },
  { name: '3月', 访问量: 2000, 用户数: 9800 },
  { name: '4月', 访问量: 2780, 用户数: 3908 },
  { name: '5月', 访问量: 1890, 用户数: 4800 },
  { name: '6月', 访问量: 2390, 用户数: 3800 },
  { name: '7月', 访问量: 3490, 用户数: 4300 },
];

const barData = [
  { name: '周一', 销售额: 4000 },
  { name: '周二', 销售额: 3000 },
  { name: '周三', 销售额: 2000 },
  { name: '周四', 销售额: 2780 },
  { name: '周五', 销售额: 1890 },
  { name: '周六', 销售额: 2390 },
  { name: '周日', 销售额: 3490 },
];

const pieData = [
  { name: '产品A', value: 400 },
  { name: '产品B', value: 300 },
  { name: '产品C', value: 300 },
  { name: '产品D', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Charts() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 className="text-3xl font-bold mb-6">图表展示</h1>
      <p className="mb-8">这里展示各种数据图表。</p>
      
      <div style={{ 
        marginTop: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* 区域图 */}
        <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">网站访问量趋势</h2>
          <p className="text-gray-500 mb-4">展示过去7个月的网站访问量和用户数变化趋势</p>
          {/* 修改：确保图表容器有足够高度 */}
          <div style={{ width: '100%', height: 350 }}>
            {/* 修改：简化 ResponsiveContainer */}
            <ResponsiveContainer>
              <AreaChart
                data={areaData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore */}
                <XAxis dataKey="name" stroke="#888" />
                {/* @ts-ignore */}
                <YAxis />
                {/* @ts-ignore */}
                <Tooltip />
                {/* @ts-ignore */}
                <Area type="monotone" dataKey="访问量" stackId="1" stroke="#8884d8" fill="#8884d8" />
                {/* @ts-ignore */}
                <Area type="monotone" dataKey="用户数" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 柱状图 - 修改容器样式 */}
        <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">每周销售额统计</h2>
          <p className="text-gray-500 mb-4">展示一周内各天的销售额数据</p>
          {/* 修改：确保图表容器有足够高度 */}
          <div style={{ width: '100%', height: 350 }}>
            {/* 修改：简化 ResponsiveContainer */}
            <ResponsiveContainer>
              <BarChart
                data={barData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore */}
                <XAxis dataKey="name" />
                {/* @ts-ignore */}
                <YAxis />
                {/* @ts-ignore */}
                <Tooltip />
                {/* @ts-ignore */}
                <Legend />
                {/* @ts-ignore */}
                <Bar dataKey="销售额" fill="#8884d8" radius={[10, 10, 0, 0]}  />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 饼图 - 修改容器样式 */}
        <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">产品销售占比</h2>
          <p className="text-gray-500 mb-4">展示各产品销售额在总销售额中的占比</p>
          {/* 修改：确保图表容器有足够高度 */}
          <div style={{ width: '100%', height: 350 }}>
            {/* 修改：简化 ResponsiveContainer */}
            <ResponsiveContainer>
              <PieChart>
                {/* @ts-ignore */}
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {/* @ts-ignore */}
                <Tooltip />
                {/* @ts-ignore */}
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}