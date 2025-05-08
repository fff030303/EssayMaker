"use client"

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function ExcelChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [categoryKey, setCategoryKey] = useState<string>('');
  const [stackedData, setStackedData] = useState<any[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        // 添加类型断言
        const binaryStr = evt.target?.result as string;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        
        // 获取第一个工作表
        const wsname = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[wsname];
        
        // 将工作表转换为JSON
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (data.length > 0) {
          // 添加类型断言，确保 data[0] 是一个对象
          const cols = Object.keys(data[0] as object);
          setColumns(cols);
          
          // 默认使用第一列作为X轴
          if (cols.length > 0) {
            setXAxisKey(cols[0]);
            
            // 默认使用第二列作为分类（如果存在）
            if (cols.length > 1) {
              setCategoryKey(cols[1]);
            }
          }
          
          setChartData(data);
        }
      } catch (error) {
        console.error('解析Excel文件时出错:', error);
        alert('解析Excel文件时出错，请确保文件格式正确');
      }
    };
    
    reader.onerror = () => {
      alert('读取文件时出错');
    };
    
    reader.readAsBinaryString(file);
  };

  // 处理X轴选择变更
  const handleXAxisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setXAxisKey(e.target.value);
  };
  
  // 处理分类选择变更
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryKey(e.target.value);
  };

  // 重置文件和数据
  const handleReset = () => {
    setChartData([]);
    setColumns([]);
    setXAxisKey('');
    setCategoryKey('');
    setStackedData([]);
    setUniqueCategories([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 当X轴或分类字段变化时，重新计算堆叠数据
  useEffect(() => {
    if (chartData.length > 0 && xAxisKey && categoryKey) {
      // 获取所有唯一的X轴值
      const uniqueXValues = Array.from(new Set(chartData.map(item => item[xAxisKey])));
      
      // 获取所有唯一的分类值
      const categories = Array.from(new Set(chartData.map(item => item[categoryKey])));
      setUniqueCategories(categories as string[]);
      
      // 为每个X轴值计算每个分类的数量
      const transformedData = uniqueXValues.map(xValue => {
        // 创建基础对象，包含X轴值
        const result: any = { [xAxisKey]: xValue };
        
        // 对每个分类，计算符合当前X轴值的记录数
        categories.forEach(category => {
          const count = chartData.filter(
            item => item[xAxisKey] === xValue && item[categoryKey] === category
          ).length;
          
          // 将分类计数添加到结果对象
          result[category] = count;
        });
        
        return result;
      });
      
      setStackedData(transformedData);
    }
  }, [chartData, xAxisKey, categoryKey]);

  // 生成不同的颜色
  const getColor = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'];
    return colors[index % colors.length];
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Excel 堆叠面积图</h1>
      
      <div className="mb-8 p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">上传 Excel 文件</h2>
        <div className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          
          {columns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择X轴数据列:
                </label>
                <select
                  value={xAxisKey}
                  onChange={handleXAxisChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择分类数据列:
                </label>
                <select
                  value={categoryKey}
                  onChange={handleCategoryChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">请选择</option>
                  {columns.filter(col => col !== xAxisKey).map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {chartData.length > 0 && (
            <button
              onClick={handleReset}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent 
                text-sm font-medium rounded-md shadow-sm text-white bg-red-600 
                hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              重置
            </button>
          )}
        </div>
      </div>
      
      {stackedData.length > 0 && uniqueCategories.length > 0 && (
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">堆叠面积图</h2>
          <p className="text-gray-500 mb-4">
            X轴: {xAxisKey}, 分类: {categoryKey}, 显示每个{xAxisKey}中不同{categoryKey}的数量
          </p>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <AreaChart
                data={stackedData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                
                {uniqueCategories.map((category, index) => (
                  <Area
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stackId="1"
                    stroke={getColor(index)}
                    fill={getColor(index)}
                    fillOpacity={0.6}
                    name={`${category}`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-2">数据预览</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      key={`header-${xAxisKey}`}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {xAxisKey}
                    </th>
                    {uniqueCategories.map((category, index) => (
                      <th
                        key={`header-${category}-${index}`}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {category}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stackedData.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      <td key={`cell-${xAxisKey}-${rowIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row[xAxisKey]}
                      </td>
                      {uniqueCategories.map((category, catIndex) => (
                        <td key={`cell-${category}-${rowIndex}-${catIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row[category]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {chartData.length > 0 && (
        <div className="mt-8 border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium mb-2">原始数据预览</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col, colIndex) => (
                    <th
                      key={`orig-header-${col}-${colIndex}`}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.slice(0, 5).map((row, rowIndex) => (
                  <tr key={`orig-row-${rowIndex}`}>
                    {columns.map((col, colIndex) => (
                      <td key={`orig-cell-${col}-${rowIndex}-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {chartData.length > 5 && (
              <p className="mt-2 text-sm text-gray-500">
                显示前5行数据，共 {chartData.length} 行
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}