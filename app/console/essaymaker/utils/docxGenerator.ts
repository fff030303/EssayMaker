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

/**
 * 生成并下载保持格式的Word文档（新方法）
 * @param content - 要导出的Markdown内容
 * @param title - 文档标题，用作文件名
 */
export const generateWordDocumentWithFormatting = async (content: string, title: string = "文档") => {
  try {
    console.log("开始生成保持格式的Word文档:", { title, contentLength: content.length });
    
    // 🆕 解析Markdown内容为结构化数据
    const parsedContent = parseMarkdownContent(content);
    
    // 🆕 创建Word文档段落，保持格式
    const docParagraphs = await createFormattedParagraphs(parsedContent);

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

    console.log('保持格式的Word文档生成成功:', {
      title,
      fileName,
      contentLength: content.length,
      paragraphCount: docParagraphs.length,
    });

    return true;
  } catch (error) {
    console.error('生成保持格式的Word文档时出错:', error);
    throw new Error(`Word文档生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 解析Markdown内容为结构化数据
 */
interface ParsedElement {
  type: 'heading' | 'paragraph' | 'list' | 'bold' | 'italic' | 'code' | 'text';
  level?: number; // 对于标题
  content: string;
  children?: ParsedElement[];
}

const parseMarkdownContent = (content: string): ParsedElement[] => {
  const lines = content.split('\n');
  const elements: ParsedElement[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // 处理标题
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      elements.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      continue;
    }
    
    // 处理列表项
    const listMatch = trimmedLine.match(/^[-*+]\s+(.+)$/) || trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (listMatch) {
      elements.push({
        type: 'list',
        content: listMatch[listMatch.length - 1], // 获取最后一个捕获组
      });
      continue;
    }
    
    // 处理普通段落（可能包含内联格式）
    elements.push({
      type: 'paragraph',
      content: trimmedLine,
    });
  }
  
  return elements;
};

/**
 * 创建格式化的Word段落
 */
const createFormattedParagraphs = async (elements: ParsedElement[]): Promise<Paragraph[]> => {
  const paragraphs: Paragraph[] = [];
  
  for (const element of elements) {
    switch (element.type) {
      case 'heading':
        const headingLevel = element.level === 1 ? HeadingLevel.HEADING_1 :
                           element.level === 2 ? HeadingLevel.HEADING_2 :
                           element.level === 3 ? HeadingLevel.HEADING_3 :
                           HeadingLevel.HEADING_4;
        
        const headingSize = element.level === 1 ? 32 : // 16pt
                           element.level === 2 ? 28 : // 14pt  
                           element.level === 3 ? 26 : // 13pt
                           24; // 12pt
        
        paragraphs.push(new Paragraph({
          heading: headingLevel,
          children: [
            new TextRun({
              text: element.content,
              font: "Microsoft YaHei",
              size: headingSize,
              bold: true,
            }),
          ],
          spacing: {
            before: element.level === 1 ? 480 : 240, // 24pt or 12pt
            after: element.level === 1 ? 240 : 120,  // 12pt or 6pt
          },
        }));
        break;
        
      case 'list':
        // 🆕 处理列表项中的内联格式
        const listTextRuns = parseInlineMarkdown(element.content);
        
        // 创建带项目符号的文本运行列表
        const listRuns = [
          new TextRun({
            text: "• ", // 项目符号
            font: "Microsoft YaHei",
            size: 24,
          }),
          ...listTextRuns
        ];
        
        paragraphs.push(new Paragraph({
          children: listRuns,
          spacing: {
            before: 0,
            after: 60, // 3pt
            line: 360,  // 1.5倍行距
          },
          indent: {
            left: 360, // 左缩进
          },
        }));
        break;
        
      case 'paragraph':
        // 🆕 处理段落中的内联格式
        const textRuns = parseInlineMarkdown(element.content);
        paragraphs.push(new Paragraph({
          children: textRuns,
          spacing: {
            before: 0,
            after: 120, // 6pt
            line: 360,  // 1.5倍行距
          },
        }));
        break;
    }
  }
  
  return paragraphs;
};

/**
 * 预处理文本，清理和标准化HTML标签
 */
const preprocessText = (text: string): string => {
  let processed = text;
  
  // 🆕 标准化HTML标签，移除可能的属性
  processed = processed.replace(/<strong[^>]*>/gi, '<strong>');
  processed = processed.replace(/<b[^>]*>/gi, '<b>');
  processed = processed.replace(/<em[^>]*>/gi, '<em>');
  processed = processed.replace(/<i[^>]*>/gi, '<i>');
  processed = processed.replace(/<code[^>]*>/gi, '<code>');
  
  // 🆕 处理一些常见的HTML实体
  processed = processed.replace(/&nbsp;/g, ' ');
  processed = processed.replace(/&amp;/g, '&');
  processed = processed.replace(/&lt;/g, '<');
  processed = processed.replace(/&gt;/g, '>');
  processed = processed.replace(/&quot;/g, '"');
  
  return processed;
};

/**
 * 解析内联Markdown和HTML格式（粗体、斜体等）- 增强版本
 */
const parseInlineMarkdown = (text: string): TextRun[] => {
  const runs: TextRun[] = [];
  
  // 🆕 预处理文本
  const processedText = preprocessText(text);
  
  console.log('parseInlineMarkdown 开始解析:', {
    "原始文本": text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    "预处理后": processedText.substring(0, 100) + (processedText.length > 100 ? '...' : ''),
    "包含**标记": processedText.includes('**'),
    "包含*标记": processedText.includes('*'),
    "包含HTML标签": /<[^>]+>/.test(processedText)
  });
  
  // 🆕 支持Markdown和HTML格式的正则表达式
  const inlinePatterns = [
    // Markdown格式
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' },     // **text** 粗体
    { regex: /\*((?!\*).*?)\*/g, type: 'italic' }, // *text* 斜体（避免与粗体冲突）
    { regex: /`(.*?)`/g, type: 'code' },           // `text` 代码
    
    // 🆕 HTML格式
    { regex: /<strong>(.*?)<\/strong>/gi, type: 'bold' },     // <strong>text</strong> 粗体
    { regex: /<b>(.*?)<\/b>/gi, type: 'bold' },               // <b>text</b> 粗体
    { regex: /<em>(.*?)<\/em>/gi, type: 'italic' },           // <em>text</em> 斜体
    { regex: /<i>(.*?)<\/i>/gi, type: 'italic' },             // <i>text</i> 斜体
    { regex: /<code>(.*?)<\/code>/gi, type: 'code' },         // <code>text</code> 代码
    
    // 🆕 其他HTML标签
    { regex: /<span[^>]*font-weight[^>]*bold[^>]*>(.*?)<\/span>/gi, type: 'bold' }, // span bold
    { regex: /<span[^>]*font-style[^>]*italic[^>]*>(.*?)<\/span>/gi, type: 'italic' }, // span italic
  ];
  
  // 🆕 先收集所有匹配的格式标记及其位置
  const matches: Array<{
    start: number;
    end: number;
    text: string;
    content: string;
    type: 'bold' | 'italic' | 'code';
  }> = [];
  
  for (const pattern of inlinePatterns) {
    let match;
    // 重置正则表达式状态
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(processedText)) !== null) {
      // 🆕 递归处理嵌套标签
      const nestedContent = match[1];
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        content: nestedContent,
        type: pattern.type as 'bold' | 'italic' | 'code'
      });
      
      console.log(`找到${pattern.type}格式:`, {
        "匹配文本": match[0],
        "内容": nestedContent,
        "位置": `${match.index}-${match.index + match[0].length}`
      });
    }
  }
  
  console.log('所有匹配结果:', {
    "匹配数量": matches.length,
    "匹配详情": matches.map(m => ({ 
      type: m.type, 
      content: m.content.substring(0, 20) + (m.content.length > 20 ? '...' : ''),
      position: `${m.start}-${m.end}`
    }))
  });
  
  // 🆕 按位置排序匹配项
  matches.sort((a, b) => a.start - b.start);
  
  // 🆕 处理重叠和嵌套的格式（优先处理最长的匹配）
  const validMatches = [];
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    let isValid = true;
    
    // 检查是否与已接受的匹配重叠
    for (const validMatch of validMatches) {
      if (!(currentMatch.end <= validMatch.start || currentMatch.start >= validMatch.end)) {
        // 如果重叠，选择更长的匹配
        if (currentMatch.text.length <= validMatch.text.length) {
          isValid = false;
          break;
        }
      }
    }
    
    if (isValid) {
      // 移除被新匹配覆盖的较短匹配
      for (let j = validMatches.length - 1; j >= 0; j--) {
        const validMatch = validMatches[j];
        if (!(currentMatch.end <= validMatch.start || currentMatch.start >= validMatch.end)) {
          if (currentMatch.text.length > validMatch.text.length) {
            validMatches.splice(j, 1);
          }
        }
      }
      validMatches.push(currentMatch);
    }
  }
  
  // 重新排序
  validMatches.sort((a, b) => a.start - b.start);
  
  console.log('有效匹配结果:', {
    "有效匹配数量": validMatches.length,
    "有效匹配详情": validMatches.map(m => ({ 
      type: m.type, 
      content: m.content.substring(0, 20) + (m.content.length > 20 ? '...' : ''),
      position: `${m.start}-${m.end}`
    }))
  });
  
  // 🆕 基于有效匹配构建TextRuns
  let lastIndex = 0;
  
  for (const match of validMatches) {
    // 添加匹配之前的普通文本
    if (match.start > lastIndex) {
      const plainText = processedText.substring(lastIndex, match.start);
      if (plainText) {
        runs.push(new TextRun({
          text: plainText,
          font: "Microsoft YaHei",
          size: 24,
        }));
        console.log('添加普通文本:', plainText.substring(0, 30) + (plainText.length > 30 ? '...' : ''));
      }
    }
    
    // 🆕 简化处理：直接创建格式化的TextRun，避免递归复杂性
    switch (match.type) {
      case 'bold':
        runs.push(new TextRun({
          text: match.content,
          font: "Microsoft YaHei",
          size: 24,
          bold: true,
        }));
        console.log('添加粗体文本:', match.content);
        break;
      case 'italic':
        runs.push(new TextRun({
          text: match.content,
          font: "Microsoft YaHei",
          size: 24,
          italics: true,
        }));
        console.log('添加斜体文本:', match.content);
        break;
      case 'code':
        runs.push(new TextRun({
          text: match.content,
          font: "Consolas",
          size: 22,
          // 移除了颜色设置，保持黑色
        }));
        console.log('添加代码文本:', match.content);
        break;
    }
    
    lastIndex = match.end;
  }
  
  // 🆕 添加最后剩余的普通文本
  if (lastIndex < processedText.length) {
    const remainingText = processedText.substring(lastIndex);
    if (remainingText) {
      runs.push(new TextRun({
        text: remainingText,
        font: "Microsoft YaHei",
        size: 24,
      }));
      console.log('添加剩余文本:', remainingText.substring(0, 30) + (remainingText.length > 30 ? '...' : ''));
    }
  }
  
  // 🆕 如果没有找到任何格式，返回整个文本作为普通文本
  if (runs.length === 0) {
    runs.push(new TextRun({
      text: processedText,
      font: "Microsoft YaHei",
      size: 24,
    }));
    console.log('没有找到格式标记，使用普通文本:', processedText.substring(0, 50) + (processedText.length > 50 ? '...' : ''));
  }
  
  console.log('解析内联格式完成:', {
    "原始文本长度": text.length,
    "TextRuns数量": runs.length,
    "TextRuns详情": runs.map(run => ({
      text: (run as any).text?.substring(0, 20) + ((run as any).text?.length > 20 ? '...' : ''),
      bold: (run as any).bold,
      italics: (run as any).italics,
      font: (run as any).font
    }))
  });
  
  return runs;
}; 