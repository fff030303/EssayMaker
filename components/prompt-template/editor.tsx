"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ModuleType, TemplateType, getActiveTemplate, saveTemplate, getTemplateHistory, restoreTemplate, getDefaultTemplate } from "@/lib/services/prompt-template"
import { StudyPlanPromptTemplate } from "@prisma/client"

interface TemplateEditorProps {
  moduleType: ModuleType
  templateType: TemplateType
  userId: string
}

export function TemplateEditor({ moduleType, templateType, userId }: TemplateEditorProps) {
  const [content, setContent] = useState("")
  const [history, setHistory] = useState<StudyPlanPromptTemplate[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)

  // 加载当前模板
  useEffect(() => {
    loadCurrentTemplate()
  }, [moduleType, templateType])

  const loadCurrentTemplate = async () => {
    try {
      const template = await getActiveTemplate(moduleType, templateType)
      setContent(template?.content || getDefaultTemplate(moduleType, templateType))
    } catch (error) {
      toast({
        title: "错误",
        description: "加载模板失败",
        variant: "destructive"
      })
    }
  }

  // 保存模板
  const handleSave = async () => {
    try {
      setLoading(true)
      await saveTemplate({
        moduleType,
        templateType,
        content,
        createdBy: userId
      })
      toast({
        title: "成功",
        description: "模板已保存"
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载历史版本
  const handleShowHistory = async () => {
    try {
      const versions = await getTemplateHistory(moduleType, templateType)
      setHistory(versions)
      setShowHistory(true)
    } catch (error) {
      toast({
        title: "错误",
        description: "加载历史版本失败",
        variant: "destructive"
      })
    }
  }

  // 恢复历史版本
  const handleRestore = async (version: number) => {
    try {
      setLoading(true)
      await restoreTemplate({
        moduleType,
        templateType,
        version,
        createdBy: userId
      })
      toast({
        title: "成功",
        description: "已恢复到历史版本"
      })
      loadCurrentTemplate()
      setShowHistory(false)
    } catch (error) {
      toast({
        title: "错误",
        description: "恢复失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 恢复默认模板
  const handleRestoreDefault = () => {
    setContent(getDefaultTemplate(moduleType, templateType))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {moduleType} - {templateType}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入模板内容..."
            className="min-h-[200px]"
          />
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleSave}
              disabled={loading}
            >
              保存
            </Button>
            <Button 
              variant="outline"
              onClick={handleShowHistory}
              disabled={loading}
            >
              历史版本
            </Button>
            <Button
              variant="outline"
              onClick={handleRestoreDefault}
              disabled={loading}
            >
              恢复默认
            </Button>
          </div>

          {showHistory && (
            <div className="mt-4 space-y-4">
              <h3 className="font-medium">历史版本</h3>
              {history.map((version) => (
                <Card key={version.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm text-gray-500">
                        版本 {version.version}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(version.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(version.version)}
                      disabled={loading}
                    >
                      恢复此版本
                    </Button>
                  </div>
                  <pre className="text-sm bg-gray-50 p-2 rounded">
                    {version.content}
                  </pre>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 