/**
 * Word文档生成工具
 * 
 * 功能：使用docx库生成真正的.docx文件，确保与Microsoft Word完全兼容
 * 
 * 核心特性：
 * 1. 真正的docx格式：使用Open XML格式，与Word完全兼容
 * 2. 文本格式处理：自动清理Markdown和HTML格式
 * 3. 段落结构：保持良好的段落和换行结构
 * 4. 字体设置：使用微软雅黑字体，优化中文显示
 * 5. 样式设置：合理的行间距和段落间距
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { cleanMarkdownToPlainText } from '../components/DraftResultDisplay/utils';

/**
 * 生成并下载Word文档
 * @param content - 要导出的内容
 * @param title - 文档标题，用作文件名
 */
export const generateWordDocument = async (content: string, title: string = "文档") => {
  try {
    // 清理内容，去除所有格式，获取纯文本
    const cleanContent = cleanMarkdownToPlainText(content);
    
    // 按段落分割内容
    const paragraphs = cleanContent
      .split('\n')
      .filter(line => line.trim() !== '') // 去除空行
      .map(line => line.trim());

    // 创建Word文档段落
    const docParagraphs = paragraphs.map(paragraphText => {
      // 检查是否是标题（简单判断：较短且可能是标题的文本）
      const isTitle = paragraphText.length < 50 && 
                     (paragraphs.indexOf(paragraphText) === 0 || 
                      paragraphText.match(/^[\u4e00-\u9fa5]+[:：]/) ||
                      paragraphText.match(/^[0-9]+[.、]/));

      if (isTitle) {
        // 创建标题段落
        return new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: paragraphText,
              font: "Microsoft YaHei",
              size: 28, // 14pt
              bold: true,
            }),
          ],
          spacing: {
            before: 240, // 12pt
            after: 120,  // 6pt
          },
        });
      } else {
        // 创建普通段落
        return new Paragraph({
          children: [
            new TextRun({
              text: paragraphText,
              font: "Microsoft YaHei",
              size: 24, // 12pt
            }),
          ],
          spacing: {
            before: 0,
            after: 120, // 6pt
            line: 360,  // 1.5倍行距
          },
        });
      }
    });

    // 添加文档标题
    const titleParagraph = new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: title,
          font: "Microsoft YaHei",
          size: 32, // 16pt
          bold: true,
        }),
      ],
      spacing: {
        before: 0,
        after: 240, // 12pt
      },
    });

    // 创建文档
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [titleParagraph, ...docParagraphs],
        },
      ],
      styles: {
        default: {
          document: {
            run: {
              font: "Microsoft YaHei",
              size: 24, // 12pt
            },
            paragraph: {
              spacing: {
                line: 360, // 1.5倍行距
              },
            },
          },
        },
      },
    });

    // 生成文档Buffer
    const buffer = await Packer.toBuffer(doc);

    // 生成文件名
    const fileName = `${title}-${new Date().toLocaleDateString().replace(/\//g, "-")}.docx`;

    // 下载文件
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    
    saveAs(blob, fileName);

    console.log('Word文档生成成功:', {
      title,
      fileName,
      contentLength: content.length,
      cleanContentLength: cleanContent.length,
      paragraphCount: paragraphs.length,
    });

    return true;
  } catch (error) {
    console.error('生成Word文档时出错:', error);
    throw new Error(`Word文档生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 简化版本：直接传入已清理的纯文本内容
 * @param cleanText - 已清理的纯文本内容
 * @param title - 文档标题
 */
export const generateSimpleWordDocument = async (cleanText: string, title: string = "文档") => {
  try {
    const paragraphs = cleanText
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => new Paragraph({
        children: [
          new TextRun({
            text: line.trim(),
            font: "Microsoft YaHei",
            size: 24, // 12pt
          }),
        ],
        spacing: {
          after: 120, // 6pt
          line: 360,  // 1.5倍行距
        },
      }));

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [
                new TextRun({
                  text: title,
                  font: "Microsoft YaHei",
                  size: 32,
                  bold: true,
                }),
              ],
              spacing: {
                after: 240,
              },
            }),
            ...paragraphs,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `${title}-${new Date().toLocaleDateString().replace(/\//g, "-")}.docx`;
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    
    saveAs(blob, fileName);
    return true;
  } catch (error) {
    console.error('生成简单Word文档时出错:', error);
    throw new Error(`Word文档生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}; 