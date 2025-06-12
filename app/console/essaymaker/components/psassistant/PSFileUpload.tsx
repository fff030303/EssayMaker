import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, RotateCcw, Loader2, Sparkles } from "lucide-react";

// 修正本地组件的导入路径和导入方式
import { UserInputSection } from "./components/UserInputSection";
import { AdvancedInputArea } from "./AdvancedInputArea";

// 定义PSFileUpload组件的props类型
interface PSFileUploadProps {
  onReset: () => void;
  isLoading: boolean;
  isUploading: boolean;
  userInfo: any; // 请根据实际数据结构替换'any'
  setUserInfo: (info: any) => void; // 请根据实际数据结构替换'any'
  direction: any; // 请根据实际数据结构替换'any'
  setDirection: (direction: any) => void; // 请根据实际数据结构替换'any'
  requirements: any; // 请根据实际数据结构替换'any'
  setRequirements: (req: any) => void; // 请根据实际数据结构替换'any'
  schoolInfo: any; // 请根据实际数据结构替换'any'
  setSchoolInfo: (info: any) => void; // 请根据实际数据结构替换'any'
  programInfo: any; // 请根据实际数据结构替换'any'
  setProgramInfo: (info: any) => void; // 请根据实际数据结构替换'any'
  otherRequirements: any; // 请根据实际数据结构替换'any'
  setOtherRequirements: (req: any) => void; // 请根据实际数据结构替换'any'
  draftFile: File | null; // 假设是文件类型，如果不是请替换
  setDraftFile: (file: File | null) => void;
  otherFiles: File[]; // 假设是文件数组类型，如果不是请替换
  setOtherFiles: (files: File[]) => void;
  handleSubmit: () => Promise<void>;
  isSubmitDisabled: boolean;
}

const PSFileUpload: React.FC<PSFileUploadProps> = ({
  onReset,
  isLoading,
  isUploading,
  userInfo,
  setUserInfo,
  direction,
  setDirection,
  requirements,
  setRequirements,
  schoolInfo,
  setSchoolInfo,
  programInfo,
  setProgramInfo,
  otherRequirements,
  setOtherRequirements,
  draftFile,
  setDraftFile,
  otherFiles,
  setOtherFiles,
  handleSubmit,
  isSubmitDisabled,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card
        className="bg-white shadow-lg border-0 rounded-xl overflow-hidden"
        style={{ border: "none !important", outline: "none !important" }}
      >
        <CardHeader
          className="border-b-0 pb-4"
          style={{ border: "none !important", boxShadow: "none !important" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-stone-200 to-stone-300">
                <FileText className="h-5 w-5 text-stone-700" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-stone-800">
                  PS初稿助理
                </CardTitle>
                <p className="text-sm text-stone-600 mt-1">
                  上传个人陈述素材表，AI将协助您生成初稿内容
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={isLoading}
                className="border-stone-300 text-stone-700 hover:bg-stone-100 hover:border-stone-400"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </Button>
              <Badge
                variant="outline"
                className="bg-stone-100/60 text-stone-700 border-stone-300"
              >
                {isUploading ? "上传中" : "准备就绪"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 bg-stone-50/30">
          {/* 用户输入部分 */}
          <UserInputSection
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            isLoading={isLoading}
          />

          {/* 高级输入区域（现在包含了方向、要求和文件上传）*/}
          <AdvancedInputArea
            isLoading={isLoading}
            type="draft" // 假设PSFileUpload总是用于初稿模式
            direction={direction}
            setDirection={setDirection}
            requirements={requirements}
            setRequirements={setRequirements}
            draftFile={draftFile}
            setDraftFile={setDraftFile}
            otherFiles={otherFiles}
            setOtherFiles={setOtherFiles}
            onSubmitClick={handleSubmit}
            onInputChange={() => {}} // 占位符，如果需要实际逻辑可在此处添加
            onFileChange={() => {}} // 占位符，如果需要实际逻辑可在此处添加
            schoolInfo={schoolInfo}
            setSchoolInfo={setSchoolInfo}
            programInfo={programInfo}
            setProgramInfo={setProgramInfo}
            otherRequirements={otherRequirements}
            setOtherRequirements={setOtherRequirements}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PSFileUpload;
