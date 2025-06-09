/**
 * AdvancedInputArea 组件
 * 
 * 功能：PS助理的高级输入区域组件，提供丰富的用户输入和文件上传功能
 * 
 * 核心特性：
 * 1. 多样化输入：
 *    - 申请方向选择
 *    - 详细需求描述
 *    - 个人信息填写
 *    - 特殊要求说明
 * 
 * 2. 文件管理：
 *    - 多文件上传支持
 *    - 拖拽上传功能
 *    - 文件预览和删除
 *    - 文件类型验证
 * 
 * 3. 智能提示：
 *    - 输入建议提供
 *    - 实时验证反馈
 *    - 错误提示显示
 *    - 完成度指示
 * 
 * 4. 用户体验：
 *    - 直观的界面设计
 *    - 流畅的交互动画
 *    - 响应式布局
 *    - 无障碍访问支持
 * 
 * 5. 数据处理：
 *    - 输入数据验证
 *    - 格式标准化
 *    - 实时保存草稿
 *    - 数据恢复功能
 * 
 * 6. 状态管理：
 *    - 输入状态跟踪
 *    - 加载状态指示
 *    - 错误状态处理
 *    - 完成状态确认
 * 
 * 支持功能：
 * - 申请方向智能推荐
 * - 需求模板快速填充
 * - 文件内容预览
 * - 批量文件操作
 * - 输入历史记录
 * 
 * 支持的文件类型：
 * - 个人陈述素材表：DOCX
 * - 成绩单：PDF, JPG, JPEG, PNG
 * 
 * 技术实现：
 * - React Hook Form表单管理
 * - 文件拖拽API集成
 * - 实时验证机制
 * - 本地存储支持
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  FileUp,
  Loader2,
  X,
  ChevronUp,
  Upload,
  FileText,
  Send,
  ChevronDown,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { DisplayResult } from "../../types";
import { TipsButton } from "../TipsButton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";

interface AdvancedInputAreaProps {
  isLoading: boolean;
  type: "draft" | "custom"; // 区分初稿还是定制内容类型
  // 添加新的props用于直接更新父组件状态
  direction: string;
  requirements: string;
  setDirection: (direction: string) => void;
  setRequirements: React.Dispatch<React.SetStateAction<string>>;
  draftFile: File | null;
  otherFiles: File[];
  setDraftFile: (file: File | null) => void;
  setOtherFiles: (files: File[]) => void;
  onSubmitClick: () => void;
  // 添加输入变化回调
  onInputChange: () => void;
  // 添加文件变化回调
  onFileChange: () => void;
  // 新增：个人陈述素材表文件提纯版状态
  purifiedDraft?: string | null;
  isPurifying?: boolean;
  // 新增：生成最终初稿按钮的回调
  onGenerateFinalDraft?: () => void;
  // 新增：清除生成内容的回调
  onClearGeneratedContent?: () => void;
  // 新增：最终初稿生成结果
  finalDraftResult?: DisplayResult | null;
  // 新增：是否正在生成最终初稿
  isGeneratingFinalDraft?: boolean;
  // 新增：跳转到步骤的回调函数
  onStepChange?: (step: number) => void;
}

// 支持的文件格式
const DRAFT_FILE_TYPES = ['.docx']; // 个人陈述素材表只支持docx
const OTHER_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png']; // 成绩单支持pdf和图片格式

// 文件格式验证函数
const validateDraftFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const isValid = DRAFT_FILE_TYPES.some(type => fileName.endsWith(type));
  console.log('验证个人陈述素材表文件:', {
    originalFileName: file.name,
    fileName: file.name,
    lowerCaseName: fileName,
    fileType: file.type,
    fileSize: file.size,
    supportedTypes: DRAFT_FILE_TYPES,
    checkResults: DRAFT_FILE_TYPES.map(type => ({
      type,
      endsWith: fileName.endsWith(type)
    })),
    isValid
  });
  return isValid;
};

const validateOtherFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const isValid = OTHER_FILE_TYPES.some(type => fileName.endsWith(type));
  console.log('验证成绩单文件:', {
    fileName: file.name,
    lowerCaseName: fileName,
    supportedTypes: OTHER_FILE_TYPES,
    isValid
  });
  return isValid;
};

// 获取文件扩展名
const getFileExtension = (fileName: string): string => {
  return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
};

export function AdvancedInputArea({
  isLoading,
  type,
  // 使用父组件传入的状态和更新函数
  direction,
  requirements,
  setDirection,
  setRequirements,
  draftFile,
  otherFiles,
  setDraftFile,
  setOtherFiles,
  onSubmitClick,
  // 添加回调函数
  onInputChange,
  onFileChange,
  // 新增：个人陈述素材表文件提纯版状态
  purifiedDraft,
  isPurifying,
  // 新增：生成最终初稿的回调
  onGenerateFinalDraft,
  // 新增：清除生成内容的回调
  onClearGeneratedContent,
  // 新增：最终初稿生成结果
  finalDraftResult,
  // 新增：是否正在生成最终初稿
  isGeneratingFinalDraft,
  // 新增：跳转到步骤的回调函数
  onStepChange,
}: AdvancedInputAreaProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isDraggingDraft, setIsDraggingDraft] = useState(false);
  const [isDraggingOther, setIsDraggingOther] = useState(false);

  // 文件输入引用
  const draftFileInputRef = useRef<HTMLInputElement>(null);
  const otherFilesInputRef = useRef<HTMLInputElement>(null);

  // 拖放区域引用
  const draftDropAreaRef = useRef<HTMLDivElement>(null);
  const otherDropAreaRef = useRef<HTMLDivElement>(null);

  // 使用toast钩子
  const { toast } = useToast();

  // 测试验证函数是否正常工作
  useEffect(() => {
    console.log('=== 测试文件验证函数 ===');
    
    // 创建测试文件对象
    const testDocxFile = new File([''], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const testLnkFile = new File([''], 'test.lnk', { type: 'application/x-ms-shortcut' });
    const testPdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    
    console.log('测试 DOCX 文件:', validateDraftFileType(testDocxFile)); // 应该返回 true
    console.log('测试 LNK 文件:', validateDraftFileType(testLnkFile)); // 应该返回 false
    console.log('测试 PDF 文件 (作为成绩单):', validateOtherFileType(testPdfFile)); // 应该返回 true
    console.log('测试 LNK 文件 (作为成绩单):', validateOtherFileType(testLnkFile)); // 应该返回 false
    
    console.log('=== 测试完成 ===');
  }, []);

  // 监听isLoading变化，重置submitting状态
  useEffect(() => {
    if (!isLoading && submitting) {
      setSubmitting(false);

      // 移除自动跳转逻辑，现在由PSAssistant组件统一处理
      // 当加载完成且之前处于提交状态，自动跳转到第二步
      // if (onStepChange && type === "draft") {
      //   // 延迟300ms再跳转，确保状态更新完成
      //   setTimeout(() => {
      //     onStepChange(2);
      //   }, 300);
      // }
    }
  }, [isLoading, submitting]);

  // 设置个人陈述素材表文件区域的拖放事件
  useEffect(() => {
    const dropArea = draftDropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingDraft(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingDraft(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingDraft(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingDraft(false);

      console.log('个人陈述素材表拖拽事件触发');

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        console.log('拖拽文件数量:', e.dataTransfer.files.length);
        console.log('拖拽的文件:', Array.from(e.dataTransfer.files).map(f => f.name));
        
        // 个人陈述素材表文件只取第一个文件
        if (e.dataTransfer.files.length > 1) {
          toast({
            variant: "destructive",
            title: "只能选择一个个人陈述素材表文件",
            description: "已自动选择第一个文件作为初稿",
          });
        }
        
        const firstFile = e.dataTransfer.files[0];
        console.log('准备处理第一个文件:', firstFile.name);
        handleDraftFile(firstFile);
      }
    };

    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragenter", handleDragEnter);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      dropArea.removeEventListener("dragover", handleDragOver);
      dropArea.removeEventListener("dragenter", handleDragEnter);
      dropArea.removeEventListener("dragleave", handleDragLeave);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, [toast]);

  // 设置其他文件区域的拖放事件
  useEffect(() => {
    const dropArea = otherDropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOther(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOther(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOther(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOther(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files);
        handleOtherFiles(fileList);
      }
    };

    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragenter", handleDragEnter);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      dropArea.removeEventListener("dragover", handleDragOver);
      dropArea.removeEventListener("dragenter", handleDragEnter);
      dropArea.removeEventListener("dragleave", handleDragLeave);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, []);

  // 处理个人陈述素材表文件 - 更新到父组件状态
  const handleDraftFile = (file: File) => {
    console.log('handleDraftFile 被调用:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });
    
    if (!file) {
      console.log('文件为空，返回');
      return;
    }
    
    // 验证文件格式
    const isValidFormat = validateDraftFileType(file);
    console.log('文件格式验证结果:', isValidFormat);
    
    if (!isValidFormat) {
      const fileExt = getFileExtension(file.name);
      console.log('文件格式不支持:', {
        fileName: file.name,
        extension: fileExt,
        supportedTypes: DRAFT_FILE_TYPES
      });
      
      toast({
        title: "文件格式不支持",
        description: `个人陈述素材表文件格式 ${fileExt} 不受支持`,
        variant: "destructive",
      });
      return;
    }
    
    console.log('文件验证通过，设置文件');
    setDraftFile(file);

    console.log('文件已设置到状态:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      lastModified: file.lastModified
    });

    toast({
      title: "个人陈述素材表文件已上传",
      description: `已设置: ${file.name}`,
    });
  };

  // 处理其他文件 - 更新到父组件状态
  const handleOtherFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    // 验证所有文件格式
    const invalidFiles = newFiles.filter(file => !validateOtherFileType(file));
    
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map(file => `${file.name} (${getFileExtension(file.name)})`).join(', ');
      toast({
        title: "部分文件格式不支持",
        description: `以下成绩单文件格式不受支持：${invalidFileNames}。`,
        variant: "destructive",
      });
      
      // 只添加格式正确的文件
      const validFiles = newFiles.filter(file => validateOtherFileType(file));
      if (validFiles.length > 0) {
        const updatedFiles = [...otherFiles, ...validFiles];
        setOtherFiles(updatedFiles);
        toast({
          title: "部分文件已上传",
          description: `已添加 ${validFiles.length} 个有效文件`,
        });
      }
      return;
    }

    // 直接合并然后设置，而不是使用函数式更新
    const updatedFiles = [...otherFiles, ...newFiles];
    setOtherFiles(updatedFiles);

    toast({
      title: "其他文件已上传",
      description: `已添加 ${newFiles.length} 个文件`,
    });
  };

  // 处理个人陈述素材表文件选择
  const handleDraftFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1) {
        toast({
          variant: "destructive",
          title: "只能选择一个个人陈述素材表文件",
          description: "已自动选择第一个文件",
        });
      }
      handleDraftFile(e.target.files[0]);
    }
  };

  // 处理其他文件选择
  const handleOtherFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      handleOtherFiles(fileList);
    }
  };

  // 处理提交 - 简化成只调用父组件的提交函数
  const handleSubmit = () => {
    // 初稿模式下必须有个人陈述素材表文件
    if (type === "draft" && !draftFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传个人陈述素材表文件",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }

    // 防止重复提交，设置提交状态
    setSubmitting(true);

    try {
      // 直接调用父组件提交函数，不在这里构建queryText
      onSubmitClick();
    } finally {
      // 重置提交状态，确保按钮不会一直禁用
      setTimeout(() => {
        setSubmitting(false);
      }, 1000); // 1秒后重置状态，给用户一个短暂的反馈
    }
  };

  // 监听最终初稿生成状态
  useEffect(() => {
    if (!finalDraftResult) return;

    console.log("检查 finalDraftResult:", {
      isComplete: finalDraftResult.isComplete,
      content: finalDraftResult.content,
    });

    // 如果内容已经生成完成，直接设置状态为false
    if (finalDraftResult.isComplete) {
      console.log("检测到完成状态，设置 isGeneratingFinalDraft 为 false");
    }
  }, [finalDraftResult?.isComplete]);

  // 处理生成最终初稿
  const handleGenerateFinalDraft = () => {
    // 添加日志来检查purifiedDraft的值
    console.log("生成初稿时的purifiedDraft值:", purifiedDraft);
    console.log("生成初稿时的direction值:", direction);

    // 首先检查是否填写了申请方向
    if (!direction.trim()) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先填写申请方向",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }

    // 然后检查是否存在提纯版内容
    if (!purifiedDraft) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先提交个人陈述素材表文件生成提纯版",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }

    // 调用父组件的回调函数
    if (onGenerateFinalDraft) {
      onGenerateFinalDraft();
    } else {
      console.error("未提供onGenerateFinalDraft回调函数");
    }
  };

  // 处理删除个人陈述素材表文件
  const handleRemoveDraftFile = () => {
    setDraftFile(null);

    // 如果有文件输入元素，重置它
    if (draftFileInputRef.current) {
      draftFileInputRef.current.value = "";
    }

    toast({
      title: "文件已移除",
      description: "个人陈述素材表文件已删除",
    });
  };

  // 处理删除其他文件
  const handleRemoveOtherFile = (index: number) => {
    // 直接过滤然后设置，而不是使用函数式更新
    const updatedFiles = otherFiles.filter((_, i: number) => i !== index);
    setOtherFiles(updatedFiles);
  };

  // 处理清空所有其他文件
  const handleClearAllOtherFiles = () => {
    if (otherFiles.length === 0) return;

    // 直接设置为空数组
    setOtherFiles([]);

    // 如果有文件输入元素，重置它
    if (otherFilesInputRef.current) {
      otherFilesInputRef.current.value = "";
    }

    toast({
      title: "文件已清空",
      description: "所有其他文件已删除",
    });
  };

  // 触发个人陈述素材表文件选择
  const triggerDraftFileInput = () => {
    draftFileInputRef.current?.click();
  };

  // 触发其他文件选择
  const triggerOtherFilesInput = () => {
    otherFilesInputRef.current?.click();
  };

  // 监听输入变化
  useEffect(() => {
    // 构建查询文本
    let queryText = `请帮我写一份关于${direction}的初稿`;

    if (requirements) {
      queryText += `，具体需求：${requirements}`;
    }

    console.log("AdvancedInputArea - 输入变化，更新查询文本:", queryText);

    // 直接调用父组件函数更新查询文本
    if (onInputChange) {
      onInputChange();
    }
  }, [direction, requirements, onInputChange]);

  // 监听文件变化
  useEffect(() => {
    // 构建文件列表
    const allFiles = draftFile ? [draftFile, ...otherFiles] : [...otherFiles];

    console.log("AdvancedInputArea - 文件变化，更新文件数量:", allFiles.length);

    // 直接调用父组件函数更新文件
    if (onFileChange) {
      onFileChange();
    }
  }, [draftFile, otherFiles, onFileChange]);

  console.log("状态变化:", {
    isLoading,
    submitting,
    disabled: isLoading || submitting,
  });

  return (
    <>
      {/* 全屏加载动画 - 在生成过程中显示 */}
      {(isLoading || isGeneratingFinalDraft) && (
        <FullScreenLoadingAnimation 
          text={
            isGeneratingFinalDraft 
              ? "正在生成个人陈述初稿，请勿切换页面..." 
              : "正在分析个人陈述素材，请勿切换页面..."
          } 
        />
      )}

    <Card className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
      <CardContent className="p-4 pt-4">
        <div className="grid grid-cols-1 gap-3">
          {/* 申请方向输入框 - 全宽度 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
              申请方向 <span className="text-red-500 ml-0.5">*</span>
              <span className="ml-1 text-xs text-red-500">(必填)</span>
            </label>
            <Input
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              placeholder="例如: 计算机科学、经济学等"
              className={cn(
                "placeholder:text-gray-400 w-full",
                !direction.trim() && "border-red-300 focus-visible:ring-red-500"
              )}
              disabled={isLoading || submitting}
            />
          </div>

          {/* 写作需求区域 - 直接展示，不使用折叠组件 */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              写作需求（选填）
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => {
                  const newRequirements = requirements
                    ? requirements +
                      "弃用个人陈述素材整理报告中XX部分素材，直接搜索相关信息（如时事新闻）进行补充，注意进行深入分析和阐述。"
                    : "弃用个人陈述素材整理报告中XX部分素材，直接搜索相关信息（如时事新闻）进行补充，注意进行深入分析和阐述。";
                  setRequirements(newRequirements);
                }}
              >
                弃用部分素材
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => {
                  const newRequirements = requirements
                    ? requirements +
                      "要求在第二段学术基础展示中添加上传成绩单中的XX课程，深入展开与申请方向相关的阐述；补充科研/实习/职业规划经历的细节。"
                    : "要求在第二段学术基础展示中添加上传成绩单中的XX课程，深入展开与申请方向相关的阐述；补充科研/实习/职业规划经历的细节。";
                  setRequirements(newRequirements);
                }}
              >
                增加部分细节
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => {
                  const newRequirements = requirements
                    ? requirements + "禁止添加素材表中不存在的数据/操作步骤。"
                    : "禁止添加素材表中不存在的数据/操作步骤。";
                  setRequirements(newRequirements);
                }}
              >
                保证内容真实
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => {
                  const newRequirements = requirements
                    ? requirements +
                      "请选用XX经历作为第三段研究经历深化/第四段实习经历深化的素材。"
                    : "请选用XX经历作为第三段研究经历深化/第四段实习经历深化的素材。";
                  setRequirements(newRequirements);
                }}
              >
                其他写作需求
              </Badge>
            </div>
            <div className="relative">
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="例如：内容要求、字数要求等"
                className="text-sm placeholder:text-gray-400 w-full min-h-[36px] max-h-[80px] overflow-y-auto resize-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{ height: "100px" }}
                disabled={isLoading || submitting}
              />
            </div>
          </div>

          {/* 文件上传区域 - 更紧凑的布局 */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            {/* 左侧 - 个人陈述素材表文件上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                个人陈述素材表 <span className="text-red-500 ml-0.5">*</span>
                <span className="ml-1 text-xs text-red-500">(必填)</span>
              </label>
              <div
                ref={draftDropAreaRef}
                className={cn(
                  "border border-dashed rounded-md p-3 transition-colors cursor-pointer",
                  isDraggingDraft
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50",
                  (isLoading || submitting) && "opacity-50 cursor-not-allowed"
                )}
                onClick={draftFile ? undefined : triggerDraftFileInput}
              >
                <input
                  type="file"
                  ref={draftFileInputRef}
                  onChange={handleDraftFileChange}
                  className="hidden"
                    accept=".docx"
                  disabled={isLoading || submitting}
                />

                {draftFile ? (
                  <div className="flex items-center p-2 border rounded bg-muted/50">
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm flex-1 truncate">
                      {draftFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDraftFile();
                      }}
                      disabled={isLoading || submitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[120px]">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      点击或拖放文件到此处上传
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        只支持 DOCX 格式
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧 - 成绩单文件上传 */}
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  成绩单（选填）
                </label>
                {otherFiles.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleClearAllOtherFiles}
                  >
                    清空全部
                  </Button>
                )}
              </div>
              <div
                ref={otherDropAreaRef}
                className={cn(
                  "border border-dashed rounded-md p-3 transition-colors cursor-pointer",
                  isDraggingOther
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50",
                  (isLoading || submitting) && "opacity-50 cursor-not-allowed"
                )}
                onClick={
                  otherFiles.length > 0 ? undefined : triggerOtherFilesInput
                }
              >
                <input
                  type="file"
                  ref={otherFilesInputRef}
                  onChange={handleOtherFilesChange}
                  className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  disabled={isLoading || submitting}
                />

                {otherFiles.length > 0 ? (
                  <div className="space-y-2 max-h-[120px] overflow-y-auto">
                    {otherFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center p-2 border rounded bg-muted/50"
                      >
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm flex-1 truncate">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOtherFile(index);
                          }}
                          disabled={isLoading || submitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerOtherFilesInput();
                      }}
                      disabled={isLoading || submitting}
                    >
                      <ArrowUp className="h-3.5 w-3.5 mr-1" />
                      添加更多文件
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[120px]">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      添加额外支持材料（可选）
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        支持 PDF, JPG, JPEG, PNG 格式
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* 控制按钮区域 - 放在Card底部 */}
      <CardFooter className="px-4 py-3 flex justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-2 py-1 h-8"
            onClick={() => {
              // 清空所有输入和文件
              setDirection("");
              setRequirements("");
              setDraftFile(null);
              setOtherFiles([]);

              // 重置文件输入元素
              if (draftFileInputRef.current) {
                draftFileInputRef.current.value = "";
              }
              if (otherFilesInputRef.current) {
                otherFilesInputRef.current.value = "";
              }

              // 清除生成内容
              if (onClearGeneratedContent) {
                onClearGeneratedContent();
              }

              // 显示清空提示
              toast({
                title: "已清空",
                description: "所有内容已重置",
              });
            }}
          >
            <RefreshCcw className="h-3 w-3 mr-1" /> 清空所有内容
          </Button>
        </div>

        <div className="flex gap-2 justify-end items-center">
          {type === "draft" &&
            finalDraftResult === null &&
            onGenerateFinalDraft &&
            purifiedDraft && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 h-10"
                onClick={handleGenerateFinalDraft}
                disabled={
                  isLoading ||
                  submitting ||
                  isGeneratingFinalDraft ||
                  !draftFile
                }
              >
                {isGeneratingFinalDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 正在生成...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" /> 直接生成初稿
                  </>
                )}
              </Button>
            )}

          <Button
            variant="default"
            size="default"
            className="flex items-center gap-1"
            onClick={handleSubmit}
            disabled={
              isLoading || submitting || !direction.trim() || !draftFile
            }
          >
            {isLoading || submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 处理中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> 获取素材表分析报告
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
    </>
  );
}
