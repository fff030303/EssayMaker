"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface Mask {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
}

interface MaskedImageProps {
  src: string;
  alt: string;
  editable?: boolean;
  initialMasks?: Mask[];
  onMasksChange?: (masks: Mask[]) => void;
}

export default function MaskedImage({
  src,
  alt,
  editable = false,
  initialMasks = [],
  onMasksChange,
}: MaskedImageProps) {
  const [masks, setMasks] = useState<Mask[]>(initialMasks);
  const [isAddingMask, setIsAddingMask] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentMask, setCurrentMask] = useState<Partial<Mask> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // 重要：当initialMasks变化时，同步更新组件内部状态
  useEffect(() => {
    console.log(`MaskedImage收到${initialMasks.length}个遮罩`);
    // 深度比较，避免不必要的状态更新
    if (JSON.stringify(initialMasks) !== JSON.stringify(masks)) {
      console.log("更新MaskedImage内部遮罩状态");
      setMasks(initialMasks);
    }
  }, [initialMasks]);

  // 开始添加新遮罩
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editable || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setStartPoint({ x, y });
    setIsAddingMask(true);
  };

  // 调整新遮罩大小
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isAddingMask || !startPoint || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;

    setCurrentMask({
      id: "",
      x: startPoint.x,
      y: startPoint.y,
      width: width,
      height: height,
    });
  };

  // 完成添加遮罩
  const handleMouseUp = () => {
    if (!isAddingMask || !startPoint || !currentMask) {
      setIsAddingMask(false);
      setStartPoint(null);
      setCurrentMask(null);
      return;
    }

    // 创建新遮罩
    const newMask: Mask = {
      id: `mask-${Date.now()}`,
      x: currentMask.x || 0,
      y: currentMask.y || 0,
      width: currentMask.width || 0,
      height: currentMask.height || 0,
    };

    // 确保宽高为正值（如果用户反向拖动）
    if (newMask.width < 0) {
      newMask.x += newMask.width;
      newMask.width = Math.abs(newMask.width);
    }

    if (newMask.height < 0) {
      newMask.y += newMask.height;
      newMask.height = Math.abs(newMask.height);
    }

    // 添加到遮罩列表
    const updatedMasks = [...masks, newMask];
    setMasks(updatedMasks);

    // 重置状态
    setIsAddingMask(false);
    setStartPoint(null);
    setCurrentMask(null);

    // 回调
    if (onMasksChange) {
      onMasksChange(updatedMasks);
    }
  };

  // 删除遮罩
  const handleDeleteMask = (id: string) => {
    const updatedMasks = masks.filter((mask) => mask.id !== id);
    setMasks(updatedMasks);

    if (onMasksChange) {
      onMasksChange(updatedMasks);
    }
  };

  // 当图片加载完成时获取尺寸
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageSize({
      width: e.currentTarget.naturalWidth,
      height: e.currentTarget.naturalHeight,
    });
  };

  return (
    <div className="masked-image-container">
      <div
        ref={containerRef}
        className={`relative ${editable ? "cursor-crosshair" : ""}`}
        style={{ maxWidth: "100%", height: "auto" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          style={{ maxWidth: "100%", height: "auto", display: "block" }}
          onLoad={handleImageLoad}
        />

        {/* 显示所有已保存的遮罩 - 提高渲染优先级 */}
        {masks.length > 0 && (
          <div className="absolute inset-0 z-10">
            {masks.map((mask) => {
              // 根据类型设置不同颜色
              let maskColor = "bg-black";
              let maskPattern = "";
              let maskBorder = "border-white";

              // 增强对比，根据类型显示不同颜色
              if (mask.type === "name") {
                maskColor = "bg-red-600";
                maskBorder = "border-white";
              } else if (mask.type === "phone") {
                maskColor = "bg-blue-600";
                maskBorder = "border-yellow-300";
              } else if (mask.type === "email") {
                maskColor = "bg-green-600";
                maskBorder = "border-white";
              } else if (mask.type === "id") {
                maskColor = "bg-purple-600";
                maskBorder = "border-yellow-300";
              } else if (mask.type === "address") {
                maskColor = "bg-yellow-600";
                maskBorder = "border-black";
              }

              return (
                <div
                  key={mask.id}
                  className={`absolute ${maskColor} border-4 ${maskBorder}`}
                  style={{
                    left: `${mask.x}%`,
                    top: `${mask.y}%`,
                    width: `${mask.width}%`,
                    height: `${mask.height}%`,
                    opacity: 1,
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255,255,255,0.5), rgba(255,255,255,0.5) 10px, rgba(0,0,0,0.5) 10px, rgba(0,0,0,0.5) 20px)",
                    boxShadow: "0 0 0 4px rgba(0,0,0,0.8)",
                    zIndex: 50,
                    transform: "translate(0, 0)", // 强制GPU渲染以提高性能
                    willChange: "transform", // 提高渲染性能
                  }}
                >
                  {editable && (
                    <button
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      onClick={() => handleDeleteMask(mask.id)}
                    >
                      ×
                    </button>
                  )}
                  {/* 添加一个更明显的标签显示遮罩类型 */}
                  <div className="absolute bottom-0 left-0 text-white text-xs bg-black bg-opacity-90 px-2 py-1 font-bold border-t border-r border-white">
                    {mask.type || "敏感"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 显示正在绘制的遮罩 */}
        {currentMask && isAddingMask && (
          <div
            className="absolute bg-black opacity-50"
            style={{
              left: `${currentMask.x}%`,
              top: `${currentMask.y}%`,
              width: `${currentMask.width}%`,
              height: `${currentMask.height}%`,
            }}
          />
        )}
      </div>

      {editable && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              const json = JSON.stringify(masks);
              navigator.clipboard.writeText(json);
              alert("遮罩配置已复制到剪贴板");
            }}
          >
            导出遮罩配置
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              setMasks([]);
              if (onMasksChange) onMasksChange([]);
            }}
          >
            清除所有遮罩
          </button>
          <button
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              // 强制重新渲染所有遮罩
              const updatedMasks = [...masks];
              setMasks([]);
              setTimeout(() => {
                setMasks(updatedMasks);
                alert(`已重新渲染${updatedMasks.length}个遮罩`);
              }, 50);
            }}
          >
            刷新遮罩显示
          </button>
        </div>
      )}
    </div>
  );
}
